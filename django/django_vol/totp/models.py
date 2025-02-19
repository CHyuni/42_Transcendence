from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class TOTP(models.Model):
	user = models.OneToOneField(
		User,
		on_delete=models.CASCADE, related_name='totp'
	)
	totp_secret = models.CharField(max_length=250, blank=True, null=True)
	totp_enabled = models.BooleanField(default=False)


	def __str__(self):
		return f"{self.user.username}'s totp"