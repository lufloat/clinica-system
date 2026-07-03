from datetime import date

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer


class TodayAppointmentsView(APIView):

    def get(self, request):

        appointments = Appointment.objects.filter(
            appointment_date=date.today()
        )

        serializer = AppointmentSerializer(
            appointments,
            many=True
        )

        return Response(serializer.data)