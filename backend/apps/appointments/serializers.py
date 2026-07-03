from rest_framework import serializers

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

    def validate(self, data):

        doctor = data["doctor"]
        date = data["appointment_date"]
        time = data["appointment_time"]

        queryset = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=date,
            appointment_time=time
        )

        # Ignora a própria consulta quando estiver editando
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Este médico já possui consulta nesse horário."
            )

        return data

    class Meta:

        model = Appointment

        fields = "__all__"