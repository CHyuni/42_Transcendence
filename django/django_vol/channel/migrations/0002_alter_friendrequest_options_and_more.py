# Generated by Django 5.1.5 on 2025-01-18 12:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('channel', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='friendrequest',
            options={},
        ),
        migrations.AlterUniqueTogether(
            name='friendrequest',
            unique_together=set(),
        ),
    ]
