from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import ModulePermission

from .models import Office
from .serializers import OfficeSerializer


class OfficeViewSet(ModelViewSet):
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer

    # A sala é recurso compartilhado entre as verticais, mas mexer nela é
    # trabalho de quem administra: sem a checagem do módulo, um profissional
    # apagaria consultório pela API.
    permission_classes = [ModulePermission]

    permission_module = "consultorios"
