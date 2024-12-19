import requests
from django.contrib.auth.models import User
from accounts.models import Profile
from django.conf import settings

def get_oauth_tokens(code):
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
        return response.json()
    else:
        return None

def get_user_info(access_token):
    user_info_url = 'https://api.intra.42.fr/v2/me'
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info_response = requests.get(user_info_url, headers=headers)
    
    if user_info_response.status_code == 200:
        return user_info_response.json()
    else:
        return None

def create_or_update_user(user_info):
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

    if not hasattr(user, 'profile'):
        Profile.objects.create(user=user)
        
    user.profile.is_online = True
    user.profile.save()
    
    return user