# Generated by Django 5.1.4 on 2025-01-10 23:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_remove_friends_friend_remove_friends_user_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='mfa_secret_key',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
    ]
