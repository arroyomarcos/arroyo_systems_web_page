// Bilingual copy for the site. Everything user-visible lives here, keyed by
// language, so components stay language-agnostic and just read `t.<section>`.
//
// Content rules (Brief_Rediseno_Web, section 5): nothing is promised that the contract or
// the quote can't back up, and internal data (cost structure, margin, budgeted hours,
// manufacturing-fee scale) never appears here.


const packagesEn = [
  {
    id: "product-design",
    name: "Product Design",
    tagline: "A part designed to be manufactured.",
    price: "€1,500 – €1,850",
    priceNote: "Excl. VAT. Your quote fixes a closed price within this range, depending on complexity.",
    priceInclVat: "€1,815.00 – €2,238.50 incl. 21% VAT",
    leadTime: "7–10 business days",
    revisions: "1 revision cycle included",
    description:
      "Stop wasting weeks fixing CAD files or guessing how a part should be manufactured. We design it properly from the start so you can request quotes, build prototypes and move to production with confidence.",
    includes: [
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
    excludes: [
      "Structural calculation. That is the scope of Product Validation.",
      "Manufacturing the part. The workshop does that; coordinating and technically supervising it is the scope of Product Manufacturing.",
    ],
  },
  {
    id: "product-validation",
    name: "Product Validation",
    tagline: "Check it holds up before you manufacture it.",
    price: "€2,050 – €2,400",
    priceNote: "Excl. VAT. Your quote fixes a closed price within this range, depending on complexity.",
    priceInclVat: "€2,480.50 – €2,904.00 incl. 21% VAT",
    leadTime: "8–11 business days",
    revisions: "1 revision cycle included",
    description:
      "You already have a CAD model, designed in-house or by another provider. We calculate that it holds up under the loads you give us, before you commit to tooling or production, and tell you exactly what to change if it doesn't.",
    includes: [
      { title: "Structural Simulation", description: "Stress, deformation and safety factor calculated using FEM." },
      { title: "Fatigue Analysis", description: "S-N based fatigue check on the critical load cases identified." },
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
    excludes: [
      "Designing the part from scratch. That is the scope of Product Design or Product Development.",
      "Physical testing. The simulation runs on the load and material assumptions agreed with you.",
    ],
    note: "Requires you to provide the CAD model in a compatible format (STEP, IGES, SolidWorks, or another format agreed in advance). Arroyo Systems is not responsible for design flaws originating in a model it did not produce.",
  },
  {
    id: "product-development",
    name: "Product Development",
    tagline: "Design and calculation, defined together.",
    price: "€3,550 – €4,300",
    priceNote: "Excl. VAT. Your quote fixes a closed price within this range, depending on complexity.",
    priceInclVat: "€4,295.50 – €5,203.00 incl. 21% VAT",
    leadTime: "10–14 business days",
    revisions: "2 revision cycles included",
    description:
      "One pair of hands defines the design and the calculation together, so the part is born already validated. It is Product Design and Product Validation in a single engagement, with no handover between them.",
    includes: [
      { title: "Optimized CAD Model", description: "Design refined after engineering analysis." },
      { title: "Structural Simulation", description: "Stress, deformation and safety factor calculated using FEM." },
      { title: "Design Optimization", description: "Material removed where possible and reinforced where necessary." },
      { title: "Technical Drawings", description: "Manufacturing documentation ready to send to suppliers." },
      { title: "Engineering Report", description: "Clear evidence that your design meets its intended requirements." },
    ],
    excludes: [
      "Manufacturing the part. The workshop does that; coordinating and technically supervising it is the scope of Product Manufacturing.",
      "Physical testing. The simulation runs on the load and material assumptions agreed with you.",
    ],
  },
  {
    id: "product-manufacturing",
    name: "Product Manufacturing",
    tagline: "Your validated design, manufactured as designed.",
    price: "Technical coordination and supervision",
    priceNote: "The workshop bills you the manufacturing. We bill the technical supervision.",
    priceInclVat: null,
    leadTime: "Lead time depends on the supplier",
    leadTimeSentence: true,
    revisions: null,
    description:
      "We select the right workshop, review its quote against your drawing and tolerances, and supervise the manufacturing through to receipt. You contract the workshop directly, with the manufacturer's price and warranty. We are your technical point of contact.",
    wideIncludes: true,
    includes: [
      { title: "Technical selection of workshops and review of their quotes against the drawing and tolerances." },
      { title: "Technical liaison with the workshop and technical follow-up of the manufacturing." },
      { title: "Technical report on any deviation, so you can decide with sound judgement." },
      { title: "Review of the documentation the workshop provides on receipt." },
      { title: "One round of changes before launch and one incident." },
    ],
    excludes: [
      "Manufacturing, purchasing and delivery of the part are carried out by the workshop, which bills you directly. Any additional work is quoted separately.",
    ],
    howItWorks:
      "You contract and pay the manufacturing directly to the workshop. Arroyo Systems bills only the technical coordination and supervision.",
  },
];

const packagesEs = [
  {
    id: "product-design",
    name: "Product Design",
    tagline: "Una pieza pensada para fabricarse.",
    price: "1.500 € – 1.850 €",
    priceNote: "Sin IVA. Tu presupuesto fija un precio cerrado dentro de este rango, según la complejidad.",
    priceInclVat: "1.815,00 € – 2.238,50 € con IVA del 21%",
    leadTime: "7–10 días hábiles",
    revisions: "1 ciclo de revisión incluido",
    description:
      "Deja de perder semanas arreglando archivos CAD o adivinando cómo se debe fabricar una pieza. La diseñamos bien desde el principio para que puedas pedir presupuestos, construir prototipos y pasar a producción con confianza.",
    includes: [
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
    excludes: [
      "Cálculo estructural. Es el alcance de Product Validation.",
      "Fabricación de la pieza. La realiza el taller; su coordinación y supervisión técnica es el alcance de Product Manufacturing.",
    ],
  },
  {
    id: "product-validation",
    name: "Product Validation",
    tagline: "Comprueba que aguanta antes de fabricar.",
    price: "2.050 € – 2.400 €",
    priceNote: "Sin IVA. Tu presupuesto fija un precio cerrado dentro de este rango, según la complejidad.",
    priceInclVat: "2.480,50 € – 2.904,00 € con IVA del 21%",
    leadTime: "8–11 días hábiles",
    revisions: "1 ciclo de revisión incluido",
    description:
      "Ya tienes un modelo CAD, diseñado internamente o por otro proveedor. Calculamos que aguanta las cargas que nos indicas antes de que te comprometas con utillaje o producción, y te decimos exactamente qué cambiar si no lo hace.",
    includes: [
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
    excludes: [
      "Diseñar la pieza desde cero. Es el alcance de Product Design o Product Development.",
      "Ensayo físico. La simulación se hace sobre las hipótesis de carga y material acordadas contigo.",
    ],
    note: "Requiere que aportes el modelo CAD en un formato compatible (STEP, IGES, SolidWorks u otro formato acordado previamente). Arroyo Systems no se responsabiliza de fallos de diseño originados en un modelo que no ha producido.",
  },
  {
    id: "product-development",
    name: "Product Development",
    tagline: "Diseño y cálculo definidos juntos.",
    price: "3.550 € – 4.300 €",
    priceNote: "Sin IVA. Tu presupuesto fija un precio cerrado dentro de este rango, según la complejidad.",
    priceInclVat: "4.295,50 € – 5.203,00 € con IVA del 21%",
    leadTime: "10–14 días hábiles",
    revisions: "2 ciclos de revisión incluidos",
    description:
      "Una sola mano define el diseño y el cálculo a la vez, para que la pieza nazca ya validada. Es Product Design y Product Validation en un único encargo, sin traspasos entre ellos.",
    includes: [
      { title: "Modelo CAD optimizado", description: "Diseño refinado tras el análisis de ingeniería." },
      {
        title: "Simulación estructural",
        description: "Tensión, deformación y factor de seguridad calculados mediante FEM.",
      },
      {
        title: "Optimización del diseño",
        description: "Material eliminado donde es posible y reforzado donde es necesario.",
      },
      { title: "Planos técnicos", description: "Documentación de fabricación lista para enviar a proveedores." },
      { title: "Informe de ingeniería", description: "Evidencia clara de que tu diseño cumple los requisitos previstos." },
    ],
    excludes: [
      "Fabricación de la pieza. La realiza el taller; su coordinación y supervisión técnica es el alcance de Product Manufacturing.",
      "Ensayo físico. La simulación se hace sobre las hipótesis de carga y material acordadas contigo.",
    ],
  },
  {
    id: "product-manufacturing",
    name: "Product Manufacturing",
    tagline: "Tu diseño validado, fabricado como se diseñó.",
    price: "Coordinación y supervisión técnica",
    priceNote: "El taller te factura la fabricación. Nosotros, la supervisión técnica.",
    priceInclVat: null,
    leadTime: "Plazo según proveedor",
    leadTimeSentence: true,
    revisions: null,
    description:
      "Seleccionamos el taller adecuado, revisamos su oferta contra tu plano y tolerancias y supervisamos la fabricación hasta la recepción. Contratas al taller directamente, con precio y garantía de fabricante. Nosotros somos tu interlocutor técnico.",
    wideIncludes: true,
    includes: [
      { title: "Selección técnica de talleres y revisión de sus ofertas frente al plano y las tolerancias." },
      { title: "Interlocución técnica con el taller y seguimiento técnico de la fabricación." },
      { title: "Informe técnico ante cualquier desviación, para que decidas con criterio." },
      { title: "Revisión de la documentación que aporta el taller a la recepción." },
      { title: "Una ronda de cambios antes del lanzamiento y una incidencia." },
    ],
    excludes: [
      "La fabricación, la compra y la entrega de la pieza las realiza el taller, que te factura directamente. Cualquier trabajo adicional se presupuesta aparte.",
    ],
    howItWorks:
      "Contratas y pagas la fabricación directamente al taller. Arroyo Systems factura únicamente la coordinación y supervisión técnica.",
  },
];

export const content = {
  en: {
    lang: "en",
    nav: {
      solutions: "Products",
      process: "How We Work",
      partners: "Software & Partners",
      contact: "Contact",
    },
    hero: {
      titleLines: ["We design.", "We calculate.", "We manufacture"],
      body: ["Machined and bent sheet metal.", "A supplier you can trust."],
      ctaPrimary: "Tell us what you need",
      ctaSecondary: "See pricing",
      trust: ["Signed and certified project", "Closed price", "Competitive lead times"],
      flowTitle: "From concept to production.",
      viewerInputs: { label: "Requirements", note: "Envelope · Interfaces · Constraints" },
      viewerResult: { label: "Result", note: "Design · Calculation · Manufacturing" },
    },
    products: {
      heading: "Products",
      subtitle:
        "Machined and bent sheet-metal parts, in steel and aluminium, with bolted joints and spot welding.",
      includesLabel: "What's included",
      howLabel: "How it works",
      signedLine: "Project signed by an engineer and endorsed by the engineers' professional association.",
      excludesLabel: "What's not included",
      detailsLink: "What's included",
      leadTimeLabel: "Lead time",
      revisionsLabel: "Revisions",
      viewDetailsAria: (name) => `View what ${name} includes`,
      packages: packagesEn,
    },
    process: {
      heading: "How We Work",
      subtitle: "You talk to the engineer who calculates your part.",
      figureCaption: "Result of a structural calculation (FEM)",
      promises: [
        {
          title: "One technical point of contact.",
          body: "We design, calculate and supervise the manufacturing. We deliver the project signed by an engineer and endorsed by the engineers' professional association.",
        },
        {
          title: "Designed to be manufactured.",
          body: "The design is born thinking about how it will be made, with no back and forth over tolerances or material.",
        },
        {
          title: "Closed price, in writing.",
          body: "You know what you pay before we start. A quote with the objectives and the detailed scope.",
        },
      ],
      steps: [
        { title: "You tell us", body: "Mechanical interfaces, loads, quantity and lead time." },
        { title: "Closed quote", body: "With the scope in writing: deliverables, revisions and exclusions." },
        { title: "We design and calculate", body: "The part, designed for manufacturing and structurally validated." },
        {
          title: "Technical supervision",
          body: "We coordinate with the workshop until the part is received.",
        },
      ],
    },
    partners: {
      heading: "Software & Partners",
      subtitle: "We design and calculate with industry-reference tools.",
      softwareLabel: "Software",
      softwareItems: [
        { id: "fusion", name: "Autodesk Fusion", logo: "autodeskFusionLogo" },
        { id: "inventor-nastran", name: "Autodesk Inventor Nastran", logo: "autodeskNastranLogo" },
      ],
      trademark: [
        "Autodesk, the Autodesk logo, Fusion and Inventor are registered trademarks or trademarks of Autodesk, Inc.",
        "Arroyo Systems is not affiliated with or endorsed by Autodesk.",
      ],
      partnersLabel: "Partners",
      items: [{ id: "3dconnexion", name: "3Dconnexion", logo: "threeDConnexionLogo" }],
    },
    contact: {
      heading1: "Tell us",
      heading2: "what you need.",
      subheading: "Describe your project. We take care of the rest.",
      emailLabel: "Email",
      locationTitle: "Location",
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
        { value: "Product Manufacturing", label: "Product Manufacturing" },
        { value: "Other", label: "Other" },
      ],
      privacyPrefix: "I have read and accept the",
      privacyLinkText: "Privacy Policy",
      submit: "Tell us what you need",
      sending: "Sending…",
      sendError: "We could not send your message. Please try again or write to us at",
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
        title: "Arroyo Systems | We design, calculate and manufacture your part.",
        description:
          "Machined and bent sheet-metal parts in steel and aluminium. Design, structural calculation and technical supervision of manufacturing, with a signed and endorsed project and a closed price.",
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
    nav: {
      solutions: "Productos",
      process: "Cómo trabajamos",
      partners: "Software y Colaboradores",
      contact: "Contacto",
    },
    hero: {
      titleLines: ["Diseñamos.", "Calculamos.", "Fabricamos"],
      body: ["Mecanizado y chapa doblada.", "Un proveedor en el que puedes confiar."],
      ctaPrimary: "Cuéntanos qué necesitas",
      ctaSecondary: "Ver precios",
      trust: ["Proyecto firmado y visado", "Precio cerrado", "Plazos competitivos"],
      flowTitle: "Del planteamiento a producción.",
      viewerInputs: { label: "Requisitos", note: "Envolvente · Interfaces · Restricciones" },
      viewerResult: { label: "Resultado", note: "Diseño · Cálculo · Fabricación" },
    },
    products: {
      heading: "Productos",
      subtitle:
        "Piezas mecanizadas y de chapa doblada, en acero y aluminio, con uniones atornilladas y soldadura puntual.",
      includesLabel: "Qué incluye",
      howLabel: "Cómo funciona",
      signedLine: "Proyecto firmado por ingeniero y visado por el colegio de ingenieros.",
      excludesLabel: "Qué no incluye",
      detailsLink: "Qué incluye",
      leadTimeLabel: "Plazo",
      revisionsLabel: "Revisiones",
      viewDetailsAria: (name) => `Ver qué incluye ${name}`,
      packages: packagesEs,
    },
    process: {
      heading: "Cómo trabajamos",
      subtitle: "Hablas con el ingeniero que calcula tu pieza.",
      figureCaption: "Resultado de un cálculo estructural (FEM)",
      promises: [
        {
          title: "Un único interlocutor técnico.",
          body: "Diseñamos, calculamos y supervisamos la fabricación. Entregamos el proyecto firmado por ingeniero y visado por el colegio de ingenieros.",
        },
        {
          title: "Diseñado para fabricarse.",
          body: "El diseño nace pensando en cómo se fabrica, sin idas y venidas por tolerancias o material.",
        },
        {
          title: "Precio cerrado, por escrito.",
          body: "Sabes lo que pagas antes de empezar. Presupuesto con los objetivos y el alcance detallado.",
        },
      ],
      steps: [
        { title: "Nos cuentas", body: "Interfaces mecánicas, cargas, cantidad y plazo." },
        { title: "Presupuesto cerrado", body: "Con el alcance por escrito: entregables, revisiones y exclusiones." },
        { title: "Diseñamos y calculamos", body: "La pieza, pensada para fabricación y validada estructuralmente." },
        {
          title: "Supervisión técnica",
          body: "Coordinamos con el taller hasta la recepción de la pieza.",
        },
      ],
    },
    partners: {
      heading: "Software y Colaboradores",
      subtitle: "Diseñamos y calculamos con herramientas de referencia en la industria.",
      softwareLabel: "Software",
      softwareItems: [
        { id: "fusion", name: "Autodesk Fusion", logo: "autodeskFusionLogo" },
        { id: "inventor-nastran", name: "Autodesk Inventor Nastran", logo: "autodeskNastranLogo" },
      ],
      trademark: [
        "Autodesk, el logotipo de Autodesk, Fusion e Inventor son marcas comerciales o marcas registradas de Autodesk, Inc.",
        "Arroyo Systems no está afiliada ni respaldada por Autodesk.",
      ],
      partnersLabel: "Colaboradores",
      items: [{ id: "3dconnexion", name: "3Dconnexion", logo: "threeDConnexionLogo" }],
    },
    contact: {
      heading1: "Cuéntanos",
      heading2: "qué necesitas.",
      subheading: "Describe tu proyecto. Nosotros nos ocupamos del resto.",
      emailLabel: "Correo",
      locationTitle: "Ubicación",
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
        { value: "Product Manufacturing", label: "Product Manufacturing" },
        { value: "Other", label: "Otro" },
      ],
      privacyPrefix: "He leído y acepto la",
      privacyLinkText: "Política de Privacidad",
      submit: "Cuéntanos qué necesitas",
      sending: "Enviando…",
      sendError: "No hemos podido enviar tu mensaje. Inténtalo de nuevo o escríbenos a",
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
        title: "Arroyo Systems | Diseñamos, calculamos y fabricamos tu pieza.",
        description:
          "Piezas mecanizadas y de chapa doblada, en acero y aluminio. Diseño, cálculo estructural y supervisión técnica de la fabricación, con proyecto firmado y visado y precio cerrado.",
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
