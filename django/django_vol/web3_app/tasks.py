from django.conf import settings
from .utils import Web3Helper
import logging
from celery import shared_task
from django_redis import get_redis_connection
import time

logger = logging.getLogger(__name__)
web3_helper = Web3Helper()

@shared_task(bind=True, queue='blockchain_transactions')
def process_transaction_task(self, data):
    redis_client = get_redis_connection("default")
    lock_key = "blockchain_nonce_lock"
    lock = redis_client.lock(
        lock_key,
        timeout=30,  # 락 타임아웃 시간을 줄임
        blocking_timeout=60  # 블로킹 타임아웃은 충분히 줌
    )
    try:
        # 락 획득 시도
        have_lock = lock.acquire()
        if not have_lock:
            logger.error("Could not acquire Redis lock")
            raise self.retry(countdown=5, max_retries=5)

        try:
            # 현재 nonce 값을 가져오거나, 없으면 체인에서 가져옴
            current_nonce = redis_client.get('current_nonce')
            if current_nonce is None:
                current_nonce = web3_helper.w3.eth.get_transaction_count(web3_helper.admin_account.address)
                if not redis_client.setnx('current_nonce', current_nonce):
                    current_nonce = int(redis_client.get('current_nonce'))
                else:
                    logger.info(f"Initialized current_nonce to {current_nonce}")
            else:
                current_nonce = int(current_nonce)

            gas_price = web3_helper.w3.eth.gas_price
            
            gas_estimate = web3_helper.contract.functions.createGame(
                int(data['player1']),
                int(data['player2']),
                int(data['p1Score']),
                int(data['p2Score']),
                int(data['mode']),
                int(data['gameType'])
            ).estimate_gas({'from': web3_helper.admin_account.address})
            
            transaction = web3_helper.contract.functions.createGame(
                int(data['player1']),
                int(data['player2']),
                int(data['p1Score']),
                int(data['p2Score']),
                int(data['mode']),
                int(data['gameType'])
            ).build_transaction({
                'gas': gas_estimate,
                'gasPrice': int(gas_price),
                'nonce': current_nonce,
                'from': web3_helper.admin_account.address
            })

            signed_txn = web3_helper.w3.eth.account.sign_transaction(
                transaction, 
                private_key=settings.ADMIN_PRIVATE_KEY
            )
            
            tx_hash = web3_helper.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # 트랜잭션이 성공하면 nonce 증가
            redis_client.set('current_nonce', current_nonce + 1)
            
            # 트랜잭션 완료 대기
            receipt = web3_helper.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {"status": "success", "transaction_hash": tx_hash.hex()}
            
        finally:
            # 락 해제 시도
            try:
                lock.release()
            except Exception as e:
                logger.error(f"Error releasing lock: {e}", exc_info=True)
                
    except Exception as e:
        logger.error(f"Error during create_game: {e}", exc_info=True)
        # 락 해제 재시도
        try:
            if lock.locked():
                lock.release()
        except Exception as release_error:
            logger.error(f"Error releasing lock during exception handling: {release_error}", exc_info=True)
        raise self.retry(exc=e, countdown=6, max_retries=5)