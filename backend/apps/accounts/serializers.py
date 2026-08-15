from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils.crypto import get_random_string
from rest_framework import serializers

from apps.verticals.serializers import VerticalSerializer
from apps.verticals.services import (
    resolve_vertical_for_email,
    selectable_verticals,
)

from apps.doctors.models import Doctor

from .models import Employee, Role, RolePermission, MODULE_KEYS, ACTION_KEYS
from .services import current_doctor, user_permission_map, user_is_admin


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class MeSerializer(serializers.ModelSerializer):
    """Usuário logado, com cargo e permissões — consumido pelo frontend."""

    role = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    must_change_password = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    vertical = serializers.SerializerMethodField()
    verticals = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "is_admin",
            "must_change_password",
            "permissions",
            "vertical",
            "verticals",
            "doctor",
        ]

    def get_role(self, user):
        employee = getattr(user, "employee", None)
        return employee.role.name if employee and employee.role else None

    def get_is_admin(self, user):
        return user_is_admin(user)

    def get_must_change_password(self, user):
        employee = getattr(user, "employee", None)
        return bool(employee and employee.must_change_password)

    def get_permissions(self, user):
        return user_permission_map(user)

    def get_vertical(self, user):
        """Bloco da vertical. Nulo = enxerga todas (admin)."""
        employee = getattr(user, "employee", None)
        vertical = employee.vertical if employee else None
        return VerticalSerializer(vertical).data if vertical else None

    def get_verticals(self, user):
        """Áreas que o usuário pode escolher nas telas com seletor.

        Uma só significa que não há escolha a fazer — é a vertical dele. O
        administrador geral recebe todas as ativas.
        """
        return [
            {"slug": item.slug, "name": item.name}
            for item in selectable_verticals(user)
        ]

    def get_doctor(self, user):
        """Profissional a que o login está restrito. Nulo = vê todos.

        O frontend usa isto para não oferecer o que o backend vai recusar —
        o seletor de profissional nos relatórios, o botão de novo agendamento.
        É conveniência de interface: o recorte real acontece nas queries.
        """
        doctor = current_doctor(user)
        if doctor is None:
            return None
        return {
            "id": doctor.pk,
            "name": doctor.name,
            "council": doctor.council,
            "specialty": doctor.specialty,
        }


# ---------- Cargos ----------

class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            "id",
            "name",
            "description",
            "is_admin",
            "is_system",
            "permissions",
            "employee_count",
        ]
        read_only_fields = ["is_system"]

    def get_permissions(self, role):
        return role.permission_map()

    def get_employee_count(self, role):
        return role.employees.count()

    def _sync_permissions(self, role, permission_map):
        """Substitui a matriz de permissões do cargo pela recebida."""
        role.permissions.all().delete()

        rows = []
        for module, actions in (permission_map or {}).items():
            if module not in MODULE_KEYS:
                continue
            for action in actions:
                if action in ACTION_KEYS:
                    rows.append(
                        RolePermission(role=role, module=module, action=action)
                    )
        RolePermission.objects.bulk_create(rows)

    def create(self, validated_data):
        permission_map = self.initial_data.get("permissions", {})
        role = Role.objects.create(**validated_data)
        if not role.is_admin:
            self._sync_permissions(role, permission_map)
        return role

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # cargos admin ignoram a matriz (têm tudo)
        if not instance.is_admin and "permissions" in self.initial_data:
            self._sync_permissions(instance, self.initial_data["permissions"])
        return instance


# ---------- Colaboradores ----------

class EmployeeSerializer(serializers.ModelSerializer):
    """Leitura de colaborador (achatando dados do User)."""

    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    username = serializers.CharField(source="user.username")
    is_active = serializers.BooleanField(source="user.is_active")
    role_name = serializers.SerializerMethodField()
    role_id = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(source="user.last_login")

    class Meta:
        model = Employee
        fields = [
            "id",
            "name",
            "username",
            "email",
            "role_id",
            "role_name",
            "doctor_id",
            "doctor_name",
            "is_active",
            "must_change_password",
            "last_login",
            "last_login_ip",
            "created_at",
        ]

    def get_name(self, employee):
        return employee.user.get_full_name() or employee.user.username

    def get_role_name(self, employee):
        return employee.role.name if employee.role else None

    def get_role_id(self, employee):
        return employee.role_id

    def get_doctor_id(self, employee):
        return employee.doctor_id

    def get_doctor_name(self, employee):
        return employee.doctor.name if employee.doctor else None


