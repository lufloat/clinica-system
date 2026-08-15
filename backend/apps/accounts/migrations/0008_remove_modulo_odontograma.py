# O Odontograma saiu do produto. A tela e a rota sumiram do frontend
# (verticals/registry.tsx); aqui cai o resto: a chave do catálogo de módulos,
# as permissões já concedidas e a menção no rol de módulos das verticais.
#
# As tabelas do app `dental` não são tocadas — estavam vazias, e derrubá-las
# é uma decisão separada desta.

from django.db import migrations, models

MODULE = "odontograma"


def limpar(apps, schema_editor):
    RolePermission = apps.get_model("accounts", "RolePermission")
    Vertical = apps.get_model("verticals", "Vertical")

    # Permissões concedidas a um módulo que não existe mais apareceriam como
    # linhas fantasma na tela de Permissões.
    RolePermission.objects.filter(module=MODULE).delete()

    for vertical in Vertical.objects.all():
        modules = list(vertical.modules or [])
        if MODULE in modules:
            vertical.modules = [item for item in modules if item != MODULE]
            vertical.save(update_fields=["modules"])


def restaurar(apps, schema_editor):
    """Devolve o módulo à odontologia. As permissões, não: quais cargos as
    tinham é informação que esta migração não guarda."""
    Vertical = apps.get_model("verticals", "Vertical")

    odonto = Vertical.objects.filter(slug="odontologia").first()
    if not odonto:
        return

    modules = list(odonto.modules or [])
    if MODULE not in modules:
        odonto.modules = modules + [MODULE]
        odonto.save(update_fields=["modules"])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_seed_dentist_role'),
        ('verticals', '0005_label_medicos_na_medicina'),
    ]

    operations = [
        migrations.RunPython(limpar, restaurar),
        migrations.AlterField(
            model_name='rolepermission',
            name='module',
            field=models.CharField(choices=[('dashboard', 'Dashboard'), ('agenda', 'Agenda'), ('pacientes', 'Pacientes'), ('medicos', 'Médicos'), ('consultorios', 'Consultórios'), ('relatorios', 'Relatórios'), ('financeiro', 'Financeiro'), ('configuracoes', 'Configurações'), ('colaboradores', 'Colaboradores'), ('cargos', 'Cargos')], max_length=30),
        ),
    ]
