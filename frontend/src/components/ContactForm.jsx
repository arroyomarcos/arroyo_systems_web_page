import React, { useCallback, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { submitContact } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { INITIAL_FORM, buildContactPayload, validateContactForm } from "../lib/contactFormValidation";
import { useLang, useContent } from "../i18n/useLang";

// ---------- Sub-components (kept small & memoisable) ----------

const TextField = ({ label, error, children }) => (
  <label className="cf-field">
    <span className="cf-label">{label}</span>
    {children}
    {error && <span className="cf-error-text">{error}</span>}
  </label>
);

const SuccessCard = ({ onReset, t }) => (
  <div className="contact-form-success">
    <CheckCircle2 size={40} className="text-[color:var(--arroyo-accent)]" />
    <h3 className="arroyo-display text-xl md:text-2xl mt-4">{t.successTitle}</h3>
    <p className="arroyo-body mt-2 max-w-sm">{t.successBody}</p>
    <button className="contact-pill mt-6" onClick={onReset}>
      {t.sendAnother}
    </button>
  </div>
);

// ---------- Main component ----------

const ContactForm = () => {
  const lang = useLang();
  const t = useContent().contactForm;
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const onChange = useCallback(
    (field) => (ev) => {
      const value = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    },
    []
  );

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitted(false);
  }, []);

  const onSubmit = useCallback(
    (ev) => {
      ev.preventDefault();
      const validationErrors = validateContactForm(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Show the confirmation immediately — the request keeps sending in the
      // background so a slow/cold backend doesn't stall the user's feedback.
      const payload = buildContactPayload(form);
      setSubmitted(true);
      setForm(INITIAL_FORM);
      setErrors({});

      submitContact(payload).catch((err) => {
        const detail = err?.response?.data?.detail;
        toast({
          title: t.errorToastTitle,
          description: typeof detail === "string" ? detail : t.errorToastBody,
          variant: "destructive",
        });
      });
    },
    [form, toast, t]
  );

  if (submitted) return <SuccessCard onReset={resetForm} t={t} />;

  return (
    <form onSubmit={onSubmit} className="contact-form" noValidate>
      <div className="cf-row">
        <TextField label={t.nameLabel} error={errors.name && t.validation[errors.name]}>
          <input
            id="contact-name"
            type="text"
            value={form.name}
            onChange={onChange("name")}
            className={`cf-input ${errors.name ? "cf-error" : ""}`}
            placeholder={t.namePlaceholder}
            autoComplete="name"
          />
        </TextField>
        <TextField label={t.emailLabel} error={errors.email && t.validation[errors.email]}>
          <input
            type="email"
            value={form.email}
            onChange={onChange("email")}
            className={`cf-input ${errors.email ? "cf-error" : ""}`}
            placeholder={t.emailPlaceholder}
            autoComplete="email"
          />
        </TextField>
      </div>

      <div className="cf-row">
        <TextField label={t.companyLabel}>
          <input
            type="text"
            value={form.company}
            onChange={onChange("company")}
            className="cf-input"
            placeholder={t.companyPlaceholder}
            autoComplete="organization"
          />
        </TextField>
        <TextField label={t.projectTypeLabel}>
          <select
            value={form.project_type}
            onChange={onChange("project_type")}
            className="cf-input cf-select"
          >
            <option value="">{t.selectOption}</option>
            {t.projectTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
        </TextField>
      </div>

      <TextField label={t.messageLabel} error={errors.message && t.validation[errors.message]}>
        <textarea
          value={form.message}
          onChange={onChange("message")}
          rows={5}
          className={`cf-input cf-textarea ${errors.message ? "cf-error" : ""}`}
          placeholder={t.messagePlaceholder}
        />
      </TextField>

      <label className="cf-checkbox">
        <input
          type="checkbox"
          checked={form.privacyAccepted}
          onChange={onChange("privacyAccepted")}
        />
        <span>
          {t.privacyPrefix}{" "}
          <a className="link-underline" href={lang === "es" ? "/es/privacy-policy" : "/privacy-policy"}>
            {t.privacyLinkText}
          </a>
          .
        </span>
      </label>
      {errors.privacyAccepted && (
        <span className="cf-error-text">{t.validation[errors.privacyAccepted]}</span>
      )}

      <div className="mt-2">
        <button type="submit" className="contact-pill">
          {t.submit} <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
