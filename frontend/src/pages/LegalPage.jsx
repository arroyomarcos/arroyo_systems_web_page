import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
        <p className="arroyo-body mt-4 max-w-3xl">Last updated: {updated}</p>
        <div className="legal-content">{children}</div>
      </div>
    </main>
    <Footer />
  </div>
);

export const PrivacyPolicy = () => (
  <LegalLayout title="Privacy Policy" updated="July 5, 2026">
    <Section title="Data controller">
      <p>
        The controller for this website is [NOMBRE COMPLETO / RAZON SOCIAL],
        operating under the commercial name Arroyo Systems.
      </p>
      <p>NIF/CIF: [NIF / CIF]</p>
      <p>Registered address: [DOMICILIO FISCAL]</p>
      <p>
        Contact email: <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </Section>

    <Section title="Data collected">
      <p>
        The contact form may collect name, email address, company, project type,
        and message. Technical data strictly necessary for security and abuse
        prevention may also be processed, such as a hashed IP address and user
        agent.
      </p>
    </Section>

    <Section title="Purpose and legal basis">
      <p>
        Data is processed to answer contact requests, evaluate enquiries, and
        manage commercial or pre-contractual communications. The legal bases are
        the user's consent and the legitimate pre-contractual interest in
        responding to the request.
      </p>
    </Section>

    <Section title="Retention">
      <p>
        Data will be retained only for the time necessary to manage the enquiry
        and any related communication, unless a longer period is required by law.
      </p>
    </Section>

    <Section title="User rights">
      <p>
        Users may request access, rectification, erasure, objection, restriction
        of processing, and portability of their data by contacting{" "}
        <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </Section>

    <Section title="Processors">
      <p>
        Arroyo Systems may use technical providers necessary to operate the
        website and contact workflow, including hosting, database, email, and
        infrastructure or security providers.
      </p>
    </Section>
  </LegalLayout>
);

export const LegalNotice = () => (
  <LegalLayout title="Legal Notice" updated="July 5, 2026">
    <Section title="Website owner">
      <p>Owner: [NOMBRE COMPLETO / RAZON SOCIAL]</p>
      <p>Commercial name: Arroyo Systems</p>
      <p>NIF/CIF: [NIF / CIF]</p>
      <p>Registered address: [DOMICILIO FISCAL]</p>
      <p>
        Contact email: <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </Section>

    <Section title="Use of the website">
      <p>
        Users must use this website lawfully and must not attempt to damage,
        overload, interfere with, or gain unauthorized access to its systems,
        services, or data.
      </p>
    </Section>

    <Section title="Intellectual property">
      <p>
        The texts, images, brand elements, design, and content of this website
        belong to Arroyo Systems or are used under the corresponding rights.
        Unauthorized reproduction, distribution, or modification is not allowed.
      </p>
    </Section>

    <Section title="Liability">
      <p>
        Arroyo Systems works to keep the information on this website accurate
        and available, but does not guarantee uninterrupted access or the absence
        of errors. The website content is provided for general informational and
        commercial contact purposes.
      </p>
    </Section>
  </LegalLayout>
);

export const CookiesPolicy = () => (
  <LegalLayout title="Cookies Policy" updated="July 5, 2026">
    <Section title="Use of cookies">
      <p>
        This website does not intentionally use non-essential cookies for
        advertising or behavioral profiling. Technical cookies or similar local
        storage mechanisms may be used only where necessary for basic operation,
        security, or session management.
      </p>
    </Section>

    <Section title="External resources">
      <p>
        The website may load external technical resources such as web fonts,
        hosting/CDN assets, backend API services, or anti-spam protection if
        enabled. If analytics, advertising pixels, Hotjar, reCAPTCHA, Turnstile,
        or similar tools are added later, this policy should be updated before
        activation.
      </p>
    </Section>

    <Section title="Managing cookies">
      <p>
        Users can manage or block cookies through their browser settings. Some
        technical features may not work correctly if strictly necessary storage
        is disabled.
      </p>
    </Section>
  </LegalLayout>
);
