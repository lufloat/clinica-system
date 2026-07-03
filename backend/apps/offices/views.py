from rest_framework.viewsets import ModelViewSet

from .models import Office
from .serializers import OfficeSerializer

class OfficeViewSet(ModelViewSet):
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer