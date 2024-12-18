from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Profile(models.Model):
	user = models.OneToOneField(
		User,
		on_delete=models.CASCADE, related_name='profile'
	)
	is_online = models.BooleanField(default=False)

	def __str__(self):
		return f"{self.user.username}'s Profile"