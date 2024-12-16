from django.urls import path
from . import views

app_name = 'home'
urlpatterns = [
	path('', views.Homepage.as_view(), name='home'),
]