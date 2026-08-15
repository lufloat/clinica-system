from django.db import migrations


# Módulos da odontologia: o odontograma entra, e a medicina não o recebe —
# é a interseção de user_permission_map que esconde um do outro.
ODONTO_MODULES = [
    "dashboard",
    "agenda",
    "pacientes",
    "medicos",
    "odontograma",
    "consultorios",
    "relatorios",
    "financeiro",
    "configuracoes",
]


def activate(apps, schema_editor):
    Vertical = apps.get_model("verticals", "Vertical")
    Vertical.objects.filter(slug="odontologia").update(
        modules=ODONTO_MODULES, active=True
    )


def deactivate(apps, schema_editor):
    Vertical = apps.get_model("verticals", "Vertical")
    Vertical.objects.filter(slug="odontologia").update(active=False)


class Migration(migrations.Migration):

    dependencies = [
        ("verticals", "0003_theme_shades"),
    ]

    operations = [
        migrations.RunPython(activate, deactivate),
    ]
