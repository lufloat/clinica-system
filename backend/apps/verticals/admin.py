from django.contrib import admin

from .models import Vertical, VerticalEmailRule


class VerticalEmailRuleInline(admin.TabularInline):
    model = VerticalEmailRule
    extra = 0


@admin.register(Vertical)
class VerticalAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_default", "active")
    list_filter = ("active", "is_default")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [VerticalEmailRuleInline]
