from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Matching(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	mode = models.CharField(max_length=50, null=False, blank=False)
	state = models.CharField(max_length=50, null=False, blank=False)
	mat_start = models.DateTimeField(auto_now_add=True)
	tournament_name = models.CharField(max_length=20, null=True, blank=True)

	def __str__(self):
		return f"{self.user.username} - {self.mode}"