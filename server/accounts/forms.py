from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User

class SignUpForm(UserCreationForm):
    first_name = forms.CharField(max_length=255, required=True, help_text='Required.')
    last_name = forms.CharField(max_length=255, required=True, help_text='Required.')
    username = forms.CharField(max_length=255, required=True, help_text='Required.')
    email = forms.EmailField(max_length=255, required=True, help_text='Required. Inform a valid email address.')
    country = forms.CharField(max_length=255, required=True, help_text='Required.')
    phone = forms.CharField(max_length=255, required=False, help_text='Optional.')
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirm Password', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'username', 'email', 'country', 'phone', 'password1', 'password2')

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email address is already in use.")
        return email

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("This username is already in use.")
        return username

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return cleaned_data


class PasswordResetRequestForm(forms.Form):
    email = forms.EmailField(max_length=254, required=True, help_text='Required. Enter your email address to reset your password.')