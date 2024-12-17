from django.urls import path
from . import views

app_name = 'api'
urlpatterns = [
	path('check-login-status/', views.check_login_status, name='check_login_status'),
	path('logged-in-users/', views.get_logged_in_users, name='get_logged_in_users'),
]