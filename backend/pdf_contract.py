"""Generates the signable service contract PDF directly from quote + customer data (never from
the reference .docx, which is only a source-of-truth for legal text, kept in sync manually).
Reuses pdf_quote.py's header/logo/company-block styling so both documents look consistent.

The client's signature block carries two deliberately small, low-contrast (but real, extractable)
anchor strings - "/firma_cliente/" and "/fecha_firma/" - that DocuSign's anchor-tab placement
matches against literal text in the PDF. They must stay real text, not be rendered as an image,
or DocuSign's anchor matching silently fails to place the tab.
"""
from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from pdf_quote import (
    COMPANY_ADDRESS,
    COMPANY_EMAIL,
    COMPANY_NAME,
    COMPANY_PHONE,
    COMPANY_WEB,
    LOGO_ASPECT_RATIO,
    LOGO_PATH,
    MUTED,
    NAVY,
)

PACKAGE_NAMES = {
    "product_design": "Product Design",
    "product_validation": "Product Validation",
    "product_development": "Product Development",
}

SIGNATURE_ANCHOR = "/firma_cliente/"
DATE_SIGNED_ANCHOR = "/fecha_firma/"

_MONTHS_ES = [
    "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def _fmt_date_es(value) -> str:
    if not isinstance(value, datetime):
        return ""
    return f"{value.day} de {_MONTHS_ES[value.month]} de {value.year}"


def _fmt_money(amount: float, currency: str = "EUR") -> str:
    symbol = "€" if currency.upper() == "EUR" else currency.upper() + " "
    return f"{symbol}{amount:,.2f}"


def build_contract_pdf(
    quote: dict,
    customer: dict,
    contract_number: str,
    *,
    provider_nif: str = "",
    liability_text: str = "a determinar",
    jurisdiction_city: str = "Madrid",
) -> bytes:
    currency = quote.get("currency", "EUR")
    generated_at = quote.get("contract_generated_at") or datetime.now()
    package_keys = {item["product_key"] for item in quote.get("items", []) if item.get("type") == "package"}

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, topMargin=20 * mm, bottomMargin=18 * mm, leftMargin=20 * mm, rightMargin=20 * mm
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("ContractTitle", parent=styles["Heading1"], fontSize=20, spaceAfter=2, textColor=NAVY)
    h2 = ParagraphStyle("ContractH2", parent=styles["Heading2"], fontSize=12, spaceBefore=10, spaceAfter=4, textColor=NAVY)
    small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=9, textColor=MUTED, leading=13)
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9.5, leading=14, spaceAfter=6)
    bullet = ParagraphStyle("Bullet", parent=body, leftIndent=10, bulletIndent=0)
    tiny_anchor = ParagraphStyle("TinyAnchor", parent=styles["Normal"], fontSize=6, textColor=colors.HexColor("#cccccc"))

    elements = []

    if LOGO_PATH.exists():
        logo_width = 38 * mm
        elements.append(Image(str(LOGO_PATH), width=logo_width, height=logo_width / LOGO_ASPECT_RATIO))
        elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph(f"<b>{COMPANY_NAME}</b>", body))
    elements.append(Paragraph(COMPANY_ADDRESS, small))
    elements.append(Paragraph(COMPANY_EMAIL, small))
    elements.append(Spacer(1, 6 * mm))

    elements.append(Paragraph("Contrato de prestación de servicios", title_style))
    elements.append(Paragraph(f"Nº de contrato: {contract_number}", small))
    elements.append(Spacer(1, 6 * mm))

    package_line = "  ".join(
        f"[{'X' if key in package_keys else ' '}] {name}" for key, name in PACKAGE_NAMES.items()
    )

    reunidos = (
        "<b>REUNIDOS</b><br/><br/>"
        f"De una parte, D. Marcos Arroyo Navarro, mayor de edad, con NIF {provider_nif or '[NIF]'}, "
        "actuando en nombre propio como profesional autónomo bajo la actividad económica "
        f"<b>{COMPANY_NAME}</b> (en adelante, “EL PRESTADOR”), con domicilio profesional en "
        f"{COMPANY_ADDRESS}, y dirección de contacto {COMPANY_EMAIL}.<br/><br/>"
        f"De otra parte, {customer.get('company_name') or '[Nombre del cliente / razón social]'}, "
        f"con {customer.get('vat_id') or '[NIF/CIF]'}, con domicilio en "
        f"{customer.get('billing_address') or '[Dirección del cliente]'}, representada a estos "
        f"efectos por {customer.get('contact_person') or '[Nombre del representante]'} "
        "(en adelante, “EL CLIENTE”).<br/><br/>"
        "Ambas partes se reconocen mutuamente capacidad legal suficiente para suscribir el presente "
        "contrato de prestación de servicios de ingeniería (en adelante, el “Contrato”), "
        "y a tal efecto"
    )
    elements.append(Paragraph(reunidos, body))
    elements.append(Spacer(1, 2 * mm))

    exponen_items = [
        "Que EL PRESTADOR se dedica profesionalmente a la prestación de servicios de ingeniería "
        "mecánica, incluyendo diseño conceptual, validación estructural mediante análisis por "
        "elementos finitos (FEM) y optimización de producto.",
        "Que EL CLIENTE está interesado en contratar dichos servicios conforme al presupuesto "
        "aceptado que se referencia en la Cláusula 1.",
        "Que ambas partes acuerdan formalizar dicha relación con arreglo a las siguientes",
    ]
    elements.append(Paragraph("<b>EXPONEN</b>", body))
    for item in exponen_items:
        elements.append(Paragraph(f"• {item}", bullet))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph("<b>CLÁUSULAS</b>", body))

    def clause(number: int, title: str) -> None:
        elements.append(Paragraph(f"{number}. {title}", h2))

    def p(text: str) -> None:
        elements.append(Paragraph(text, body))

    def bullets(items: list[str]) -> None:
        for item in items:
            elements.append(Paragraph(f"• {item}", bullet))

    total_str = _fmt_money(quote.get("total", 0), currency)

    clause(1, "Objeto del contrato")
    p(
        "El presente Contrato tiene por objeto regular la prestación por parte de EL PRESTADOR a "
        f"favor de EL CLIENTE de los servicios de ingeniería especificados en el presupuesto nº "
        f"{quote.get('quote_number', '')}, de fecha {_fmt_date_es(quote.get('issue_date'))} (en "
        "adelante, el “Presupuesto”), aceptado por EL CLIENTE mediante la firma electrónica "
        "del presente Contrato mostrada al final de este documento. El Presupuesto se incorpora como "
        "Anexo I y forma parte inseparable del presente Contrato."
    )
    p(f"El servicio contratado corresponde a la modalidad: {package_line}, cuyo alcance detallado se especifica en la Cláusula 2.")

    clause(2, "Alcance del servicio")
    p(
        "El alcance de cada modalidad de servicio (Product Design, Product Validation, Product "
        "Development), incluyendo lo que incluye y lo que queda expresamente excluido, es el publicado en "
        "el catálogo de servicios de ingeniería de Arroyo Systems vigente en la fecha del "
        "Presupuesto. El precio final dentro del rango indicado para cada servicio se fija en el "
        "Presupuesto (Anexo I) en función de la complejidad específica del proyecto, y podrá "
        "incluir horas adicionales tarifadas conforme a la Cláusula 4."
    )

    clause(3, "Entregables y formato de entrega")
    bullets([
        "Los entregables se proporcionarán en formato digital: modelos CAD (STEP y/o formato "
        "nativo Fusion 360), planos técnicos en PDF y DWG, e informes en PDF, salvo acuerdo "
        "distinto por escrito entre las partes.",
        "La entrega se realizará por correo electrónico o mediante enlace a repositorio en la "
        "nube compartido con EL CLIENTE.",
        "Se considerará entregado el trabajo en la fecha de envío de la comunicación de "
        "entrega, independientemente de cuándo EL CLIENTE la revise.",
        "EL CLIENTE dispondrá de un plazo de 5 días hábiles desde la entrega para comunicar "
        "por escrito cualquier disconformidad dentro del alcance contratado. Transcurrido dicho plazo "
        "sin objeción, el entregable se considerará aceptado.",
    ])

    clause(4, "Precio y forma de pago")
    p(
        f"El precio total del servicio contratado es de {total_str} (IVA {'incluido' if quote.get('vat_rate') else 'no incluido'}), "
        "conforme al Presupuesto aceptado (Anexo I), y se abonará según el siguiente calendario:"
    )
    bullets([
        "50% del importe del servicio contratado, en concepto de anticipo, a la firma del presente "
        "Contrato y antes del inicio de los trabajos. Este anticipo se calcula exclusivamente sobre "
        "el precio del servicio contratado (Cláusula 2) y no se ve alterado por las horas de "
        "ingeniería adicionales que, en su caso, se añadan conforme al párrafo siguiente.",
        "50% restante del importe del servicio contratado, junto con el importe correspondiente a las "
        "horas de ingeniería adicionales (Engineering Hours) que, en su caso, se hayan generado "
        "conforme al párrafo siguiente, a la entrega de los deliverables finales, en un plazo "
        "máximo de 7 días naturales desde la recepción de la factura correspondiente.",
    ])
    p(
        "El impago del anticipo facultará a EL PRESTADOR a no iniciar los trabajos. El impago del "
        "saldo final facultará a EL PRESTADOR a retener la entrega de los archivos editables y la "
        "cesión de derechos prevista en la Cláusula 7, sin perjuicio de otras acciones legales "
        "que le correspondan."
    )
    p(
        "Las horas de trabajo adicionales derivadas de retrasos o de pequeñas modificaciones del "
        "proyecto no previstas inicialmente, dentro del margen indicado en el Presupuesto, se "
        "facturarán a razón de 50 €/hora (Engineering Hours) y se incorporarán íntegramente "
        "al segundo pago (saldo final) indicado en el párrafo anterior, sin alterar el importe del "
        "anticipo ya abonado. EL PRESTADOR comunicará dichas horas a EL CLIENTE antes de emitir la "
        "factura correspondiente al saldo final."
    )

    clause(5, "Plazos de ejecución")
    p(
        "Los plazos indicados en la Cláusula 2 son estimaciones basadas en la información "
        "disponible en el momento de la aceptación del Presupuesto y comienzan a contar desde la "
        "recepción del anticipo y de toda la información técnica necesaria por parte de EL "
        "CLIENTE para iniciar el trabajo."
    )
    p(
        "Dichos plazos podrán verse alterados por: (i) retrasos en la entrega de información o "
        "materiales por parte de EL CLIENTE; (ii) solicitudes de cambio de alcance conforme a la "
        "Cláusula 6; o (iii) causas de fuerza mayor conforme a la Cláusula 13. En ningún caso "
        "el mero incumplimiento de un plazo estimado dará derecho a EL CLIENTE a penalización "
        "económica automática, salvo pacto expreso en contrario reflejado en el Presupuesto."
    )

    clause(6, "Modificaciones y ampliaciones de alcance")
    bullets([
        "Cualquier solicitud de EL CLIENTE que suponga una modificación de los requisitos "
        "iniciales, adición de funcionalidades, o repetición de trabajo ya aceptado, se "
        "considerará una “Solicitud de Cambio” y quedará fuera del alcance y precio "
        "inicialmente pactados.",
        "Ante una Solicitud de Cambio, EL PRESTADOR presentará a EL CLIENTE una valoración "
        "económica y de plazo adicional antes de proceder, que deberá ser aprobada por escrito "
        "(incluido correo electrónico) por EL CLIENTE.",
        "Los ciclos de revisión no utilizados en un entregable no son acumulables ni canjeables por "
        "otro concepto.",
    ])

    clause(7, "Propiedad intelectual")
    p(
        "Una vez efectuado el pago íntegro del precio pactado en la Cláusula 4, EL PRESTADOR "
        "cede a EL CLIENTE los derechos de explotación (reproducción, distribución, "
        "transformación y comunicación pública) sobre los entregables específicos generados "
        "para el proyecto (modelos CAD, planos, informes), en la medida necesaria para su uso, "
        "fabricación y comercialización por parte de EL CLIENTE."
    )
    p("Quedan expresamente excluidos de dicha cesión y son y seguirán siendo propiedad exclusiva de EL PRESTADOR:")
    bullets([
        "Las metodologías, procesos de trabajo, plantillas, scripts, flujos de automatización y "
        "conocimiento técnico general (know-how) empleados para producir los entregables.",
        "Cualquier herramienta, biblioteca de componentes o desarrollo interno de Arroyo Systems "
        "reutilizado o adaptado durante el proyecto.",
    ])
    p(
        "EL PRESTADOR podrá referenciar el proyecto en su porfolio profesional o comercial de forma "
        "genérica (sin datos confidenciales del CLIENTE) salvo indicación expresa en contrario "
        "por escrito de EL CLIENTE."
    )
    p(
        "Hasta que no se complete el pago íntegro del precio, todos los entregables se ceden "
        "únicamente a efectos de revisión, sin que ello suponga cesión de derechos de "
        "explotación."
    )

    clause(8, "Confidencialidad")
    p(
        "Ambas partes se comprometen a mantener la más estricta confidencialidad sobre toda la "
        "información técnica, comercial o de cualquier otra naturaleza a la que tengan acceso con "
        "motivo de la ejecución del presente Contrato, y a no revelarla a terceros sin "
        "consentimiento previo y por escrito de la otra parte, salvo requerimiento legal o judicial."
    )
    p(
        "Esta obligación de confidencialidad se mantendrá vigente durante la ejecución del "
        "Contrato y por un periodo de 2 años tras su finalización, cualquiera que sea la causa de "
        "dicha finalización."
    )

    clause(9, "Responsabilidad y garantías")
    p(
        "EL PRESTADOR se compromete a ejecutar los servicios contratados conforme a las reglas del "
        "arte de la ingeniería y con la diligencia profesional exigible, empleando los estándares "
        "y normativa técnica aplicable (ISO, ASME, ASTM u otras que resulten de aplicación según "
        "se especifique en el Presupuesto)."
    )
    p(
        "Los resultados de los análisis de validación estructural (FEM) proporcionados constituyen "
        "una herramienta de apoyo a la toma de decisiones de ingeniería basada en modelos "
        "numéricos y las hipótesis de carga y material acordadas con EL CLIENTE, y no constituyen "
        "garantía absoluta del comportamiento del producto final en condiciones reales de "
        "fabricación, montaje o uso."
    )
    p(
        "La responsabilidad económica total de EL PRESTADOR frente a EL CLIENTE por cualquier "
        "concepto derivado del presente Contrato queda limitada, en todo caso, a la mayor de las "
        "siguientes cantidades: (i) el importe efectivamente facturado por EL PRESTADOR en el "
        f"proyecto correspondiente; o (ii) el límite de indemnización por siniestro de la póliza "
        f"de responsabilidad civil profesional vigente de EL PRESTADOR conforme a la Cláusula 10 "
        f"({liability_text} € por siniestro). Esta limitación no será de aplicación en "
        "supuestos de dolo o negligencia grave imputables a EL PRESTADOR, ni en aquello que no pueda "
        "limitarse conforme a la legislación española aplicable."
    )
    p(
        "EL PRESTADOR no será responsable de daños indirectos, lucro cesante, pérdida de "
        "negocio o de datos que pudieran derivarse del uso de los entregables por parte de EL CLIENTE "
        "o de terceros."
    )
    p(
        "Corresponde a EL CLIENTE, antes de proceder a la fabricación en serie o comercialización "
        "del producto, validar mediante los ensayos físicos y certificaciones que resulten "
        "pertinentes según el sector de aplicación, especialmente en sectores regulados "
        "(automoción, aeroespacial, defensa, dispositivos médicos u otros de naturaleza "
        "análoga)."
    )

    clause(10, "Seguro de responsabilidad civil profesional")
    p(
        "EL PRESTADOR se compromete a mantener en vigor durante toda la duración del presente "
        "Contrato y durante un periodo mínimo de 2 años tras su finalización, una póliza de "
        "seguro de responsabilidad civil profesional que cubra los daños derivados del ejercicio de "
        f"su actividad de ingeniería, con un límite de indemnización por siniestro "
        f"({liability_text} €)."
    )
    bullets([
        "A requerimiento razonable de EL CLIENTE, EL PRESTADOR facilitará el certificado de la "
        "póliza en vigor como acreditación de dicha cobertura.",
        "Si la actividad concreta del proyecto (por ejemplo, sectores regulados como automoción, "
        "aeroespacial o dispositivos médicos) exigiera una cobertura superior a la habitual, EL "
        "CLIENTE deberá comunicarlo antes de la aceptación del Presupuesto, pudiendo acordarse un "
        "incremento de cobertura y, en su caso, del precio del servicio.",
    ])
    p(
        "El incumplimiento de la obligación de mantener la póliza en vigor no exonera a EL "
        "PRESTADOR de sus obligaciones bajo la Cláusula 9, pero faculta a EL CLIENTE a resolver el "
        "Contrato conforme a la Cláusula 12."
    )

    clause(11, "Indemnización frente a terceros")
    p(
        "EL CLIENTE mantendrá indemne a EL PRESTADOR frente a cualquier reclamación, demanda o "
        "procedimiento iniciado por un tercero como consecuencia de: (i) la fabricación, montaje, "
        "ensayo, comercialización o uso del producto por parte de EL CLIENTE o de terceros bajo su "
        "control; (ii) modificaciones sobre los entregables no realizadas ni autorizadas por escrito "
        "por EL PRESTADOR; o (iii) el incumplimiento por parte de EL CLIENTE de las obligaciones de "
        "validación, ensayo y certificación que le corresponden conforme a la Cláusula 9."
    )

    clause(12, "Resolución y cancelación")
    bullets([
        "EL CLIENTE podrá cancelar el proyecto en cualquier momento mediante comunicación por "
        "escrito, debiendo abonar el trabajo efectivamente realizado hasta la fecha de cancelación, "
        "calculado proporcionalmente sobre el precio total pactado o, en su caso, sobre las horas "
        "efectivamente empleadas a razón de 50 €/hora.",
        "EL PRESTADOR podrá resolver el Contrato en caso de impago por parte de EL CLIENTE en los "
        "plazos pactados, o de incumplimiento grave de cualquier otra obligación contractual, "
        "previo requerimiento por escrito con 10 días naturales de antelación para su "
        "subsanación.",
        "En caso de cancelación, EL PRESTADOR no estará obligado a entregar los archivos "
        "editables ni a ceder los derechos de explotación conforme a la Cláusula 7 hasta que no "
        "se haya abonado el importe correspondiente al trabajo realizado.",
    ])

    clause(13, "Fuerza mayor")
    p(
        "Ninguna de las partes será responsable por el incumplimiento o retraso en el cumplimiento "
        "de sus obligaciones cuando dicho incumplimiento o retraso se deba a causas de fuerza mayor o "
        "caso fortuito, entendiendo por tales aquellos acontecimientos imprevisibles o inevitables "
        "ajenos a la voluntad de las partes."
    )

    clause(14, "Subcontratación")
    p(
        "EL PRESTADOR podrá subcontratar con terceros profesionales la ejecución parcial de los "
        "servicios objeto del presente Contrato cuando la naturaleza o volumen del proyecto lo "
        "requiera, previa comunicación a EL CLIENTE."
    )
    bullets([
        "EL PRESTADOR seguirá siendo el único responsable frente a EL CLIENTE de la correcta "
        "ejecución del Contrato, incluida la parte subcontratada, como si la hubiera ejecutado "
        "directamente.",
        "EL PRESTADOR se asegurará de que cualquier subcontratado quede sujeto a obligaciones de "
        "confidencialidad equivalentes a las establecidas en la Cláusula 8.",
        "La subcontratación no exime a EL PRESTADOR de la obligación de mantener el seguro de "
        "responsabilidad civil profesional conforme a la Cláusula 10.",
    ])

    clause(15, "Protección de datos")
    p(
        "Los datos personales facilitados por las partes con motivo de la firma y ejecución del "
        "presente Contrato serán tratados conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley "
        "Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos "
        "digitales, con la finalidad de gestionar la relación contractual."
    )

    clause(16, "Ley aplicable y jurisdicción")
    p(
        "El presente Contrato se rige por la legislación española. Para la resolución de "
        "cualquier controversia derivada de su interpretación o ejecución, las partes se someten "
        f"a los Juzgados y Tribunales de {jurisdiction_city}, con renuncia expresa a cualquier otro "
        "fuero que pudiera corresponderles."
    )

    clause(17, "Disposiciones generales")
    bullets([
        "El presente Contrato, junto con su Anexo I (Presupuesto), constituye el acuerdo íntegro "
        "entre las partes y sustituye a cualquier acuerdo o negociación previa sobre el mismo "
        "objeto.",
        "La nulidad de alguna de las cláusulas del presente Contrato no afectará a la validez del "
        "resto, que se mantendrán en vigor.",
        "Ninguna de las partes podrá ceder su posición contractual sin consentimiento previo y "
        "por escrito de la otra parte.",
        "Cualquier modificación del presente Contrato deberá realizarse por escrito y con la "
        "firma de ambas partes.",
    ])

    elements.append(Spacer(1, 4 * mm))
    p(
        "Y en prueba de conformidad con cuanto antecede, ambas partes firman el presente Contrato, "
        f"en el lugar y fecha indicados a continuación.<br/><br/>En {jurisdiction_city}, a {_fmt_date_es(generated_at)}"
    )
    elements.append(Spacer(1, 6 * mm))

    provider_block = Paragraph(
        "<b>EL PRESTADOR</b><br/>D. Marcos Arroyo Navarro<br/>Arroyo Systems", body
    )
    client_block_lines = [
        "<b>EL CLIENTE</b>",
        customer.get("contact_person") or "",
        customer.get("company_name") or "",
    ]
    client_block = Paragraph("<br/>".join(line for line in client_block_lines if line), body)

    sign_table = Table([[provider_block, client_block]], colWidths=[80 * mm, 80 * mm])
    sign_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(sign_table)

    # Real, extractable anchor text for DocuSign's SignHere / DateSigned tabs - rendered small
    # and low-contrast so it doesn't visually intrude, but never as an image.
    anchor_table = Table(
        [["", Paragraph(f"{SIGNATURE_ANCHOR}&nbsp;&nbsp;&nbsp;{DATE_SIGNED_ANCHOR}", tiny_anchor)]],
        colWidths=[80 * mm, 80 * mm],
    )
    elements.append(anchor_table)

    elements.append(Spacer(1, 8 * mm))
    elements.append(Paragraph(f"{COMPANY_NAME} — {COMPANY_ADDRESS}", small))
    elements.append(Paragraph(f"{COMPANY_EMAIL} — {COMPANY_PHONE} — {COMPANY_WEB}", small))

    doc.build(elements)
    return buf.getvalue()
