# Generated by Django 5.1.5 on 2025-01-18 03:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('totp', '0003_alter_totp_totp_secret'),
    ]

    operations = [
        migrations.AlterField(
            model_name='totp',
            name='totp_secret',
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
    ]
