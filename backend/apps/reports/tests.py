from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from apps.accounts.models import Employee, Role, RolePermission
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.offices.models import Office
from apps.patients.models import Patient
from apps.verticals.models import Vertical

URL = "/api/reports/summary/"


class ReportDoctorFilterTests(APITestCase):

    def setUp(self):
        self.medicina = Vertical.objects.get(slug="medicina")
        self.odonto = Vertical.objects.get(slug="odontologia")

        self.helena = Doctor.objects.create(
            name="Dra. Helena", council="CRM", council_code="1",
            specialty="Cardiologia", vertical=self.medicina,
        )
        self.rafael = Doctor.objects.create(
            name="Dr. Rafael", council="CRM", council_code="2",
            specialty="Ortopedia", vertical=self.medicina,
        )
        self.caio = Doctor.objects.create(
            name="Dr. Caio", council="CRO", council_code="1",
            specialty="Ortodontia", vertical=self.odonto,
        )

        self.paciente = Patient.objects.create(
            name="João", cpf="123.456.789-00", phone="1",
            birth_date="1990-01-01",
        )
        self.sala = Office.objects.create(name="Sala 1", room="1", floor="1")

        # 2 da Helena, 1 do Rafael, 1 do Caio (odonto) — todas no mesmo dia
        self._appointment(self.helena, self.medicina, "09:00:00")
        self._appointment(self.helena, self.medicina, "10:00:00")
        self._appointment(self.rafael, self.medicina, "11:00:00")
        self._appointment(self.caio, self.odonto, "14:00:00")

        self.data = "2026-07-15"

    def _appointment(self, doctor, vertical, time):
        return Appointment.objects.create(
            vertical=vertical, patient=self.paciente, doctor=doctor,
            office=self.sala, appointment_date="2026-07-15",
            appointment_time=time,
        )

    def _login(self, username, vertical, modules=("relatorios",)):
        role = Role.objects.create(name=f"Cargo {username}")
        for module in modules:
            RolePermission.objects.create(
                role=role, module=module, action="view"
            )

        user = User.objects.create_user(username, f"{username}@c.com", "x")
        Employee.objects.create(user=user, role=role, vertical=vertical)
        self.client.force_authenticate(user)
        return user

    def _admin(self):
        user = User.objects.create_superuser("chefe", "chefe@c.com", "x")
        Employee.objects.create(user=user, vertical=None)
        self.client.force_authenticate(user)
        return user

    def _params(self, **over):
        params = {"start": self.data, "end": self.data}
        params.update(over)
        return params

    def test_sem_filtro_traz_todas_do_escopo(self):
        self._admin()

        response = self.client.get(URL, self._params())

        self.assertEqual(response.data["summary"]["total"], 4)
        self.assertIsNone(response.data["doctor"])

    def test_filtro_por_profissional(self):
        self._admin()

        response = self.client.get(URL, self._params(doctor=self.helena.pk))

        self.assertEqual(response.data["summary"]["total"], 2)
        self.assertEqual(response.data["doctor"], self.helena.pk)
        self.assertEqual(response.data["doctor_name"], "Dra. Helena")

        nomes = [row["doctor"] for row in response.data["by_doctor"]]
        self.assertEqual(nomes, ["Dra. Helena"])

    def test_detalhamento_tambem_e_filtrado(self):
        self._admin()

        response = self.client.get(URL, self._params(doctor=self.rafael.pk))

        self.assertEqual(len(response.data["appointments"]), 1)
        self.assertEqual(
            response.data["appointments"][0]["doctor_name"], "Dr. Rafael"
        )

    def test_opcoes_do_filtro_vem_recortadas_pela_vertical(self):
        self._login("recep_odonto", self.odonto)

        response = self.client.get(URL, self._params())
        nomes = [row["name"] for row in response.data["doctors"]]

        self.assertEqual(nomes, ["Dr. Caio"])

    def test_relatorio_e_recortado_pela_vertical(self):
        self._login("recep_odonto", self.odonto)

        response = self.client.get(URL, self._params())

        # das 4 consultas, só a de odontologia
        self.assertEqual(response.data["summary"]["total"], 1)

    def test_totais_do_seletor_nao_somem_com_filtro_ativo(self):
        """São calculados antes do filtro — senão o seletor zeraria os outros."""
        self._admin()

        response = self.client.get(URL, self._params(doctor=self.helena.pk))
        totais = {row["name"]: row["total"] for row in response.data["doctors"]}

        self.assertEqual(totais["Dra. Helena"], 2)
        self.assertEqual(totais["Dr. Rafael"], 1)

    def test_totais_do_seletor_respeitam_o_periodo(self):
        self._admin()

        response = self.client.get(
            URL, {"start": "2026-01-01", "end": "2026-01-31"}
        )
        totais = {row["name"]: row["total"] for row in response.data["doctors"]}

        self.assertEqual(set(totais.values()), {0})

    def test_profissional_de_outra_vertical_e_recusado(self):
        """O parâmetro não pode virar porta para a agenda alheia."""
        self._login("recep_odonto", self.odonto)

        response = self.client.get(URL, self._params(doctor=self.helena.pk))

        self.assertEqual(response.status_code, 400)

    def test_profissional_inexistente_e_recusado(self):
        self._admin()

        response = self.client.get(URL, self._params(doctor=99999))

        self.assertEqual(response.status_code, 400)

    def test_doctor_vazio_e_tratado_como_todos(self):
        self._admin()

        response = self.client.get(URL, self._params(doctor=""))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["total"], 4)

    def test_sem_o_modulo_relatorios_recebe_403(self):
        self._login("sem_rel", self.medicina, modules=("agenda",))

        self.assertEqual(self.client.get(URL, self._params()).status_code, 403)
