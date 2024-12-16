from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin

# Register your models here.

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'first_name', 'last_name', 'email', 'is_staff', 'is_active']
    search_fields = ['username', 'email']
    
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)