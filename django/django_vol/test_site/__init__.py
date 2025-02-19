from __future__ import absolute_import, unicode_literals

# Celery 앱 가져오기
from .celery import app as celery_app

__all__ = ['celery_app']
