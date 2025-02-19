from django.db import models
from django.contrib.auth.models import User
# Create your models here.
class FriendRequest(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    STATUS_CHOICES = [
        (PENDING, '대기중'),
        (ACCEPTED, '수락됨'),
        (REJECTED, '거절됨')
    ]

    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='from_user')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='to_user')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['from_user', 'to_user']  
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.from_user.username} - {self.to_user.username}'

class FriendBlocked(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE, related_name='user'
    )
    blocked_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_user')

    class Meta:
        unique_together = ['user', 'blocked_user']

    def __str__(self):
        return f'{self.user.username} - {self.blocked_user.username}'