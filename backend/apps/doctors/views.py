from rest_framework import viewsets

from apps.accounts.permissions import ModulePermission
from apps.core.scoping import VerticalScopedViewSetMixin
from apps.verticals.services import current_vertical

from .models import Doctor
from .serializers import DoctorSerializer
from .services import vertical_for_council


class DoctorViewSet(VerticalScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related("vertical")
    serializer_class = DoctorSerializer
    permission_classes = [ModulePermission]
    permission_module = "medicos"

    def scope_save_kwargs(self, serializer, creating):
        """Para o administrador geral, o conselho é que define a vertical.

        Quem tem vertical grava nela e pronto (regra do mixin). O
        administrador geral não tem: sem esta derivação, o mixin cairia na
        vertical padrão e um CRO nasceria dentro da clínica médica, onde
        apareceria na agenda errada e não poderia ser vinculado a um login de
        odontologia.
        """
        kwargs = super().scope_save_kwargs(serializer, creating)

        if current_vertical(self.request.user) is not None:
            return kwargs

        council = serializer.validated_data.get("council") or getattr(
            serializer.instance, "council", None
        )

        vertical = vertical_for_council(council)
        if vertical is not None:
            kwargs["vertical"] = vertical

        return kwargs
