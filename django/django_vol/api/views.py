from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from accounts.models import Profile
from rest_framework import viewsets

# Create your views here.

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer

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