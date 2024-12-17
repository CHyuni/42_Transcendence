import requests
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.conf import settings
from django.http import JsonResponse

# Create your views here.

class Homepage(TemplateView):
	template_name = 'home/home.html'

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context['title'] = '태진업고튀어'
		return context

def oauth_callback(request):
	code = request.GET.get('code')

	if not code:
		return JsonResponse({'error': 'No code provided'}, status=400)
	
	token_url = 'https://api.intra.42.fr/oauth/token'
	client_id = settings.CLIENT_ID
	client_secret = settings.CLIENT_SECRET
	redirect_uri = 'http://10.12.9.1:8080/callback/'

	data = {
		'grant_type': 'authorization_code',
		'client_id': client_id,
		'client_secret': client_secret,
		'redirect_uri': redirect_uri,
		'code': code,
	}

	response = requests.post(token_url, data=data)

	if response.status_code == 200:
		tokens = response.json()
		access_token = tokens['access_token']

		user_info_url = 'https://api.intra.42.fr/v2/me'
		headers = {
			'Authorization': f'Bearer {access_token}',
		}
		user_info_response = requests.get(user_info_url, headers=headers)

		if user_info_response.status_code == 200:
			user_info = user_info_response.json()

			username = user_info.get('login')
			first_name = user_info.get('first_name')
			last_name = user_info.get('last_name')
			email = user_info.get('email')

			user, created = User.objects.get_or_create(
				username=username,
				defaults={
					'first_name': first_name,
					'last_name': last_name,
					'email': email,
				}
			)

			if created:
				user.set_unusable_password()
				user.save()

			from django.contrib.auth import login
			login(request, user)

			return redirect('home:home')
		else:
			return JsonResponse({'error': 'Failed to fetch user info'}, status=400)
		
	else:
		return JsonResponse({'error': 'Failed to get access token'}, status=400)

def logout_view(request):
	logout(request)
	return JsonResponse({'message': 'Logged out successfully'})