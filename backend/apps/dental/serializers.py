from rest_framework import serializers

from .models import VALID_TEETH, DentalChart, ToothRecord


class ToothRecordSerializer(serializers.ModelSerializer):

    class Meta:
        model = ToothRecord
        fields = [
            "id",
            "chart",
            "tooth",
            "face",
            "condition",
            "procedure",
            "status",
            "appointment",
            "notes",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_tooth(self, value):
        if value not in VALID_TEETH:
            raise serializers.ValidationError(
                "Número de dente inválido (use a notação FDI)."
            )
        return value

    def validate(self, data):
        """O atendimento informado tem que ser do mesmo paciente do odontograma."""
        chart = data.get("chart") or getattr(self.instance, "chart", None)
        appointment = data.get("appointment") or getattr(
            self.instance, "appointment", None
        )

        if chart and appointment and appointment.patient_id != chart.patient_id:
            raise serializers.ValidationError(
                {"appointment": "O atendimento é de outro paciente."}
            )

        return data


class DentalChartSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(source="patient.name", read_only=True)
    tooth_records = ToothRecordSerializer(many=True, read_only=True)

    class Meta:
        model = DentalChart
        fields = [
            "id",
            "patient",
            "patient_name",
            "notes",
            "tooth_records",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
