from django.db import migrations


# Cargos criados na contratação. O Administrador é protegido (is_system).
DEFAULT_ROLES = [
    ("Administrador", "Acesso total ao sistema", True, True),
    ("Médico", "Profissional de saúde", False, True),
    ("Secretária", "Apoio administrativo", False, True),
    ("Financeiro", "Gestão financeira", False, True),
    ("Recepção", "Atendimento e agenda", False, True),
    ("Supervisor", "Supervisão da operação", False, True),
]

# Permissões iniciais sugeridas para os cargos não-admin (módulo -> ações).
DEFAULT_PERMS = {
    "Recepção": {
        "dashboard": ["view"],
        "agenda": ["view", "create", "edit"],
        "pacientes": ["view", "create", "edit"],
    },
    "Secretária": {
        "dashboard": ["view"],
        "agenda": ["view", "create", "edit"],
        "pacientes": ["view", "create", "edit"],
        "medicos": ["view"],
        "consultorios": ["view"],
    },
    "Médico": {
        "dashboard": ["view"],
        "agenda": ["view", "edit"],
        "pacientes": ["view"],
    },
    "Financeiro": {
        "dashboard": ["view"],
        "financeiro": ["view", "create", "edit"],
        "relatorios": ["view"],
    },
    "Supervisor": {
        "dashboard": ["view"],
        "agenda": ["view"],
        "pacientes": ["view"],
        "medicos": ["view"],
        "consultorios": ["view"],
        "relatorios": ["view"],
    },
}


def seed(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    RolePermission = apps.get_model("accounts", "RolePermission")
    Employee = apps.get_model("accounts", "Employee")
    User = apps.get_model("auth", "User")

    roles = {}
    for name, desc, is_admin, is_system in DEFAULT_ROLES:
        role, _ = Role.objects.get_or_create(
            name=name,
            defaults={
                "description": desc,
                "is_admin": is_admin,
                "is_system": is_system,
            },
        )
        roles[name] = role

    # permissões iniciais dos cargos não-admin
    for role_name, perm_map in DEFAULT_PERMS.items():
        role = roles.get(role_name)
        if not role:
            continue
        for module, actions in perm_map.items():
            for action in actions:
                RolePermission.objects.get_or_create(
                    role=role, module=module, action=action
                )

    admin_role = roles["Administrador"]

    # perfil para todo usuário já existente; não força troca de senha
    # (eles já têm senha funcionando), e promove Maria/superusers a admin
    for user in User.objects.all():
        make_admin = user.is_superuser or user.username.lower() in ("maria", "admin")
        Employee.objects.get_or_create(
            user=user,
            defaults={
                "role": admin_role if make_admin else None,
                "must_change_password": False,
            },
        )


def unseed(apps, schema_editor):
    # remoção só dos cargos padrão; perfis ficam (inofensivos)
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(name__in=[r[0] for r in DEFAULT_ROLES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
