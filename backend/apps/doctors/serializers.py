from rest_framework import serializers

from apps.verticals.services import current_vertical

from .models import Doctor
from .services import vertical_for_council


class DoctorSerializer(serializers.ModelSerializer):

    vertical_slug = serializers.CharField(source="vertical.slug", read_only=True)
    vertical_name = serializers.CharField(source="vertical.name", read_only=True)

    class Meta:
        model = Doctor
        fields = "__all__"
        # A vertical vem do perfil de quem cria (VerticalScopedViewSetMixin),
        # então o cliente não precisa enviá-la.
        extra_kwargs = {"vertical": {"required": False}}

    def validate(self, data):
        """CRO é de dentista, CRM é de médico: o par precisa fazer sentido."""
        council = data.get("council") or getattr(self.instance, "council", "CRM")

        # A precedência tem que ser a mesma da gravação, senão validamos contra
        # uma vertical diferente da que será salva. Para quem tem vertical, ela
        # vence o corpo da requisição (VerticalScopedViewSetMixin); para o
        # administrador geral, quem manda é o conselho (DoctorViewSet).
        request = self.context.get("request")
        user_vertical = current_vertical(request.user) if request else None

        vertical = (
            user_vertical
            or vertical_for_council(council)
            or data.get("vertical")
            or getattr(self.instance, "vertical", None)
        )

        if not vertical:
            return data

        expected = {"odontologia": "CRO", "medicina": "CRM"}.get(vertical.slug)
        if expected and council != expected:
            raise serializers.ValidationError(
                {"council": f"Profissional de {vertical.name} deve ter {expected}."}
            )

        return data
