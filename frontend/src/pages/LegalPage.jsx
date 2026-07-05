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
        The controller for this website is Marcos Arroyo Navarro, operating
        under the commercial name Arroyo Systems.
      </p>
      <p>NIF: 04262555B</p>
      <p>Registered address: Av. Planetario 6, 28045 Madrid, Spain</p>
      <p>
        Contact email: <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </Section>

    <Section title="Data collected">
      <p>
        The contact form may collect name, email address, company, project type,
        message, privacy policy acceptance, date of acceptance, and privacy
        policy version. Technical data strictly necessary for security, service
        operation, diagnostics, and abuse prevention may also be processed, such
        as IP address, user agent, request metadata, and server logs.
      </p>
    </Section>

    <Section title="Purpose and legal basis">
      <p>
        Data is processed to answer contact requests, assess engineering
        enquiries, manage project assessment, prepare possible proposals, and
        maintain records of privacy consent. The legal bases are the user's
        consent, the application of pre-contractual measures requested by the
        user, and Arroyo Systems' legitimate interest in securing the website
        and preventing abuse.
      </p>
    </Section>

    <Section title="Retention">
      <p>
        Contact requests will generally be retained for up to 12 months from
        the last communication, unless a contractual relationship is created or
        a longer period is required to comply with legal obligations, defend
        claims, or protect the service from misuse.
      </p>
    </Section>

    <Section title="User rights">
      <p>
        Users may request access, rectification, erasure, objection, restriction
        of processing, and portability of their data by contacting{" "}
        <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        Users may also lodge a complaint with the Spanish Data Protection
        Authority (AEPD) if they consider that their rights have not been
        properly addressed.
      </p>
    </Section>

    <Section title="Processors">
      <p>
        Arroyo Systems uses technical providers necessary to operate the
        website and contact workflow. These may include GitHub Pages for
        frontend hosting, Render for backend/API hosting, MongoDB Atlas for
        database storage, Resend for email notifications, and Cloudflare for DNS,
        security, and domain infrastructure.
      </p>
      <p>
        These providers may process data outside the European Economic Area
        under their applicable contractual safeguards and data processing terms.
      </p>
    </Section>
  </LegalLayout>
);

export const LegalNotice = () => (
  <LegalLayout title="Legal Notice" updated="July 5, 2026">
    <Section title="Website owner">
      <p>Owner: Marcos Arroyo Navarro</p>
      <p>Commercial name: Arroyo Systems</p>
      <p>NIF: 04262555B</p>
      <p>Registered address: Av. Planetario 6, 28045 Madrid, Spain</p>
      <p>Website: arroyo-systems.com</p>
      <p>
        Contact email: <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </Section>

    <Section title="Activity">
      <p>
        Arroyo Systems provides engineering services, design for manufacturing
        (DFM), structural validation, manufacturability assessment, technical
        project assessment, and engineering consulting.
      </p>
      <p>
        This website does not sell products or services directly. It is intended
        to provide information and receive contact or project assessment
        requests.
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
      <p>
        Any technical information, preliminary assessment, estimate, or proposal
        provided through or after using this website is not binding until it is
        expressly confirmed in writing by Arroyo Systems. Engineering decisions
        must be validated against the specific project requirements, applicable
        regulations, manufacturing constraints, and final documentation.
      </p>
    </Section>

    <Section title="Applicable law">
      <p>
        This website is governed by Spanish law. Unless a mandatory rule states
        otherwise, any dispute will be submitted to the competent courts of
        Madrid, Spain.
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
      <p>
        Because the website currently uses only technical or strictly necessary
        storage, a cookie consent banner is not required at this stage. If
        analytics, advertising, remarketing, or behavioral tracking tools are
        added later, visitors must be given a clear option to accept, reject, or
        configure those cookies before they are loaded.
      </p>
    </Section>

    <Section title="External resources">
      <p>
        The website may load external technical resources needed to operate the
        service, including GitHub Pages, Render, MongoDB Atlas, Resend, and
        Cloudflare. These resources are used for hosting, API operation, data
        storage, email notifications, DNS, security, and infrastructure.
      </p>
      <p>
        Arroyo Systems does not currently use Google Analytics, Meta Pixel,
        LinkedIn Insight Tag, Hotjar, or similar analytics or advertising
        tracking tools. If such tools are added later, this policy and the
        consent mechanism must be updated before activation.
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
