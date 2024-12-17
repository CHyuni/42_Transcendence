from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User

# Create your views here.

@api_view(['GET'])
def check_login_status(request):
	return Response({
		'username': request.user.username
	})

@api_view(['GET'])
def get_logged_in_users(request):
	if request.user.is_authenticated:
		return Response({'users': [request.user.username]})
	else:
		return Response({'users': []})