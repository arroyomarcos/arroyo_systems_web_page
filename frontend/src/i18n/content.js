// Bilingual copy for the site. Everything user-visible lives here, keyed by
// language, so components stay language-agnostic and just read `t.<section>`.

const packagesEn = [
  {
    id: "rapid-design",
    name: "Rapid Design",
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
    id: "validated-design",
    name: "Validated Design",
    tagline: "Know your design will work before you spend money manufacturing it.",
    priceRange: "€3,000 – €3,500",
    priceInclVat: "€3,630 – €4,235 (incl. 21% VAT)",
    leadTime: "10–14 business days",
    revisions: "2 revision cycles included",
    hours: "Base: 35h · Up to +10h if complexity increases",
    bestFor: "PyMEs and startups with funding that need structural certainty before production.",
    description:
      "Anyone can design a part that looks good. We prove it will survive the real loads before the first prototype is built. Less risk, fewer redesigns and fewer expensive mistakes.",
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
  {
    id: "performance-design",
    name: "Performance Design",
    tagline: "Don't just prove it works. Make it better. Iterative optimization for weight, cost, and reliability.",
    priceRange: "€5,000 – €5,750",
    priceInclVat: "€6,050 – €6,957 (incl. 21% VAT)",
    leadTime: "14–21 business days",
    revisions: "3 revision cycles included",
    hours: "Base: 60h · Up to +15h if complexity increases",
    bestFor: "Fabricantes, technical PyMEs, and well-funded startups needing full documentation.",
    description:
      "Your part already works. Now make it lighter, stronger and cheaper to manufacture. We optimize the design through multiple engineering iterations, so you get the highest performance without unnecessary material or cost.",
    deliverables: [
      { title: "Optimized CAD Model", description: "Final geometry refined through engineering optimization." },
      {
        title: "Advanced Structural Analysis",
        description: "Static and fatigue simulations under real operating conditions.",
      },
      {
        title: "Iterative Design Optimization",
        description:
          "Multiple engineering iterations to reduce weight, improve strength and lower manufacturing cost.",
      },
      { title: "Technical Drawings", description: "Manufacturing drawings ready for production." },
      {
        title: "Material & Manufacturing Specification",
        description: "Recommended material, manufacturing process and finishing requirements.",
      },
      {
        title: "Engineering Validation Reports",
        description: "Complete documentation showing why the final design performs better than the original.",
      },
    ],
  },
];

const packagesEs = [
  {
    id: "rapid-design",
    name: "Rapid Design",
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
    id: "validated-design",
    name: "Validated Design",
    tagline: "Sabe que tu diseño funcionará antes de gastar dinero en fabricarlo.",
    priceRange: "3.000 € – 3.500 €",
    priceInclVat: "3.630 € – 4.235 € (IVA del 21% incluido)",
    leadTime: "10–14 días laborables",
    revisions: "2 ciclos de revisión incluidos",
    hours: "Base: 35 h · Hasta +10 h si aumenta la complejidad",
    bestFor: "PyMEs y startups con financiación que necesitan certeza estructural antes de producción.",
    description:
      "Cualquiera puede diseñar una pieza que tenga buen aspecto. Nosotros demostramos que soportará las cargas reales antes de construir el primer prototipo. Menos riesgo, menos rediseños y menos errores costosos.",
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
  {
    id: "performance-design",
    name: "Performance Design",
    tagline: "No te quedes en demostrar que funciona. Hazlo mejor. Optimización iterativa de peso, coste y fiabilidad.",
    priceRange: "5.000 € – 5.750 €",
    priceInclVat: "6.050 € – 6.957 € (IVA del 21% incluido)",
    leadTime: "14–21 días laborables",
    revisions: "3 ciclos de revisión incluidos",
    hours: "Base: 60 h · Hasta +15 h si aumenta la complejidad",
    bestFor: "Fabricantes, PyMEs técnicas y startups bien financiadas que necesitan documentación completa.",
    description:
      "Tu pieza ya funciona. Ahora hazla más ligera, más resistente y más barata de fabricar. Optimizamos el diseño mediante múltiples iteraciones de ingeniería, para que obtengas el máximo rendimiento sin material ni coste innecesarios.",
    deliverables: [
      { title: "Modelo CAD optimizado", description: "Geometría final refinada mediante optimización de ingeniería." },
      {
        title: "Análisis estructural avanzado",
        description: "Simulaciones estáticas y de fatiga bajo condiciones reales de operación.",
      },
      {
        title: "Optimización iterativa del diseño",
        description:
          "Múltiples iteraciones de ingeniería para reducir peso, mejorar la resistencia y bajar el coste de fabricación.",
      },
      { title: "Planos técnicos", description: "Planos de fabricación listos para producción." },
      {
        title: "Especificación de material y fabricación",
        description: "Material recomendado, proceso de fabricación y requisitos de acabado.",
      },
      {
        title: "Informes de validación de ingeniería",
        description: "Documentación completa que muestra por qué el diseño final rinde mejor que el original.",
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
        "You send the part. We design it, prove it works, and get it manufacturing-ready — in days, not months.",
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
      body: "AI-accelerated design workflow. Manufacturing coordination built in — from finished design to a part in your hands, without you chasing suppliers. No account managers between you and the person doing the work.",
      bullets: [
        "Pricing is public. You see the range before you talk to us.",
        "Turnaround is measured in business days — most projects ship in one to three weeks, start to finish.",
        "Every design ships with structural validation. Not just a part that looks right — one that's proven to hold.",
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
        { value: "Rapid Design", label: "Rapid Design" },
        { value: "Validated Design", label: "Validated Design" },
        { value: "Performance Design", label: "Performance Design" },
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
          "Engineering, on demand. We design machined and sheet-metal parts, validate them structurally, and get them manufacturing-ready — in days, not months.",
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
        "Nos envías la pieza. La diseñamos, demostramos que funciona y la dejamos lista para fabricar — en días, no meses.",
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
      body: "Flujo de diseño acelerado con IA. Coordinación de fabricación incluida — del diseño terminado a la pieza en tus manos, sin que tengas que perseguir proveedores. Sin gestores de cuenta entre tú y quien hace el trabajo.",
      bullets: [
        "Los precios son públicos. Ves el rango antes de hablar con nosotros.",
        "Los plazos se miden en días laborables — la mayoría de proyectos se entregan en una a tres semanas, de principio a fin.",
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
        { value: "Rapid Design", label: "Rapid Design" },
        { value: "Validated Design", label: "Validated Design" },
        { value: "Performance Design", label: "Performance Design" },
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
          "Ingeniería, bajo demanda. Diseñamos piezas mecanizadas y de chapa, las validamos estructuralmente, y las dejamos listas para fabricar — en días, no meses.",
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
