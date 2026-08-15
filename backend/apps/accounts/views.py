from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from .models import Employee, Role, MODULES, ACTIONS
from .serializers import (
    LoginSerializer,
    MeSerializer,
    RoleSerializer,
    EmployeeSerializer,
    EmployeeWriteSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsAdmin
from .services import client_ip, log_action, ensure_employee


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):

    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    identifier = serializer.validated_data["username"].strip()
    password = serializer.validated_data["password"]

    # Aceita nome de usuário OU e-mail. authenticate() já bloqueia inativos
    # (ModelBackend rejeita is_active=False), atendendo ao requisito.
    user = authenticate(username=identifier, password=password)

    if user is None:
        match = User.objects.filter(email__iexact=identifier).first()
        if match:
            user = authenticate(username=match.username, password=password)

    if not user:
        log_action(request, "login_failed", detail=identifier[:120])
        return Response(
            {"detail": "Usuário ou senha inválidos."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # registra último login e IP
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])

    employee = ensure_employee(user)
    employee.last_login_ip = client_ip(request)
    employee.save(update_fields=["last_login_ip"])

    log_action(request, "login", user=user)

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "must_change_password": employee.must_change_password,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(MeSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    if not user.check_password(serializer.validated_data["current_password"]):
        return Response(
            {"current_password": ["Senha atual incorreta."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(serializer.validated_data["new_password"])
    user.save()

    employee = ensure_employee(user)
    employee.must_change_password = False
    employee.save(update_fields=["must_change_password"])

    log_action(request, "change_password", user=user)

    return Response({"detail": "Senha alterada com sucesso."})


@api_view(["GET"])
@permission_classes([IsAdmin])
def permission_catalog(request):
    """Catálogo de módulos e ações para montar a tela de permissões."""
    return Response(
        {
            "modules": [{"key": k, "label": v} for k, v in MODULES],
            "actions": [{"key": k, "label": v} for k, v in ACTIONS],
        }
    )


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        role = serializer.save()
        log_action(self.request, "create_role", detail=role.name)

    def perform_update(self, serializer):
        role = serializer.save()
        log_action(self.request, "update_role", detail=role.name)

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if role.is_system:
            return Response(
                {"detail": "Cargos do sistema não podem ser excluídos."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        log_action(request, "delete_role", detail=role.name)
        return super().destroy(request, *args, **kwargs)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("user", "role").all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return EmployeeWriteSerializer
        return EmployeeSerializer

    def create(self, request, *args, **kwargs):
        write = EmployeeWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        employee = write.save()
        log_action(request, "create_employee", detail=employee.user.username)
        return Response(
            EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        employee = self.get_object()
        write = EmployeeWriteSerializer(
            employee, data=request.data, partial=kwargs.get("partial", False)
        )
        write.is_valid(raise_exception=True)
        employee = write.save()
        log_action(request, "update_employee", detail=employee.user.username)
        return Response(EmployeeSerializer(employee).data)

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()

        # não deixa o admin remover a própria conta nem o último admin ativo
        if employee.user_id == request.user.id:
            return Response(
                {"detail": "Você não pode excluir a própria conta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        log_action(request, "delete_employee", detail=employee.user.username)
        employee.user.delete()  # remove o User; Employee cai em cascata
        return Response(status=status.HTTP_204_NO_CONTENT)
