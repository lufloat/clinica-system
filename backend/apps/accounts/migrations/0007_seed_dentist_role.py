from django.db import migrations


# O cargo Dentista nasce depois dos demais (migração 0002), quando a vertical
# de odontologia deixou de ser hipótese. As permissões são as do Médico mais o
# odontograma — que é o que de fato separa os dois no dia a dia.
#
# O par cargo/vertical não é redundante: a vertical diz quais módulos existem
# no produto, o cargo diz o que a pessoa faz com eles. Dar "odontograma" ao
# cargo Médico seria inócuo na vertical medicina (que não lista o módulo), mas
# apareceria na tela de Cargos como uma permissão sem sentido.
DENTIST_ROLE = ("Dentista", "Profissional de odontologia", False, True)

DENTIST_PERMS = {
    "dashboard": ["view"],
    "agenda": ["view", "edit"],
    "pacientes": ["view"],
    "odontograma": ["view", "create", "edit"],
}


def seed(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    RolePermission = apps.get_model("accounts", "RolePermission")

    name, description, is_admin, is_system = DENTIST_ROLE

    role, created = Role.objects.get_or_create(
        name=name,
        defaults={
            "description": description,
            "is_admin": is_admin,
            "is_system": is_system,
        },
    )

    # Cargo já existente (criado à mão pelo administrador) mantém a matriz de
    # permissões que ele configurou: sobrescrever seria desfazer o trabalho.
    if not created:
        return

    for module, actions in DENTIST_PERMS.items():
        for action in actions:
            RolePermission.objects.get_or_create(
                role=role, module=module, action=action
            )


def unseed(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    # Só remove se ninguém estiver usando o cargo.
    Role.objects.filter(name=DENTIST_ROLE[0], employees__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_employee_doctor"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
