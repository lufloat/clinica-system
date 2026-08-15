from apps.verticals.models import Vertical


# Conselho profissional → linha de produto. O par é fixo: quem tem CRO atende
# na odontologia, quem tem CRM na clínica médica. O serializer valida a
# coerência; aqui ela é usada para *derivar* a vertical.
COUNCIL_VERTICAL_SLUG = {
    "CRM": "medicina",
    "CRO": "odontologia",
}


def vertical_for_council(council):
    """Vertical correspondente ao conselho, ou None se não houver.

    Serve ao administrador geral, que não tem vertical própria: sem isto o
    cadastro cairia na vertical padrão e um dentista nasceria dentro da
    clínica médica.
    """
    slug = COUNCIL_VERTICAL_SLUG.get(council)
    if not slug:
        return None
    return Vertical.objects.filter(slug=slug, active=True).first()
