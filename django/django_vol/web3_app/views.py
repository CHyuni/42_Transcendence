# views.py
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .utils import Web3Helper
import json
from django.views.decorators.csrf import csrf_exempt
import logging
from .tasks import process_transaction_task

logger = logging.getLogger(__name__)
web3_helper = Web3Helper()

@csrf_exempt
@require_http_methods(["POST"])
def create_game(request):
    data = json.loads(request.body)

    # Celery 작업을 비동기적으로 호출
    task = process_transaction_task.delay(data)
    
    return JsonResponse({
        "status": "pending",
        "message": "Transaction has been queued",
        "task_id": task.id  # 나중에 상태 확인에 사용할 수 있음
    })

@require_http_methods(["GET"])
def get_all_game_results(request):
    try:
        # 컨트랙트 함수 호출
        results = web3_helper.contract.functions.getAllGames().call()

        # 결과 포맷팅
        formatted_results = [{
            'player1': game[0],
            'player2': game[1],
            'player1Score': game[2],
            'player2Score': game[3],
            'winner': game[4],
            'loser': game[5],
            'mode': game[6],
            'gameType': game[7]
        } for game in results]

        return JsonResponse({'status': 'success', 'data': formatted_results})
    except Exception as e:
        logger.error(f"Error during tournamentGet: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=400)

# @require_http_methods(["GET"])
# def get_game_results_by_player(request, player_id):
#     try:
#         player_id = int(player_id)
        
#         # 컨트랙트 함수 호출을 별도의 try/except로 분리
#         try:
#             results = web3_helper.contract.functions.getGameResultsByPlayer(int(player_id)).call({
#                 'from': web3_helper.admin_account.address  # from 주소 명시적 지정
#             })
#         except Exception as contract_error:
#             logger.error(f"Contract call error: {contract_error}", exc_info=True)
#             return JsonResponse({
#                 'error': 'Contract call failed',
#                 'details': str(contract_error)
#             }, status=400)

#         # 결과 포맷팅
#         formatted_results = [{
#             'player1': game[0],
#             'player2': game[1],
#             'player1Score': game[2],
#             'player2Score': game[3],
#             'player1BeforeRating': game[4],
#             'player2BeforeRating': game[5],
#             'player1AfterRating': game[6],
#             'player2AfterRating': game[7],
#             'mode': game[8],
#             'result': game[9]
#         } for game in results]

#         return JsonResponse({'status': 'success', 'data': formatted_results})  # JsonResponse 사용
#     except Exception as e:
#         logger.error(f"Error during tournamentGet: {e}", exc_info=True)
#         return JsonResponse({'error': str(e)}, status=400)
# @csrf_exempt
# def create_tournament(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             tournament_id = data.get('id')
#             name = data.get('name')
            
#             print(f"Received tournament data - ID: {tournament_id}, Name: {name}")
            
#             if tournament_id is None or name is None:
#                 return JsonResponse({
#                     'success': False,
#                     'message': 'Missing required fields: id or name'
#                 }, status=400)

#             helper = Web3Helper()
#             result = helper.create_tournament(tournament_id, name)
            
#             if result.get('success'):
#                 return JsonResponse(result)
#             else:
#                 return JsonResponse({
#                     'success': False,
#                     'message': result.get('error', 'Unknown error occurred')
#                 }, status=400)

#         except Exception as e:
#             print(f"Error: {str(e)}")
#             return JsonResponse({
#                 'success': False,
#                 'message': str(e)
#             }, status=500)

#     return JsonResponse({
#         'success': False,
#         'message': 'Method not allowed'
#     }, status=405)

# @csrf_exempt
# def create_game(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             tournament_id = data.get('tournament_id')
#             p1 = data.get('p1')
#             p2 = data.get('p2')
#             p1_point = data.get('p1_point')
#             p2_point = data.get('p2_point')
            
#             if not all([tournament_id, p1, p2, p1_point is not None, p2_point is not None]):
#                 return JsonResponse({
#                     'success': False,
#                     'message': 'Missing required fields'
#                 }, status=400)

#             helper = Web3Helper()
#             result = helper.create_game(tournament_id, p1, p2, p1_point, p2_point)
            
#             if result.get('success'):
#                 return JsonResponse(result)
#             else:
#                 return JsonResponse({
#                     'success': False,
#                     'message': result.get('error', 'Unknown error occurred')
#                 }, status=400)

#         except Exception as e:
#             print(f"Error: {str(e)}")
#             return JsonResponse({
#                 'success': False,
#                 'message': str(e)
#             }, status=500)

#     return JsonResponse({
#         'success': False,
#         'message': 'Method not allowed'
#     }, status=405)