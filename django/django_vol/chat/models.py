from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class ChatRoom(models.Model):
	user1 = models.ForeignKey(
		User,
		on_delete=models.CASCADE, related_name='user1'
	)
	user2 = models.ForeignKey(
		User,
		on_delete=models.CASCADE, related_name='user2'
	)
	room = models.CharField(max_length=250)

	def __str__(self):
		return f"{self.user1.username} and  {self.user2.username}"

class ChatRoomMessage(models.Model):
	room_id = models.ForeignKey(
		ChatRoom,
		on_delete=models.CASCADE, related_name='room_id'
	)
	sender = models.ForeignKey(
		User,
		on_delete=models.CASCADE,
		related_name='sender'
		)
	message = models.CharField(max_length=250)

	def __str__(self):
		return f"{self.sender.username}: {self.message[:50]}" 