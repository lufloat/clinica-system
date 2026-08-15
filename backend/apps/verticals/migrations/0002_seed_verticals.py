from django.db import migrations


# Cópia literal de accounts.MODULE_KEYS no momento desta migração.
# Migrações não importam código vivo: a lista precisa ser estável no tempo.
ALL_MODULES = [
    "dashboard",
    "agenda",
    "pacientes",
    "medicos",
    "consultorios",
    "relatorios",
    "financeiro",
    "configuracoes",
    "colaboradores",
    "cargos",
]

SEED = [
    {
        "slug": "medicina",
        "name": "Clínica Médica",
        # Todos os módulos: a vertical padrão precisa ser um no-op quando a
        # interseção de permissões entrar (fase 2).
        "modules": ALL_MODULES,
        "labels": {},
        # Espelha o visual atual (--indigo-600 e o logo da Sidebar).
        "theme": {"primary": "#4F46E5", "logo": "🏥"},
        "is_default": True,
        "active": True,
    },
    {
        "slug": "odontologia",
        "name": "Odontologia",
        "modules": ALL_MODULES,
        "labels": {"medicos": "Dentistas"},
        "theme": {"primary": "#0E7C86", "logo": "🦷"},
        "is_default": False,
        # Inativa até a fase 3 (modelos clínicos e telas de odonto).
        "active": False,
    },
]


def seed(apps, schema_editor):
    Vertical = apps.get_model("verticals", "Vertical")
    for row in SEED:
        Vertical.objects.update_or_create(slug=row["slug"], defaults=row)


def unseed(apps, schema_editor):
    Vertical = apps.get_model("verticals", "Vertical")
    Vertical.objects.filter(slug__in=[r["slug"] for r in SEED]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("verticals", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
