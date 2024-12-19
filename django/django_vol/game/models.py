# from django.db import models, transaction
# from django.contrib.auth.models import AbstractBaseUser
# from rest_framework.exceptions import ValidationError

# # 구현해야할것 :토너먼트 관리 모델, 게임 매치 모델, 매치메이킹 시스템모델?,     
# # 토너먼트 관리 모델
# STATUS = [
#     ('PENDING', '대기중'),
#     ('ONGOING', '진행중'),
#     ('COMPLETED', '완료'),
#     ('CANECELLED', '취소됨'),
# ]
# class Tournament(models.Model):
#     name = models.CharField(max_length=50, unique=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     started_at = models.DateTimeField(null=True, blank=True)
#     ended_at = models.DateTimeField(null=True, blank=True)
#     current_people = models.IntegerField(default=0) 
#     max_people = models.IntegerField(default=0)
#     status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
#     winner = models.ForeignKey(User, on_delete=models.SET_NULL,null=True, blank=True, related_name='tournament_winner')
#     def __str__(self):
#         return self.name

# class Match(models.Model):
#     round_number = models.IntegerField()
#     match_number = models.IntegerField()

#     score = models.CharField(max_length=50, blank=True)
#     status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
#     player1 = models.ForeignKey(User, on_delete=models.PROTECT, null=True, related_name='player1_matches')
#     player2 = models.ForeignKey(User, on_delete=models.PROTECT, null=True, related_name='player2_matches')
#     winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='match_wins')
#     loser = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='match_losses')
#     tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
#     class Meta:
#         ordering = ['round_number', 'match_number'] 
#         unique_together = ['tournament', 'round_number', 'match_number']
        
#     def __str__(self):
#         return f"{self.tournament.name} - Round {self.round_number} Match {self.match_number} - {self.player1.username} vs {self.player2.username}"    

#     # 다음 라운드 매치 생성
#     # 인스턴스가 없어도 메서드 호출가능
#     @classmethod
#     def create_next_round(cls, tournament):
#         #현재 라운드
#         current_round = cls.objects.filter(tournament=tournament).order_by('-round_number').first()
#         #현재 라운드 매치
#         print("현재 라운드:", current_round.round_number)
#         current_round_matches = cls.objects.filter(
#             tournament=tournament,
#             round_number=current_round.round_number
#         ).order_by('match_number')
#         print("현재 라운드 매치들:", current_round_matches.values())
#         winners = []
#         # 승자리스트 
#         for match in current_round_matches:
#             if match.winner:
#                 winners.append(match.winner)
#         print("승자 목록:", winners)
#         for i in range(0, len(winners), 2):
#             if i + 1 < len(winners):
#                 cls.objects.create(
#                     tournament=tournament,
#                     player1=winners[i],
#                     player2=winners[i + 1],
#                     status='PENDING',
#                     round_number=current_round.round_number + 1,
#                     )
                    
#     def save(self, *args, **kwargs):
#         # 코드 블록을 트랜잭션으로 묶음
#         with transaction.atomic():
#             # 새로운 매치를 생성할 경우
#             if not self.pk:
#                 # 현재 토너먼트의 모든 매치, select_for_update로 뮤텍스
#                 current_round = Match.objects.filter(
#                 tournament=self.tournament,
#                 ).select_for_update()
#                 if not current_round.exists():
#                     self.round_number = 1
#                 else:
#                     #현재 라운드
#                     current_round = current_round.order_by('-round_number').first()
#                     #현재 라운드 매치 수
#                     matches_count = Match.objects.filter(
#                         tournament=self.tournament,
#                         round_number=current_round.round_number
#                     ).count()
#                     #현재 라운드 최대 매치 수 = 최대 참가자 / 현재 라운드 번호 ^ 2 , // > 소수점 절삭
#                     max_match = self.tournament.max_people // (2 ** current_round.round_number)
#                     # 수동 설정이 아닌 경우
#                     print(self.round_number, current_round.round_number)
#                     # is_next_round = self.round_number is not None and self.round_number > current_round.round_number
#                     if matches_count >= max_match and self.round_number is None:
#                         raise ValidationError("Current round is full. Wait for all matches to complete.")
#                     if self.round_number is None:
#                         # 현재 라운드에 여유가 있으면 현재 라운드에 배정
#                         self.round_number = current_round.round_number
#                 # 같은 토너먼트, 같은 라운드 내에서 가장 큰 match_number 찾기, 토너먼트,라운드넘버에 뮤텍스를 걸어서 동시 접근 방지
#                 existing_match = Match.objects.filter(
#                 tournament=self.tournament,
#                 round_number=self.round_number
#                 ).select_for_update().order_by('-match_number')
#                 if not existing_match.exists():
#                     self.match_number = 1
#                 else:
#                     self.match_number = existing_match.first().match_number + 1
#             # models.Model 클래스 save 오버라이딩
#             super().save(*args, **kwargs)
            
#             if self.status == 'COMPLETED':
#                 tournament = self.tournament
#             # 모든 매치가 완료되었는가
#             current_round = Match.objects.filter(
#                 tournament=self.tournament,
#                 round_number=self.round_number
#             )
            
#             # 모든 매치가 완료되었는가
#             is_completed = all(
#                 match.status == 'COMPLETED'
#                 for match in current_round
#             )
#             print('여기여기', is_completed, current_round.count())
#             if is_completed:
#                 #마지막 라운드
#                 if current_round.count() == 1:
#                     tournament.status = 'COMPLETED'
#                     tournament.winner = self.winner
#                     tournament.save()
#                 elif current_round.count() > 1 and tournament.status == 'ONGOING':
#                     Match.create_next_round(tournament)