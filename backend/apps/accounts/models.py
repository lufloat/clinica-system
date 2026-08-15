from django.conf import settings
from django.db import models


# Módulos do sistema que podem ter permissões. O valor é a chave usada
# tanto no backend quanto no frontend para controlar menu e rotas.
MODULES = [
    ("dashboard", "Dashboard"),
    ("agenda", "Agenda"),
    ("pacientes", "Pacientes"),
    ("medicos", "Médicos"),
    ("consultorios", "Consultórios"),
    ("relatorios", "Relatórios"),
    ("financeiro", "Financeiro"),
    ("configuracoes", "Configurações"),
    ("colaboradores", "Colaboradores"),
    ("cargos", "Cargos"),
]

MODULE_KEYS = [key for key, _ in MODULES]

ACTIONS = [
    ("view", "Visualizar"),
    ("create", "Criar"),
    ("edit", "Editar"),
    ("delete", "Excluir"),
]

ACTION_KEYS = [key for key, _ in ACTIONS]


class Role(models.Model):
    """Cargo. Reúne um conjunto de permissões (via RolePermission)."""

    name = models.CharField(max_length=80, unique=True)
    description = models.CharField(max_length=200, blank=True)

    # is_admin ignora a matriz de permissões: tem acesso total.
    is_admin = models.BooleanField(default=False)

    # is_system protege cargos internos (Administrador) de exclusão.
    is_system = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def permission_map(self):
        """{modulo: [acoes]} — formato consumido pelo frontend."""
        if self.is_admin:
            return {module: list(ACTION_KEYS) for module in MODULE_KEYS}

        result = {}
        for perm in self.permissions.all():
            result.setdefault(perm.module, []).append(perm.action)
        return result


class RolePermission(models.Model):
    """Uma permissão concedida: (cargo, módulo, ação). Presença = concedida."""

    role = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name="permissions"
    )
    module = models.CharField(max_length=30, choices=MODULES)
    action = models.CharField(max_length=10, choices=ACTIONS)

    class Meta:
        unique_together = ("role", "module", "action")

    def __str__(self):
        return f"{self.role.name}: {self.module}.{self.action}"


class Employee(models.Model):
    """Perfil do colaborador, ligado 1‑para‑1 ao User do Django."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employee",
    )
    role = models.ForeignKey(
        Role, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="employees",
    )

    # Linha de produto do colaborador. Nulo = enxerga todas (admin).
    # Atribuída pela regra de e-mail ao criar o acesso; é esta coluna — e não
    # o e-mail — que o sistema lê em runtime.
    vertical = models.ForeignKey(
        "verticals.Vertical",
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="employees",
    )

    # Admin fixou a vertical manualmente: o resync por e-mail não sobrescreve.
    vertical_locked = models.BooleanField(default=False)

    # Profissional que este login representa. Preenchido = o colaborador é um
    # médico ou dentista e só enxerga os próprios atendimentos; nulo = cargo
    # administrativo, que vê os dados de todos (dentro da vertical dele).
    # É esta coluna que o escopo lê em runtime — ver core.scoping.
    doctor = models.OneToOneField(
        "doctors.Doctor",
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="employee",
        verbose_name="Profissional vinculado",
    )

    # Forçado a trocar a senha no primeiro acesso (criado pelo admin).
    must_change_password = models.BooleanField(default=True)

    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_username()

    @property
    def is_admin(self):
        return bool(self.role and self.role.is_admin) or self.user.is_superuser


class AuditLog(models.Model):
    """Registro de ações importantes: login, criação de acessos, etc."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=60)
    detail = models.CharField(max_length=255, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        who = self.user.get_username() if self.user else "—"
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {who}: {self.action}"
