from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<room_name>[^/]+)/$', consumers.PongConsumer.as_asgi()),
]

urlpatterns = websocket_urlpatterns