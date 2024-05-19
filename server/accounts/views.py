from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from .forms import SignUpForm, PasswordResetRequestForm
from django.contrib.auth.forms import AuthenticationForm
from .models import User

def register(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password1'])
            user.save()
            login(request, user)
            return redirect('home')
    else:
        form = SignUpForm()
    return render(request, 'register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

def password_reset_request(request):
    if request.method == 'POST':
        password_reset_form = PasswordResetRequestForm(request.POST)
        if password_reset_form.is_valid():
            email = password_reset_form.cleaned_data['email']
            # Logic for sending password reset email
    else:
        password_reset_form = PasswordResetRequestForm()
    return render(request, 'password/reset.html', {'password_reset_form': password_reset_form})
