from rest_framework import serializers
from django.contrib.auth.models import User
from .models import FriendRequest, FriendBlocked
		

class FriendRequestSerializer(serializers.ModelSerializer):
    from_username = serializers.CharField(source='from_user.username', read_only=True)
    from_user_status = serializers.CharField(source='from_user.profile.status', read_only=True)
    from_user_rating = serializers.IntegerField(source='from_user.profile.rating', read_only=True)
    from_user_is_online = serializers.BooleanField(source='from_user.profile.is_online', read_only=True)
    to_username = serializers.CharField(source='to_user.username', read_only=True)
    to_user_status = serializers.CharField(source='to_user.profile.status', read_only=True)
    to_user_rating = serializers.IntegerField(source='to_user.profile.rating', read_only=True)
    to_user_is_online = serializers.BooleanField(source='to_user.profile.is_online', read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at',
        'from_username', 'from_user_status', 'from_user_rating', 'from_user_is_online',
        'to_username', 'to_user_status', 'to_user_rating', 'to_user_is_online']

class FriendBlockedSerializer(serializers.ModelSerializer):
    blocked_user = serializers.CharField(source='blocked_user.username', read_only=True)
    blocked_user_status = serializers.CharField(source='blocked_user.profile.status', read_only=True)
    blocked_user_rating = serializers.IntegerField(source='blocked_user.profile.rating', read_only=True)

    class Meta:
        model = FriendBlocked
        fields = ['id', 'user_id', 'blocked_user_id', 'blocked_user', 'blocked_user_status', 'blocked_user_rating']