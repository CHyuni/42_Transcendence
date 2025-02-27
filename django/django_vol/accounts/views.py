from django.shortcuts import render, redirect, get_object_or_404
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, status
from django.contrib.auth.models import User
from .models import Profile
from .serializers import UserSerializer, ProfileSerializer
from django.contrib.auth import logout, login
from .services import *
from totp.services import setup_totp
from totp.models import TOTP
from urllib.parse import quote
import jwt
from django.conf import settings
import pyotp
import logging
from cryptography.fernet import Fernet
from datetime import datetime, timedelta
import uuid
import redis
from api.models import Matching
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from totp.views import IsAuthenticatedOrSpecialHeader
from channel.models import FriendBlocked
from django.db.models import Q
from django.db import transaction
import base64
from django.utils import timezone
from google.oauth2 import id_token


logger = logging.getLogger(__name__)
# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
	queryset = User.objects.all()
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]

	@action(detail=False, methods=['get'], url_path='get-status')
	def get_status(self, request):
		try:
			user = request.user.profile.status
			return Response({'status': user}, status=status.HTTP_200_OK)
		except Exception as e:
			logger.error(f"Error during tournamentGet: {e}", exc_info=True)
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	@action(detail=False, methods=['get'], url_path='online-users')
	def get_logged_in_users(self, request):
		current_user = request.user.id

		blocked_user_ids = FriendBlocked.objects.filter(user_id=current_user).values_list('blocked_user_id', flat=True)
		blocking_user_ids = FriendBlocked.objects.filter(blocked_user_id=current_user).values_list('user_id', flat=True)
		online_users = User.objects.filter(profile__is_online=True).exclude(
			Q(id__in=blocked_user_ids) | Q(id__in=blocking_user_ids)
		)
		profiles = [user.profile for user in online_users]
		serializer = ProfileSerializer(profiles, many=True)
		return Response({'users': serializer.data})

	@action(detail=True, methods=['get'], url_path='profile')
	def get_profile(self, request, pk=None):
		if pk == 'me':
			profile = request.user.profile
		else:
			try:
				profile = self.get_queryset().get(pk=pk).profile
			except User.DoesNotExist:
				return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

		serializer = ProfileSerializer(profile)
		return Response(serializer.data)
	
	@action(detail=True, methods=['get'], url_path='modeUpdate')
	def mode_update(self, request, pk=None):
		if pk != 'me':
			return Response(status=status.HTTP_403_FORBIDDEN)
		
		profile = get_object_or_404(Profile, user=request.user)
		init = self.request.query_params.get('init')

		if init:
			profile.mode = 'Casual Mod'
			profile.save()
			return Response({'message': 'Success'}, status=status.HTTP_200_OK)

		if not profile.mode:
			profile.mode = 'Casual Mod'
		elif profile.mode == 'Casual Mod':
			profile.mode = 'Tournament Mod'
		elif profile.mode == 'Tournament Mod':
			profile.mode = 'Casual Mod'
		profile.save()
		serializer = ProfileSerializer(profile)
		return Response({'message': 'Success'}, status=status.HTTP_200_OK)

	@action(detail=False, methods=['patch'], url_path='update-profile')
	def update_profile(self, request):
		try:
			profile = request.user.profile
			
			# ProfileSerializer를 사용하여 부분 업데이트
			serializer = ProfileSerializer(
				profile,
				data=request.data,
				partial=True  # 부분 업데이트 허용
			)
			
			if not serializer.is_valid():
				return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
				
			# TOTP 처리
			totp_obj, created = TOTP.objects.get_or_create(
				user=profile.user,
				defaults={'totp_enabled': request.data.get('totp_enabled', False)}
			)
			if not created:
				totp_obj.totp_enabled = request.data.get('totp_enabled', False)
				totp_obj.save()
			
			serializer.save()
			
			return Response(serializer.data)
		except Exception as e:
			logger.error(f"Error : {e}", exc_info=True)
			return Response(
				{'error': f'{str(e)}'}, 
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)

	@action(detail=False, methods=['patch'], url_path='update-profile-image')
	def update_profile_image(self, request):
		profile = request.user.profile
		
		if 'profile_image_file' in request.FILES:
			try:
				profile.profile_image_file = request.FILES['profile_image_file']
				profile.save()
				
				# 시리얼라이저를 사용하여 응답
				serializer = ProfileSerializer(profile)
				return Response(serializer.data)
			except Exception as e:
				return Response({'error': str(e)}, status=400)
		
		return Response({'error': 'No image file provided'}, status=400)

