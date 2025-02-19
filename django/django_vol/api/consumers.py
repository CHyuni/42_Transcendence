from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from urllib.parse import parse_qs
import json
import logging

logger = logging.getLogger(__name__)
from django.db import transaction

class MatchingConsumer(AsyncWebsocketConsumer):
	try:
		async def connect(self):
		query_params = parse_qs(self.scope['query_string'].decode())
		mode = query_params.get('mode', [None])[0]
		username = query_params.get('username', [None])[0]
		userid = query_params.get('userid', [None])[0]
		self.room_group_name = 'matching' + mode
		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
		await self.accept()

		self.username = username
		self.userid = userid
		self.mode = mode
    except Exception as e:
        logger.error(f'Error in connect: {e}')
	
	async def disconnect(self, close_code):
        logger.info(f'close: {close_code}')
        await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

    async def receive(self, text_data):
		