from django.http import HttpResponse

from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet

from apps.appointments.models import Appointment

from .pdf import generate_certificate
from .prescription_pdf import generate_prescription


class DocumentViewSet(ViewSet):

    @action(detail=True, methods=["get"])
    def certificate(self, request, pk=None):

        appointment = Appointment.objects.get(pk=pk)

        pdf = generate_certificate(
            appointment,
            days=1
        )

        response = HttpResponse(
            pdf,
            content_type="application/pdf"
        )

        response[
            "Content-Disposition"
        ] = 'inline; filename="atestado.pdf"'

        return response

    @action(detail=True, methods=["get"])
    def prescription(self, request, pk=None):

        appointment = Appointment.objects.get(pk=pk)

        pdf = generate_prescription(
            appointment,
            medication=request.GET.get("medication", ""),
            dosage=request.GET.get("dosage", ""),
            frequency=request.GET.get("frequency", ""),
            duration=request.GET.get("duration", ""),
            observations=request.GET.get("observations", ""),
        )

        response = HttpResponse(
            pdf,
            content_type="application/pdf"
        )

        response["Content-Disposition"] = 'inline; filename="receita.pdf"'

        return response