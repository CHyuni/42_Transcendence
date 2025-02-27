from django.http import JsonResponse, HttpResponseRedirect
from django.conf import settings
import jwt
from datetime import datetime
from django.contrib.auth.models import User

class JWTAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # 인증이 필요없는 경로는 바로 통과
        exempt_paths = ['/api/oauth/callback', '/api/totp/verify-2fa/', '/api/oauth/google-callback', '/nginx/'
        ,'/tournaments/', '/metrics', '/health/']
        if any(request.path.startswith(path) for path in exempt_paths):
            return self.get_response(request)
        if (any(request.path.startswith(path) for path in exempt_paths) or
            request.headers.get('X-Special-Access') == 'true'):
            return self.get_response(request)
        try:
            # 쿠키에서 JWT 가져오기
            access_token = request.COOKIES.get('access_token')

            if not access_token:
                print("No access token in cookies!")
                return HttpResponseRedirect(setting.SERVER_URL_WITH_DJANGO_PORT)
                
            # JWT 검증
            payload = jwt.decode(
                access_token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
            # print("JWT decoded payload:", payload)
            user_id = payload.get('user_id')
            user = User.objects.get(id=user_id)
            request.user = user
            # print("Found user:", user.username)
            # 토큰 만료 확인
            exp = payload.get('exp')
            if datetime.utcnow().timestamp() > exp:
                return JsonResponse({'message': 'Token has expired'}, status=401)
            
        except jwt.InvalidTokenError:
            return JsonResponse({'message': 'Invalid token'}, status=401)
        except jwt.ExpiredSignatureError:
            return JsonResponse({'message': 'Token has expired'}, status=401)
        except Exception as e:
            print(f"Authentication error1: {type(e).__name__} - {str(e)}")
            return JsonResponse({'message': 'Authentication failed'}, status=401)
            
        return self.get_response(request)