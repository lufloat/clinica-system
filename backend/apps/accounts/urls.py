from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    login,
    me,
    change_password,
    permission_catalog,
    RoleViewSet,
    EmployeeViewSet,
)

router = DefaultRouter()
router.register("roles", RoleViewSet, basename="roles")
router.register("employees", EmployeeViewSet, basename="employees")

urlpatterns = [
    path("login/", login),
    path("me/", me),
    path("change-password/", change_password),
    path("permission-catalog/", permission_catalog),
] + router.urls
