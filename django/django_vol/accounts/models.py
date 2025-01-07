from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Profile(models.Model):
	user = models.OneToOneField(
		User,
		on_delete=models.CASCADE, related_name='profile'
	)
	is_online = models.BooleanField(default=False)
	image = models.URLField(null=True, blank=True)
	win_count = models.IntegerField(default=0)
	lose_count = models.IntegerField(default=0)

	STATUS_CHOICES = [
        ("available", "Available"),
        ("playing", "Playing"),
        ("in-queue", "In Queue"),
		("offline", "Offline"),
    ]

	status = models.CharField(
		max_length=20,
		choices=STATUS_CHOICES,
		default="offline"
	)

	def __str__(self):
		return f"{self.user.username}'s Profile"

class Friends(models.Model):
	user = models.ForeignKey(
		User,
		on_delete=models.CASCADE, related_name='friends'
	)
	friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends_of')

	def __str__(self):
		return f'{self.user.username} - {self.friend.username}'

class Blocked(models.Model):
	user = models.ForeignKey(
		User,
		on_delete=models.CASCADE, related_name='blocked'
	)
	block_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')

	def __str__(self):
		return f'{self.user.username} - {self.block_user.username}'