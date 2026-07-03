from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentViewSet(ModelViewSet):

    queryset = Appointment.objects.all()

    serializer_class = AppointmentSerializer

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