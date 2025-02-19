from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Matching

class MatchingSerializer(serializers.ModelSerializer):
	username = serializers.CharField(source='user.username')
	mode = serializers.CharField(source='user.profile.mode')

	class Meta:
		model = Matching
		fields = ['id', 'username', 'mode', 'mat_start']