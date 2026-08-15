from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("apps.core.urls")),

    path("api/accounts/", include("apps.accounts.urls")),

    path("api/doctors/", include("apps.doctors.urls")),  # ← ESTA LINHA

    path("api/token/", TokenObtainPairView.as_view()),
    path("api/token/refresh/", TokenRefreshView.as_view()),
    path("api/patients/", include("apps.patients.urls")),
    path("api/offices/", include("apps.offices.urls")),
    path("api/appointments/", include("apps.appointments.urls")),
    # A API do odontograma saiu junto com a tela: sem o módulo no catálogo de
    # permissões, ela responderia 403 a todo mundo. O app `dental` continua no
    # projeto, com as tabelas (vazias) preservadas.
    path("api/documents/", include("apps.documents.urls")),
    path(   "api/reports/",  include("apps.reports.urls")
),
]