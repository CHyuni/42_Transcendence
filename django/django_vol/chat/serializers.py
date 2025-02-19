from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChatRoom, ChatRoomMessage
from django.core.validators import MaxLengthValidator, ProhibitNullCharactersValidator
from test_site.validator import HTMLSanitizerValidator

class ChatRoomSerializer(serializers.ModelSerializer):
    user1_name = serializers.CharField(source='user1.username', read_only=True) 
    user2_name = serializers.CharField(source='user2.username', read_only=True)
    class Meta:
        model = ChatRoom
        fields = ['id', 'user1', 'user2', 'room', 'user1_name', 'user2_name']

class ChatRoomMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    class Meta:
        model = ChatRoomMessage
        fields = ['id', 'room_id', 'sender', 'message', 'sender_name']
        extra_kwargs = {
            'message': {
                'validators': [
                    HTMLSanitizerValidator(),
                    MaxLengthValidator(250),
                    ProhibitNullCharactersValidator()
                ]
            }
        }