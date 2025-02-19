from rest_framework import viewsets, status
from .models import FriendRequest, FriendBlocked
from .serializers import FriendRequestSerializer, FriendBlockedSerializer
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from accounts.models import Profile
import traceback
import logging

logger = logging.getLogger(__name__)

class FriendRequestViewSet(viewsets.ModelViewSet):
    queryset = FriendRequest.objects.all() 
    serializer_class = FriendRequestSerializer

    def get_queryset(self):
        user_id = self.request.query_params.get('user')
        status = self.request.query_params.get('status')
        
        if status == 'pending_to':
            return self.queryset.filter(
                to_user=user_id,
                status='pending'
            ).select_related('from_user', 'to_user')
        elif status == 'pending_from':
            return self.queryset.filter(
                from_user=user_id,
                status='pending'
            )
        elif status == 'accepted':
            return self.queryset.filter(
                Q(to_user=user_id) | Q(from_user=user_id),
                status=status
            ).select_related('from_user', 'to_user')
        
        return self.queryset.none()

class FriendBlockedViewSet(viewsets.ModelViewSet):
    queryset = FriendBlocked.objects.all() 
    serializer_class = FriendBlockedSerializer

    def _is_blocked(self, myuid, otheruid):
        if not myuid or not otheruid:
            raise ValueError("myuid and otheruid are required")
        
        return self.queryset.filter(
            (Q(user_id=myuid) & Q(blocked_user_id=otheruid))
        )

    @action(detail=False, methods=['get'], url_path='get')
    def get_blocked(self, request):
        try:
            myuid = request.query_params.get('myuid')
            blocked_users = self.queryset.filter(user_id=myuid).values(
                'blocked_user_id',
                'blocked_user_id__username',
            )
            return Response(blocked_users, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=False, methods=['post'], url_path='create')
    def add_blocked(self, request):
        try:
            myuid = request.data.get('myuid')
            otheruid = request.data.get('otheruid')
            mode = request.data.get('mode')
            is_blocked = self._is_blocked(myuid, otheruid)

            if is_blocked.exists():
                return Response({'message': 'isBlocked', 'blocked': True}, status=status.HTTP_200_OK)
            else:
                if mode == 'check':
                    return Response({'blocked': False}, status=status.HTTP_200_OK)
                elif mode == 'checkBidirectional':
                    is_blocked = self._is_blocked(otheruid, myuid)
                    if is_blocked.exists():
                        return Response({'message': 'otherblock'}, status=status.HTTP_200_OK)
                    return Response({'message': 'NotBlocked'}, status=status.HTTP_200_OK)

                myuid = request.data.get('myuid')
                otheruid = request.data.get('otheruid')
                
                FriendBlocked.objects.create(user_id=myuid, blocked_user_id=otheruid)
                return Response({'message': 'addBlocked', 'blocked': True}, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error in add_blocked: {str(e)}')
            logger.error(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['delete'], url_path='unblock')
    def user_unblock(self, request):
        try:
            myuid = request.query_params.get('myuid')
            otheruid = request.query_params.get('otheruid')
            block_user = self._is_blocked(myuid, otheruid)

            if block_user.exists():
                block_user.delete()
                return Response({'message': 'deleted successfully'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'No matching friend requests found'}, status=status.HTTP_404_NOT_FOUND)
        
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in related_status: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
        
class RelatedViewSet(viewsets.ModelViewSet):
    queryset = FriendRequest.objects.all() 
    serializer_class = FriendRequestSerializer

    def _get_related_requests(self, request):
        myuid = request.query_params.get('myuid')
        otheruid = request.query_params.get('otheruid')
    
        if not myuid or not otheruid:
            raise ValueError("myuid and otheruid are required")
    
        return self.queryset.filter(
            (Q(from_user_id=myuid) | Q(to_user_id=myuid)) &
            (Q(from_user_id=otheruid) | Q(to_user_id=otheruid))
        )

    @action(detail=False, methods=['delete'], url_path='remove')
    def delete_related(self, request):
        try:
            related_requests = self._get_related_requests(request)

            if related_requests.exists():
                related_requests.delete()
                return Response({'message': 'deleted successfully'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'No matching friend requests found'}, status=status.HTTP_404_NOT_FOUND)
        
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in related_status: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='friend')
    def related_status(self, request):
        try:
            related_requests = self._get_related_requests(request)

            if related_requests.exists():
                req = related_requests.first()
                if req:
                    if req.status == 'pending':
                        return Response({'message': 'already pending'}, status=status.HTTP_200_OK)
                    elif req.status == 'accepted':
                        return Response({'is_related': True}, status=status.HTTP_200_OK)
                    else:
                        return Response({'message': 'other status'}, status=status.HTTP_200_OK)
            else:
                return Response({'NoMatching': 'No matching friend requests found'}, status=status.HTTP_200_OK)

        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in related_status: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
