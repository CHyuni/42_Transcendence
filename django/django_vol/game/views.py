# from django.shortcuts import render

# # Create your views here.
# from rest_framework import viewsets
# from .models import User, Tournament, Match
# from .serializers import UserSerializer, TournamentSerializer, MatchSerializer
# from rest_framework.decorators import action

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer

# class TournamentViewSet(viewsets.ModelViewSet):
#     queryset = Tournament.objects.all()
#     serializer_class = TournamentSerializer
#     # @action(detail=False, methods=['post'])
#     # def register(self, request):
#     #     # post data 딕셔너리 저장
#     #     tournament_data = request.data
#     #     #serializer 객체 생성 ,json > python 객체, serializer는 양방향 모두 가능
#     #     serializer = self.get_serializer(data=tournament_data) 
        
#     #     if erializer.is_valid():
#     #         tournament = serializer.save()
#     #         return Response({
#     #             'message': '토너먼트가 생성되었습니다',
#     #             'data': serializer.data
#     #         }, status=status.HTTP_201_CREATED)
            
#     #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class MatchViewSet(viewsets.ModelViewSet):
#     queryset = Match.objects.all()
#     serializer_class = MatchSerializer