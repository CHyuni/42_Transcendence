from django.db import models
from django.contrib.auth.models import User
import pyotp
# Create your models here.

class Profile(models.Model):
	user = models.OneToOneField(
		User,
		on_delete=models.CASCADE, related_name='profile'
	)
	is_online = models.BooleanField(default=False)
	profile_image = models.URLField(null=True, blank=True)
	casual_win = models.IntegerField(default=0)
	casual_lose = models.IntegerField(default=0)
	tournament_win = models.IntegerField(default=0)
	tournament_lose = models.IntegerField(default=0)
	rating = models.IntegerField(default=800)
	top_rating = models.IntegerField(default=800)
	mode = models.CharField(max_length=20, null=True, blank=True, default='Casual Mod')
	about_me = models.CharField(max_length=128, null=True, blank=True)
	profile_image_file = models.ImageField(upload_to='profile_images/', null=True, blank=True)
	winning = models.IntegerField(default=0)
	last_logins = models.DateTimeField(auto_now=True)

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


