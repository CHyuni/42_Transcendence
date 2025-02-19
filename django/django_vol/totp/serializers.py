from rest_framework import serializers
from .models import TOTP

class TOTPSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TOTP
        fields = ['id', 'username', 'totp_secret', 'totp_enabled']
        read_only_fields = ['totp_secret'] 