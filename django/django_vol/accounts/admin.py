from django.contrib import admin
from django.utils.safestring import mark_safe
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Profile, Friends, Blocked

# Register your models here

def get_is_online(obj):
	try:
		if obj.profile.is_online:
			 return mark_safe('<span style="color: green;">&#10004;</span>')
		return mark_safe('<span style="color: red;">&#10008;</span>') 
	except Profile.DoesNotExist:
		return mark_safe('<span style="color: red;">&#10008;</span>') 

get_is_online.short_description = 'Is Online'

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'first_name', 'last_name', 'email', get_is_online, 'is_staff', 'is_active']
    search_fields = ['username', 'email']
    
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Profile)