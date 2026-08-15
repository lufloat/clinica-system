from django.db import migrations


# O tema vira CSS custom property no frontend: primary → --primary,
# primaryDark → --primary-dark, sidebar → --sidebar.
THEMES = {
    # Espelha variables.css: indigo-600, indigo-700 e o azul da sidebar.
    "medicina": {
        "primary": "#4F46E5",
        "primaryDark": "#4338CA",
        "sidebar": "#0E1430",
        "logo": "🏥",
    },
    "odontologia": {
        "primary": "#0E7C86",
        "primaryDark": "#0A5F66",
        "sidebar": "#07262B",
        "logo": "🦷",
    },
}


LABELS = {
    "medicina": {},
    "odontologia": {
        "medicos": "Dentistas",
        "agenda": "Atendimentos",
        "search_placeholder": "Buscar paciente, dentista ou atendimento…",
    },
}


def set_themes(apps, schema_editor):
    Vertical = apps.get_model("verticals", "Vertical")
    for slug, theme in THEMES.items():
        Vertical.objects.filter(slug=slug).update(
            theme=theme, labels=LABELS[slug]
        )


def unset_shades(apps, schema_editor):
    Vertical = apps.get_model("verticals", "Vertical")
    for vertical in Vertical.objects.filter(slug__in=THEMES):
        theme = dict(vertical.theme or {})
        theme.pop("primaryDark", None)
        theme.pop("sidebar", None)
        vertical.theme = theme
        vertical.save(update_fields=["theme"])


class Migration(migrations.Migration):

    dependencies = [
        ("verticals", "0002_seed_verticals"),
    ]

    operations = [
        migrations.RunPython(set_themes, unset_shades),
    ]
