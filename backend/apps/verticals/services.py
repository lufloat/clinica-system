from fnmatch import fnmatch

from .models import Vertical, VerticalEmailRule


def default_vertical():
    """Vertical usada quando nenhuma regra de e-mail casa."""
    return Vertical.objects.filter(is_default=True, active=True).first()


def current_vertical(user):
    """Vertical do usuário logado, ou None para quem enxerga todas."""
    if not user or not user.is_authenticated:
        return None
    employee = getattr(user, "employee", None)
    return getattr(employee, "vertical", None) if employee else None


def selectable_verticals(user):
    """Verticais que o usuário pode escolher nos relatórios e no dashboard.

    Quem tem vertical não escolhe nada: a lista é só a dele, e serve para o
    frontend saber que não há seletor a oferecer. O administrador geral vê
    todas as ativas e pode consolidar ou separar.
    """
    own = current_vertical(user)
    if own is not None:
        return Vertical.objects.filter(pk=own.pk)
    return Vertical.objects.filter(active=True)


def scope_vertical(user, requested_slug):
    """Vertical a aplicar na consulta, a partir do que o cliente pediu.

    Devolve `(vertical, erro)`. Vertical nula significa "todas" — só o
    administrador geral chega nesse caso.

    Para quem tem vertical o parâmetro é ignorado, nunca recusado: recusar
    faria a tela quebrar ao trocar de usuário com o filtro na URL, e o
    resultado seria o mesmo — os dados dele.
    """
    own = current_vertical(user)
    if own is not None:
        return own, None

    if not requested_slug:
        return None, None

    vertical = Vertical.objects.filter(
        slug=requested_slug, active=True
    ).first()

    if vertical is None:
        return None, "Área não encontrada."

    return vertical, None


def resolve_vertical_for_email(email):
    """Vertical correspondente ao e-mail, ou a padrão.

    Chamada ao criar/editar o colaborador — nunca por requisição. Este é o
    único ponto do sistema em que o e-mail influencia a vertical.
    """
    email = (email or "").strip().lower()
    if not email:
        return default_vertical()

    rules = VerticalEmailRule.objects.select_related("vertical").filter(
        vertical__active=True
    )  # Meta.ordering já traz por prioridade decrescente

    for rule in rules:
        if _matches(email, rule.pattern):
            return rule.vertical

    return default_vertical()


def _matches(email, pattern):
    pattern = (pattern or "").strip().lower()
    if not pattern:
        return False
    if pattern.startswith("@"):
        return email.endswith(pattern)
    return fnmatch(email, pattern)
