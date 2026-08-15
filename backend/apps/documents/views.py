from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet

from apps.accounts.permissions import ModulePermission
from apps.appointments.models import Appointment
from apps.core.scoping import scoped_appointments

from .pdf import generate_certificate
from .prescription_pdf import generate_prescription


class DocumentViewSet(ViewSet):
    """Atestado e receita, gerados a partir de um atendimento.

    O documento carrega nome de paciente, profissional e data — é o mesmo
    dado da agenda, em PDF. Por isso responde ao módulo `agenda` e ao mesmo
    recorte dela: quem não enxerga o atendimento na tela também não o imprime
    trocando o id na URL.
    """

    permission_classes = [ModulePermission]

    permission_module = "agenda"

    def get_appointment(self, pk):
        return get_object_or_404(
            scoped_appointments(
                self.request.user,
                Appointment.objects.select_related(
                    "patient", "doctor", "office"
                ),
            ),
            pk=pk,
        )

    @action(detail=True, methods=["get"])
    def certificate(self, request, pk=None):

        appointment = self.get_appointment(pk)

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

        appointment = self.get_appointment(pk)

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