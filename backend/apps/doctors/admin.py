from django.contrib import admin

from .models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "council",
        "council_code",
        "specialty",
        "vertical",
        "phone",
        "active",
    )

    search_fields = (
        "name",
        "council_code",
        "specialty",
    )

    list_filter = (
        "vertical",
        "council",
        "active",
        "specialty",
    )

    list_select_related = ("vertical",)

    ordering = ("name",)
