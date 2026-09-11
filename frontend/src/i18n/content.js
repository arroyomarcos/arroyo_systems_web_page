// Bilingual copy for the site. Everything user-visible lives here, keyed by
// language, so components stay language-agnostic and just read `t.<section>`.

const packagesEn = [
  {
    id: "product-design",
    name: "Product Design",
    tagline: "Turn your idea into a part you can manufacture. Fast.",
    priceRange: "€1,300 – €1,550",
    priceInclVat: "€1,573 – €1,876 (incl. 21% VAT)",
    leadTime: "7–10 business days",
    revisions: "1 revision cycle included",
    hours: "Base: 15h · Up to +5h if complexity increases",
    bestFor: "Hardware companies, MVP prototyping, simple to medium complexity parts.",
    description:
      "Stop wasting weeks fixing CAD files or guessing how a part should be manufactured. We design it properly from the start so you can request quotes, build prototypes and move to production with confidence.",
    deliverables: [
      { title: "CAD Model", description: "Clean, fully parametric CAD model ready for manufacturing." },
      {
        title: "Technical Drawings",
        description: "Manufacturing drawings with dimensions, tolerances and material specifications.",
      },
      {
        title: "Design for Manufacturing Report",
        description: "Practical recommendations to reduce machining costs and avoid manufacturing problems.",
      },
      {
        title: "Material Recommendation",
        description: "The right material and manufacturing process for your application.",
      },
    ],
  },
  {
    id: "product-validation",
    name: "Product Validation",
    tagline: "Already have a design? Prove it holds up before you manufacture it.",
    priceRange: "€1,850 – €2,100",
    priceInclVat: "€2,239 – €2,541 (incl. 21% VAT)",
    leadTime: "8–11 business days",
    revisions: "1 revision cycle included",
    hours: "Base: 20h · Up to +5h if complexity increases",
    bestFor: "Teams with an existing design, in-house or third-party, needing structural certainty before production.",
    description:
      "You already have a CAD model, designed in-house or by another provider. We check that it will survive real operating loads before you commit to tooling or production, and tell you exactly what to change if it won't.",
    deliverables: [
      { title: "Structural Simulation", description: "Stress, deformation and safety factor calculated using FEM." },
      {
        title: "Fatigue Analysis",
        description: "S-N based fatigue check on the critical load cases identified.",
      },
      {
        title: "Design Optimization Recommendations",
        description: "Where material can be safely removed, and where it must be reinforced.",
      },
      {
        title: "Updated Technical Drawings",
        description: "Revised only where the analysis requires a geometry change.",
      },
      {
        title: "Engineering Validation Report",
        description: "Clear evidence that your design meets its intended requirements.",
      },
    ],
    note: "Requires the client to provide the CAD model in a compatible format (STEP, IGES, SolidWorks, or another format agreed in advance). Arroyo Systems is not responsible for design flaws originating in a model it did not produce.",
  },
  {
    id: "product-development",
    name: "Product Development",
    tagline: "Know your design will work before you spend money manufacturing it.",
    priceRange: "€3,000 – €3,500",
    priceInclVat: "€3,630 – €4,235 (incl. 21% VAT) · vs. €3,150 – €3,650 booked separately",
    leadTime: "10–14 business days",
    revisions: "2 revision cycles included",
    hours: "Base: 35h (15h design + 20h validation) · Up to +10h if complexity increases",
    bestFor: "PyMEs and industrial manufacturers that need a design built and validated together, from scratch.",
    description:
      "Anyone can design a part that looks good. We prove it will survive the real loads before the first prototype is built, designed and validated together in one engagement, at a discount versus booking Product Design and Product Validation as two separate projects.",
    deliverables: [
      { title: "Optimized CAD Model", description: "Design refined after engineering analysis." },
      { title: "Structural Simulation", description: "Stress, deformation and safety factor calculated using FEM." },
      {
        title: "Design Optimization",
        description: "Material removed where possible and reinforced where necessary.",
      },
      { title: "Technical Drawings", description: "Manufacturing documentation ready to send to suppliers." },
      {
        title: "Engineering Report",
        description: "Clear evidence that your design meets its intended requirements.",
      },
    ],
  },
];

