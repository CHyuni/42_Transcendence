import json
import math
import asyncio
import redis
import logging
import jwt
from datetime import datetime
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

from channels.generic.websocket import AsyncWebsocketConsumer
from channels_redis.core import RedisChannelLayer

class PongConsumer(AsyncWebsocketConsumer):
	room_name = {}

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		try:
			self.redis_client = redis.Redis(host='redis', port=6379, db=0)
			# Redis 연결 테스트
			self.redis_client.ping()
			logging.info("Redis connection successful")
		except Exception as e:
			logging.error(f"Redis connection error: {str(e)}")

	def verify_token_from_cookie(self):
		try:
			# scope에서 쿠키 정보 가져오기
			headers = dict(self.scope['headers'])
			cookie_header = headers.get(b'cookie', b'').decode()
			
			if not cookie_header:
				return False
				
			# 쿠키 파싱
			cookies = {}
			for item in cookie_header.split(';'):
				if '=' in item:
					name, value = item.strip().split('=', 1)
					cookies[name] = value
			
			token = cookies.get('access_token')
			if not token:
				return False
				
			# 토큰 검증
			decoded = jwt.decode(
				token,
				settings.SECRET_KEY,
				algorithms=["HS256"]
			)
			
			# 만료 시간 확인
			exp = decoded.get('exp')
			if exp and datetime.utcnow().timestamp() > exp:
				return False
				
			return True
			
		except jwt.ExpiredSignatureError:
			return False
		except jwt.InvalidTokenError:
			return False
		except Exception as e:
			logging.error(f"Token verification error: {e}")
			return False

	async def connect(self):
		try:
			logging.info("PongConsumer: Starting connection attempt")
			
			self.room_name = self.scope['url_route']['kwargs']['room_name']
			logging.info(f"PongConsumer: Room name: {self.room_name}")
			
			self.room_group_name = f'game_{self.room_name}'
			self.game_started_key = f"game_started_{self.room_group_name}"
			
			if self.room_group_name in PongConsumer.room_name and PongConsumer.room_name[self.room_group_name] == 'end':
				logging.warning(f"Room {self.room_group_name} is in 'end' state. Connection rejected.")
				await self.close()
				return
			logging.info("PongConsumer: Checking current players")
			current_players = int(self.redis_client.get(f"room_count_{self.room_group_name}") or 0)
			logging.info(f"PongConsumer: Current players: {current_players}")
			
			if current_players >= 2:
				logging.warning(f"Room {self.room_name} is full. Connection rejected.")
				await self.close()
				return
			
			current_players = int(self.redis_client.incr(f"room_count_{self.room_group_name}"))
			logging.info(f"PongConsumer: Updated player count: {current_players}")

			self.user_identifier = 'user1' if current_players == 1 else 'user2'
			if not hasattr(self, 'CANVAS_WIDTH'):
				self.CANVAS_WIDTH = 800
			if not hasattr(self, 'CANVAS_HEIGHT'):
				self.CANVAS_HEIGHT = 600

			if self.user_identifier == 'user1':
				self.game_state = {
					'ball': {
						'x': self.CANVAS_WIDTH / 2,
						'y': self.CANVAS_HEIGHT / 2,
						'radius': 10,
						'velocityX': 5,
						'velocityY': 5,
						'speed': 7
					},
					'user1': {
						'x': 0,
						'y': (self.CANVAS_HEIGHT - 100) / 2,
						'width': 10,
						'height': 100,
						'score': 0,
					},
					'user2': {
						'x': self.CANVAS_WIDTH - 10,
						'y': (self.CANVAS_HEIGHT - 100) / 2,
						'width': 10,
						'height': 100,
						'score': 0,
					},
					'canvas_width': self.CANVAS_WIDTH,
					'canvas_height': self.CANVAS_HEIGHT,
				}
				self.redis_client.set(self.game_started_key, "False")
				self.redis_client.set(f"game_state_{self.room_group_name}", 
									json.dumps(self.game_state))
			else:
				stored_state = self.redis_client.get(f"game_state_{self.room_group_name}")
				if not stored_state:
					logging.error("Game state not found")
					await self.close()
					return
				self.game_state = json.loads(stored_state)
			
			await self.channel_layer.group_add(
				self.room_group_name,
				self.channel_name
			)
			
			self.connected = True
			await self.accept()
			if not self.verify_token_from_cookie():
				await self.send(text_data=json.dumps({
					'type': 'token_expired',
					'message': 'Your session has expired'
				}))
				await self.close()
				return			
			await self.send(text_data=json.dumps({
				'game_state': self.game_state,
				'user_identifier': self.user_identifier
			}))
			
			if self.room_name == 'timeout':
				PongConsumer.room_name[self.room_group_name] = 'end'
				await self.send(text_data=json.dumps({
					'type': 'timeout',
				}))
			elif current_players == 2:
				self.redis_client.set(self.game_started_key, "True")
				await self.channel_layer.group_send(
					self.room_group_name,
					{
						'type': 'game_start',
					}
				)
			elif current_players < 2:
				await self.send(text_data=json.dumps({
					'type': 'timeout_check',
				}))
				
		except Exception as e:
			logging.error(f"PongConsumer connection error: {str(e)}")
			logging.error(f"Error type: {type(e)}")
			import traceback
			logging.error(f"Traceback: {traceback.format_exc()}")
			if hasattr(self, 'connected') and not self.connected:
				self.redis_client.decr(f"room_count_{self.room_group_name}")
			await self.close()

	async def game_start(self, event):
		if not self.connected:
			return
		await self.send(text_data=json.dumps({
			'type': event['type']
		}))

		asyncio.create_task(self.game_loop(event))

	async def game_loop(self, event):
		if not hasattr(self, 'game_loop_running'):
			self.game_loop_running = True
			frame_per_second = 50
		
		while self.game_loop_running:
			try:
				game_started = self.redis_client.get(self.game_started_key)
				if not game_started or game_started.decode() != "True":
					self.game_loop_running = False
					break

				if self.user_identifier == 'user1':
					self.update()
					self.redis_client.set(f"game_state_{self.room_group_name}", 
										json.dumps(self.game_state))
			
				stored_state = self.redis_client.get(f"game_state_{self.room_group_name}")
				if not stored_state:
					logging.error("Game state not found")
					await self.close()
					return
				self.game_state = json.loads(stored_state)
				await self.send(text_data=json.dumps({
					'game_state': self.game_state
				}))
					
				await asyncio.sleep(1 / frame_per_second)
				
			except Exception as e:
				logging.error(f"Error in game loop: {e}")
				self.game_loop_running = False
				break
		
	async def update_send(self, event):
		if 'game_state' in event:
			self.game_state = event['game_state']

		await self.send(text_data=json.dumps({
			'game_state': self.game_state
		}))

	async def disconnect(self, close_code):
		if hasattr(self, 'game_loop_running'):
			self.game_loop_running = False
		try:
			if not hasattr(self, 'room_group_name'):
				return
				
			await self.channel_layer.group_discard(
				self.room_group_name,
				self.channel_name
			)
			
			current_players = int(self.redis_client.decr(f"room_count_{self.room_group_name}"))
			if current_players <= 0:
				keys_to_delete = [
					f"room_count_{self.room_group_name}",
					self.game_started_key,
					f"game_state_{self.room_group_name}"
				]
				self.redis_client.delete(*keys_to_delete)
			
			if current_players > 0:
				if not hasattr(self, 'gameEnd'):
					winner = 'user1' if self.user_identifier == 'user2' else 'uses1'
					await self.channel_layer.group_send(
						self.room_group_name, {
							'type': 'gameEnd',
							'winner': winner
						}
					)
				await self.channel_layer.group_send(
					self.room_group_name,
					{
						'type': 'game_stop',
						'message': 'Player disconnected'
					}
				)
				
		except Exception as e:
			logging.error(f"Disconnect error: {e}")
	
	async def game_stop(self, event):
		if not self.connected:
			return
		await self.send(text_data=json.dumps({
			'type': 'game_stop',
			'message': event['message']
		}))

	async def receive(self, text_data):
		if not self.verify_token_from_cookie():
			await self.send(text_data=json.dumps({
				'type': 'token_expired',
				'message': 'Your session has expired'
			}))
			await self.close()
			return
		text_data_json = json.loads(text_data)
		message = text_data_json
		if 'type' in message:
			if message['type'] == 'timeout':
				logger.info("ENTRY")
				PongConsumer.room_name[self.room_group_name] = 'end'
				return
		key = message['key']
		user_identifier = self.user_identifier

		stored_state = self.redis_client.get(f"game_state_{self.room_group_name}")
		if stored_state:
			self.game_state = json.loads(stored_state)

		self.update_game_state(key, user_identifier)

		self.redis_client.set(f"game_state_{self.room_group_name}", json.dumps(self.game_state))

		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'update_send',
				'game_state': self.game_state
			}
		)

	async def gameEnd(self, event):
		winner = event['winner']
		user1_score = self.game_state['user1']['score']
		user2_score = self.game_state['user2']['score']
		self.gameEnd = True
		if self.user_identifier == winner:
			await self.send(text_data=json.dumps({
				'type': 'game_win',
				'user1_score': user1_score,
				'user2_score': user2_score,
				}
			))
		else:
			await self.send(text_data=json.dumps({
				'type': 'game_lose',
				}
			))

	def update_game_state(self, key, user_identifier):
		if user_identifier in ['user1', 'user2']: # 사용자 식별자가 유효한지 확인
			user = self.game_state[user_identifier] # user_identifier에 따른 정보 접근
			if key == "ArrowDown" or key == "s": # 's' 키를 누른 경우도 포함
				if user['y'] + user['height'] < self.game_state['canvas_height']:
					user['y'] += user['height']/5
			elif key == "ArrowUp" or key == 'w': # 'w' 키를 누른 경우도 포함
				if user['y'] > 0:
					user['y'] -= user['height']/5
		else:
			pass

	async def send_game_end(self, winner):
		self.game_loop_running=False
		await self.channel_layer.group_send(
			self.room_group_name, {
				'type': 'gameEnd',
				'winner': winner
			}
		)

	def update(self):
		if(self.game_state['ball']['x'] - self.game_state['ball']['radius'] < 0):
			self.game_state['user2']['score'] += 1
			self.resetBall(direction=1)
			self.redis_client.set(f"game_state_{self.room_group_name}", json.dumps(self.game_state))
			if self.game_state['user2']['score'] == 11:
				asyncio.create_task(self.send_game_end('user2'))
				PongConsumer.room_name[self.room_group_name] = 'end'
		elif( self.game_state['ball']['x'] + self.game_state['ball']['radius'] > self.game_state['canvas_width']):
			self.game_state['user1']['score'] += 1
			self.resetBall(direction=-1)
			self.redis_client.set(f"game_state_{self.room_group_name}", json.dumps(self.game_state))
			if self.game_state['user1']['score'] == 11:
				asyncio.create_task(self.send_game_end('user1'))
				PongConsumer.room_name[self.room_group_name] = 'end'

		self.game_state['ball']['x'] += self.game_state['ball']['velocityX']
		self.game_state['ball']['y'] += self.game_state['ball']['velocityY']

		if(self.game_state['ball']['y'] - self.game_state['ball']['radius'] < 0 or self.game_state['ball']['y'] + self.game_state['ball']['radius'] > self.game_state['canvas_height']):
			self.game_state['ball']['velocityY'] = -self.game_state['ball']['velocityY']

		player = self.game_state['user1'] if self.game_state['ball']['x'] + self.game_state['ball']['radius'] < self.game_state['canvas_width']/2 else self.game_state['user2']

		if(self.collision(self.game_state['ball'], player)):
			collidePoint = (self.game_state['ball']['y'] - (player['y'] + player['height']/2))
			collidePoint = collidePoint / (player['height']/2)

			angleRad = (math.pi/4) * collidePoint

			direction = 1 if self.game_state['ball']['x'] + self.game_state['ball']['radius'] < self.game_state['canvas_width']/2 else -1
			self.game_state['ball']['velocityX'] = direction * self.game_state['ball']['speed'] * math.cos(angleRad)
			self.game_state['ball']['velocityY'] = self.game_state['ball']['speed'] * math.sin(angleRad)

			self.game_state['ball']['speed'] += 0.5

	def collision(self, b, p):
		p_top = p['y']
		p_bottom = p['y'] + p['height']
		p_left = p['x']
		p_right = p['x'] + p['width']

		b_top = b['y'] - b['radius']
		b_bottom = b['y'] + b['radius']
		b_left = b['x'] - b['radius']
		b_right = b['x'] + b['radius']

		return p_left < b_right and p_top < b_bottom and p_right > b_left and p_bottom > b_top

	def resetBall(self, direction):
		self.game_state['ball']['x'] = self.game_state['canvas_width']/2
		self.game_state['ball']['y'] = self.game_state['canvas_height']/2
		self.game_state['ball']['velocityX'] = direction * 5
		self.game_state['ball']['velocityY'] = 5 
		self.game_state['ball']['speed'] = 7