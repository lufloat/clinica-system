from datetime import date

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import ModulePermission
from apps.accounts.services import current_doctor
from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.verticals.services import current_vertical


class TodayAppointmentsView(APIView):

    permission_classes = [ModulePermission]

    permission_module = "dashboard"

    def get(self, request):

        appointments = Appointment.objects.filter(
            appointment_date=date.today()
        )

        vertical = current_vertical(request.user)
        if vertical is not None:
            appointments = appointments.filter(vertical=vertical)

        # "Hoje" do profissional vinculado é só a agenda dele.
        doctor = current_doctor(request.user)
        if doctor is not None:
            appointments = appointments.filter(doctor=doctor)

        serializer = AppointmentSerializer(
            appointments,
            many=True
        )

        return Response(serializer.data)