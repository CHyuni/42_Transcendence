from django.contrib.auth.models import User
from .models import TOTP
import pyotp
import qrcode
import base64
from io import BytesIO
from cryptography.fernet import Fernet
from django.conf import settings


def verify_totp(self, token):
    if not self.totp_secret or not self.totp_enabled:
        return False
    try:
        cipher_suite = Fernet(settings.ENCRYPTION_KEY)
        byte_totp = self.totp_secret[2:-1]
        decrypted_secret = cipher_suite.decrypt(byte_totp).decode()
        totp = pyotp.TOTP(decrypted_secret)
        return totp.verify(token)
    
    except Exception as e:
        logger.error(f"TOTP 검증 중 오류 발생: {e}")
        return False

def setup_totp(user):
    
    secret = pyotp.random_base32()

    # profile = user.profile
    # profile.totp_secret = secret
    # profile.save()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=user.email, 
        issuer_name='ft_transcendence'
    )
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    # PIL 이미지로 변환
    qr_image = qr.make_image(fill_color="black", back_color="white")
    
    # 이미지를 base64로 인코딩
    buffered = BytesIO()
    qr_image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    # data URL 형식으로 반환
    return f"data:image/png;base64,{img_str}", secret