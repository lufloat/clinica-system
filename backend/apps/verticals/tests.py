from django.contrib.auth.models import User
from django.test import TestCase

from apps.accounts.services import ensure_employee

from .models import Vertical, VerticalEmailRule
from .services import default_vertical, resolve_vertical_for_email


class ResolveVerticalForEmailTests(TestCase):
    """As verticais `medicina` e `odontologia` vêm da migração de seed."""

    def setUp(self):
        self.medicina = Vertical.objects.get(slug="medicina")
        self.odonto = Vertical.objects.get(slug="odontologia")
        self.odonto.active = True
        self.odonto.save()

    def test_padrao_quando_nenhuma_regra_casa(self):
        self.assertEqual(default_vertical(), self.medicina)
        self.assertEqual(
            resolve_vertical_for_email("joao@clinica.com.br"), self.medicina
        )

    def test_email_vazio_cai_na_padrao(self):
        self.assertEqual(resolve_vertical_for_email(""), self.medicina)
        self.assertEqual(resolve_vertical_for_email(None), self.medicina)

    def test_regra_por_dominio(self):
        VerticalEmailRule.objects.create(
            vertical=self.odonto, pattern="@odonto.clinica.com.br"
        )
        self.assertEqual(
            resolve_vertical_for_email("ana@odonto.clinica.com.br"), self.odonto
        )
        self.assertEqual(
            resolve_vertical_for_email("ana@clinica.com.br"), self.medicina
        )

    def test_regra_por_glob(self):
        VerticalEmailRule.objects.create(vertical=self.odonto, pattern="odonto.*@*")
        self.assertEqual(
            resolve_vertical_for_email("odonto.ana@clinica.com.br"), self.odonto
        )

    def test_maior_prioridade_vence(self):
        VerticalEmailRule.objects.create(
            vertical=self.medicina, pattern="@clinica.com.br", priority=1
        )
        VerticalEmailRule.objects.create(
            vertical=self.odonto, pattern="dr.*@clinica.com.br", priority=10
        )
        self.assertEqual(
            resolve_vertical_for_email("dr.ana@clinica.com.br"), self.odonto
        )
        self.assertEqual(
            resolve_vertical_for_email("ana@clinica.com.br"), self.medicina
        )

    def test_regra_de_vertical_inativa_e_ignorada(self):
        VerticalEmailRule.objects.create(
            vertical=self.odonto, pattern="@odonto.clinica.com.br"
        )
        self.odonto.active = False
        self.odonto.save()
        self.assertEqual(
            resolve_vertical_for_email("ana@odonto.clinica.com.br"), self.medicina
        )

    def test_maiusculas_nao_afetam(self):
        VerticalEmailRule.objects.create(
            vertical=self.odonto, pattern="@Odonto.Clinica.com.BR"
        )
        self.assertEqual(
            resolve_vertical_for_email("ANA@ODONTO.CLINICA.COM.BR"), self.odonto
        )


class DefaultExclusivityTests(TestCase):

    def test_marcar_nova_padrao_desmarca_a_anterior(self):
        odonto = Vertical.objects.get(slug="odontologia")
        odonto.is_default = True
        odonto.save()

        self.assertEqual(Vertical.objects.filter(is_default=True).count(), 1)
        self.assertFalse(Vertical.objects.get(slug="medicina").is_default)


class EnsureEmployeeVerticalTests(TestCase):
    """Perfis criados fora do fluxo de colaboradores não podem virar 'todas'."""

    def test_usuario_comum_recebe_a_vertical_padrao(self):
        user = User.objects.create_user("joao", "joao@clinica.com.br", "x")
        employee = ensure_employee(user)
        self.assertEqual(employee.vertical, Vertical.objects.get(slug="medicina"))

    def test_superusuario_fica_com_vertical_nula(self):
        user = User.objects.create_superuser("chefe", "chefe@clinica.com.br", "x")
        employee = ensure_employee(user)
        self.assertIsNone(employee.vertical)
