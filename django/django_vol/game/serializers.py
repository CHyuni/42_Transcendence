# from rest_framework import serializers
# from .models import User, Tournament, Match


# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ['id','username', 'nickname']

#         # fields = ['id', 'email', 'first_name', 'last_name', 
#         #          'username', 'avatar', 'ranking_points', 
#         #          'total_games', 'wins', 'losses']


# class TournamentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Tournament
#         fields = ['name', 'created_at', 'started_at', 'ended_at',
#         'current_people', 'max_people', 'status', 'winner']

# class MatchSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Match
#         fields = ['round_number', 'match_number', 'score', 'status',
#         'player1', 'player2', 'winner', 'loser', 'tournament']
#         read_only_fields = ['round_number', 'match_number']
#     def validate(self, data):

#         # 매치 생성인지 수정인지
#         request = self.context.get('request')
#         is_create = request and request.method == 'POST'
#         # print(is_create)

#         if data.get('player1') and data.get('player2'):
#             if data['player1'] == data['player2']:
#                 raise serializers.ValidationError("Player 1 and Player 2 cannot be the same user")
#         if data.get('winner') and data.get('loser'):
#             if data['winner'] == data['loser']:
#                 raise serializers.ValidationError("Winner and Loser cannot be the same user")
#         if is_create and data.get('tournament') and (data.get('player1') or data.get('player2')):
#             # 해당 토너먼트의 모든 매치 조회
#             existing_matches = Match.objects.filter(tournament=data['tournament'])
            
#             # 이미 참여중인 선수들 목록
#             participating_players = set()
#             for match in existing_matches:
#                 if match.player1:
#                     participating_players.add(match.player1.id)
#                 if match.player2:
#                     participating_players.add(match.player2.id)
            
#             # 새로운 선수들 검증
#             if data.get('player1') and data['player1'].id in participating_players:
#                 raise serializers.ValidationError(f"Player {data['player1']} is already participating in this tournament")
#             if data.get('player2') and data['player2'].id in participating_players:
#                 raise serializers.ValidationError(f"Player {data['player2']} is already participating in this tournament")
        
#         return data