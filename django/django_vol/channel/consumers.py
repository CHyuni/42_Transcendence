from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import FriendRequest, FriendBlocked
from django.contrib.auth.models import User
from urllib.parse import parse_qs
import json
import logging
import datetime

logger = logging.getLogger(__name__)
from django.db import transaction

class ChannelConsumer(AsyncWebsocketConsumer):
    try:
        async def connect(self):
            self.room_group_name = 'friend_requests'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

            query_params = parse_qs(self.scope['query_string'].decode())
            username = query_params.get('username', [None])[0]
            userid = query_params.get('userid', [None])[0]

            self.username = username
            self.userid = userid
            await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'refresh',
                        'refreshInitiator': self.username,
                    }
                )
            logger.info(f'Websocket connected: {self.channel_name}, selfUsername: {self.username}, selfUserid: {self.userid}')
    except Exception as e:
        logger.error(f'Error in connect: {e}')

    async def disconnect(self, close_code):
        logger.info(f'close: {close_code}')
        await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

    async def receive(self, text_data):
        logger.info(text_data)
        data = json.loads(text_data)
        if data.get('type') == 'create_friend_request':
            request, created = await self.create_friend_request(
                from_user_id=self.userid,
                to_user_id=data['to_user_id']
            )
            if created:
                status_message = "friend_request_success"
            else:
                status_message = "friend_already_exists"
            from_user = await database_sync_to_async(User.objects.get)(id=self.userid)
            to_user = await database_sync_to_async(User.objects.get)(id=data['to_user_id'])
            await self.send(text_data=json.dumps({
                'type': 'send_new_friend_request',
                'status': status_message,   
                'to_user_name': to_user.username,
            }))
            await self.channel_layer.group_send(
                'friend_requests',
                {
                    'type': 'friend_request_notification',
                    'message': {
                        'type': 'new_friend_request',
                        'to_user_id': data['to_user_id'],
                        'from_user_name': self.username,
                        'to_user_name': to_user.username,
                    }
                }
            )
        if data.get('type') == 'update_friend_request':
            request = await self.update_friend_request(
                request_id=data['request_id'],
                new_status=data['new_status']
            )
            await self.send(text_data=json.dumps({
                'type': 'selfRefresh',
                'request_id': request.id,
                'new_status': request.status
            }))
        if data.get('type') == 'selfRefresh':
            users = data.get('users', [])
            print('Received users:', users)
            await self.channel_layer.group_send(
                self.room_group_name, {
                    'type': 'selfRefresh',
                    'user_ids': users,
                }
            )
        if data.get('type') == 'refresh':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'refresh',
                }
            )
        if data.get('type') == 'game_request':
            try:
                from_user = await database_sync_to_async(User.objects.get)(id=int(self.userid))
                to_user_id = data['to_user']
                to_user = await database_sync_to_async(User.objects.get)(id=to_user_id)
                mode = data['mode']
                await self.channel_layer.group_send(
                    self.room_group_name, {
                        'type': 'gameRequest',
                        'from_user_id': from_user.id,
                        'from_user_name': from_user.username,
                        'to_user_id': to_user.id,
                        'to_user_name': to_user.username,
                        'mode': mode
                    }
                )
            except User.DoesNotExist as e:
                logger.error(f"User not found: {e}")
            except ValueError as e:
                logger.error(f"Invalid user ID format: {e}")
            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}")
        if data.get('type') == 'game_response':
            try:
                logger.info(data)
                from_user_id = data['from_user_id']
                result = data['response']
                from_user_name = data['from_user_name']
                to_user_name = data['to_user_name']
                to_user_id = data['to_user_id']
                if 'match' in data:
                    matching = True
                else:
                    matching = False
                if 'room_name' in data:
                    room_name = data['room_name']
                else:
                    room_name = None

                await self.channel_layer.group_send(
                    self.room_group_name, {
                        'type': 'gameResponse',
                        'from_user_id': from_user_id,
                        'from_user_name': from_user_name,
                        'to_user_name': to_user_name,
                        'to_user_id': to_user_id,
                        'result': result,
                        'matching': matching,
                        'room_name': room_name
                    }
                )
            except User.DoesNotExist as e:
                logger.error(f"User not found: {e}")
            except ValueError as e:
                logger.error(f"Invalid user ID format: {e}")
            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}")
        if data.get('type') == 'Casual_matched':
            try:
                user1_id = self.userid
                user1_name = self.username
                user2_id = data['otheruid']
                user2_name = data['otherusername']

                await self.channel_layer.group_send(
                    self.room_group_name, {
                        'type': 'casualStart',
                        'user1_id': user1_id,
                        'user1_name': user1_name,
                        'user2_id': user2_id,
                        'user2_name': user2_name,
                    }
                )
            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}")
        if data.get('type') == 'tourna_match':
            try:
                matched_users = data['matched_users']
                users_ids = [user['user_id'] for user in matched_users]
                users_name = [user['tournament_name'] for user in matched_users]
                if 'custom' in data:
                    custom = True
                else:
                    custom = False

                await self.channel_layer.group_send(
                    self.room_group_name, {
                        'type': 'tournaStart',
                        'users_ids': users_ids,
                        'users_name': users_name,
                        'custom': custom
                    }
                )
            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}")
        if data.get('type') == 'tour_win':
            try:
                user_name = data['user_name']
                users_ids = data['users_ids']
                winner = data['winner']
                if 'side' in data:
                    side = data['side']
                    logger.info(side)
                    logger.info(winner)
                else:
                    side = None

                await self.channel_layer.group_send(
                    self.room_group_name, {
                        'type': 'tourWin',
                        'users_ids': users_ids,
                        'user_name': user_name,
                        'winner': winner,
                        'side': side,
                    }
                )
            except Exception as e:
                logger.error(f'An unexpected error occurred: {e}')
        if data.get('type') == 'tour_custom':
            try:
                from_user_id = data.get('from_user_id')
                from_user_name = data.get('from_user_name')
                to_user_id = data.get('to_user_id')
                to_user_name = data.get('to_user_name')
                response = data.get('response')
                nickname = data['nickname']

                await self.channel_layer.group_send(
                    self.room_group_name, {
                        'type': 'tourCustom',
                        'from_user_id': from_user_id,
                        'from_user_name': from_user_name,
                        'to_user_id': to_user_id,
                        'to_user_name': to_user_name,
                        'response': response,
                        'nickname': nickname,
                    }
                )
            except Exception as e:
                logger.error(f'Error tournaCustom: {e}', exc_info=True)
        if data.get('type') == 'custom_user_update':
            try:
                userData = data.get('userData')
                users_ids = data.get('users_ids')

                await self.channel_layer.group_send(
                    self.room_group_name, {
                        'type': 'customUserUpdate',
                        'userData': userData,
                        'users_ids': users_ids,
                    }
                )
            except Exception as e:
                logger.error(f'Error custom_user_update: {e}', exc_info=True)

    async def customUserUpdate(self, event):
        try:
            userData = event['userData']
            users_ids = event['users_ids']
            send_flag = False

            for user_id in users_ids:
                if user_id == int(self.userid):
                    send_flag = True
                    break
            if send_flag:
                await self.send(text_data=json.dumps({
                    'type': 'custom_user_update',
                    'userData': userData,
                }))
        except Exception as e:
            logger.error(f'Error def custom_user_update: {e}', exc_info=True)

    async def tourCustom(self, event):
        try:
            from_user_id = event['from_user_id']
            from_user_name = event['from_user_name']
            to_user_id = event['to_user_id']
            to_user_name = event['to_user_name']
            response = event['response']
            nickname = event['nickname']

            if response == 'reject':
                if from_user_id == int(self.userid):
                    await self.send(text_data=json.dumps({
                        'type': 'tour_custom_reject',
                        'to_user_name': to_user_name,
                    }))
            elif response == 'accept':
                if from_user_id == int(self.userid):
                    await self.send(text_data=json.dumps({
                        'type': 'tour_custom',
                        'from_user_id': from_user_id,
                        'from_user_name': from_user_name,
                        'to_user_id': to_user_id,
                        'to_user_name': to_user_name,
                        'nickname': nickname,
                    }))
        except Exception as e:
            logger.error(f'Error tourCustom: {e}', exc_info=True)

    async def tourWin(self, event):
        users_ids = event['users_ids']
        user_name = event['user_name']
        winner = event['winner']
        side = event['side']

        if side is None:
            for user_id in users_ids:
                try:
                    if user_id == winner:
                        await self.send(text_data=json.dumps({
                            'type': 'tourna_winner',
                            'user_name': user_name,
                        }))
                except Exception as e:
                    logger.error(f'An unexpected error occurred: {e}')
        else:
            if side == 'left':
                for i in range(len(users_ids)):
                    try:
                        if users_ids[i] == int(self.userid):
                            await self.send(text_data=json.dumps({
                                'type': 'tour_side_winner',
                                'user_name': user_name,
                                'side': side,
                                'winner': winner,
                                'myname': self.username
                            }))
                    except Exception as e:
                        logger.error(f'An unexpected error occurred: {e}')
            else:
                for i in range(len(users_ids)):
                    try:
                        logger.info(type(users_ids[i]))
                        if users_ids[i] == int(self.userid):
                            await self.send(text_data=json.dumps({
                                'type': 'tour_side_winner',
                                'user_name': user_name,
                                'side': side,
                                'winner': winner,
                                'myname': self.username
                            }))
                    except Exception as e:
                            logger.error(f'An unexpected error occurred: {e}')


    async def tournaStart(self, event):
        users_ids = event['users_ids']
        users_name = event['users_name']
        custom = event['custom']
        
        for user_id in users_ids:
            try:
                if user_id == int(self.userid):
                    await self.send(text_data=json.dumps({
                        'type': 'tourna_match',
                        'users_ids': users_ids,
                        'users_name': users_name,
                        'myuid': self.userid,
                        'custom': custom,
                    }))
            except Exception as e:
                logger.error(f'Error tournaStart self send user {user_id}: {e}', exc_info=True)

    async def casualStart(self, event):
        user1_id = event['user1_id']
        user1_name = event['user1_name']
        user2_id = event['user2_id']
        user2_name = event['user2_name']
        now = datetime.datetime.now()
        year = now.year
        month = now.month
        day = now.day
        hours = now.hour
        minutes = now.minute

        room_name = f"{year}-{month}-{day}-{hours}{minutes}-{user1_name}-{user2_name}"
        
        if (self.userid == user1_id) or (user2_id == int(self.userid)):
            await self.send(text_data=json.dumps({
                'type': 'game_response',
                'result': 'accept',
                'from_user_name': user1_name,
                'to_user_name': user2_name,
                'player1_id': user1_id,
                'player2_id': user2_id,
                'matching': 'y',
                'room_name': room_name
            }))

    async def gameResponse(self, event):
        from_user_id = event['from_user_id']
        to_user_id = event['to_user_id']
        result = event['result']
        from_user_name = event['from_user_name']
        to_user_name = event['to_user_name']
        room_name = event['room_name']

        if from_user_id == int(self.userid):
            await self.send(text_data=json.dumps({
                'type': 'game_response',
                'from_user_name': from_user_name,
                'to_user_name': to_user_name,
                'player1_id': from_user_id,
                'player2_id': to_user_id,
                'result': result,
                'room_name': room_name,
            }))

    async def gameRequest(self, event):
        from_user_id = event['from_user_id']
        from_user_name = event['from_user_name']
        to_user_id = event['to_user_id']
        to_user_name = event['to_user_name']
        mode = event['mode']

        if from_user_id == int(self.userid):
            await self.send(text_data=json.dumps({
                'type': 'game_request',
                'status': 'me',
                'to_user_name': to_user_name,
                'from_user_id': from_user_id,
                'to_user_id': to_user_id,
                'mode': mode,
            }))
        elif to_user_id == int(self.userid):
            await self.send(text_data=json.dumps({
                'type': 'game_request',
                'status': 'other',
                'from_user_name': from_user_name,
                'from_user_id': from_user_id,
                'to_user_id': to_user_id,
                'to_user_name': to_user_name,
                'mode': mode,
            }))

    async def selfRefresh(self, event):
        user_ids = event['user_ids']
        for uid in user_ids:
            if uid.get('id') == int(self.userid):
                await self.send(text_data=json.dumps({
                    'type': 'selfRefresh'
                }))
                return

    async def refresh(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'refreshInitiator': self.username,
        }))
        
    async def friend_request_notification(self, event):
        if event['message']['to_user_id'] == int(self.userid):
            await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def create_friend_request(self, from_user_id, to_user_id):
        try:
            with transaction.atomic():
                from_user = User.objects.get(id=from_user_id)
                to_user = User.objects.get(id=to_user_id)

                request, created = FriendRequest.objects.get_or_create(
                    from_user=from_user,
                    to_user=to_user,
                )
                return request, created
        except User.DoesNotExist:
            raise ValueError("사용자를 찾을 수 없습니다")
        except Exception as e:
            raise Exception(f"친구 요청 저장 중 오류 발생: {str(e)}")

    @database_sync_to_async
    def update_friend_request(self, request_id, new_status):
        try:
            request = FriendRequest.objects.get(id=request_id)
            request.status = new_status
            request.save()
            return request
        except FriendRequest.DoesNotExist:
            raise ValueError("친구 요청을 찾을 수 없습니다")
        except Exception as e:
            raise Exception(f"친구 요청 업데이트 중 오류 발생: {str(e)}")
