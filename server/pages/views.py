from django.shortcuts import render

def home_view(request):
    return render(request, 'welcome.html')

def faq(request):
    return render(request, 'faq.html')

def get_started(request):
    return render(request, 'get_started.html')


def contact(request):
    return render(request, 'contact.html')

def api(request):
    return render(request, 'api.html')

def about(request):
    return render(request, 'about.html')