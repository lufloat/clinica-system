from rest_framework import serializers

from apps.verticals.services import current_vertical, default_vertical

from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(
        source="patient.name",
        read_only=True
    )

    doctor_name = serializers.CharField(
        source="doctor.name",
        read_only=True
    )

    office_name = serializers.CharField(
        source="office.name",
        read_only=True
    )

    vertical_slug = serializers.CharField(
        source="vertical.slug",
        read_only=True
    )

    class Meta:

        model = Appointment

        fields = "__all__"

        # A vertical vem do perfil de quem agenda (VerticalScopedViewSetMixin).
        extra_kwargs = {"vertical": {"required": False}}

    def _field(self, data, name):
        """Valor do campo considerando edição parcial (PATCH)."""
        if name in data:
            return data[name]
        return getattr(self.instance, name, None)

    def _effective_vertical(self, data):
        """Mesma precedência da gravação (ver AppointmentViewSet).

        A vertical do colaborador vence o corpo da requisição — validar contra
        outra que não a gravada deixaria passar combinação inválida.

        Quem não tem vertical (administrador geral) atende as duas clínicas:
        para ele quem manda é o profissional escolhido, senão a agenda dele
        cairia sempre na vertical padrão e marcar com um dentista viraria
        "este profissional não é de Clínica Médica".
        """
        request = self.context.get("request")

        own = current_vertical(request.user) if request else None
        if own is not None:
            return own

        doctor = self._field(data, "doctor")

        return (
            getattr(doctor, "vertical", None)
            or data.get("vertical")
            or getattr(self.instance, "vertical", None)
            or default_vertical()
        )

    def validate(self, data):

        doctor = self._field(data, "doctor")
        office = self._field(data, "office")
        date = self._field(data, "appointment_date")
        time = self._field(data, "appointment_time")

        vertical = self._effective_vertical(data)

        # O profissional tem que ser da mesma vertical do atendimento: um
        # dentista não pode ser escalado numa consulta médica.
        if doctor and vertical and doctor.vertical_id != vertical.pk:
            raise serializers.ValidationError(
                {"doctor": f"Este profissional não é de {vertical.name}."}
            )

        if not (date and time):
            return data

        # Consulta cancelada não ocupa horário nem sala.
        taken = Appointment.objects.exclude(status="CANCELADA")
        if self.instance:
            taken = taken.exclude(pk=self.instance.pk)

        if doctor and taken.filter(
            doctor=doctor, appointment_date=date, appointment_time=time
        ).exists():
            raise serializers.ValidationError(
                "Este profissional já possui atendimento nesse horário."
            )

        # Sala é recurso físico compartilhado entre as verticais: o conflito é
        # checado sem filtrar por vertical, senão a agenda médica e a
        # odontológica marcariam duas pessoas na mesma sala no mesmo horário.
        if office and taken.filter(
            office=office, appointment_date=date, appointment_time=time
        ).exists():
            raise serializers.ValidationError(
                {"office": "Este consultório já está ocupado nesse horário."}
            )

        return data
