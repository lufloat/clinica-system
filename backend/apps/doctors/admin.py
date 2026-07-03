from django.contrib import admin

from .models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "crm",
        "specialty",
        "phone",
        "active",
    )

    search_fields = (
        "name",
        "crm",
        "specialty",
    )

    list_filter = (
        "active",
        "specialty",
    )

    ordering = ("name",)