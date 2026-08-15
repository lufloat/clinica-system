from django.db import models

from apps.core.models import BaseModel


# Notação FDI (ISO 3950): o dígito da dezena é o quadrante.
# Permanentes 11–48; decíduos 51–85.
PERMANENT_TEETH = (
    [11, 12, 13, 14, 15, 16, 17, 18]
    + [21, 22, 23, 24, 25, 26, 27, 28]
    + [31, 32, 33, 34, 35, 36, 37, 38]
    + [41, 42, 43, 44, 45, 46, 47, 48]
)

DECIDUOUS_TEETH = (
    [51, 52, 53, 54, 55]
    + [61, 62, 63, 64, 65]
    + [71, 72, 73, 74, 75]
    + [81, 82, 83, 84, 85]
)

VALID_TEETH = PERMANENT_TEETH + DECIDUOUS_TEETH


class DentalChart(BaseModel):
    """Odontograma do paciente: o estado atual da boca.

    É 1‑para‑1 com o paciente, não com o atendimento. O odontograma não é
    anexo de uma consulta — é uma fotografia que vai sendo atualizada. Cada
    procedimento (ToothRecord) guarda em qual atendimento foi feito.
    """

    patient = models.OneToOneField(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="dental_chart",
        verbose_name="Paciente",
    )

    notes = models.TextField(blank=True, verbose_name="Observações gerais")

    class Meta:
        verbose_name = "Odontograma"
        verbose_name_plural = "Odontogramas"

    def __str__(self):
        return f"Odontograma de {self.patient.name}"


class ToothRecord(BaseModel):
    """Um lançamento em um dente: condição encontrada e/ou procedimento."""

    CONDITION_CHOICES = [
        ("SAUDAVEL", "Saudável"),
        ("CARIE", "Cárie"),
        ("RESTAURADO", "Restaurado"),
        ("FRATURADO", "Fraturado"),
        ("AUSENTE", "Ausente"),
        ("IMPLANTE", "Implante"),
        ("PROTESE", "Prótese"),
    ]

    # Faces do dente. VESTIBULAR/LINGUAL/MESIAL/DISTAL/OCLUSAL, ou o dente todo.
    FACE_CHOICES = [
        ("TODO", "Dente inteiro"),
        ("VESTIBULAR", "Vestibular"),
        ("LINGUAL", "Lingual"),
        ("MESIAL", "Mesial"),
        ("DISTAL", "Distal"),
        ("OCLUSAL", "Oclusal"),
    ]

    STATUS_CHOICES = [
        ("PLANEJADO", "Planejado"),
        ("EXECUTADO", "Executado"),
        ("CANCELADO", "Cancelado"),
    ]

    chart = models.ForeignKey(
        DentalChart,
        on_delete=models.CASCADE,
        related_name="tooth_records",
    )

    # Número FDI. Validado no serializer contra VALID_TEETH.
    tooth = models.PositiveSmallIntegerField(verbose_name="Dente")

    face = models.CharField(
        max_length=12, choices=FACE_CHOICES, default="TODO", verbose_name="Face"
    )

    condition = models.CharField(
        max_length=12,
        choices=CONDITION_CHOICES,
        default="SAUDAVEL",
        verbose_name="Condição",
    )

    procedure = models.CharField(
        max_length=120, blank=True, verbose_name="Procedimento"
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PLANEJADO",
        verbose_name="Situação",
    )

    # Em qual atendimento isto foi lançado. Nulo = registro de anamnese,
    # feito fora de uma consulta específica.
    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tooth_records",
        verbose_name="Atendimento",
    )

    notes = models.CharField(max_length=255, blank=True, verbose_name="Observação")

    class Meta:
        verbose_name = "Lançamento em dente"
        verbose_name_plural = "Lançamentos em dentes"
        ordering = ["tooth", "face", "-created_at"]
        indexes = [models.Index(fields=["chart", "tooth"])]

    def __str__(self):
        return f"Dente {self.tooth} ({self.face}): {self.condition}"
