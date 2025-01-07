from django.shortcuts import render
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import Profile
from rest_framework import viewsets
from .serializers import UserSerializer

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
	queryset = User.objects.all()
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]

	@action(detail=True, methods=['get'], url_path='get-myname')
	def check_login_status(self, request, pk=None):
		if pk == 'me':
			return Response({'username': request.user.username})
		user = self.get_object()
		return Response({'username': user.username})

	@action(detail=False, methods=['get'], url_path='online-users')
	def get_logged_in_users(self, request):
		online_users = User.objects.filter(profile__is_online=True)
		usernames = [user.username for user in online_users]
		return Response({'users': usernames})

def apitest(request):
	response = request.get(
		'https://api.intra.42.fr/v2/me',
		headers={'Authorization': f'Bearer {ACCESS_TOKEN}'}
	)