from django.views.generic import TemplateView
from django.contrib.auth import logout, login
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .services import get_oauth_tokens, get_user_info, create_or_update_user

# Create your views here.

class Homepage(TemplateView):
	template_name = 'home/home.html'

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context['title'] = '태진업고튀어'
		return context

class Gamepage(TemplateView):
	template_name = 'home/index.html'

def oauth_callback(request):
	code = request.GET.get('code')

	if not code:
		return JsonResponse({'error': 'No code provided'}, status=400)
	
	tokens = get_oauth_tokens(code)

	if tokens:
		access_token = tokens.get('access_token')
		if access_token:
			user_info = get_user_info(access_token)
			if user_info:
				user = create_or_update_user(user_info)
				login(request, user)
				return redirect('home:home')
			else:
				return JsonResponse({'error': 'Failed to fetch user info'}, status=400)
		else:
			return JsonResponse({'error': 'Failed to get access token'}, status=400)
	else:
		return JsonResponse({'error': 'Failed to get token'}, status=400)

def logout_view(request):
	request.user.profile.is_online = False
	request.user.profile.status = "offline"
	request.user.profile.save()
	logout(request)
	return JsonResponse({'message': 'Logged out successfully'})