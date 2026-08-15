from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from apps.accounts.models import Employee, Role, RolePermission
from apps.doctors.models import Doctor
from apps.offices.models import Office
from apps.patients.models import Patient
from apps.verticals.models import Vertical

from .models import Appointment


class AppointmentVerticalTests(APITestCase):
    """A agenda é uma só; a vertical separa, mas a sala é compartilhada."""

    def setUp(self):
        self.medicina = Vertical.objects.get(slug="medicina")
        self.odonto = Vertical.objects.get(slug="odontologia")

        self.medico = Doctor.objects.create(
            name="Dra. Helena", council="CRM", council_code="1",
            specialty="Cardiologia", vertical=self.medicina,
        )
        self.dentista = Doctor.objects.create(
            name="Dr. Caio", council="CRO", council_code="1",
            specialty="Ortodontia", vertical=self.odonto,
        )

        # Paciente é compartilhado entre as verticais — por decisão de projeto.
        self.paciente = Patient.objects.create(
            name="João Silva", cpf="123.456.789-00", phone="1",
            birth_date="1990-01-01",
        )
        self.sala = Office.objects.create(name="Sala 1", room="1", floor="1")

        self.data = "2026-08-10"
        self.hora = "09:00:00"

    def _login(self, username, vertical):
        role = Role.objects.create(name=f"Cargo {username}")
        for action in ["view", "create", "edit", "delete"]:
            RolePermission.objects.create(role=role, module="agenda", action=action)

        user = User.objects.create_user(username, f"{username}@c.com", "x")
        Employee.objects.create(user=user, role=role, vertical=vertical)
        self.client.force_authenticate(user)
        return user

    def _payload(self, doctor, **over):
        data = {
            "patient": self.paciente.pk,
            "doctor": doctor.pk,
            "office": self.sala.pk,
            "appointment_date": self.data,
            "appointment_time": self.hora,
            "observations": "",
        }
        data.update(over)
        return data

    def test_vertical_vem_do_perfil(self):
        self._login("recep_odonto", self.odonto)

        response = self.client.post(
            "/api/appointments/", self._payload(self.dentista)
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Appointment.objects.get().vertical, self.odonto)

    def test_nao_da_para_escalar_profissional_de_outra_vertical(self):
        self._login("recep_odonto", self.odonto)

        response = self.client.post(
            "/api/appointments/", self._payload(self.medico)
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("doctor", response.data)

    def test_sala_ocupada_pela_outra_vertical_gera_conflito(self):
        """O ganho de manter uma única tabela de agenda."""
        Appointment.objects.create(
            vertical=self.medicina, patient=self.paciente, doctor=self.medico,
            office=self.sala, appointment_date=self.data,
            appointment_time=self.hora,
        )

        self._login("recep_odonto", self.odonto)
        response = self.client.post(
            "/api/appointments/", self._payload(self.dentista)
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("office", response.data)

    def test_consulta_cancelada_libera_a_sala(self):
        Appointment.objects.create(
            vertical=self.medicina, patient=self.paciente, doctor=self.medico,
            office=self.sala, appointment_date=self.data,
            appointment_time=self.hora, status="CANCELADA",
        )

        self._login("recep_odonto", self.odonto)
        response = self.client.post(
            "/api/appointments/", self._payload(self.dentista)
        )

        self.assertEqual(response.status_code, 201, response.data)

    def test_agenda_da_outra_vertical_nao_aparece(self):
        Appointment.objects.create(
            vertical=self.medicina, patient=self.paciente, doctor=self.medico,
            office=self.sala, appointment_date=self.data,
            appointment_time=self.hora,
        )

        self._login("recep_odonto", self.odonto)

        self.assertEqual(len(self.client.get("/api/appointments/").data), 0)

    def test_edicao_parcial_nao_quebra_a_validacao(self):
        """PATCH sem `doctor` no corpo antes levantava KeyError."""
        appointment = Appointment.objects.create(
            vertical=self.odonto, patient=self.paciente, doctor=self.dentista,
            office=self.sala, appointment_date=self.data,
            appointment_time=self.hora,
        )

        self._login("recep_odonto", self.odonto)
        response = self.client.patch(
            f"/api/appointments/{appointment.pk}/", {"observations": "retorno"}
        )

        self.assertEqual(response.status_code, 200, response.data)
