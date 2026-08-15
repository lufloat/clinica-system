from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import ModulePermission

from .models import DentalChart, ToothRecord
from .serializers import DentalChartSerializer, ToothRecordSerializer


class DentalChartViewSet(ModelViewSet):
    """Odontogramas.

    Sem recorte por vertical: o paciente é compartilhado e o odontograma só
    existe na odontologia. O acesso é controlado pelo módulo `odontograma`,
    que não pertence à vertical medicina.
    """

    queryset = DentalChart.objects.select_related("patient").prefetch_related(
        "tooth_records"
    )
    serializer_class = DentalChartSerializer
    permission_classes = [ModulePermission]
    permission_module = "odontograma"

    @action(detail=False, methods=["get"], url_path=r"por-paciente/(?P<patient_id>\d+)")
    def by_patient(self, request, patient_id=None):
        """Odontograma do paciente, criando um vazio no primeiro acesso."""
        chart, _ = DentalChart.objects.get_or_create(patient_id=patient_id)
        return Response(self.get_serializer(chart).data)


class ToothRecordViewSet(ModelViewSet):

    queryset = ToothRecord.objects.select_related("chart")
    serializer_class = ToothRecordSerializer
    permission_classes = [ModulePermission]
    permission_module = "odontograma"

    def get_queryset(self):
        queryset = super().get_queryset()

        chart = self.request.query_params.get("chart")
        if chart:
            queryset = queryset.filter(chart_id=chart)

        return queryset
