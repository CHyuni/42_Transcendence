from django.shortcuts import render
from django.views.generic import TemplateView

# Create your views here.

class Homepage(TemplateView):
	template_name = 'home/home.html'

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context['title'] = '태진업고튀어'
		return context
