from django.db import models

from apps.appointments.models import Appointment


class MedicalCertificate(models.Model):

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE
    )

    days = models.IntegerField(default=1)

    observations = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)


class Prescription(models.Model):

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE
    )

    medications = models.TextField()

    instructions = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)