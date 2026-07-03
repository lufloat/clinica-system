from django.db import models

from apps.core.models import BaseModel


class Doctor(BaseModel):

    name = models.CharField(
        max_length=150,
        verbose_name="Nome"
    )

    crm = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="CRM"
    )

    specialty = models.CharField(
        max_length=100,
        verbose_name="Especialidade"
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    email = models.EmailField(
        blank=True
    )

    active = models.BooleanField(
        default=True
    )

    class Meta:
        verbose_name = "Médico"
        verbose_name_plural = "Médicos"
        ordering = ["name"]

    def __str__(self):
        return self.name