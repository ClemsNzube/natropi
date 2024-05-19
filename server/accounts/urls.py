from django.urls import path
from .views import register, login_view, password_reset_request

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login_view, name='login'),
    path('password-reset/', password_reset_request, name='password_reset'),
]
