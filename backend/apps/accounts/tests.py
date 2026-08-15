from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.doctors.models import Doctor
from apps.verticals.models import Vertical, VerticalEmailRule

from .models import Employee, Role, RolePermission
from .services import user_can, user_permission_map


class VerticalScopedPermissionTests(TestCase):
    """A vertical recorta o que o cargo concede — inclusive para admin."""

    def setUp(self):
        self.medicina = Vertical.objects.get(slug="medicina")

        # Vertical enxuta: serve para provar que o recorte acontece.
        self.odonto = Vertical.objects.get(slug="odontologia")
        self.odonto.active = True
        self.odonto.modules = ["dashboard", "agenda", "pacientes", "medicos"]
        self.odonto.save()

    def _employee(self, username, role=None, vertical=None, superuser=False):
        user = (
            User.objects.create_superuser(username, f"{username}@c.com", "x")
            if superuser
            else User.objects.create_user(username, f"{username}@c.com", "x")
        )
        Employee.objects.create(user=user, role=role, vertical=vertical)
        return user

    def _role(self, name, modules, is_admin=False):
        # sufixo evita colidir com os cargos da migração de seed (name é único)
        role = Role.objects.create(name=f"{name} (teste)", is_admin=is_admin)
        for module in modules:
            RolePermission.objects.create(role=role, module=module, action="view")
        return role

    def test_cargo_recortado_pela_vertical(self):
        role = self._role("Recepção", ["agenda", "pacientes", "consultorios"])
        user = self._employee("ana", role=role, vertical=self.odonto)

        # `consultorios` está no cargo mas não na vertical.
        self.assertEqual(
            sorted(user_permission_map(user)), ["agenda", "pacientes"]
        )
        self.assertTrue(user_can(user, "agenda", "view"))
        self.assertFalse(user_can(user, "consultorios", "view"))

    def test_admin_com_vertical_tambem_e_recortado(self):
        role = self._role("Admin Odonto", [], is_admin=True)
        user = self._employee("chefe_odonto", role=role, vertical=self.odonto)

        self.assertEqual(sorted(user_permission_map(user)), sorted(self.odonto.modules))
        self.assertFalse(user_can(user, "financeiro", "view"))
        # dentro da vertical, admin continua podendo tudo
        self.assertTrue(user_can(user, "agenda", "delete"))

    def test_vertical_nula_enxerga_todas(self):
        user = self._employee("geral", superuser=True)

        self.assertIn("financeiro", user_permission_map(user))
        self.assertTrue(user_can(user, "financeiro", "delete"))

    def test_vertical_padrao_nao_altera_o_comportamento_atual(self):
        """medicina lista todos os módulos: o recorte é um no-op."""
        role = self._role("Recepção Médica", ["agenda", "consultorios"])
        user = self._employee("bia", role=role, vertical=self.medicina)

        self.assertEqual(
            sorted(user_permission_map(user)), ["agenda", "consultorios"]
        )

    def test_sem_cargo_nao_recebe_nada(self):
        user = self._employee("sem_cargo", vertical=self.odonto)
        self.assertEqual(user_permission_map(user), {})


class EmployeeDoctorLinkTests(APITestCase):
    """Vínculo colaborador → profissional, criado pelo administrador.

    O vínculo é o que transforma um acesso comum em acesso restrito, então as
    recusas aqui existem para não entregar um login que abre e não mostra nada.
    """

    URL = "/api/accounts/employees/"

    def setUp(self):
        self.medicina = Vertical.objects.get(slug="medicina")
        self.odonto = Vertical.objects.get(slug="odontologia")

        self.helena = Doctor.objects.create(
            name="Dra. Helena", council="CRM", council_code="1",
            specialty="Cardiologia", vertical=self.medicina,
        )
        self.caio = Doctor.objects.create(
            name="Dr. Caio", council="CRO", council_code="1",
            specialty="Ortodontia", vertical=self.odonto,
        )

        # A vertical vem do e-mail: uma regra por domínio para cada uma.
        VerticalEmailRule.objects.create(
            vertical=self.odonto, pattern="@odonto.com", priority=10
        )

        admin_role = Role.objects.create(name="Admin Teste", is_admin=True)
        admin = User.objects.create_user("admin", "admin@clinica.com", "x")
        Employee.objects.create(user=admin, role=admin_role, vertical=None)
        self.client.force_authenticate(admin)

    def _payload(self, **over):
        data = {
            "name": "Helena Prado",
            "email": "helena@clinica.com",
            "password": "SenhaTemp@123",
            "is_active": True,
        }
        data.update(over)
        return data

    def test_cria_colaborador_vinculado(self):
        response = self.client.post(
            self.URL, self._payload(doctor_id=self.helena.pk)
        )

        self.assertEqual(response.status_code, 201)
        employee = Employee.objects.get(user__email="helena@clinica.com")
        self.assertEqual(employee.doctor, self.helena)

    def test_colaborador_sem_vinculo_continua_sem_restricao(self):
        response = self.client.post(self.URL, self._payload())

        self.assertEqual(response.status_code, 201)
        employee = Employee.objects.get(user__email="helena@clinica.com")
        self.assertIsNone(employee.doctor)

    def test_recusa_profissional_ja_vinculado_a_outro_acesso(self):
        self.client.post(self.URL, self._payload(doctor_id=self.helena.pk))

        response = self.client.post(self.URL, self._payload(
            email="outra@clinica.com", doctor_id=self.helena.pk
        ))

        self.assertEqual(response.status_code, 400)
        self.assertIn("já está vinculado", str(response.data))
        self.assertEqual(User.objects.filter(email="outra@clinica.com").count(), 0)

    def test_recusa_vinculo_de_outra_vertical(self):
        """Dentista num login de medicina veria uma interseção sempre vazia."""
        response = self.client.post(self.URL, self._payload(
            doctor_id=self.caio.pk
        ))

        self.assertEqual(response.status_code, 400)
        self.assertIn("Odontologia", str(response.data))
        # nada foi criado pela metade
        self.assertEqual(User.objects.filter(email="helena@clinica.com").count(), 0)

    def test_aceita_dentista_em_login_de_odontologia(self):
        response = self.client.post(self.URL, self._payload(
            name="Caio Souza", email="caio@odonto.com", doctor_id=self.caio.pk
        ))

        self.assertEqual(response.status_code, 201)
        employee = Employee.objects.get(user__email="caio@odonto.com")
        self.assertEqual(employee.vertical, self.odonto)
        self.assertEqual(employee.doctor, self.caio)

    def test_desvincula_enviando_nulo(self):
        self.client.post(self.URL, self._payload(doctor_id=self.helena.pk))
        employee = Employee.objects.get(user__email="helena@clinica.com")

        # format="json": o encoder multipart do test client não aceita None.
        response = self.client.put(
            f"{self.URL}{employee.pk}/",
            self._payload(doctor_id=None),
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        employee.refresh_from_db()
        self.assertIsNone(employee.doctor)

    def test_me_expoe_o_profissional_do_usuario(self):
        user = User.objects.create_user("dra", "dra@clinica.com", "x")
        Employee.objects.create(
            user=user, role=Role.objects.create(name="Médica Teste"),
            vertical=self.medicina, doctor=self.helena,
        )
        self.client.force_authenticate(user)

        response = self.client.get("/api/accounts/me/")

        self.assertEqual(response.data["doctor"]["name"], "Dra. Helena")
        self.assertEqual(response.data["doctor"]["council"], "CRM")
