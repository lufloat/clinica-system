from django.db import models

from apps.doctors.models import Doctor
from apps.patients.models import Patient
from apps.offices.models import Office


class Appointment(models.Model):

    STATUS_CHOICES = [
        ("AGENDADA", "Agendada"),
        ("FINALIZADA", "Finalizada"),
        ("CANCELADA", "Cancelada"),
    ]

    # Separa as agendas. O paciente é compartilhado entre as verticais, então
    # é esta coluna — e não o paciente — que diz de qual produto é o horário.
    vertical = models.ForeignKey(
        "verticals.Vertical",
        on_delete=models.PROTECT,
        related_name="appointments"
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    appointment_date = models.DateField()

    appointment_time = models.TimeField()

    observations = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="AGENDADA"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.name} - {self.appointment_date} {self.appointment_time}"