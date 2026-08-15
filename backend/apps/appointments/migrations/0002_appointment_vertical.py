import django.db.models.deletion
from django.db import migrations, models


def set_vertical(apps, schema_editor):
    """Toda consulta existente é da vertical padrão (medicina)."""
    Appointment = apps.get_model("appointments", "Appointment")
    Vertical = apps.get_model("verticals", "Vertical")

    default = Vertical.objects.filter(is_default=True).first()
    if default:
        Appointment.objects.filter(vertical__isnull=True).update(vertical=default)


def unset_vertical(apps, schema_editor):
    Appointment = apps.get_model("appointments", "Appointment")
    Appointment.objects.update(vertical=None)


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0001_initial"),
        ("verticals", "0003_theme_shades"),
    ]

    operations = [
        migrations.AddField(
            model_name="appointment",
            name="vertical",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="appointments",
                to="verticals.vertical",
            ),
        ),
        migrations.RunPython(set_vertical, unset_vertical),
        migrations.AlterField(
            model_name="appointment",
            name="vertical",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="appointments",
                to="verticals.vertical",
            ),
        ),
    ]
