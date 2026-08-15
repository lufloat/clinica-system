from django.contrib import admin

from .models import DentalChart, ToothRecord


class ToothRecordInline(admin.TabularInline):
    model = ToothRecord
    extra = 0


@admin.register(DentalChart)
class DentalChartAdmin(admin.ModelAdmin):
    list_display = ("patient", "created_at", "updated_at")
    search_fields = ("patient__name", "patient__cpf")
    list_select_related = ("patient",)
    inlines = [ToothRecordInline]


@admin.register(ToothRecord)
class ToothRecordAdmin(admin.ModelAdmin):
    list_display = ("chart", "tooth", "face", "condition", "status", "appointment")
    list_filter = ("condition", "status", "face")
    search_fields = ("chart__patient__name", "procedure")
    list_select_related = ("chart", "chart__patient", "appointment")
