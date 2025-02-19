# from django.views.generic import TemplateView

# class Homepage(TemplateView):
# 	template_name = 'game/index.html'

from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
# from .models import User, Tournament, Match
from .models import User, Match
from django.db import transaction
# from .serializers import TournamentSerializer, MatchSerializer
from .serializers import MatchSerializer
from rest_framework.decorators import action
from django.db.models import Q
import uuid
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer

    def create(self, request):
        try:
            with transaction.atomic():
                p1_id = int(request.data.get('player1'))
                p2_id = int(request.data.get('player2'))
                p1_score = request.data.get('player1_score')
                p2_score = request.data.get('player2_score')
                winner = int(request.data.get('winner'))
                loser = int(request.data.get('loser'))
                playmode = request.data.get('mode')
                gametype = request.data.get('type')
                player1 = User.objects.select_for_update().get(id=p1_id)
                player2 = User.objects.select_for_update().get(id=p2_id)
                p1_rating_change = 0
                p2_rating_change = 0
                if playmode == 'casual' and gametype == 'match':
                    p1_rating_change = 20 if p1_id == winner else -10
                    p2_rating_change = 20 if p2_id == winner else -10
                elif playmode == 'r1' and gametype == 'match':
                    p1_rating_change = 10 if p1_id == winner else -10
                    p2_rating_change = 10 if p2_id == winner else -10
                elif playmode == 'r2' and gametype == 'match':
                    p1_rating_change = 10 if p1_id == winner else 0
                    p2_rating_change = 10 if p2_id == winner else 0
                elif gametype == 'custom':
                    pass
                else:
                     raise ValueError(f"Unsupported playmode: {playmode} {gametype}")
                
                if p1_rating_change:
                    player1.profile.rating += p1_rating_change
                    if player1.profile.rating > player1.profile.top_rating:
                        player1.profile.top_rating = player1.profile.rating
                    if winner == p1_id and playmode != 'r1':
                        player1.profile.winning += 1
                        if playmode == 'casual':
                            player1.profile.casual_win +=1
                        else:
                            player1.profile.tournament_win += 1
                    elif loser == p1_id:
                        player1.profile.winning = 0
                        if playmode == 'casual':
                            player1.profile.casual_lose += 1
                        elif playmode == 'r1':
                            player1.profile.tournament_lose += 1
                        elif playmode == 'r2':
                            player1.profile.tournament_win += 1
                    player1.profile.save()
                
                if p2_rating_change:
                    player2.profile.rating += p2_rating_change
                    if player2.profile.rating > player2.profile.top_rating:
                        player2.profile.top_rating = player2.profile.rating
                    if winner == p2_id and playmode != 'r1':
                        player2.profile.winning += 1
                        if playmode == 'casual':
                            player2.profile.casual_win +=1
                        else:
                            player2.profile.tournament_win += 1
                    elif loser == p2_id:
                        player2.profile.winning = 0
                        if playmode == 'casual':
                            player2.profile.casual_lose += 1
                        elif playmode == 'r1':
                            player2.profile.tournament_lose += 1
                        elif playmode == 'r2':
                            player2.profile.tournament_win += 1
                    player2.profile.save()
                Match.objects.create(
                    player1_before_rating=player1.profile.rating - p1_rating_change if gametype == 'match' else player1.profile.rating,
                    player1_after_rating=player1.profile.rating,
                    player2_before_rating=player2.profile.rating - p2_rating_change if gametype == 'match' else player2.profile.rating,
                    player2_after_rating=player2.profile.rating,
                    mode=playmode,
                    loser_id=loser,
                    winner_id=winner,
                    player1_id=p1_id,
                    player2_id=p2_id,
                    player1_score=p1_score,
                    player2_score=p2_score,
                )
            return Response({'message': 'success'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error during tournamentGet: {e}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        queryset = Match.objects.all()
        user_id = self.request.query_params.get('id', None)
        mode = self.request.query_params.get('mode')
        if user_id:
            base_query = Q(player1_id=user_id) | Q(player2_id=user_id)
            if mode == 'Casual Mod':
                mode_query = Q(mode='casual')
            else:
                mode_query = ~Q(mode='casual')
            # player1_id나 player2_id가 user_id와 일치하는 모든 매치
            queryset = queryset.filter(
                base_query & mode_query
            ).order_by('-match_date')
        else:
            queryset = None
        
        return queryset