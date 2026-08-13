import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLang } from "../i18n/useLang";

const CONTACT_EMAIL = "contact@arroyo-systems.com";

const Section = ({ title, children }) => (
  <section className="legal-section">
    <h2>{title}</h2>
    <div>{children}</div>
  </section>
);

const LegalLayout = ({ title, updated, children }) => (
  <div className="App">
    <Header />
    <main className="legal-page">
      <div className="arroyo-container">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[color:var(--arroyo-accent)]">
          Arroyo Systems
        </p>
        <h1 className="section-heading mt-4">{title}</h1>
        <p className="arroyo-body mt-4 max-w-3xl">{updated}</p>
        <div className="legal-content">{children}</div>
      </div>
    </main>
    <Footer />
  </div>
);

const ContactEmailLink = () => (
  <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>
    {CONTACT_EMAIL}
  </a>
);

// ---------- Privacy Policy ----------

const PrivacyPolicyEN = () => (
  <LegalLayout title="Privacy Policy" updated="Last updated: July 5, 2026">
    <Section title="Data controller">
      <p>
        The controller for this website is Marcos Arroyo Navarro, operating under the commercial
        name Arroyo Systems.
      </p>
      <p>NIF: 04262555B</p>
      <p>Registered address: Av. Planetario 6, 28045 Madrid, Spain</p>
      <p>
        Contact email: <ContactEmailLink />
      </p>
    </Section>

    <Section title="Data collected">
      <p>
        The contact form may collect name, email address, company, project type, message, privacy
        policy acceptance, date of acceptance, and privacy policy version. Technical data strictly
        necessary for security, service operation, diagnostics, and abuse prevention may also be
        processed, such as IP address, user agent, request metadata, and server logs.
      </p>
    </Section>

    <Section title="Purpose and legal basis">
      <p>
        Data is processed to answer contact requests, assess engineering enquiries, manage project
        assessment, prepare possible proposals, and maintain records of privacy consent. The legal
        bases are the user's consent, the application of pre-contractual measures requested by the
        user, and Arroyo Systems' legitimate interest in securing the website and preventing abuse.
      </p>
    </Section>

    <Section title="Retention">
      <p>
        Contact requests will generally be retained for up to 12 months from the last
        communication, unless a contractual relationship is created or a longer period is required
        to comply with legal obligations, defend claims, or protect the service from misuse.
      </p>
    </Section>

    <Section title="User rights">
      <p>
        Users may request access, rectification, erasure, objection, restriction of processing, and
        portability of their data by contacting <ContactEmailLink />. Users may also lodge a
        complaint with the Spanish Data Protection Authority (AEPD) if they consider that their
        rights have not been properly addressed.
      </p>
    </Section>

    <Section title="Processors">
      <p>
        Arroyo Systems uses technical providers necessary to operate the website and contact
        workflow. These may include GitHub Pages for frontend hosting, Render for backend/API
        hosting, MongoDB Atlas for database storage, Resend for email notifications, and Cloudflare
        for DNS, security, and domain infrastructure.
      </p>
      <p>
        These providers may process data outside the European Economic Area under their applicable
        contractual safeguards and data processing terms.
      </p>
    </Section>
  </LegalLayout>
);

const PrivacyPolicyES = () => (
  <LegalLayout title="Política de Privacidad" updated="Última actualización: 5 de julio de 2026">
    <Section title="Responsable del tratamiento">
      <p>
        El responsable de esta web es Marcos Arroyo Navarro, operando bajo el nombre comercial
        Arroyo Systems.
      </p>
      <p>NIF: 04262555B</p>
      <p>Domicilio: Av. Planetario 6, 28045 Madrid, España</p>
      <p>
        Email de contacto: <ContactEmailLink />
      </p>
    </Section>

    <Section title="Datos recopilados">
      <p>
        El formulario de contacto puede recopilar nombre, email, empresa, tipo de proyecto,
        mensaje, aceptación de la política de privacidad, fecha de aceptación y versión de la
        política de privacidad. También pueden tratarse datos técnicos estrictamente necesarios
        para la seguridad, el funcionamiento del servicio, el diagnóstico y la prevención de
        abusos, como la dirección IP, el user agent, metadatos de la petición y logs del servidor.
      </p>
    </Section>

    <Section title="Finalidad y base legal">
      <p>
        Los datos se tratan para responder a solicitudes de contacto, evaluar consultas de
        ingeniería, gestionar la evaluación de proyectos, preparar posibles propuestas y mantener
        registro del consentimiento de privacidad. Las bases legales son el consentimiento del
        usuario, la aplicación de medidas precontractuales solicitadas por el usuario, y el interés
        legítimo de Arroyo Systems en proteger la web y prevenir abusos.
      </p>
    </Section>

    <Section title="Conservación">
      <p>
        Las solicitudes de contacto se conservarán generalmente hasta 12 meses desde la última
        comunicación, salvo que se establezca una relación contractual o se requiera un plazo mayor
        para cumplir obligaciones legales, defender reclamaciones o proteger el servicio frente a un
        mal uso.
      </p>
    </Section>

    <Section title="Derechos del usuario">
      <p>
        Los usuarios pueden solicitar acceso, rectificación, supresión, oposición, limitación del
        tratamiento y portabilidad de sus datos escribiendo a <ContactEmailLink />. Los usuarios
        también pueden presentar una reclamación ante la Agencia Española de Protección de Datos
        (AEPD) si consideran que sus derechos no han sido debidamente atendidos.
      </p>
    </Section>

    <Section title="Encargados del tratamiento">
      <p>
        Arroyo Systems utiliza proveedores técnicos necesarios para operar la web y el proceso de
        contacto. Estos pueden incluir GitHub Pages para el alojamiento del frontend, Render para
        el alojamiento del backend/API, MongoDB Atlas para el almacenamiento de la base de datos,
        Resend para las notificaciones por email, y Cloudflare para DNS, seguridad e infraestructura
        de dominio.
      </p>
      <p>
        Estos proveedores pueden tratar datos fuera del Espacio Económico Europeo conforme a sus
        garantías contractuales y términos de tratamiento de datos aplicables.
      </p>
    </Section>
  </LegalLayout>
);

