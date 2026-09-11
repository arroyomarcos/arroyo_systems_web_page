import React from "react";
import { LINKEDIN_URL, EMAIL, ASSETS } from "../mock";
import { Linkedin, Mail, MapPin, ArrowRight } from "lucide-react";
import ContactForm from "./ContactForm";
import { useLang, useContent } from "../i18n/useLang";

// Lands on the top of the contact section, exactly like the hero's "Start a
// project" link and the header's contact button. Scrolling the name input into
// view instead leaves the section cropped mid-form, so the cursor is placed
// with preventScroll to keep the landing position identical.
const focusContactForm = (e) => {
  e.preventDefault();
  const section = document.getElementById("contact");
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  const nameInput = document.getElementById("contact-name");
  if (nameInput) nameInput.focus({ preventScroll: true });
};

const Footer = () => {
  const lang = useLang();
  const base = lang === "es" ? "/es" : "";
  const t = useContent().contact;

  return (
    <footer id="contact" className="relative py-20 md:py-28 bg-white border-t border-slate-100">
      <div className="arroyo-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-12 lg:gap-20 items-start">
          <div>
            <h2 className="section-heading">
              {t.heading1}
              <br />
              {t.heading2}
            </h2>
            <p className="arroyo-body text-lg md:text-xl mt-6 max-w-md">{t.subheading}</p>
            <a href="#contact" onClick={focusContactForm} className="contact-pill mt-8">
              {t.cta} <ArrowRight size={16} />
            </a>

            <ul className="mt-10 space-y-5">
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[color:var(--arroyo-accent)]" />
                <a
                  href={`mailto:${EMAIL}`}
                  className="text-base md:text-lg text-[color:var(--arroyo-navy)] font-medium hover:text-[color:var(--arroyo-accent)] transition-colors"
                >
                  {EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={18} className="text-[color:var(--arroyo-accent)]" />
                <span className="text-base md:text-lg text-[color:var(--arroyo-navy)] font-medium">
                  {t.locationLabel}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Linkedin size={18} className="text-[color:var(--arroyo-accent)]" />
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base md:text-lg text-[color:var(--arroyo-navy)] font-medium hover:text-[color:var(--arroyo-accent)] transition-colors"
                >
                  {t.linkedinLabel}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact form */}
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[color:var(--arroyo-accent)] mb-4">
              {t.formEyebrow}
            </p>
            <ContactForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 md:mt-24 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="logo-badge">
              <img
                src={ASSETS.logo}
                alt="Arroyo Systems"
                className="logo-img h-8 w-auto object-contain"
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
