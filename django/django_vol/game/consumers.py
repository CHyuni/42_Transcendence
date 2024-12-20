import json
import math
from channels.generic.websocket import AsyncWebsocketConsumer
from channels_redis.core import RedisChannelLayer

class PongConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = f'game_{self.room_name}'

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		await self.accept()

		group_channels = await self.channel_layer.group_channels(self.room_group_name)
		if len(group_channels) == 1:
			self.user_identifier = 'user1'
		elif len(group_channels) == 2:
			self.user_identifier = 'user2'
		else:
			await self.close()
			return
		
		canvas_width = 800
		canvas_height = 600

		self.game_state = {
			'ball': {
				'x' : canvas_width / 2,
				'y' : canvas_height / 2,
				'radius': 10,
				'velocityX': 5,
				'velocityY': 5,
				'speed': 7
			},
			'user1': {
				'x': 0,
				'y': (canvas_height - 100) / 2,
				'width': 10,
				'height': 100,
				'score': 0,
			},
			'user2': {
				'x': canvas_width - 10,
				'y': (canvas_height - 100) / 2,
				'width': 10,
				'height': 100,
				'score': 0,
			},
			'canvas_width': canvas_width,
			'canvas_height': canvas_height,
		}

		await self.send(text_data=json.dumps({
			'game_state': self.game_state
		}))

		if len(group_channels) == 2:
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_start',
				}
			)
	
	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

		group_channels = await self.channel_layer.group_channels(self.room_group_name)

		if not group_channels:
			await self.channel_layer.connection.delete(self.room_group_name)
	
	async def receive_json(self, text_data_json):
		message = text_data_json
		key = message['key']
		user_identifier = self.user_identifier

		self.update_game_state(key, user_identifier)

		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'update_game_state',
				'game_state': self.game_state
			}
		)

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

		self.update()

	def update(self):
		if(self.game_state['ball']['x'] - self.game_state['ball']['radius'] < 0):
			self.game_state['user2']['score'] += 1
			self.resetBall()
		elif( self.game_state['ball']['x'] + self.game_state['ball']['radius'] > self.game_state['canvas_width']):
			self.game_state['user1']['score'] += 1
			self.resetBall()

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

			self.game_state['ball']['speed'] += 0.1

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

	def resetBall(self):
		self.game_state['ball']['x'] = self.game_state['canvas_width']/2
		self.game_state['ball']['y'] = self.game_state['canvas_height']/2
		self.game_state['ball']['velocityX'] = -self.game_state['ball']['velocityX']
		self.game_state['ball']['speed'] = 7