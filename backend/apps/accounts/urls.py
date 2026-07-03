from django.urls import path

from .views import login, me, register

urlpatterns = [
    path("login/", login),
    path("me/", me),
    path("register/", register),
]