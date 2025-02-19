from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import ChatRoom, ChatRoomMessage
from .serializers import ChatRoomSerializer, ChatRoomMessageSerializer
from django.db.models import Q
import uuid
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all() 
    serializer_class = ChatRoomSerializer

    def create(self, request, *args, **kwargs):
        friend_id = request.data.get('friend_id')
        user = request.user

        try:
            friend_user = User.objects.get(id=friend_id)
            existing_room = ChatRoom.objects.filter(
                Q(user1=user, user2=friend_user) | 
                Q(user1=friend_user, user2=user)
            ).first()

            if existing_room:
                chat_room = existing_room
            else:
                chat_room = ChatRoom.objects.create(
                    user1=user,
                    user2=friend_user,
                    room=str(uuid.uuid4())
                )
            serializer = self.get_serializer(chat_room)

            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "Friend not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    


class ChatRoomMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatRoomMessage.objects.all()
    serializer_class = ChatRoomMessageSerializer
    
    def create(self, request, *args, **kwargs):
        room_name = request.data.get('room_name')
        user = request.user
        
        try:
            room = ChatRoom.objects.get(room=room_name)
            
            # 2. 시리얼라이저에 데이터 전달 (검증기 동작)
            serializer = self.get_serializer(data={
                'room_id': room.id,
                'sender': user.id,
                'message': request.data.get('message')
            })
            serializer.is_valid(raise_exception=True)  # 검증기 실행
            
            # 3. 검증된 데이터로 저장
            serializer.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except ChatRoom.DoesNotExist:
            return Response(
                {"error": "채팅방이 존재하지 않습니다"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "서버 내부 오류"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def list(self, request):
        room_name = request.query_params.get('room_name')
        if room_name:
            queryset = ChatRoomMessage.objects.filter(room_id__room=room_name).order_by('id')
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        
        return Response({"error": "Room name is required"}, status=400)