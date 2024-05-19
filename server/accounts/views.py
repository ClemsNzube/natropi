from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_text
from django.views.generic import View

from .forms import UserLoginForm, UserSignupForm, PasswordResetRequestForm, PasswordResetConfirmForm
from .models import User

class UserLoginView(View):
    form_class = UserLoginForm
    template_name = 'login.html'

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')
        return render(request, self.template_name, {'form': form})

class UserSignupView(View):
    form_class = UserSignupForm
    template_name = 'register.html'

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password1'])
            user.save()
            login(request, user)
            return redirect('home')
        return render(request, self.template_name, {'form': form})

class PasswordResetRequestView(View):
    form_class = PasswordResetRequestForm
    template_name = 'password/reset.html'

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            data = form.cleaned_data['email']
            user = User.objects.get(email=data)
            if user:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                subject = "Password Reset Requested"
                email_template_name = "password/reset.html"
                c = {
                    "email": user.email,
                    'domain': request.META['HTTP_HOST'],
                    'site_name': 'Website',
                    "uid": uid,
                    "user": user,
                    'token': token,
                    'protocol': 'http',
                }
                email = render_to_string(email_template_name, c)
                send_mail(subject, email, '', [user.email], fail_silently=False)
            return redirect('password_reset_done')
        return render(request, self.template_name, {'form': form})

class PasswordResetConfirmView(View):
    form_class = PasswordResetConfirmForm
    template_name = 'password/reset.html'

    def get(self, request, uidb64=None, token=None):
        try:
            uid = force_text(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            form = self.form_class(user=user)
            return render(request, self.template_name, {'form': form, 'uid': uidb64, 'token': token})
        else:
            return render(request, 'password/reset.html')

    def post(self, request, uidb64=None, token=None):
        try:
            uid = force_text(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        form = self.form_class(user, request.POST)
        if form.is_valid():
            form.save()
            return redirect('password_reset_complete')
        return render(request, self.template_name, {'form': form, 'uid': uidb64, 'token': token})
