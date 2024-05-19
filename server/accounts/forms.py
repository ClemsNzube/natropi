from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordResetForm, SetPasswordForm
from .models import User

class UserLoginForm(AuthenticationForm):
    username = forms.CharField(label='Email')

class UserSignupForm(UserCreationForm):
    first_name = forms.CharField(max_length=255, required=True)
    last_name = forms.CharField(max_length=255, required=True)
    username = forms.CharField(max_length=255, required=True)
    email = forms.EmailField(required=True)
    country = forms.CharField(max_length=255, required=True)
    phone = forms.CharField(max_length=255, required=False)
    password1 = forms.CharField(widget=forms.PasswordInput, label='Password')
    password2 = forms.CharField(widget=forms.PasswordInput, label='Confirm Password')

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'country', 'phone', 'password1', 'password2']

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match.")
        return cleaned_data

class PasswordResetRequestForm(PasswordResetForm):
    email = forms.EmailField(max_length=254)

class PasswordResetConfirmForm(SetPasswordForm):
    new_password1 = forms.CharField(label='New password', widget=forms.PasswordInput)
    new_password2 = forms.CharField(label='Confirm new password', widget=forms.PasswordInput)
