from django.db import migrations


# Médico e dentista passam a abrir Relatórios. Não é uma abertura de dados: a
# view já recorta pelo profissional vinculado (apps/reports/report.py), então
# cada um soma a própria produção e o seletor de profissional nem aparece.
#
# Só "view": exportar o CSV é feito no navegador, a partir do que a tela já
# recebeu — não há ação de escrita a conceder.
ROLES = ["Médico", "Dentista"]

MODULE = "relatorios"
ACTION = "view"


def conceder(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    RolePermission = apps.get_model("accounts", "RolePermission")

    for name in ROLES:
        role = Role.objects.filter(name=name).first()
        if not role:
            continue
        RolePermission.objects.get_or_create(
            role=role, module=MODULE, action=ACTION
        )


def revogar(apps, schema_editor):
    RolePermission = apps.get_model("accounts", "RolePermission")

    RolePermission.objects.filter(
        role__name__in=ROLES, module=MODULE, action=ACTION
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_remove_modulo_odontograma"),
    ]

    operations = [
        migrations.RunPython(conceder, revogar),
    ]
