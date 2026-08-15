import django.db.models.deletion
from django.db import migrations, models


def set_vertical(apps, schema_editor):
    """Todo profissional existente é da vertical padrão (medicina)."""
    Doctor = apps.get_model("doctors", "Doctor")
    Vertical = apps.get_model("verticals", "Vertical")

    default = Vertical.objects.filter(is_default=True).first()
    if default:
        Doctor.objects.filter(vertical__isnull=True).update(vertical=default)


def unset_vertical(apps, schema_editor):
    Doctor = apps.get_model("doctors", "Doctor")
    Doctor.objects.update(vertical=None)


class Migration(migrations.Migration):

    dependencies = [
        ("doctors", "0001_initial"),
        ("verticals", "0003_theme_shades"),
    ]

    operations = [
        # RenameField preserva os dados da coluna — drop+add não.
        migrations.RenameField(
            model_name="doctor",
            old_name="crm",
            new_name="council_code",
        ),
        # A unicidade deixa de ser da coluna e passa a ser do par (ver abaixo).
        migrations.AlterField(
            model_name="doctor",
            name="council_code",
            field=models.CharField(max_length=20, verbose_name="Registro"),
        ),
        migrations.AddField(
            model_name="doctor",
            name="council",
            field=models.CharField(
                choices=[("CRM", "CRM"), ("CRO", "CRO")],
                default="CRM",
                max_length=3,
                verbose_name="Conselho",
            ),
        ),
        # Nulo → backfill → obrigatório: evita quebrar linhas existentes.
        migrations.AddField(
            model_name="doctor",
            name="vertical",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="doctors",
                to="verticals.vertical",
                verbose_name="Vertical",
            ),
        ),
        migrations.RunPython(set_vertical, unset_vertical),
        migrations.AlterField(
            model_name="doctor",
            name="vertical",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="doctors",
                to="verticals.vertical",
                verbose_name="Vertical",
            ),
        ),
        migrations.AddConstraint(
            model_name="doctor",
            constraint=models.UniqueConstraint(
                fields=("council", "council_code"),
                name="unique_council_registration",
            ),
        ),
        migrations.AlterModelOptions(
            name="doctor",
            options={
                "ordering": ["name"],
                "verbose_name": "Profissional",
                "verbose_name_plural": "Profissionais",
            },
        ),
    ]
