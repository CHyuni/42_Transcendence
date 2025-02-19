from django.urls import path, include
from . import views

app_name = 'home'
urlpatterns = [
	path('', views.Homepage.as_view(), name='home'),
	path('accounts/', include('accounts.urls')),
	path('game/', views.Gamepage.as_view(), name='game')
]