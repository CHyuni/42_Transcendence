"""
ASGI config for test_site project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path, re_path
from chat import consumers as chat_consumers
from game import consumers as game_consumers

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_site.settings')

application = ProtocolTypeRouter({
	"http": get_asgi_application(),
	"websocket": AuthMiddlewareStack(
		URLRouter(
			[
				re_path(r'ws/chat/(?P<room_name>\w+)/$', chat_consumers.ChatConsumer.as_asgi()),
				re_path(r'ws/pong/(?P<room_name>\w+)/$', game_consumers.PongConsumer.as_asgi()),
			]
		)
	),
})