const packagesEs = [
  {
    id: "product-design",
    name: "Product Design",
    tagline: "Convierte tu idea en una pieza lista para fabricar. Rápido.",
    priceRange: "1.300 € – 1.550 €",
    priceInclVat: "1.573 € – 1.876 € (IVA del 21% incluido)",
    leadTime: "7–10 días laborables",
    revisions: "1 ciclo de revisión incluido",
    hours: "Base: 15 h · Hasta +5 h si aumenta la complejidad",
    bestFor: "Empresas de hardware, prototipado de MVP, piezas de complejidad simple a media.",
    description:
      "Deja de perder semanas arreglando archivos CAD o adivinando cómo se debe fabricar una pieza. La diseñamos bien desde el principio para que puedas pedir presupuestos, construir prototipos y pasar a producción con confianza.",
    deliverables: [
      { title: "Modelo CAD", description: "Modelo CAD limpio y totalmente paramétrico, listo para fabricación." },
      {
        title: "Planos técnicos",
        description: "Planos de fabricación con cotas, tolerancias y especificaciones de material.",
      },
      {
        title: "Informe de diseño para fabricación (DFM)",
        description: "Recomendaciones prácticas para reducir costes de mecanizado y evitar problemas de fabricación.",
      },
      {
        title: "Recomendación de material",
        description: "El material y proceso de fabricación adecuados para tu aplicación.",
      },
    ],
  },
  {
    id: "product-validation",
    name: "Product Validation",
    tagline: "¿Ya tienes un diseño? Demuestra que aguanta antes de fabricarlo.",
    priceRange: "1.850 € – 2.100 €",
    priceInclVat: "2.239 € – 2.541 € (IVA del 21% incluido)",
    leadTime: "8–11 días laborables",
    revisions: "1 ciclo de revisión incluido",
    hours: "Base: 20 h · Hasta +5 h si aumenta la complejidad",
    bestFor: "Equipos con un diseño ya existente, propio o de un tercero, que necesitan certeza estructural antes de producción.",
    description:
      "Ya tienes un modelo CAD, diseñado internamente o por otro proveedor. Comprobamos que soportará las cargas reales de operación antes de que te comprometas con utillaje o producción, y te decimos exactamente qué cambiar si no lo hace.",
    deliverables: [
      {
        title: "Simulación estructural",
        description: "Tensión, deformación y factor de seguridad calculados mediante FEM.",
      },
      {
        title: "Análisis de fatiga",
        description: "Comprobación de fatiga basada en curvas S-N sobre los casos de carga críticos identificados.",
      },
      {
        title: "Recomendaciones de optimización del diseño",
        description: "Dónde se puede quitar material de forma segura y dónde hay que reforzar.",
      },
      {
        title: "Planos técnicos actualizados",
        description: "Revisados solo donde el análisis exige un cambio de geometría.",
      },
      {
        title: "Informe de validación de ingeniería",
        description: "Evidencia clara de que tu diseño cumple los requisitos previstos.",
      },
    ],
    note: "Requiere que el cliente aporte el modelo CAD en un formato compatible (STEP, IGES, SolidWorks u otro formato acordado previamente). Arroyo Systems no se responsabiliza de fallos de diseño originados en un modelo que no ha producido.",
  },
  {
    id: "product-development",
    name: "Product Development",
    tagline: "Sabe que tu diseño funcionará antes de gastar dinero en fabricarlo.",
    priceRange: "3.000 € – 3.500 €",
    priceInclVat: "3.630 € – 4.235 € (IVA del 21% incluido) · frente a 3.150 € – 3.650 € contratados por separado",
    leadTime: "10–14 días laborables",
    revisions: "2 ciclos de revisión incluidos",
    hours: "Base: 35 h (15 h de diseño + 20 h de validación) · Hasta +10 h si aumenta la complejidad",
    bestFor: "PyMEs y fabricantes industriales que necesitan un diseño construido y validado a la vez, desde cero.",
    description:
      "Cualquiera puede diseñar una pieza que tenga buen aspecto. Nosotros demostramos que soportará las cargas reales antes de construir el primer prototipo, diseñado y validado en un mismo proyecto, con descuento frente a contratar Product Design y Product Validation por separado.",
    deliverables: [
      { title: "Modelo CAD optimizado", description: "Diseño refinado tras el análisis de ingeniería." },
      {
        title: "Simulación estructural",
        description: "Tensión, deformación y factor de seguridad calculados mediante FEM.",
      },
      {
        title: "Optimización del diseño",
        description: "Material eliminado donde es posible y reforzado donde es necesario.",
      },
      {
        title: "Planos técnicos",
        description: "Documentación de fabricación lista para enviar a proveedores.",
      },
      {
        title: "Informe de ingeniería",
        description: "Evidencia clara de que tu diseño cumple los requisitos previstos.",
      },
    ],
  },
];

