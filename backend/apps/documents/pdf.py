from io import BytesIO

from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer
)


def generate_certificate(appointment, days):

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        rightMargin=50,
        leftMargin=50,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    title = styles["Heading1"]
    title.alignment = TA_CENTER

    normal = styles["Normal"]
    normal.alignment = TA_JUSTIFY
    normal.leading = 22

    story = []

    story.append(Paragraph("CLÍNICA MÉDICA", title))
    story.append(Paragraph("ATESTADO MÉDICO", title))

    story.append(Spacer(1, 30))

    texto = f"""
    Atesto para os devidos fins que o(a) paciente
    <b>{appointment.patient.name}</b>,
    esteve em atendimento médico nesta clínica
    na data de <b>{appointment.appointment_date}</b>,
    necessitando permanecer afastado(a) de suas
    atividades por <b>{days}</b> dia(s),
    conforme avaliação médica.

    """

    story.append(
        Paragraph(texto, normal)
    )

    story.append(Spacer(1, 80))

    story.append(
        Paragraph(
            f"<b>Médico:</b> {appointment.doctor.name}",
            normal
        )
    )

    story.append(Spacer(1, 50))

    story.append(
        Paragraph(
            "________________________________________",
            normal
        )
    )

    story.append(
        Paragraph(
            "Assinatura e Carimbo",
            normal
        )
    )

    doc.build(story)

    pdf = buffer.getvalue()

    buffer.close()

    return pdf