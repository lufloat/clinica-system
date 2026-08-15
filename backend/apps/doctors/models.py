from django.db import models

from apps.core.models import BaseModel


class Doctor(BaseModel):

    # Conselho profissional: médico tem CRM, dentista tem CRO.
    COUNCIL_CHOICES = [
        ("CRM", "CRM"),
        ("CRO", "CRO"),
    ]

    name = models.CharField(
        max_length=150,
        verbose_name="Nome"
    )

    council = models.CharField(
        max_length=3,
        choices=COUNCIL_CHOICES,
        default="CRM",
        verbose_name="Conselho"
    )

    council_code = models.CharField(
        max_length=20,
        verbose_name="Registro"
    )

    specialty = models.CharField(
        max_length=100,
        verbose_name="Especialidade"
    )

    # Linha de produto: dentista não aparece no seletor da consulta médica.
    vertical = models.ForeignKey(
        "verticals.Vertical",
        on_delete=models.PROTECT,
        related_name="doctors",
        verbose_name="Vertical"
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
        verbose_name = "Profissional"
        verbose_name_plural = "Profissionais"
        ordering = ["name"]
        # Um CRM e um CRO podem ter o mesmo número: a unicidade é do par.
        constraints = [
            models.UniqueConstraint(
                fields=["council", "council_code"],
                name="unique_council_registration",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.council} {self.council_code})"
