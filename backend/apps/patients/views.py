from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import ModulePermission

from .models import Patient
from .serializers import PatientSerializer


class PatientViewSet(ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    # Sem isto a viewset cairia no padrão do DRF (IsAuthenticated) e qualquer
    # pessoa logada poderia cadastrar ou apagar paciente, por mais restrito
    # que fosse o cargo dela.
    permission_classes = [ModulePermission]

    permission_module = "pacientes"