class EmployeeWriteSerializer(serializers.Serializer):
    """Criação/edição de colaborador pelo administrador."""

    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role_id = serializers.IntegerField(required=False, allow_null=True)
    doctor_id = serializers.IntegerField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)

    def _split_name(self, name):
        parts = name.strip().split()
        first = parts[0] if parts else ""
        last = " ".join(parts[1:]) if len(parts) > 1 else ""
        return first, last

    def _resolve_role(self, role_id):
        if not role_id:
            return None
        try:
            return Role.objects.get(pk=role_id)
        except Role.DoesNotExist:
            raise serializers.ValidationError({"role_id": "Cargo não encontrado."})

    def _resolve_doctor(self, doctor_id):
        """Profissional a vincular ao login, já validado.

        Vincular é o que transforma o colaborador em usuário restrito, então
        as duas recusas abaixo evitam um acesso que "abre mas não mostra nada".
        """
        if not doctor_id:
            return None

        doctor = Doctor.objects.filter(pk=doctor_id).first()
        if doctor is None:
            raise serializers.ValidationError(
                {"doctor_id": "Profissional não encontrado."}
            )

        # Um profissional responde por um login: dois acessos para a mesma
        # pessoa dividiriam o histórico e nenhum dos dois mostraria a agenda
        # inteira dela.
        taken = Employee.objects.filter(doctor=doctor)
        if self.instance:
            taken = taken.exclude(pk=self.instance.pk)
        if taken.exists():
            raise serializers.ValidationError(
                {"doctor_id": (
                    f"{doctor.name} já está vinculado a outro acesso."
                )}
            )

        return doctor

    def _check_vertical_match(self, employee_vertical, doctor):
        """Vínculo cruzando verticais deixaria o profissional sem dados.

        Os dois recortes se somam: um dentista num login da vertical medicina
        veria a interseção entre "agenda da medicina" e "atendimentos dele" —
        sempre vazia. Recusar aqui é melhor do que entregar um sistema mudo.
        """
        if not doctor or not employee_vertical:
            return
        if doctor.vertical_id != employee_vertical.pk:
            raise serializers.ValidationError(
                {"doctor_id": (
                    f"{doctor.name} é de {doctor.vertical.name}, mas este "
                    f"acesso é de {employee_vertical.name}. O e-mail do "
                    f"colaborador define a vertical."
                )}
            )

    def validate_username(self, value):
        value = (value or "").strip()
        qs = User.objects.filter(username__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.user_id)
        if value and qs.exists():
            raise serializers.ValidationError("Este login já está em uso.")
        return value

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.user_id)
        if qs.exists():
            raise serializers.ValidationError("Este e-mail já está em uso.")
        return value

    def create(self, validated_data):
        first, last = self._split_name(validated_data["name"])
        username = (validated_data.get("username") or "").strip() or validated_data["email"]
        password = validated_data.get("password") or get_random_string(12)

        vertical = resolve_vertical_for_email(validated_data["email"])

        # Validado antes de criar o User: o vínculo inválido não pode deixar
        # para trás um login órfão.
        doctor = self._resolve_doctor(validated_data.get("doctor_id"))
        self._check_vertical_match(vertical, doctor)

        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=password,
            first_name=first,
            last_name=last,
            is_active=validated_data.get("is_active", True),
        )

        employee = Employee.objects.create(
            user=user,
            role=self._resolve_role(validated_data.get("role_id")),
            doctor=doctor,
            must_change_password=True,  # troca obrigatória no 1º acesso
            vertical=vertical,
        )
        return employee

    def update(self, instance, validated_data):
        user = instance.user

        # A vertical resultante deste update, calculada antes de gravar
        # qualquer coisa: é contra ela que o vínculo é conferido, e uma recusa
        # aqui não pode deixar o User salvo pela metade.
        new_vertical = instance.vertical
        if "email" in validated_data and not instance.vertical_locked:
            new_vertical = resolve_vertical_for_email(validated_data["email"])

        changing_doctor = "doctor_id" in validated_data
        doctor = instance.doctor

        if changing_doctor:
            doctor = self._resolve_doctor(validated_data.get("doctor_id"))

        self._check_vertical_match(new_vertical, doctor)

        if "name" in validated_data:
            user.first_name, user.last_name = self._split_name(validated_data["name"])
        if "email" in validated_data:
            user.email = validated_data["email"]
            # Reclassifica pelo novo e-mail, a menos que o admin tenha fixado.
            instance.vertical = new_vertical
        if validated_data.get("username"):
            user.username = validated_data["username"].strip()
        if "is_active" in validated_data:
            user.is_active = validated_data["is_active"]
        if validated_data.get("password"):
            user.set_password(validated_data["password"])
            instance.must_change_password = True  # senha resetada pelo admin
        user.save()

        if "role_id" in validated_data:
            instance.role = self._resolve_role(validated_data.get("role_id"))

        if changing_doctor:
            instance.doctor = doctor

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value
