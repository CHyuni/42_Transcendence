from django.views.generic import TemplateView
from django.shortcuts import render, redirect
from django.http import JsonResponse

# Create your views here.

class Homepage(TemplateView):
	template_name = 'home/home.html'

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context['title'] = '태진업고튀어'
		return context

class Gamepage(TemplateView):
	template_name = 'home/index.html'