export const PrivacyPolicy = () => (useLang() === "es" ? <PrivacyPolicyES /> : <PrivacyPolicyEN />);

// ---------- Legal Notice ----------

const LegalNoticeEN = () => (
  <LegalLayout title="Legal Notice" updated="Last updated: July 5, 2026">
    <Section title="Website owner">
      <p>Owner: Marcos Arroyo Navarro</p>
      <p>Commercial name: Arroyo Systems</p>
      <p>NIF: 04262555B</p>
      <p>Registered address: Av. Planetario 6, 28045 Madrid, Spain</p>
      <p>Website: arroyo-systems.com</p>
      <p>
        Contact email: <ContactEmailLink />
      </p>
    </Section>

    <Section title="Activity">
      <p>
        Arroyo Systems provides engineering services, design for manufacturing (DFM), structural
        validation, manufacturability assessment, technical project assessment, and engineering
        consulting.
      </p>
      <p>
        This website does not sell products or services directly. It is intended to provide
        information and receive contact or project assessment requests.
      </p>
    </Section>

    <Section title="Use of the website">
      <p>
        Users must use this website lawfully and must not attempt to damage, overload, interfere
        with, or gain unauthorized access to its systems, services, or data.
      </p>
    </Section>

    <Section title="Intellectual property">
      <p>
        The texts, images, brand elements, design, and content of this website belong to Arroyo
        Systems or are used under the corresponding rights. Unauthorized reproduction,
        distribution, or modification is not allowed.
      </p>
    </Section>

    <Section title="Liability">
      <p>
        Arroyo Systems works to keep the information on this website accurate and available, but
        does not guarantee uninterrupted access or the absence of errors. The website content is
        provided for general informational and commercial contact purposes.
      </p>
      <p>
        Any technical information, preliminary assessment, estimate, or proposal provided through
        or after using this website is not binding until it is expressly confirmed in writing by
        Arroyo Systems. Engineering decisions must be validated against the specific project
        requirements, applicable regulations, manufacturing constraints, and final documentation.
      </p>
    </Section>

    <Section title="Applicable law">
      <p>
        This website is governed by Spanish law. Unless a mandatory rule states otherwise, any
        dispute will be submitted to the competent courts of Madrid, Spain.
      </p>
    </Section>
  </LegalLayout>
);

const LegalNoticeES = () => (
  <LegalLayout title="Aviso Legal" updated="Última actualización: 5 de julio de 2026">
    <Section title="Titular de la web">
      <p>Titular: Marcos Arroyo Navarro</p>
      <p>Nombre comercial: Arroyo Systems</p>
      <p>NIF: 04262555B</p>
      <p>Domicilio: Av. Planetario 6, 28045 Madrid, España</p>
      <p>Web: arroyo-systems.com</p>
      <p>
        Email de contacto: <ContactEmailLink />
      </p>
    </Section>

    <Section title="Actividad">
      <p>
        Arroyo Systems presta servicios de ingeniería, diseño para fabricación (DFM), validación
        estructural, evaluación de fabricabilidad, evaluación técnica de proyectos y consultoría de
        ingeniería.
      </p>
      <p>
        Esta web no vende productos ni servicios de forma directa. Su finalidad es proporcionar
        información y recibir solicitudes de contacto o evaluación de proyectos.
      </p>
    </Section>

    <Section title="Uso de la web">
      <p>
        Los usuarios deben utilizar esta web de forma lícita y no deben intentar dañar, sobrecargar,
        interferir con, ni acceder sin autorización a sus sistemas, servicios o datos.
      </p>
    </Section>

    <Section title="Propiedad intelectual">
      <p>
        Los textos, imágenes, elementos de marca, diseño y contenidos de esta web pertenecen a
        Arroyo Systems o se utilizan bajo los derechos correspondientes. No se permite su
        reproducción, distribución o modificación sin autorización.
      </p>
    </Section>

    <Section title="Responsabilidad">
      <p>
        Arroyo Systems trabaja para mantener la información de esta web actualizada y disponible,
        pero no garantiza un acceso ininterrumpido ni la ausencia de errores. El contenido de la web
        se ofrece con fines informativos generales y de contacto comercial.
      </p>
      <p>
        Cualquier información técnica, evaluación preliminar, estimación o propuesta facilitada a
        través de esta web, o tras su uso, no es vinculante hasta que sea confirmada expresamente
        por escrito por Arroyo Systems. Las decisiones de ingeniería deben validarse frente a los
        requisitos específicos del proyecto, la normativa aplicable, las restricciones de
        fabricación y la documentación final.
      </p>
    </Section>

    <Section title="Ley aplicable">
      <p>
        Esta web se rige por la legislación española. Salvo que una norma imperativa disponga lo
        contrario, cualquier controversia se someterá a los tribunales competentes de Madrid,
        España.
      </p>
    </Section>
  </LegalLayout>
);

