import React from "react";
import { LINKEDIN_URL, EMAIL, ASSETS } from "../mock";
import ContactForm from "./ContactForm";
import { useLang, useContent } from "../i18n/useLang";

const Footer = () => {
  const lang = useLang();
  const base = lang === "es" ? "/es" : "";
  const t = useContent().contact;

  return (
    <footer id="contact" className="relative py-20 md:py-28 bg-white border-t border-[color:var(--arroyo-line)]">
      <div className="arroyo-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-12 lg:gap-20 items-start">
          <div>
            <h2 className="section-heading">
              {t.heading1}
              <br />
              {t.heading2}
            </h2>
            <p className="section-lead mt-6 max-w-md">{t.subheading}</p>

            <dl className="contact-details mt-10">
              <div>
                <dt>{t.emailLabel}</dt>
                <dd>
                  <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </dd>
              </div>
              <div>
                <dt>{t.locationTitle}</dt>
                <dd>{t.locationLabel}</dd>
              </div>
              <div>
                <dt>LinkedIn</dt>
                <dd>
                  <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="link-chevron">
                    {t.linkedinLabel}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* Contact form */}
          <div>
            <p className="eyebrow mb-4">
              {t.formEyebrow}
            </p>
            <ContactForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 md:mt-24 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-3">
          <div className="flex items-center gap-2">
            <span className="logo-badge">
              <img
                src={ASSETS.logo}
                alt="Arroyo Systems"
                className="logo-img h-10 w-auto object-contain"
              />
            </span>
          </div>
          <p className="text-xs text-[color:var(--arroyo-muted)]">{t.copyright(new Date().getFullYear())}</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[color:var(--arroyo-muted)]">
            <a className="hover:text-[color:var(--arroyo-accent)] transition-colors" href={`${base}/privacy-policy`}>
              {t.privacyPolicy}
            </a>
            <a className="hover:text-[color:var(--arroyo-accent)] transition-colors" href={`${base}/legal-notice`}>
              {t.legalNotice}
            </a>
            <a className="hover:text-[color:var(--arroyo-accent)] transition-colors" href={`${base}/cookies-policy`}>
              {t.cookiesPolicy}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
