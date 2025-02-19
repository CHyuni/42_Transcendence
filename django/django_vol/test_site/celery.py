from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Django 설정 모듈 가져오기
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_site.settings')

# Celery 앱 생성
app = Celery('test_site')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
app.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_time_limit=300,  # 5분
    task_soft_time_limit=240,  # 4분
)