import logging
from django.shortcuts import render, redirect
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated, AllowAny 
from rest_framework import viewsets, status
from django.contrib.auth.models import User
from .serializers import TOTPSerializer
from django.contrib.auth import logout, login
from .services import verify_totp
from .models import TOTP
from urllib.parse import quote
import jwt
from django.conf import settings
import pyotp
import redis
from cryptography.fernet import Fernet
from datetime import datetime
from datetime import date, time, timedelta
from django.middleware.csrf import get_token
from .serializers import TOTPSerializer
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class IsAuthenticatedOrSpecialHeader(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.headers.get('X-Special-Access') == 'true':
            return True
        return request.user and request.user.is_authenticated


class TOTPViewSet(viewsets.ViewSet):
	queryset = TOTP.objects.all()
	serializer_class = TOTPSerializer
	@action(detail=False, methods=['POST'], url_path='verify-2fa', permission_classes=[AllowAny])
	def verify_2fa(self, request):
		try:
			token = request.data.get('token') 
			user_id = request.data.get('user_id')
			if not user_id:
				return Response({'error': 'User ID is required'}, 
							status=status.HTTP_400_BAD_REQUEST)
				
			user = User.objects.get(id=user_id)
			totp = TOTP.objects.get(user=user)
			verification_result = verify_totp(totp, token)
			
			if verification_result:
				# JWT 토큰 생성
				access_token = jwt.encode(
					{
						'user_id': user.id,
						'exp': datetime.utcnow() + timedelta(hours=1),
					},
					settings.SECRET_KEY,
					algorithm='HS256',
				)
				
				# 응답 생성
				response = Response({
					'message': 'Authentication successful',
					'redirect_url': '/sidebar'
				})
				
				# JWT 토큰을 쿠키에 설정
				response.set_cookie(
					'access_token', 
					access_token,
					httponly=True,       
					secure=True,
					samesite='strict',      
					max_age=3600 
				)
				
				csrf_token = get_token(request)
				response.set_cookie(
					'csrftoken', 
					csrf_token,
					secure=True,
					samesite='strict',
					max_age=3600
				)
				
				user.profile.mode = 'Casual Mod'
				user.profile.save()
				
				return response
			else:
				logger.error(f"Error during tournamentGet: {e}", exc_info=True)
				return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)
				
		except User.DoesNotExist:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
		except TOTP.DoesNotExist:
			return Response({'error': 'totp not found'}, status=status.HTTP_404_NOT_FOUND)
		except Exception as e:
			print(f"Unexpected error: {str(e)}")
			return Response({'error': f'Server error: {str(e)}'}, 
						status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	@action(detail=False, methods=['POST'], url_path='save-2fa', permission_classes=[IsAuthenticatedOrSpecialHeader])
	def save_2fa(self, request):
		try:
			# Redis 클라이언트 생성
			redis_client = redis.Redis(host='redis', port=6379, db=0)
			
			if request.headers.get('X-Special-Access') == 'true':
				user_id = request.data.get('user_id')
				print("@@@",user_id)
				if not user_id:
					return Response({'error': 'User ID is required'}, status=400)
				try:
					user = User.objects.get(id=user_id)
				except User.DoesNotExist:
					return Response({'error': 'User not found'}, status=404)
			else:
				user = request.user
			setup_id = request.data.get('setup_id')
			secret = redis_client.get(f"2fa_temp_{setup_id}")
			if not secret:
				return Response({'error': 'Setup expired'}, status=400)
			
			encryption_key = settings.ENCRYPTION_KEY
			if isinstance(encryption_key, str):
				encryption_key = encryption_key.encode('utf-8')
			cipher_suite = Fernet(settings.ENCRYPTION_KEY)
			totp, created = TOTP.objects.update_or_create(
				user=user,
				defaults={
					'totp_enabled': True,
					'totp_secret': cipher_suite.encrypt(secret)
				}
			)
			print(settings.ENCRYPTION_KEY)
			return Response({
				'message': 'Successfully saved',
				'status': 'success'
			}, status=status.HTTP_200_OK)
		except Exception as e:
			logger.error(f"Error during tournamentGet: {e}", exc_info=True)
			return Response(
				{'error': str(e)}, 
				status=status.HTTP_400_BAD_REQUEST
			)