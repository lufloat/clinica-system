from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from apps.accounts.models import Employee, Role, RolePermission
from apps.verticals.models import Vertical

from .models import Doctor


class DoctorVerticalScopeTests(APITestCase):

    def setUp(self):
        self.medicina = Vertical.objects.get(slug="medicina")
        self.odonto = Vertical.objects.get(slug="odontologia")

        self.medico = Doctor.objects.create(
            name="Dra. Helena", council="CRM", council_code="12345",
            specialty="Cardiologia", vertical=self.medicina,
        )
        self.dentista = Doctor.objects.create(
            name="Dr. Caio", council="CRO", council_code="12345",
            specialty="Ortodontia", vertical=self.odonto,
        )

    def _login(self, username, vertical):
        role = Role.objects.create(name=f"Cargo {username}")
        for action in ["view", "create", "edit", "delete"]:
            RolePermission.objects.create(
                role=role, module="medicos", action=action
            )

        user = User.objects.create_user(username, f"{username}@c.com", "x")
        Employee.objects.create(user=user, role=role, vertical=vertical)
        self.client.force_authenticate(user)
        return user

    def test_crm_e_cro_podem_ter_o_mesmo_numero(self):
        """A unicidade é do par (conselho, registro), não da coluna."""
        self.assertEqual(self.medico.council_code, self.dentista.council_code)

    def test_colaborador_so_ve_profissionais_da_sua_vertical(self):
        self._login("recep_odonto", self.odonto)

        response = self.client.get("/api/doctors/")
        names = [row["name"] for row in response.data]

        self.assertEqual(names, ["Dr. Caio"])

    def test_admin_geral_ve_todos(self):
        admin = User.objects.create_superuser("chefe", "chefe@c.com", "x")
        Employee.objects.create(user=admin, vertical=None)
        self.client.force_authenticate(admin)

        response = self.client.get("/api/doctors/")

        self.assertEqual(len(response.data), 2)

    def test_vertical_vem_do_perfil_e_nao_do_payload(self):
        self._login("recep_odonto", self.odonto)

        response = self.client.post(
            "/api/doctors/",
            {
                "name": "Dra. Bia",
                "council": "CRO",
                "council_code": "99999",
                "specialty": "Endodontia",
                # tentativa de gravar na vertical alheia
                "vertical": self.medicina.pk,
                "phone": "",
                "email": "",
            },
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            Doctor.objects.get(council_code="99999").vertical, self.odonto
        )

    def test_edicao_nao_permite_mover_para_a_vertical_alheia(self):
        self._login("recep_odonto", self.odonto)

        response = self.client.patch(
            f"/api/doctors/{self.dentista.pk}/",
            {"vertical": self.medicina.pk},
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.dentista.refresh_from_db()
        self.assertEqual(self.dentista.vertical, self.odonto)

    def test_odontologia_exige_cro(self):
        self._login("recep_odonto", self.odonto)

        response = self.client.post(
            "/api/doctors/",
            {
                "name": "Dr. Errado",
                "council": "CRM",
                "council_code": "77777",
                "specialty": "Endodontia",
                "phone": "",
                "email": "",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("council", response.data)

    def test_sem_permissao_no_modulo_recebe_403(self):
        user = User.objects.create_user("sem_perm", "sp@c.com", "x")
        Employee.objects.create(user=user, role=None, vertical=self.odonto)
        self.client.force_authenticate(user)

        self.assertEqual(self.client.get("/api/doctors/").status_code, 403)


class AdminGeralCadastraPorConselhoTests(APITestCase):
    """Sem vertical própria, é o conselho que decide a linha de produto.

    O administrador geral atende as duas clínicas. Se o cadastro dele caísse
    na vertical padrão, todo dentista nasceria dentro da clínica médica:
    apareceria na agenda errada e não poderia ser vinculado a um login de
    odontologia.
    """

    def setUp(self):
        self.medicina = Vertical.objects.get(slug="medicina")
        self.odonto = Vertical.objects.get(slug="odontologia")

        admin = User.objects.create_superuser("chefe", "chefe@c.com", "x")
        Employee.objects.create(user=admin, vertical=None)
        self.client.force_authenticate(admin)

    def _post(self, council, code):
        return self.client.post("/api/doctors/", {
            "name": f"Profissional {council}",
            "council": council,
            "council_code": code,
            "specialty": "Clínica",
            "phone": "",
            "email": "",
        })

    def test_cro_nasce_na_odontologia(self):
        response = self._post("CRO", "99001")

        self.assertEqual(response.status_code, 201)
        doctor = Doctor.objects.get(council_code="99001")
        self.assertEqual(doctor.vertical, self.odonto)

    def test_crm_nasce_na_medicina(self):
        response = self._post("CRM", "99002")

        self.assertEqual(response.status_code, 201)
        doctor = Doctor.objects.get(council_code="99002")
        self.assertEqual(doctor.vertical, self.medicina)

    def test_trocar_o_conselho_na_edicao_move_a_vertical(self):
        """Corrigir CRM para CRO tem que levar o cadastro junto."""
        self._post("CRM", "99003")
        doctor = Doctor.objects.get(council_code="99003")

        response = self.client.patch(f"/api/doctors/{doctor.pk}/", {
            "council": "CRO",
        })

        self.assertEqual(response.status_code, 200)
        doctor.refresh_from_db()
        self.assertEqual(doctor.council, "CRO")
        self.assertEqual(doctor.vertical, self.odonto)

    def test_listagem_informa_a_area_de_cada_um(self):
        self._post("CRM", "99004")
        self._post("CRO", "99005")

        response = self.client.get("/api/doctors/")

        areas = {row["council_code"]: row["vertical_name"] for row in response.data}
        self.assertEqual(areas["99004"], "Clínica Médica")
        self.assertEqual(areas["99005"], "Odontologia")
