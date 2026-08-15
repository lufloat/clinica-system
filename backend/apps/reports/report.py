from datetime import date, datetime, timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.accounts.permissions import ModulePermission
from apps.accounts.services import current_doctor
from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.doctors.models import Doctor
from apps.verticals.services import scope_vertical, selectable_verticals


STATUS_LABELS = dict(Appointment.STATUS_CHOICES)


def parse_date(value, fallback):
    if not value:
        return fallback
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return fallback


class ReportView(APIView):

    permission_classes = [ModulePermission]

    permission_module = "relatorios"

    def get(self, request):

        today = date.today()

        default_start = today.replace(day=1)

        start = parse_date(request.query_params.get("start"), default_start)
        end = parse_date(request.query_params.get("end"), today)

        if end < start:
            start, end = end, start

        qs = Appointment.objects.filter(
            appointment_date__range=(start, end)
        )

        # Recorte por vertical: quem tem vertical só vê a agenda dela. O
        # administrador geral escolhe uma pelo `?vertical=` ou consolida as
        # duas quando não manda parâmetro.
        vertical, error = scope_vertical(
            request.user, request.query_params.get("vertical")
        )

        if error:
            return Response({"detail": error}, status=400)

        doctors_qs = Doctor.objects.all()

        if vertical is not None:
            qs = qs.filter(vertical=vertical)
            doctors_qs = doctors_qs.filter(vertical=vertical)

        # Segundo recorte: quem tem profissional vinculado só relata a própria
        # produção. Aplicado antes de tudo o que é calculado abaixo, para que
        # nenhum agregado — nem o seletor — enxergue além dele.
        scoped_doctor = current_doctor(request.user)

        if scoped_doctor is not None:
            qs = qs.filter(doctor=scoped_doctor)
            doctors_qs = doctors_qs.filter(pk=scoped_doctor.pk)

        # Totais por profissional no período, calculados ANTES do filtro por
        # profissional: são o que o seletor exibe, e não podem sumir quando um
        # filtro está ativo.
        doctor_totals = {
            row["doctor_id"]: row["total"]
            for row in qs.values("doctor_id").annotate(total=Count("id"))
        }

        # Filtro opcional por profissional. Só aceita quem está no escopo do
        # usuário — senão o parâmetro viraria porta para a outra vertical.
        # Para o profissional restrito, `doctors_qs` já é só ele: um `?doctor=`
        # apontando para um colega não encontra ninguém e é recusado, em vez
        # de alargar o recorte.
        doctor_id = request.query_params.get("doctor")
        selected_doctor = scoped_doctor

        if doctor_id:
            selected_doctor = doctors_qs.filter(pk=doctor_id).first()

            if selected_doctor is None:
                return Response(
                    {"detail": "Profissional não encontrado."},
                    status=400,
                )

            qs = qs.filter(doctor=selected_doctor)

        total = qs.count()

        by_status_raw = {
            row["status"]: row["total"]
            for row in qs.values("status").annotate(total=Count("id"))
        }

        finalizada = by_status_raw.get("FINALIZADA", 0)
        cancelada = by_status_raw.get("CANCELADA", 0)
        agendada = by_status_raw.get("AGENDADA", 0)

        by_status = [
            {
                "status": code,
                "label": label,
                "total": by_status_raw.get(code, 0),
            }
            for code, label in Appointment.STATUS_CHOICES
        ]

        by_doctor = list(
            qs.values("doctor_id", "doctor__name")
            .annotate(
                total=Count("id"),
                finalizada=Count("id", filter=Q(status="FINALIZADA")),
                cancelada=Count("id", filter=Q(status="CANCELADA")),
            )
            .order_by("-total")
        )
        by_doctor = [
            {
                "doctor_id": row["doctor_id"],
                "doctor": row["doctor__name"],
                "total": row["total"],
                "finalizada": row["finalizada"],
                "cancelada": row["cancelada"],
            }
            for row in by_doctor
        ]

        by_office = list(
            qs.values("office__name")
            .annotate(total=Count("id"))
            .order_by("-total")
        )
        by_office = [
            {"office": row["office__name"], "total": row["total"]}
            for row in by_office
        ]

        daily_raw = {
            row["day"]: row["total"]
            for row in qs.annotate(day=TruncDate("appointment_date"))
            .values("day")
            .annotate(total=Count("id"))
        }

        daily = []
        cursor = start
        while cursor <= end:
            daily.append({
                "date": cursor.isoformat(),
                "label": cursor.strftime("%d/%m"),
                "total": daily_raw.get(cursor, 0),
            })
            cursor += timedelta(days=1)

        appointments = AppointmentSerializer(
            qs.order_by("appointment_date", "appointment_time"),
            many=True
        ).data

        return Response({
            "start": start.isoformat(),
            "end": end.isoformat(),

            # Seletor de área. Uma opção só = o usuário tem vertical própria.
            "verticals": [
                {"slug": item.slug, "name": item.name}
                for item in selectable_verticals(request.user)
            ],
            "vertical": vertical.slug if vertical else None,
            "vertical_name": vertical.name if vertical else None,

            # Opções do filtro: só os profissionais que o usuário pode ver. A
            # lista não depende do período, para o filtro não "sumir" quando o
            # recorte de datas não tem consultas.
            "doctors": [
                {
                    "id": doctor.pk,
                    "name": doctor.name,
                    "specialty": doctor.specialty,
                    "total": doctor_totals.get(doctor.pk, 0),
                }
                for doctor in doctors_qs.order_by("name")
            ],
            "doctor": selected_doctor.pk if selected_doctor else None,
            "doctor_name": selected_doctor.name if selected_doctor else None,

            "summary": {
                "total": total,
                "agendada": agendada,
                "finalizada": finalizada,
                "cancelada": cancelada,
                "finalization_rate":
                    round(finalizada / total * 100) if total else 0,
                "cancellation_rate":
                    round(cancelada / total * 100) if total else 0,
            },
            "by_status": by_status,
            "by_doctor": by_doctor,
            "by_office": by_office,
            "daily": daily,
            "appointments": appointments,
        })
