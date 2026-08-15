from django.db import migrations


# A odontologia já renomeava "Médicos" para "Dentistas". Faltava o outro lado:
# a medicina não declarava rótulo nenhum e vivia do texto fixo da interface.
#
# Com o rótulo explícito nas duas verticais, o texto fixo deixa de significar
# "Médicos" e passa a significar "nenhuma vertical" — o caso do administrador
# geral, que enxerga médicos e dentistas na mesma tela e para quem o termo
# correto é "Profissionais".
def seed(apps, schema_editor):
    Vertical = apps.get_model("verticals", "Vertical")

    medicina = Vertical.objects.filter(slug="medicina").first()
    if not medicina:
        return

    labels = dict(medicina.labels or {})
    labels.setdefault("medicos", "Médicos")

    medicina.labels = labels
    medicina.save(update_fields=["labels"])


def unseed(apps, schema_editor):
    Vertical = apps.get_model("verticals", "Vertical")

    medicina = Vertical.objects.filter(slug="medicina").first()
    if not medicina:
        return

    labels = dict(medicina.labels or {})
    labels.pop("medicos", None)

    medicina.labels = labels
    medicina.save(update_fields=["labels"])


class Migration(migrations.Migration):

    dependencies = [
        ("verticals", "0004_activate_odontologia"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
