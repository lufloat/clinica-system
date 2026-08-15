from django.db import models


class Vertical(models.Model):
    """Uma linha de produto do sistema (medicina, odontologia, ...).

    Mesmo código, mesma base de pacientes — muda a agenda, o vocabulário,
    a marca e o conjunto de módulos visíveis.
    """

    # `slug` é a chave que o frontend conhece para escolher telas específicas.
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=80, verbose_name="Nome")

    # Subconjunto de accounts.MODULE_KEYS visível nesta vertical.
    modules = models.JSONField(default=list, blank=True)

    # Sobrescritas de rótulo: {"medicos": "Dentistas"}
    labels = models.JSONField(default=dict, blank=True)

    # Marca: {"primary": "#4F46E5", "logo": "🏥"}
    theme = models.JSONField(default=dict, blank=True)

    # Vertical atribuída quando nenhuma regra de e-mail casa.
    is_default = models.BooleanField(default=False)

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Vertical"
        verbose_name_plural = "Verticais"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Só pode haver uma padrão: marcar esta desmarca as demais.
        if self.is_default:
            Vertical.objects.exclude(pk=self.pk).filter(is_default=True).update(
                is_default=False
            )


class VerticalEmailRule(models.Model):
    """Regra de provisionamento: e-mail do colaborador → vertical.

    Aplicada ao criar/editar o acesso, nunca a cada requisição. O que o
    sistema lê em runtime é `Employee.vertical`, não o e-mail.
    """

    vertical = models.ForeignKey(
        Vertical, on_delete=models.CASCADE, related_name="email_rules"
    )

    # "@odonto.clinica.com.br" casa por domínio; "odonto.*@*" casa por glob.
    pattern = models.CharField(max_length=120, verbose_name="Padrão")

    # Maior prioridade vence quando mais de uma regra casa.
    priority = models.IntegerField(default=0, verbose_name="Prioridade")

    class Meta:
        ordering = ["-priority", "pk"]
        unique_together = ("vertical", "pattern")
        verbose_name = "Regra de e-mail"
        verbose_name_plural = "Regras de e-mail"

    def __str__(self):
        return f"{self.pattern} → {self.vertical.slug}"