def process_oauth_flow(request, get_tokens_func, get_user_info_func, create_or_update_user_func):
	code = request.GET.get('code')
	if not code:
		logger.info("--------------------------------------------------1")
		return redirect('')

	logger.info(code)
	tokens = get_tokens_func(code)
	if not tokens:
		logger.info("--------------------------------------------------2")
		return redirect('')

	access_token = tokens.get('access_token')
	if not access_token:
		logger.info("--------------------------------------------------3")
		return redirect('')

	user_info = get_user_info_func(access_token)
	if not user_info:
		logger.info("--------------------------------------------------4")
		return redirect('')

	user = create_or_update_user_func(user_info)
	
	# 로그인 처리 부분
	if not hasattr(user, 'totp') or not user.totp.totp_enabled:
		access_token = jwt.encode(
			{
				'user_id': user.id,
				'exp': datetime.utcnow() + timedelta(hours=1),
			},
			settings.SECRET_KEY,
			algorithm='HS256',
		)
		user.profile.mode = 'Casual Mod'
		user.profile.save()

		response = redirect('/sidebar')
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
		return response
	else:
		return redirect(f'/verify-2fa?user_id={user.id}')

class OAuthViewSet(viewsets.ViewSet):
	permission_classes = [IsAuthenticated]

	@action(detail=False, methods=['get'], url_path='google-callback', permission_classes=[AllowAny])
	def google_oauth_callback(self, request):
		return process_oauth_flow(
			request,
			get_google_oauth_tokens,  
			get_google_user_info,     
			create_or_update_google_user  
		)

	@action(detail=False, methods=['get'], url_path='callback', permission_classes=[AllowAny])
	def oauth_callback(self, request):
		return process_oauth_flow(
			request,
			get_oauth_tokens,  
			get_user_info,     
			create_or_update_user  
		)

	@action(detail=False, methods=['get'], url_path='qrcode', permission_classes=[IsAuthenticatedOrSpecialHeader])
	def qr_generate(self, request):
		try:
			redis_client = redis.Redis(host='redis', port=6379, db=0)
			
			# X-Special-Access로 접근할 때는 user_id 파라미터로 user를 찾음
			if request.headers.get('X-Special-Access') == 'true':
				user_id = request.GET.get('user_id')
				if not user_id:
					return Response({'error': 'User ID is required'}, status=400)
				try:
					user = User.objects.get(id=user_id)
				except User.DoesNotExist:
					return Response({'error': 'User not found'}, status=404)
			else:
				user = request.user
				
			qr_code_url, secret = setup_totp(user)
			setup_id = str(uuid.uuid4())
			print("@@@",setup_id)
			redis_client.setex(f"2fa_temp_{setup_id}", 300, secret)
			
			return Response({
				'qr_code_url': qr_code_url,
				'setup_id': setup_id
			})
		except Exception as e:
			print(f"Error in qr_generate: {e}")
			return Response({
				'error': str(e)
			}, status=500)

	@action(detail=False, methods=['get'], url_path='logout')
	def logout_view(self, request):
		try:
			if request.user.profile.status == 'playing':
				return Response({'playing': True}, status=status.HTTP_200_OK)
			# 사용자 상태 업데이트
			with transaction.atomic():
				find_me = Matching.objects.filter(state='find', user=request.user)
				if find_me.exists():
					find_me.delete()
			request.user.profile.is_online = False
			request.user.profile.status = 'offline'
			request.user.profile.mode = 'Casual Mod'
			request.user.profile.last_logins = timezone.now()
			request.user.profile.save()
			
			# JWT 토큰이 담긴 쿠키 삭제를 위한 응답 생성
			response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
			response.delete_cookie('access_token')
			response.delete_cookie('csrftoken')
			return response
			
		except Exception as e:
			print(f"DEBUG ERROR: {e}")  # 실제 오류 메시지를 출력하기 위한 로그 추가
			return Response({'error': 'Logout failed'}, status=status.HTTP_400_BAD_REQUEST)