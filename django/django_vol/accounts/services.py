import requests
from django.contrib.auth.models import User
from .models import Profile
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
def get_oauth_tokens(code):
    token_url = 'https://api.intra.42.fr/oauth/token'
    client_id = settings.CLIENT_ID
    client_secret = settings.CLIENT_SECRET
    redirect_uri = settings.REDIRECT_URL

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
    image = user_info.get('image', {}).get('link')

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
    user.profile.status = "available"
    user.profile.profile_image = image
    user.profile.save()
    
    return user

def get_google_oauth_tokens(code):
    token_url = 'https://oauth2.googleapis.com/token'
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    redirect_uri = settings.GOOGLE_REDIRECT_URL

    data = {
        'grant_type': 'authorization_code',
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'code': code,
    }

    logger.info(data)
    response = requests.post(token_url, data=data)

    if response.status_code == 200:
        return response.json()
    else:
        return None

def get_google_user_info(access_token):
    user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info_response = requests.get(user_info_url, headers=headers)
    
    if user_info_response.status_code == 200:
        return user_info_response.json()
    else:
        return None

def create_or_update_google_user(user_info):
    email = user_info.get('email')
    first_name = user_info.get('given_name', '')
    last_name = user_info.get('family_name', '')
    username = email.split('@')[0]  # 이메일 주소에서 사용자 이름 생성
    image = user_info.get('picture')
    
    # 같은 이메일의 사용자가 이미 존재하는지 확인
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # 사용자 이름이 이미 존재하는 경우 처리
        if User.objects.filter(username=username).exists():
            base_username = username
            counter = 1
            while User.objects.filter(username=f"{base_username}{counter}").exists():
                counter += 1
            username = f"{base_username}{counter}"
        
        # 새 사용자 생성
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
    
    # 프로필 생성 또는 업데이트
    if not hasattr(user, 'profile'):
        Profile.objects.create(user=user)
        
    user.profile.is_online = True
    user.profile.status = "available"
    user.profile.profile_image = image
    user.profile.save()
    
    return user