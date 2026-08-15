from datetime import date, timedelta

from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.accounts.permissions import ModulePermission
from apps.accounts.services import current_doctor
from apps.doctors.models import Doctor
from apps.patients.models import Patient
from apps.offices.models import Office
from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.verticals.services import scope_vertical, selectable_verticals


STATUS_LABELS = dict(Appointment.STATUS_CHOICES)


class DashboardView(APIView):

    permission_classes = [ModulePermission]

    permission_module = "dashboard"

    def get(self, request):

        today = date.today()

        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        # Recorte por vertical. O administrador geral escolhe uma pelo
        # parâmetro `?vertical=`; sem parâmetro, os números vêm consolidados.
        # Quem tem vertical própria não escolhe: é sempre a dele.
        vertical, error = scope_vertical(
            request.user, request.query_params.get("vertical")
        )

        if error:
            return Response({"detail": error}, status=400)

        appointments = Appointment.objects.all()
        doctors = Doctor.objects.all()

        if vertical is not None:
            appointments = appointments.filter(vertical=vertical)
            doctors = doctors.filter(vertical=vertical)

        # Segundo recorte: o profissional vinculado só se vê nos indicadores.
        # Os cards deixam de ser um retrato da clínica e passam a ser o do
        # próprio atendimento — inclusive o contador de profissionais, que
        # seria a única forma de ele inferir o tamanho da equipe.
        doctor = current_doctor(request.user)

        if doctor is not None:
            appointments = appointments.filter(doctor=doctor)
            doctors = doctors.filter(pk=doctor.pk)

        today_qs = appointments.filter(
            appointment_date=today
        )

        status_data = (
            appointments
            .values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

        status_chart = [
            {
                "status": row["status"],
                "label": STATUS_LABELS.get(
                    row["status"], row["status"]
                ),
                "total": row["total"],
            }
            for row in status_data
        ]

        today_list = AppointmentSerializer(
            today_qs.order_by("appointment_time"),
            many=True
        ).data

        # Paciente e consultório são compartilhados entre as verticais: a
        # mesma pessoa pode ser paciente da clínica médica e da odontologia.
        # Por isso a contagem só é global quando o painel também é — havendo
        # qualquer recorte, o card passa a contar quem apareceu nele, senão
        # o painel da odontologia exibiria o total de pacientes da casa.
        if vertical is None and doctor is None:
            patient_count = Patient.objects.count()
            office_count = Office.objects.count()
        else:
            patient_count = (
                appointments.values("patient_id").distinct().count()
            )
            office_count = appointments.values("office_id").distinct().count()

        return Response({

            # Opções do seletor de área. Uma só = o usuário tem vertical
            # própria e não há o que escolher.
            "verticals": [
                {"slug": item.slug, "name": item.name}
                for item in selectable_verticals(request.user)
            ],
            "vertical": vertical.slug if vertical else None,
            "vertical_name": vertical.name if vertical else None,

            "doctors": doctors.count(),
            "patients": patient_count,
            "offices": office_count,

            "appointments_today": today_qs.count(),

            "appointments_week":
                appointments.filter(
                    appointment_date__range=(week_start, week_end)
                ).count(),

            "finished_today":
                today_qs.filter(status="FINALIZADA").count(),

            "canceled_today":
                today_qs.filter(status="CANCELADA").count(),

            "status_chart": status_chart,

            "today_list": today_list,

        })
