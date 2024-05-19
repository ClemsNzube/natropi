from django.urls import path
from .views import *

urlpatterns = [
    path('', home_view, name='home'),
    path('api/', api, name='api'),
    path('about/', about, name='about'),
    path('contact/', contact, name='contact'),
    path('get_started/', get_started, name='get_started'),
    path('faq/', faq, name='faq'),
    
]
