from io import BytesIO

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def generate_prescription(
    appointment,
    medication,
    dosage,
    frequency,
    duration,
    observations,
):

    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()

    title = styles["Heading1"]

    title.alignment = TA_CENTER

    body = styles["Normal"]

    story = []

    story.append(
        Paragraph(
            "RECEITA MÉDICA",
            title
        )
    )

    story.append(
        Spacer(1,30)
    )

    story.append(

        Paragraph(

            f"""
            <b>Paciente:</b>
            {appointment.patient.name}
            """,

            body

        )

    )

    story.append(
        Spacer(1,20)
    )

    story.append(
        Paragraph(
            f"<b>Medicamento:</b> {medication}",
            body
        )
    )

    story.append(Spacer(1, 10))

    story.append(
        Paragraph(
            f"<b>Dosagem:</b> {dosage}",
            body
        )
    )

    story.append(Spacer(1, 10))

    story.append(
        Paragraph(
            f"<b>Frequência:</b> {frequency}",
            body
        )
    )

    story.append(Spacer(1, 10))

    story.append(
        Paragraph(
            f"<b>Duração:</b> {duration}",
            body
        )
    )

    story.append(Spacer(1, 10))

    story.append(
        Paragraph(
            f"<b>Observações:</b> {observations}",
            body
        )
    )

    story.append(
        Spacer(1,60)
    )

    story.append(

        Paragraph(

            f"Médico: {appointment.doctor.name}",

            body

        )

    )

    story.append(
        Spacer(1,40)
    )

    story.append(

        Paragraph(

            "___________________________________",

            body

        )

    )

    story.append(

        Paragraph(

            "Assinatura e Carimbo",

            body

        )

    )

    doc.build(story)

    pdf = buffer.getvalue()

    buffer.close()

    return pdf