export const LegalNotice = () => (useLang() === "es" ? <LegalNoticeES /> : <LegalNoticeEN />);

// ---------- Cookies Policy ----------

const CookiesPolicyEN = () => (
  <LegalLayout title="Cookies Policy" updated="Last updated: July 5, 2026">
    <Section title="Use of cookies">
      <p>
        This website does not intentionally use non-essential cookies for advertising or
        behavioral profiling. Technical cookies or similar local storage mechanisms may be used
        only where necessary for basic operation, security, or session management.
      </p>
      <p>
        Because the website currently uses only technical or strictly necessary storage, a cookie
        consent banner is not required at this stage. If analytics, advertising, remarketing, or
        behavioral tracking tools are added later, visitors must be given a clear option to accept,
        reject, or configure those cookies before they are loaded.
      </p>
    </Section>

    <Section title="External resources">
      <p>
        The website may load external technical resources needed to operate the service, including
        GitHub Pages, Render, MongoDB Atlas, Resend, and Cloudflare. These resources are used for
        hosting, API operation, data storage, email notifications, DNS, security, and
        infrastructure.
      </p>
      <p>
        Arroyo Systems does not currently use Google Analytics, Meta Pixel, LinkedIn Insight Tag,
        Hotjar, or similar analytics or advertising tracking tools. If such tools are added later,
        this policy and the consent mechanism must be updated before activation.
      </p>
    </Section>

    <Section title="Managing cookies">
      <p>
        Users can manage or block cookies through their browser settings. Some technical features
        may not work correctly if strictly necessary storage is disabled.
      </p>
    </Section>
  </LegalLayout>
);

const CookiesPolicyES = () => (
  <LegalLayout title="Política de Cookies" updated="Última actualización: 5 de julio de 2026">
    <Section title="Uso de cookies">
      <p>
        Esta web no utiliza intencionadamente cookies no esenciales con fines publicitarios o de
        perfilado de comportamiento. Pueden usarse cookies técnicas o mecanismos de almacenamiento
        local similares únicamente cuando sean necesarios para el funcionamiento básico, la
        seguridad o la gestión de sesión.
      </p>
      <p>
        Dado que la web utiliza actualmente solo almacenamiento técnico o estrictamente necesario,
        no se requiere un banner de consentimiento de cookies en esta fase. Si en el futuro se
        añaden herramientas de analítica, publicidad, remarketing o seguimiento de comportamiento,
        se ofrecerá a los visitantes una opción clara para aceptar, rechazar o configurar esas
        cookies antes de que se carguen.
      </p>
    </Section>

    <Section title="Recursos externos">
      <p>
        La web puede cargar recursos técnicos externos necesarios para operar el servicio,
        incluyendo GitHub Pages, Render, MongoDB Atlas, Resend y Cloudflare. Estos recursos se
        utilizan para alojamiento, funcionamiento de la API, almacenamiento de datos, notificaciones
        por email, DNS, seguridad e infraestructura.
      </p>
      <p>
        Arroyo Systems no utiliza actualmente Google Analytics, Meta Pixel, LinkedIn Insight Tag,
        Hotjar ni herramientas similares de analítica o seguimiento publicitario. Si en el futuro se
        añaden estas herramientas, esta política y el mecanismo de consentimiento deberán
        actualizarse antes de su activación.
      </p>
    </Section>

    <Section title="Gestión de cookies">
      <p>
        Los usuarios pueden gestionar o bloquear las cookies desde la configuración de su
        navegador. Algunas funciones técnicas pueden no funcionar correctamente si se desactiva el
        almacenamiento estrictamente necesario.
      </p>
    </Section>
  </LegalLayout>
);

export const CookiesPolicy = () => (useLang() === "es" ? <CookiesPolicyES /> : <CookiesPolicyEN />);
