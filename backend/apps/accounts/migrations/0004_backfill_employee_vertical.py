from django.db import migrations


def backfill(apps, schema_editor):
    """Classifica os colaboradores existentes na vertical padrão.

    Superusuários ficam com vertical nula — o que significa "todas".
    """
    Employee = apps.get_model("accounts", "Employee")
    Vertical = apps.get_model("verticals", "Vertical")

    default = Vertical.objects.filter(is_default=True, active=True).first()
    if not default:
        return

    Employee.objects.filter(
        vertical__isnull=True, user__is_superuser=False
    ).update(vertical=default)


def clear(apps, schema_editor):
    Employee = apps.get_model("accounts", "Employee")
    Employee.objects.update(vertical=None)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_employee_vertical_employee_vertical_locked"),
        ("verticals", "0002_seed_verticals"),
    ]

    operations = [
        migrations.RunPython(backfill, clear),
    ]
