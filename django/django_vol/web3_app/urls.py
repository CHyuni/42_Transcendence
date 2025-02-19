from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_game, name='create_game'),
    path('get_all/', views.get_all_game_results, name='get_all_game_results'),
    # path('get_player/<int:player_id>/', views.get_game_results_by_player, name='get_game_results_by_player'),
]