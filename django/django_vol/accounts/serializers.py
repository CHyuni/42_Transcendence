from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
import base64
from django.core.validators import MaxLengthValidator, ProhibitNullCharactersValidator
from test_site.validator import HTMLSanitizerValidator

class UserSerializer(serializers.ModelSerializer):
	is_online = serializers.SerializerMethodField()

	class Meta:
		model = User
		fields = ['id','username', 'first_name', 'last_name', 'email', 'is_online']
	
	def get_is_online(self, obj):
		return obj.profile.is_online if hasattr(obj, 'profile') else False

class ProfileSerializer(serializers.ModelSerializer):
	username = serializers.CharField(source='user.username', read_only=True)
	userid = serializers.IntegerField(source='user.id', read_only=True)
	totp_enabled = serializers.BooleanField(source='user.totp.totp_enabled', read_only=True)
	profile_image_base64 = serializers.SerializerMethodField()
	class Meta:
		model = Profile
		fields = ['username', 'userid', 'profile_image', 'casual_win', 'casual_lose',
			'tournament_win', 'tournament_lose', 'rating', 'top_rating', 'status', 'mode',
			'about_me', 'totp_enabled', 'profile_image_file', 'profile_image_base64',
			'last_logins', 'is_online', 'winning']
		extra_kwargs = {
			'about_me': {
				'validators': [
					HTMLSanitizerValidator(),	
					MaxLengthValidator(128),
					ProhibitNullCharactersValidator()
				]
			}
		}

	def get_profile_image_base64(self, obj):
		if obj.profile_image_file:
			try:
				return base64.b64encode(obj.profile_image_file.read()).decode('utf-8')
			except Exception as e:
				return None
		return None