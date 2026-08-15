from django.contrib import admin

from .models import Role, RolePermission, Employee, AuditLog


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 0


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "is_admin", "is_system")
    inlines = [RolePermissionInline]


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "user", "role", "vertical", "doctor", "vertical_locked",
        "must_change_password", "last_login_ip",
    )
    # Coluna "doctor" preenchida = acesso restrito aos próprios atendimentos:
    # o filtro serve para conferir de relance quem está nessa condição.
    list_filter = ("vertical", "role")
    list_select_related = ("user", "role", "vertical", "doctor")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "action", "ip")
    list_filter = ("action",)
    readonly_fields = ("user", "action", "detail", "ip", "created_at")
