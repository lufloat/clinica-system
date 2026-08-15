from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import ModulePermission
from apps.core.scoping import (
    DoctorScopedViewSetMixin,
    VerticalScopedViewSetMixin,
)
from apps.verticals.services import current_vertical, scope_vertical

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentViewSet(
    DoctorScopedViewSetMixin, VerticalScopedViewSetMixin, ModelViewSet
):

    queryset = Appointment.objects.select_related(
        "patient", "doctor", "office", "vertical"
    )

    serializer_class = AppointmentSerializer

    permission_classes = [ModulePermission]

    permission_module = "agenda"

    def scope_filters(self):
        """Deixa o administrador geral separar a agenda por área.

        `?vertical=odontologia` mostra só a agenda odontológica; sem o
        parâmetro, as duas vêm juntas. Quem tem vertical própria não escolhe
        — `scope_vertical` devolve a dele e ignora o pedido.
        """
        filters = super().scope_filters()

        vertical, error = scope_vertical(
            self.request.user, self.request.query_params.get("vertical")
        )

        if error:
            raise ValidationError({"detail": error})

        if vertical is not None:
            filters["vertical"] = vertical

        return filters

    def scope_save_kwargs(self, serializer, creating):
        """Para o administrador geral, a área do horário vem do profissional.

        Sem isto o mixin gravaria na vertical padrão, e marcar com um dentista
        seria recusado como "profissional não é de Clínica Médica".
        """
        kwargs = super().scope_save_kwargs(serializer, creating)

        if current_vertical(self.request.user) is not None:
            return kwargs

        doctor = serializer.validated_data.get("doctor") or getattr(
            serializer.instance, "doctor", None
        )

        if doctor is not None:
            kwargs["vertical"] = doctor.vertical

        return kwargs

    @action(detail=True, methods=["patch"])
    def finalize(self, request, pk=None):

        appointment = self.get_object()

        if appointment.status == "CANCELADA":
            return Response(
                {"error": "Uma consulta cancelada não pode ser finalizada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if appointment.status == "FINALIZADA":
            return Response(
                {"error": "A consulta já está finalizada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment.status = "FINALIZADA"
        appointment.save()

        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"])
    def cancel(self, request, pk=None):

        appointment = self.get_object()

        if appointment.status == "FINALIZADA":
            return Response(
                {"error": "Uma consulta finalizada não pode ser cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if appointment.status == "CANCELADA":
            return Response(
                {"error": "A consulta já está cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment.status = "CANCELADA"
        appointment.save()

        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK
        )