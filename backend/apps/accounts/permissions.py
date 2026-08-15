from rest_framework.permissions import BasePermission

from .services import user_is_admin, user_can


class IsAdmin(BasePermission):
    """Somente administradores (cargo is_admin ou superuser)."""

    message = "Apenas administradores podem acessar este recurso."

    def has_permission(self, request, view):
        return user_is_admin(request.user)


# Método HTTP → ação de permissão.
_METHOD_ACTION = {
    "GET": "view",
    "HEAD": "view",
    "OPTIONS": "view",
    "POST": "create",
    "PUT": "edit",
    "PATCH": "edit",
    "DELETE": "delete",
}


class ModulePermission(BasePermission):
    """
    Checa a permissão do módulo declarado na view (`permission_module`)
    conforme o método HTTP. Admin sempre passa.
    """

    message = "Você não tem permissão para esta ação."

    def has_permission(self, request, view):
        module = getattr(view, "permission_module", None)
        if not module:
            # sem módulo declarado, basta estar autenticado
            return bool(request.user and request.user.is_authenticated)

        action = _METHOD_ACTION.get(request.method, "view")
        return user_can(request.user, module, action)