export const content = {
  en: {
    lang: "en",
    nav: { solutions: "Solutions", whyUs: "Why Us", partners: "Partners", contact: "Contact Us" },
    hero: {
      titleLine1: "Engineering,",
      titleLine2: "on demand.",
      body1: "No retainers. No six-week discovery phase. No “we’ll circle back.”",
      body2:
        "You send the part. We design it, prove it works, and get it manufacturing-ready. In days, not months.",
      ctaPrimary: "See pricing",
      ctaSecondary: "Start a project",
    },
    products: {
      heading: "Solutions",
      subtitle:
        "Three complementary services for machined parts and bent sheet metal, reducing risk, cost and uncertainty across the full design-to-manufacture lifecycle.",
      deliverablesLabel: "Deliverables",
      leadTimeLabel: "Lead time",
      revisionsLabel: "Revisions",
      viewDetailsAria: (name) => `View full details for ${name}`,
      packages: packagesEn,
    },
    whyUs: {
      heading:
        "We're not a consultancy. We're the engineer you'd hire in-house if you could afford to wait for one.",
      body: "AI-accelerated design workflow. Manufacturing coordination built in. From finished design to a part in your hands, without you chasing suppliers. No account managers between you and the person doing the work.",
      bullets: [
        "Pricing is public. You see the range before you talk to us.",
        "Turnaround is measured in business days. Most projects ship in one to three weeks, start to finish.",
        "Every design ships with structural validation. Not just a part that looks right. One that's proven to hold.",
      ],
    },
    partners: {
      heading: "Partners",
      subtitle:
        "We collaborate with hardware and software providers that strengthen how we design, validate and review mechanical components.",
      visitWebsite: "Visit website",
      items: [
        {
          id: "3dconnexion",
          name: "3Dconnexion",
          logo: "threeDConnexionLogo",
          url: "https://3dconnexion.com",
          description:
            "3Dconnexion joins Arroyo Systems as a Technology Partner, bringing precision 3D navigation and control hardware into our engineering workflow.",
        },
      ],
    },
    contact: {
      heading1: "Got a part to design",
      heading2: "and not much time to lose?",
      subheading: "Neither do we. That's the point.",
      cta: "Tell us about your project",
      formEyebrow: "Send us a message",
      locationLabel: "Madrid, Spain",
      linkedinLabel: "LinkedIn",
      privacyPolicy: "Privacy Policy",
      legalNotice: "Legal Notice",
      cookiesPolicy: "Cookies Policy",
      copyright: (year) => `© ${year} Arroyo Systems. All rights reserved.`,
    },
    contactForm: {
      nameLabel: "Name *",
      emailLabel: "Email *",
      companyLabel: "Company",
      projectTypeLabel: "Project type",
      messageLabel: "Message *",
      namePlaceholder: "Your full name",
      emailPlaceholder: "you@company.com",
      companyPlaceholder: "Company name",
      messagePlaceholder: "Tell us about your component, requirements, timeline...",
      selectOption: "Select an option",
      projectTypes: [
        { value: "Product Design", label: "Product Design" },
        { value: "Product Validation", label: "Product Validation" },
        { value: "Product Development", label: "Product Development" },
        { value: "Other", label: "Other" },
      ],
      privacyPrefix: "I have read and accept the",
      privacyLinkText: "Privacy Policy",
      submit: "Send message",
      successTitle: "Message received.",
      successBody:
        "Thanks for contacting Arroyo Systems. We'll review your enquiry and come back to you shortly.",
      sendAnother: "Send another message",
      errorToastTitle: "Message may not have been delivered",
      errorToastBody:
        "We couldn't confirm your message was sent. Please contact us by email if you don't hear back.",
      validation: {
        required: "Required",
        invalidEmail: "Invalid email",
        messageTooShort: "Please provide at least 10 characters",
      },
    },
    seo: {
      home: {
        title: "Arroyo Systems | Engineering, on demand.",
        description:
          "Engineering, on demand. We design machined and sheet-metal parts, validate them structurally, and get them manufacturing-ready. In days, not months.",
      },
      privacyPolicy: {
        title: "Privacy Policy | Arroyo Systems",
        description: "Privacy policy for Arroyo Systems website and contact form data processing.",
      },
      legalNotice: {
        title: "Legal Notice | Arroyo Systems",
        description: "Legal notice and website owner information for Arroyo Systems.",
      },
      cookiesPolicy: {
        title: "Cookies Policy | Arroyo Systems",
        description: "Cookies policy for Arroyo Systems website.",
      },
    },
  },
  es: {
    lang: "es",
    nav: { solutions: "Soluciones", whyUs: "Por qué nosotros", partners: "Colaboradores", contact: "Contáctanos" },
    hero: {
      titleLine1: "Ingeniería,",
      titleLine2: "bajo demanda.",
      body1: "Sin contratos de permanencia. Sin fases de descubrimiento de seis semanas. Sin “ya te llamaremos”.",
      body2:
        "Nos envías la pieza. La diseñamos, demostramos que funciona y la dejamos lista para fabricar. En días, no meses.",
      ctaPrimary: "Ver precios",
      ctaSecondary: "Empezar un proyecto",
    },
    products: {
      heading: "Soluciones",
      subtitle:
        "Tres servicios complementarios para piezas mecanizadas y de chapa doblada, que reducen riesgo, coste e incertidumbre en todo el ciclo de diseño a fabricación.",
      deliverablesLabel: "Entregables",
      leadTimeLabel: "Plazo",
      revisionsLabel: "Revisiones",
      viewDetailsAria: (name) => `Ver el detalle completo de ${name}`,
      packages: packagesEs,
    },
    whyUs: {
      heading:
        "No somos una consultora. Somos el ingeniero que contratarías internamente si pudieras permitirte esperar a encontrarlo.",
      body: "Flujo de diseño acelerado con IA. Coordinación de fabricación incluida. Del diseño terminado a la pieza en tus manos, sin que tengas que perseguir proveedores. Sin gestores de cuenta entre tú y quien hace el trabajo.",
      bullets: [
        "Los precios son públicos. Ves el rango antes de hablar con nosotros.",
        "Los plazos se miden en días laborables. La mayoría de proyectos se entregan en una a tres semanas, de principio a fin.",
        "Todo diseño se entrega con validación estructural. No solo una pieza que parece correcta, sino una que está demostrado que aguanta.",
      ],
    },
    partners: {
      heading: "Colaboradores",
      subtitle:
        "Colaboramos con proveedores de hardware y software que refuerzan cómo diseñamos, validamos y revisamos componentes mecánicos.",
      visitWebsite: "Visitar web",
      items: [
        {
          id: "3dconnexion",
          name: "3Dconnexion",
          logo: "threeDConnexionLogo",
          url: "https://3dconnexion.com",
          description:
            "3Dconnexion se une a Arroyo Systems como Technology Partner, aportando hardware de navegación y control 3D de precisión a nuestro flujo de trabajo de ingeniería.",
        },
      ],
    },
    contact: {
      heading1: "¿Tienes una pieza que diseñar",
      heading2: "y poco tiempo que perder?",
      subheading: "Nosotros tampoco. Esa es la idea.",
      cta: "Cuéntanos tu proyecto",
      formEyebrow: "Envíanos un mensaje",
      locationLabel: "Madrid, España",
      linkedinLabel: "LinkedIn",
      privacyPolicy: "Política de Privacidad",
      legalNotice: "Aviso Legal",
      cookiesPolicy: "Política de Cookies",
      copyright: (year) => `© ${year} Arroyo Systems. Todos los derechos reservados.`,
    },
    contactForm: {
      nameLabel: "Nombre *",
      emailLabel: "Email *",
      companyLabel: "Empresa",
      projectTypeLabel: "Tipo de proyecto",
      messageLabel: "Mensaje *",
      namePlaceholder: "Tu nombre completo",
      emailPlaceholder: "tucorreo@empresa.com",
      companyPlaceholder: "Nombre de la empresa",
      messagePlaceholder: "Cuéntanos sobre tu componente, requisitos, plazos...",
      selectOption: "Selecciona una opción",
      projectTypes: [
        { value: "Product Design", label: "Product Design" },
        { value: "Product Validation", label: "Product Validation" },
        { value: "Product Development", label: "Product Development" },
        { value: "Other", label: "Otro" },
      ],
      privacyPrefix: "He leído y acepto la",
      privacyLinkText: "Política de Privacidad",
      submit: "Enviar mensaje",
      successTitle: "Mensaje recibido.",
      successBody: "Gracias por contactar con Arroyo Systems. Revisaremos tu consulta y te responderemos en breve.",
      sendAnother: "Enviar otro mensaje",
      errorToastTitle: "Es posible que el mensaje no se haya enviado",
      errorToastBody:
        "No hemos podido confirmar el envío de tu mensaje. Escríbenos por email si no recibes respuesta.",
      validation: {
        required: "Obligatorio",
        invalidEmail: "Email no válido",
        messageTooShort: "Escribe al menos 10 caracteres",
      },
    },
    seo: {
      home: {
        title: "Arroyo Systems | Ingeniería, bajo demanda.",
        description:
          "Ingeniería, bajo demanda. Diseñamos piezas mecanizadas y de chapa, las validamos estructuralmente, y las dejamos listas para fabricar. En días, no meses.",
      },
      privacyPolicy: {
        title: "Política de Privacidad | Arroyo Systems",
        description:
          "Política de privacidad de la web de Arroyo Systems y del tratamiento de datos del formulario de contacto.",
      },
      legalNotice: {
        title: "Aviso Legal | Arroyo Systems",
        description: "Aviso legal e información del titular de la web de Arroyo Systems.",
      },
      cookiesPolicy: {
        title: "Política de Cookies | Arroyo Systems",
        description: "Política de cookies de la web de Arroyo Systems.",
      },
    },
  },
};

export const getContent = (lang) => content[lang] || content.en;
