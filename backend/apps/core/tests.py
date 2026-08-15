from datetime import date

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from apps.accounts.models import Employee, Role, RolePermission
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.offices.models import Office
from apps.patients.models import Patient
from apps.verticals.models import Vertical

AGENDA = "/api/appointments/"
DASHBOARD = "/api/reports/dashboard/"
SUMMARY = "/api/reports/summary/"
TODAY = "/api/reports/today/"


class DoctorScopeTests(APITestCase):
    """Isolamento por profissional: cada um enxerga só o que é seu.

    O que estes testes protegem não é a interface — é a API. Todo caso aqui
    passa por uma requisição HTTP autenticada, porque o risco real é alguém
    trocar um parâmetro na URL, não clicar num botão escondido.
    """

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

        self.joao = Patient.objects.create(
            name="João", cpf="123.456.789-00", phone="1",
            birth_date="1990-01-01",
        )
        self.ana = Patient.objects.create(
            name="Ana", cpf="987.654.321-00", phone="2",
            birth_date="1985-05-05",
        )

        self.sala = Office.objects.create(name="Sala 1", room="1", floor="1")
        self.sala2 = Office.objects.create(name="Sala 2", room="2", floor="1")

        self.hoje = date.today()

        # 2 da Helena, 1 do Rafael, 1 do Caio — todas hoje.
        self.consulta_helena = self._appointment(
            self.helena, self.medicina, "09:00", self.joao, self.sala
        )
        self._appointment(
            self.helena, self.medicina, "10:00", self.ana, self.sala
        )
        self.consulta_rafael = self._appointment(
            self.rafael, self.medicina, "11:00", self.joao, self.sala2
        )
        self._appointment(
            self.caio, self.odonto, "14:00", self.joao, self.sala
        )

    def _appointment(self, doctor, vertical, time, patient, office):
        return Appointment.objects.create(
            patient=patient, doctor=doctor, office=office,
            vertical=vertical, appointment_date=self.hoje,
            appointment_time=time,
        )

    def _login(self, username, vertical, doctor=None, modules=None):
        """Cria um acesso e autentica. `doctor` preenchido = restrito."""
        role = Role.objects.create(name=f"Cargo {username}")
        for module in modules or ["agenda", "dashboard", "relatorios"]:
            for action in ["view", "create", "edit", "delete"]:
                RolePermission.objects.create(
                    role=role, module=module, action=action
                )

        user = User.objects.create_user(username, f"{username}@c.com", "x")
        Employee.objects.create(
            user=user, role=role, vertical=vertical, doctor=doctor
        )
        self.client.force_authenticate(user)
        return user

    # ---------- Agenda ----------

    def test_medico_lista_apenas_a_propria_agenda(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.get(AGENDA)

        self.assertEqual(response.status_code, 200)
        nomes = {row["doctor_name"] for row in response.data}
        self.assertEqual(nomes, {"Dra. Helena"})
        self.assertEqual(len(response.data), 2)

    def test_recepcao_continua_vendo_a_agenda_de_todos(self):
        self._login("recepcao", self.medicina)

        response = self.client.get(AGENDA)

        # Todos da medicina: as duas da Helena e a do Rafael. O Caio é de
        # outra vertical e continua de fora, como já era.
        self.assertEqual(len(response.data), 3)

    def test_medico_nao_abre_consulta_de_colega_pelo_id(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.get(f"{AGENDA}{self.consulta_rafael.pk}/")

        self.assertEqual(response.status_code, 404)

    def test_medico_nao_finaliza_consulta_de_colega(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.patch(
            f"{AGENDA}{self.consulta_rafael.pk}/finalize/"
        )

        self.assertEqual(response.status_code, 404)
        self.consulta_rafael.refresh_from_db()
        self.assertEqual(self.consulta_rafael.status, "AGENDADA")

    def test_medico_nao_cria_agendamento(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.post(AGENDA, {
            "patient": self.joao.pk,
            "doctor": self.helena.pk,
            "office": self.sala.pk,
            "appointment_date": self.hoje.isoformat(),
            "appointment_time": "16:00",
            "observations": "",
        })

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Appointment.objects.count(), 4)

    def test_medico_nao_transfere_a_propria_consulta_para_colega(self):
        """O doctor do corpo é ignorado: a consulta continua sendo dela."""
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.patch(
            f"{AGENDA}{self.consulta_helena.pk}/",
            {"doctor": self.rafael.pk},
        )

        self.assertEqual(response.status_code, 200)
        self.consulta_helena.refresh_from_db()
        self.assertEqual(self.consulta_helena.doctor, self.helena)

    def test_medico_edita_a_propria_consulta(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.patch(
            f"{AGENDA}{self.consulta_helena.pk}/",
            {"observations": "Paciente em jejum"},
        )

        self.assertEqual(response.status_code, 200)
        self.consulta_helena.refresh_from_db()
        self.assertEqual(self.consulta_helena.observations, "Paciente em jejum")

    # ---------- Dashboard ----------

    def test_dashboard_do_medico_conta_so_os_atendimentos_dele(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.get(DASHBOARD)

        self.assertEqual(response.data["appointments_today"], 2)
        self.assertEqual(response.data["doctors"], 1)
        # Dois pacientes distintos nas consultas dela.
        self.assertEqual(response.data["patients"], 2)
        self.assertEqual(len(response.data["today_list"]), 2)

    def test_dashboard_da_recepcao_conta_a_clinica(self):
        self._login("recepcao", self.medicina)

        response = self.client.get(DASHBOARD)

        self.assertEqual(response.data["appointments_today"], 3)
        self.assertEqual(response.data["doctors"], 2)
        self.assertEqual(response.data["patients"], 2)

    def test_today_do_medico_traz_so_a_agenda_dele(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.get(TODAY)

        self.assertEqual(len(response.data), 2)

    # ---------- Relatórios ----------

    def test_relatorio_do_medico_soma_so_a_producao_dele(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.get(SUMMARY)

        self.assertEqual(response.data["summary"]["total"], 2)
        self.assertEqual(len(response.data["by_doctor"]), 1)
        self.assertEqual(response.data["by_doctor"][0]["doctor"], "Dra. Helena")

    def test_seletor_do_relatorio_nao_revela_os_colegas(self):
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.get(SUMMARY)

        nomes = {row["name"] for row in response.data["doctors"]}
        self.assertEqual(nomes, {"Dra. Helena"})

    def test_relatorio_ignora_doctor_de_colega_na_query_string(self):
        """O furo original: trocar o ID na URL para ler o dado do colega."""
        self._login("helena", self.medicina, doctor=self.helena)

        response = self.client.get(SUMMARY, {"doctor": self.rafael.pk})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Profissional não encontrado.")

    def test_relatorio_da_recepcao_mantem_o_filtro_por_profissional(self):
        self._login("recepcao", self.medicina)

        response = self.client.get(SUMMARY, {"doctor": self.rafael.pk})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["total"], 1)
        # O seletor segue listando os dois profissionais da medicina.
        self.assertEqual(len(response.data["doctors"]), 2)

    # ---------- Dentista ----------

    def test_dentista_tem_o_mesmo_isolamento_do_medico(self):
        """O eixo é o vínculo, não o conselho: CRO se comporta como CRM."""
        self._login("caio", self.odonto, doctor=self.caio)

        response = self.client.get(AGENDA)

        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["doctor_name"], "Dr. Caio")

    # ---------- Administrador ----------

    def test_admin_vinculado_continua_vendo_tudo(self):
        """O dono da clínica que também atende não pode ficar restrito."""
        role = Role.objects.create(name="Dono", is_admin=True)
        user = User.objects.create_user("dono", "dono@c.com", "x")
        # Sem vertical: administrador geral.
        Employee.objects.create(
            user=user, role=role, vertical=None, doctor=self.helena
        )
        self.client.force_authenticate(user)

        response = self.client.get(AGENDA)

        self.assertEqual(len(response.data), 4)


class VerticalFilterTests(APITestCase):
    """Seletor de área do Dashboard e dos Relatórios.

    Quem administra as duas clínicas precisa tanto do número somado quanto do
    número de cada uma. Quem trabalha em uma só não escolhe nada.
    """

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

        self.paciente = Patient.objects.create(
            name="João", cpf="123.456.789-00", phone="1",
            birth_date="1990-01-01",
        )
        self.sala = Office.objects.create(name="Sala 1", room="1", floor="1")
        self.hoje = date.today()

        # 2 consultas médicas e 1 odontológica.
        self._appointment(self.helena, self.medicina, "09:00")
        self._appointment(self.helena, self.medicina, "10:00")
        self._appointment(self.caio, self.odonto, "14:00")

    def _appointment(self, doctor, vertical, time):
        return Appointment.objects.create(
            patient=self.paciente, doctor=doctor, office=self.sala,
            vertical=vertical, appointment_date=self.hoje,
            appointment_time=time,
        )

    def _admin_geral(self):
        role = Role.objects.create(name="Chefe", is_admin=True)
        user = User.objects.create_user("chefe", "chefe@c.com", "x")
        Employee.objects.create(user=user, role=role, vertical=None)
        self.client.force_authenticate(user)
        return user

    def _da_medicina(self):
        role = Role.objects.create(name="Recepção Médica")
        for module in ["dashboard", "relatorios", "agenda"]:
            RolePermission.objects.create(
                role=role, module=module, action="view"
            )
        user = User.objects.create_user("bia", "bia@c.com", "x")
        Employee.objects.create(user=user, role=role, vertical=self.medicina)
        self.client.force_authenticate(user)
        return user

    # ---------- consolidado ----------

    def test_admin_sem_parametro_soma_as_duas_areas(self):
        self._admin_geral()

        response = self.client.get(DASHBOARD)

        self.assertEqual(response.data["appointments_today"], 3)
        self.assertEqual(response.data["doctors"], 2)
        self.assertIsNone(response.data["vertical"])

    def test_admin_recebe_as_duas_areas_como_opcao(self):
        self._admin_geral()

        response = self.client.get(DASHBOARD)

        slugs = {item["slug"] for item in response.data["verticals"]}
        self.assertEqual(slugs, {"medicina", "odontologia"})

    # ---------- separado ----------

    def test_dashboard_filtrado_por_odontologia(self):
        self._admin_geral()

        response = self.client.get(DASHBOARD, {"vertical": "odontologia"})

        self.assertEqual(response.data["appointments_today"], 1)
        self.assertEqual(response.data["doctors"], 1)
        self.assertEqual(response.data["vertical_name"], "Odontologia")

    def test_dashboard_filtrado_por_medicina(self):
        self._admin_geral()

        response = self.client.get(DASHBOARD, {"vertical": "medicina"})

        self.assertEqual(response.data["appointments_today"], 2)

    def test_relatorio_filtrado_por_odontologia(self):
        self._admin_geral()

        response = self.client.get(SUMMARY, {"vertical": "odontologia"})

        self.assertEqual(response.data["summary"]["total"], 1)
        self.assertEqual(
            [row["doctor"] for row in response.data["by_doctor"]], ["Dr. Caio"]
        )
        # o seletor de profissional acompanha a área escolhida
        self.assertEqual(
            [row["name"] for row in response.data["doctors"]], ["Dr. Caio"]
        )

    def test_area_desconhecida_e_recusada(self):
        self._admin_geral()

        response = self.client.get(DASHBOARD, {"vertical": "veterinaria"})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Área não encontrada.")

    # ---------- quem tem vertical própria ----------

    def test_colaborador_da_medicina_nao_recebe_seletor(self):
        self._da_medicina()

        response = self.client.get(DASHBOARD)

        self.assertEqual(len(response.data["verticals"]), 1)
        self.assertEqual(response.data["verticals"][0]["slug"], "medicina")

    def test_colaborador_nao_alcanca_a_outra_area_pelo_parametro(self):
        """O furo óbvio: pedir a odontologia estando na medicina."""
        self._da_medicina()

        response = self.client.get(DASHBOARD, {"vertical": "odontologia"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["appointments_today"], 2)
        self.assertEqual(response.data["vertical_name"], "Clínica Médica")

    def test_cards_de_paciente_acompanham_a_area_escolhida(self):
        """Painel da odontologia não exibe o total de pacientes da casa."""
        self._admin_geral()

        outro = Patient.objects.create(
            name="Sem consulta", cpf="111.222.333-44", phone="9",
            birth_date="1970-01-01",
        )

        geral = self.client.get(DASHBOARD)
        odonto = self.client.get(DASHBOARD, {"vertical": "odontologia"})

        # Consolidado conta o cadastro inteiro, inclusive quem nunca veio.
        self.assertEqual(geral.data["patients"], Patient.objects.count())
        self.assertIn(outro, Patient.objects.all())
        # Recortado conta quem apareceu: só o paciente do Dr. Caio.
        self.assertEqual(odonto.data["patients"], 1)

    # ---------- Agenda por área ----------

    def test_agenda_do_admin_soma_as_duas_areas(self):
        self._admin_geral()

        response = self.client.get(AGENDA)

        self.assertEqual(len(response.data), 3)

    def test_agenda_filtrada_por_odontologia(self):
        self._admin_geral()

        response = self.client.get(AGENDA, {"vertical": "odontologia"})

        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["doctor_name"], "Dr. Caio")

    def test_agenda_filtrada_por_medicina(self):
        self._admin_geral()

        response = self.client.get(AGENDA, {"vertical": "medicina"})

        self.assertEqual(len(response.data), 2)

    def test_agenda_recusa_area_desconhecida(self):
        self._admin_geral()

        response = self.client.get(AGENDA, {"vertical": "veterinaria"})

        self.assertEqual(response.status_code, 400)

    def test_colaborador_nao_ve_a_outra_agenda_pelo_parametro(self):
        self._da_medicina()

        response = self.client.get(AGENDA, {"vertical": "odontologia"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_admin_agenda_com_dentista_e_o_horario_nasce_na_odontologia(self):
        """O administrador geral atende as duas clínicas: marcar com um
        dentista não pode esbarrar na vertical padrão."""
        self._admin_geral()

        response = self.client.post(AGENDA, {
            "patient": self.paciente.pk,
            "doctor": self.caio.pk,
            "office": self.sala.pk,
            "appointment_date": self.hoje.isoformat(),
            "appointment_time": "16:00",
            "observations": "",
        })

        self.assertEqual(response.status_code, 201, response.data)
        criada = Appointment.objects.get(appointment_time="16:00")
        self.assertEqual(criada.vertical, self.odonto)

    def test_admin_agenda_com_medico_e_o_horario_nasce_na_medicina(self):
        self._admin_geral()

        response = self.client.post(AGENDA, {
            "patient": self.paciente.pk,
            "doctor": self.helena.pk,
            "office": self.sala.pk,
            "appointment_date": self.hoje.isoformat(),
            "appointment_time": "17:00",
            "observations": "",
        })

        self.assertEqual(response.status_code, 201, response.data)
        criada = Appointment.objects.get(appointment_time="17:00")
        self.assertEqual(criada.vertical, self.medicina)

    def test_me_lista_as_areas_selecionaveis(self):
        self._admin_geral()

        response = self.client.get("/api/accounts/me/")

        slugs = {item["slug"] for item in response.data["verticals"]}
        self.assertEqual(slugs, {"medicina", "odontologia"})

    def test_me_do_colaborador_traz_so_a_area_dele(self):
        self._da_medicina()

        response = self.client.get("/api/accounts/me/")

        self.assertEqual(
            [item["slug"] for item in response.data["verticals"]], ["medicina"]
        )


class ModulePermissionCoverageTests(APITestCase):
    """Toda rota responde ao cargo — nenhuma cai no padrão do DRF.

    O padrão do projeto é `IsAuthenticated`: uma viewset que esquece de
    declarar o módulo fica aberta a qualquer pessoa logada, por mais restrito
    que seja o cargo dela. Estes testes cobrem as rotas que tinham esse
    esquecimento.
    """

    def setUp(self):
        self.medicina = Vertical.objects.get(slug="medicina")

        self.helena = Doctor.objects.create(
            name="Dra. Helena", council="CRM", council_code="1",
            specialty="Cardiologia", vertical=self.medicina,
        )
        self.rafael = Doctor.objects.create(
            name="Dr. Rafael", council="CRM", council_code="2",
            specialty="Ortopedia", vertical=self.medicina,
        )

        self.paciente = Patient.objects.create(
            name="João", cpf="123.456.789-00", phone="1",
            birth_date="1990-01-01",
        )
        self.sala = Office.objects.create(name="Sala 1", room="1", floor="1")

        self.minha = Appointment.objects.create(
            patient=self.paciente, doctor=self.helena, office=self.sala,
            vertical=self.medicina, appointment_date=date.today(),
            appointment_time="09:00",
        )
        self.alheia = Appointment.objects.create(
            patient=self.paciente, doctor=self.rafael, office=self.sala,
            vertical=self.medicina, appointment_date=date.today(),
            appointment_time="10:00",
        )

        # Cargo do profissional: lê paciente, mexe na agenda, nada de salas.
        role = Role.objects.create(name="Profissional")
        for module, actions in {
            "dashboard": ["view"],
            "agenda": ["view", "edit"],
            "pacientes": ["view"],
        }.items():
            for action in actions:
                RolePermission.objects.create(
                    role=role, module=module, action=action
                )

        user = User.objects.create_user("helena", "helena@c.com", "x")
        Employee.objects.create(
            user=user, role=role, vertical=self.medicina, doctor=self.helena
        )
        self.client.force_authenticate(user)

    # ---------- Pacientes ----------

    def test_le_paciente_porque_o_cargo_permite(self):
        self.assertEqual(self.client.get("/api/patients/").status_code, 200)

    def test_nao_cadastra_paciente_sem_a_acao_no_cargo(self):
        response = self.client.post("/api/patients/", {
            "name": "Novo", "cpf": "999.888.777-66",
            "phone": "1", "birth_date": "1990-01-01",
        })

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Patient.objects.count(), 1)

    def test_nao_apaga_paciente(self):
        response = self.client.delete(f"/api/patients/{self.paciente.pk}/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Patient.objects.count(), 1)

    # ---------- Consultórios ----------

    def test_nao_alcanca_consultorios_sem_o_modulo(self):
        self.assertEqual(self.client.get("/api/offices/").status_code, 403)

    def test_nao_apaga_consultorio(self):
        response = self.client.delete(f"/api/offices/{self.sala.pk}/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Office.objects.count(), 1)

    # ---------- Documentos ----------

    def test_imprime_documento_do_proprio_atendimento(self):
        response = self.client.get(
            f"/api/documents/{self.minha.pk}/certificate/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_nao_imprime_atestado_de_atendimento_alheio(self):
        """O PDF carrega o mesmo dado da agenda: segue o mesmo recorte."""
        response = self.client.get(
            f"/api/documents/{self.alheia.pk}/certificate/"
        )

        self.assertEqual(response.status_code, 404)

    def test_nao_imprime_receita_de_atendimento_alheio(self):
        response = self.client.get(
            f"/api/documents/{self.alheia.pk}/prescription/"
        )

        self.assertEqual(response.status_code, 404)

    def test_sem_o_modulo_agenda_nao_imprime_nada(self):
        role = Role.objects.create(name="Financeiro Teste")
        RolePermission.objects.create(
            role=role, module="financeiro", action="view"
        )
        user = User.objects.create_user("fin", "fin@c.com", "x")
        Employee.objects.create(user=user, role=role, vertical=self.medicina)
        self.client.force_authenticate(user)

        response = self.client.get(
            f"/api/documents/{self.minha.pk}/certificate/"
        )

        self.assertEqual(response.status_code, 403)
