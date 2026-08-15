from apps.verticals.services import resolve_vertical_for_email

from .models import AuditLog, Employee


def client_ip(request):
    """IP do cliente, respeitando proxy reverso (X-Forwarded-For)."""
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_action(request, action, detail="", user=None):
    """Registra uma ação de auditoria. Nunca deve derrubar a requisição."""
    try:
        AuditLog.objects.create(
            user=user if user is not None else _request_user(request),
            action=action,
            detail=detail[:255],
            ip=client_ip(request),
        )
    except Exception:
        # auditoria não pode quebrar o fluxo principal
        pass


def _request_user(request):
    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated:
        return user
    return None


def ensure_employee(user):
    """Garante que o usuário tenha um perfil de colaborador.

    Perfis criados fora do fluxo de colaboradores (createsuperuser, admin do
    Django) passariam por aqui com vertical nula — que significa "todas". Só
    superusuário pode ficar assim; os demais recebem a vertical do e-mail.
    """
    employee, created = Employee.objects.get_or_create(user=user)

    if created and not user.is_superuser and employee.vertical_id is None:
        employee.vertical = resolve_vertical_for_email(user.email)
        employee.save(update_fields=["vertical"])

    return employee


def user_is_admin(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    employee = getattr(user, "employee", None)
    return bool(employee and employee.is_admin)


def current_doctor(user):
    """Profissional a que o usuário está restrito, ou None para quem vê todos.

    Espelha `verticals.services.current_vertical`, um andar abaixo: a vertical
    diz de qual produto são os dados, esta função diz de quem eles são.

    Vínculo preenchido significa restrito — é o que separa um médico de uma
    recepcionista. O administrador é a única exceção: ele pode estar vinculado
    a um profissional (o dono da clínica que também atende) e ainda assim
    precisa enxergar a operação inteira.
    """
    if not user or not user.is_authenticated:
        return None
    if user_is_admin(user):
        return None
    employee = getattr(user, "employee", None)
    return getattr(employee, "doctor", None) if employee else None


def user_permission_map(user):
    """{modulo: [acoes]} do usuário.

    Dois eixos independentes: o cargo diz o que a pessoa pode fazer, a
    vertical diz o que existe no produto dela. O resultado é a interseção.
    """
    from .models import ACTION_KEYS, MODULE_KEYS

    if user_is_admin(user):
        base = {module: list(ACTION_KEYS) for module in MODULE_KEYS}
    else:
        employee = getattr(user, "employee", None)
        base = employee.role.permission_map() if employee and employee.role else {}

    return _scoped_to_vertical(user, base)


def _scoped_to_vertical(user, permission_map):
    """Remove os módulos que não pertencem à vertical do colaborador.

    Vale inclusive para admin: quem tem vertical definida enxerga o produto
    dela. Vertical nula significa "todas" — é o caso do administrador geral.
    """
    employee = getattr(user, "employee", None)
    vertical = getattr(employee, "vertical", None) if employee else None
    if not vertical:
        return permission_map

    allowed = set(vertical.modules or [])
    return {
        module: actions
        for module, actions in permission_map.items()
        if module in allowed
    }


def user_can(user, module, action):
    # Sem atalho para admin: a expansão dele já acontece dentro de
    # user_permission_map, que também aplica o recorte por vertical.
    return action in user_permission_map(user).get(module, [])
