from datetime import date

from django.db.models import Count

from rest_framework.views import APIView
from rest_framework.response import Response

from apps.doctors.models import Doctor
from apps.patients.models import Patient
from apps.offices.models import Office
from apps.appointments.models import Appointment


class DashboardView(APIView):

    def get(self, request):

        status_data = (
            Appointment.objects
            .values("status")
            .annotate(total=Count("id"))
        )

        return Response({

            "doctors": Doctor.objects.count(),

            "patients": Patient.objects.count(),

            "offices": Office.objects.count(),

            "appointments_today":
                Appointment.objects.filter(
                    appointment_date=date.today()
                ).count(),

            "status_chart": list(status_data)

        })