from rest_framework.exceptions import PermissionDenied

from apps.accounts.services import current_doctor
from apps.verticals.services import current_vertical, default_vertical


def scoped_appointments(user, queryset):
    """Aplica os dois eixos de escopo a um queryset de atendimentos.

    Mesma regra dos mixins, para quem não é ViewSet: a vertical recorta o
    produto, o vínculo recorta o profissional. Serve a qualquer view que
    alcance um atendimento por id — sem isto, trocar o número na URL entrega
    o atendimento alheio.
    """
    vertical = current_vertical(user)
    if vertical is not None:
        queryset = queryset.filter(vertical=vertical)

    doctor = current_doctor(user)
    if doctor is not None:
        queryset = queryset.filter(doctor=doctor)

    return queryset


class ScopedViewSetMixin:
    """Base dos eixos de escopo.

    Cada eixo declara duas coisas: o recorte da leitura (`scope_filters`) e os
    campos que força na gravação (`scope_save_kwargs`). Os dois métodos são
    cooperativos — chamam `super()` e mesclam — para que uma viewset possa
    empilhar mais de um eixo sem que um anule o outro. Herdar direto desta
    classe, sem eixo nenhum, não muda comportamento algum.
    """

    def scope_filters(self):
        return {}

    def scope_save_kwargs(self, serializer, creating):
        return {}

    def get_queryset(self):
        queryset = super().get_queryset()
        filters = self.scope_filters()
        return queryset.filter(**filters) if filters else queryset

    def perform_create(self, serializer):
        serializer.save(**self.scope_save_kwargs(serializer, creating=True))

    def perform_update(self, serializer):
        serializer.save(**self.scope_save_kwargs(serializer, creating=False))


class VerticalScopedViewSetMixin(ScopedViewSetMixin):
    """Recorta a viewset pela vertical do colaborador.

    Um único lugar para o isolamento: quem tem vertical só lê e escreve dados
    dela; vertical nula (administrador geral) enxerga todas. O model precisa
    ter um campo `vertical` — o nome é configurável por `vertical_field`.
    """

    vertical_field = "vertical"

    def scope_filters(self):
        filters = super().scope_filters()

        vertical = current_vertical(self.request.user)
        if vertical is not None:
            filters[self.vertical_field] = vertical

        return filters

    def scope_save_kwargs(self, serializer, creating):
        """Grava forçando a vertical do colaborador, se ele tiver uma.

        O valor que vier no corpo da requisição é ignorado: sem isto, um
        colaborador poderia mover o registro para a vertical alheia.
        """
        kwargs = super().scope_save_kwargs(serializer, creating)

        vertical = current_vertical(self.request.user)

        # Administrador geral pode informar a vertical; se omitir, cai na
        # padrão. Na edição não há padrão a aplicar: o registro já tem uma.
        if (
            vertical is None
            and creating
            and not serializer.validated_data.get(self.vertical_field)
        ):
            vertical = default_vertical()

        if vertical is not None:
            kwargs[self.vertical_field] = vertical

        return kwargs


class DoctorScopedViewSetMixin(ScopedViewSetMixin):
    """Recorta a viewset pelo profissional vinculado ao colaborador.

    Segundo eixo de isolamento, aplicado junto com a vertical: a vertical diz
    de qual produto são os dados, este eixo diz de quem eles são. Um médico
    não vê a agenda do colega da mesma clínica. Quem não tem profissional
    vinculado (recepção, secretaria, financeiro, administrador) passa sem
    filtro.

    O recorte é sempre do lado do servidor: um `?doctor=` na query string ou
    um `doctor` no corpo da requisição não têm efeito, porque o valor usado é
    o do usuário autenticado. Trocar o ID na URL não revela dado alheio.
    """

    doctor_field = "doctor"

    def scope_filters(self):
        filters = super().scope_filters()

        doctor = current_doctor(self.request.user)
        if doctor is not None:
            filters[self.doctor_field] = doctor

        return filters

    def scope_save_kwargs(self, serializer, creating):
        """Na edição, prende o registro ao profissional do usuário.

        `scope_filters` já impede chegar a um registro alheio, mas nada
        impediria reatribuir o próprio atendimento a outro profissional e
        perdê-lo de vista.
        """
        kwargs = super().scope_save_kwargs(serializer, creating)

        doctor = current_doctor(self.request.user)
        if doctor is not None:
            kwargs[self.doctor_field] = doctor

        return kwargs

    def perform_create(self, serializer):
        # Agendar é trabalho da recepção. Sem isto, o profissional restrito
        # criaria o registro já preso a ele — o que contraria o fluxo da
        # clínica, em que a agenda é montada por quem atende o telefone.
        if current_doctor(self.request.user) is not None:
            raise PermissionDenied(
                "Profissionais não criam agendamentos. Solicite à recepção."
            )
        super().perform_create(serializer)
