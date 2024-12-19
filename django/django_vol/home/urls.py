from django.urls import path, include
from . import views

app_name = 'home'
urlpatterns = [
	path('', views.Homepage.as_view(), name='home'),
	path('callback/', views.oauth_callback, name='oauth_callback'),
	path('logout/', views.logout_view, name='logout'),
	path('accounts/', include('accounts.urls')),
]