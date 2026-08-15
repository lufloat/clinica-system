from rest_framework import serializers

from .models import Vertical


class VerticalSerializer(serializers.ModelSerializer):
    """Bloco `vertical` do /me — consumido pelo frontend."""

    class Meta:
        model = Vertical
        fields = ["slug", "name", "modules", "labels", "theme"]
