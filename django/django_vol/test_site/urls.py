"""
URL configuration for test_site project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from accounts.views import UserViewSet, OAuthViewSet
from totp.views import TOTPViewSet
from channel.views import FriendRequestViewSet, FriendBlockedViewSet, RelatedViewSet
from api.views import TestLoginViewSet, StateUpdateViewSet, MatchingGameViewSet
from chat.views import ChatRoomViewSet, ChatRoomMessageViewSet
# from game.views import TournamentViewSet, MatchViewSet
from game.views import MatchViewSet
import re

from django.conf import settings
from django.conf.urls.static import static
# from api.views import UserViewSet, TournamentViewSet, MatchViewSet

router = DefaultRouter()
router.register(r'user', UserViewSet)
router.register(r'oauth', OAuthViewSet, basename='oauth')
router.register(r'totp', TOTPViewSet, basename='totp')
router.register(r'friend', FriendRequestViewSet, basename='friendrequest')
router.register(r'blocked', FriendBlockedViewSet)
router.register(r'chatroom', ChatRoomViewSet)
router.register(r'chatroommessage', ChatRoomMessageViewSet)
router.register(r'match_stat', MatchViewSet)
router.register(r'testlogin', TestLoginViewSet, basename='testlogin')
router.register(r'related', RelatedViewSet, basename='related')
router.register(r'status', StateUpdateViewSet, basename='statusupdate')
router.register(r'match', MatchingGameViewSet, basename='matching')

# router.register(r'tournament', TournamentViewSet)
# router.register(r'match', MatchViewSet)

from django.http import HttpResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from django.http import JsonResponse

def metrics_view(request):
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)

def health_check(request):
    return JsonResponse({"status": "ok"})

from django.core.validators import MaxLengthValidator, ProhibitNullCharactersValidator
from test_site.validator import HTMLSanitizerValidator
from django.core.exceptions import ValidationError

def validate_view(request):
    errors = []
    validators = [
        HTMLSanitizerValidator(),
        MaxLengthValidator(10),
        ProhibitNullCharactersValidator()
    ]

    input_data = request.GET.get('nickname', '')  # GET 요청에서 nickname 받기
    
    
    # 모든 검증기 실행
    if input_data == '':
        return JsonResponse({'status': 'ok'})
    if not re.match(r"^[a-zA-Z0-9]+$", input_data):
        errors.append("닉네임은 영문 소문자와 숫자만 사용할 수 있습니다.")

    for validator in validators:
        try:
            validator(input_data)
        except ValidationError as e:
            errors.extend(e.messages)
    
    if errors:
        return JsonResponse({
            'status': 'error',
            'errors': errors
        }, status=400)

    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('nginx/admin/', admin.site.urls),
    path('', include('home.urls')),
    path('api/tournaments/', include('web3_app.urls')),
    path('api/', include(router.urls)),
    path('accounts/', include('accounts.urls')),
    path('metrics/', metrics_view, name='prometheus-metrics'),
    path('health/', health_check, name='health_check'),
    path('api/validate/', validate_view, name='validate'),
]
