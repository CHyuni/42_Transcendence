from django.shortcuts import render
from django.db import transaction
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from accounts.models import Profile
from accounts.serializers import ProfileSerializer
from .models import Matching
from .serializers import MatchingSerializer
from django.shortcuts import redirect
from django.contrib.auth import login
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token  # 추가
from django.conf import settings  # 추가
from datetime import datetime, timedelta 
from rest_framework import status
import jwt
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class TestLoginViewSet(viewsets.ViewSet):
	permission_classes = [AllowAny]
	def create(self, request):
		try:
			name = request.data.get('temp')
			user = User.objects.get(username=name)
			user.profile.mode = 'Casual Mod'
			user.profile.is_online = True
			user.profile.status = "available"
			user.profile.save()
			access_token = jwt.encode(
				{
					'user_id': user.id,
					'exp': datetime.utcnow() + timedelta(hours=1),
				},
				settings.SECRET_KEY,
				algorithm='HS256',
			)
			# Response 객체 생성
			response = Response(
				{'message': 'Login successful'},
				status=status.HTTP_200_OK,
			)

			# 쿠키 설정
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

			# 리다이렉트 URL을 응답 데이터에 포함
			response.data['redirect_url'] = '/sidebar'

			return response
            
		except User.DoesNotExist:
			return Response(
				{'error': 'User not found'}, 
				status=status.HTTP_404_NOT_FOUND
			)

class StateUpdateViewSet(viewsets.ModelViewSet):
	queryset = Profile.objects.all()
	serializer_class = ProfileSerializer

	@action(detail=True, methods=['get'], url_path='get-state')
	def getState(self, request, pk=None):
		try:
			if pk == 'me':
				profile = request.user.profile
			else:
				profile = self.get_queryset().get(pk=pk)
			return Response({'message': profile.status, 'mode': profile.mode}, status=status.HTTP_200_OK)
		except Exception as e:
			return Response({'error': f'{str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	@action(detail=True, methods=['patch'], url_path='state-update')
	def stateUpdate(self, request, pk=None):
		try:
			if pk == 'me':
				profile = request.user.profile
			else:
				return Response(status=status.HTTP_403_FORBIDDEN)
			new_status = request.data.get('status')
			if new_status:
				profile.status = new_status
				profile.save()
				return Response({'message': 'update'}, status=status.HTTP_200_OK)
			else:
				return Response({'message': 'Not Found status'}, status=status.HTTP_400_BAD_REQUEST)
		except Exception as e:
			return Response({'error': f'{str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def check_login_status(request):
	return Response({
		'username': request.user.username
	})

@api_view(['GET'])
def get_logged_in_users(request):
	online_users = User.objects.filter(profile__is_online=True)
	username = [user.username for user in online_users]

	return Response({'users': username})
	
class MatchingGameViewSet(viewsets.ModelViewSet):
	queryset = Matching.objects.all()
	serializer_class = MatchingSerializer

	@action(detail=False, methods=['get'], url_path='start')
	def gameMatching(self, request):
		try:
			if request.user.profile.status == 'playing':
				return Response({'playing': True}, status=status.HTTP_200_OK)
			with transaction.atomic():
				find_me = Matching.objects.filter(state='find', user_id=request.user)
				if find_me:
					return Response({'status': 'already'}, status=status.HTTP_200_OK)
				existing_matching = Matching.objects.filter(state='find', mode=request.user.profile.mode).exclude(user=request.user).select_for_update(skip_locked=True).order_by('id').select_related('user').first()
				if existing_matching:
					existing_matching.state = 'matched'
					existing_matching.save()
					return Response({'status': 'matched', 'match_user_id': existing_matching.user_id, 'username': existing_matching.user.username}, status=status.HTTP_200_OK)
				else:
					new_matching = Matching.objects.create(
						user = request.user,
						mode = request.user.profile.mode,
						state = 'find'
					)
					return Response({'status': 'matching'}, status=status.HTTP_200_OK)
		except Exception as e:
			return Response({'error': f'{str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
	
	@action(detail=False, methods=['delete'], url_path='delete')
	def matchDelete(self, request):
		try:
			with transaction.atomic():
				find_me = Matching.objects.filter(state='find', user=request.user)
				if find_me.exists():
					find_me.delete()
					return Response({'message': 'success'}, status=status.HTTP_200_OK)
				return Response({'message': 'no matching found'}, status=status.HTTP_200_OK)
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	@action(detail=False, methods=['post'], url_path='tournament')
	def tournamentGet(self, request):
		try:
			if Matching.objects.filter(user=request.user, state='find').exists():
				return Response({'status': 'already'}, status=status.HTTP_200_OK)

			with transaction.atomic():
				if Matching.objects.filter(user=request.user, state='find').exists():
					return Response({'status': 'already'}, status=status.HTTP_200_OK)

				nickname = request.data.get('temp', request.user.username)
				if nickname == "":
					nickname = request.user.username
				new_matching = Matching.objects.create(
					user = request.user,
					mode = 'Tournament Mod',
					state = 'find',
					tournament_name = nickname
				)
				existing_matching = Matching.objects.select_for_update().filter(state='find', mode='Tournament Mod').order_by('id')
				matching_data = list(existing_matching.values_list('id', 'user_id', 'tournament_name'))
				if not matching_data:
					return Response({'error': 'Not Found users'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
				matching_ids = [md[0] for md in matching_data]
				try:
					current_index = matching_ids.index(new_matching.id)
				except ValueError as ve:
					return Response({'error': str(ve)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
				group_start = (current_index // 4) * 4
				group_end = group_start + 4
				if len(matching_data) < group_end:
 					return Response({'status': 'matching'}, status=status.HTTP_200_OK)
				
				matched_users = [
					{'user_id': md[1], 'tournament_name': md[2]}
					for md in matching_data[group_start:group_end]
				]

				user_ids = [md['user_id'] for md in matched_users]
				Matching.objects.filter(user_id__in=user_ids).update(state='matched')
				return Response({'status': 'matched', 'matched_users': matched_users}, status=status.HTTP_200_OK)
		except Exception as e:
			logger.error(f"Error during tournamentGet: {e}", exc_info=True)
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	@action(detail=False, methods=['get'], url_path='check')
	def tournamentName(self, request):
		try:
			with transaction.atomic():
				if Matching.objects.filter(user=request.user, state='find').exists():
					return Response({'status': 'already'}, status=status.HTTP_200_OK)
			return Response({'status': 'success'}, status=status.HTTP_200_OK)

		except Exception as e:
			logger.error(f"Error during tournamentGet: {e}", exc_info=True)
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)