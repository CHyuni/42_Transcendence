# utils.py
from web3 import Web3
from eth_account import Account
from django.conf import settings
import json

class Web3Helper:
    def __init__(self):
        try:
            self.w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URL))
            print(f"Web3 connected: {self.w3.is_connected()}")
            
            # ABI 로드
            with open('web3_app/tournament_abi.json') as f:
                self.abi = json.load(f)
            
            self.contract_address = settings.CONTRACT_ADDRESS
            print(f"Contract address: {self.contract_address}")
            
            self.contract = self.w3.eth.contract(
                address=self.contract_address, 
                abi=self.abi
            )
            
            self.admin_account = Account.from_key(settings.ADMIN_PRIVATE_KEY)
            print(f"Admin account address: {self.admin_account.address}")
            
        except Exception as e:
            print(f"Initialization error: {str(e)}")
            raise e
