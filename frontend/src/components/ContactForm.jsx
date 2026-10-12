import React, { useCallback, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, FileUp, X } from "lucide-react";
import { submitContactForm } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import {
  ACCEPT_ATTRIBUTE,
  INITIAL_FORM,
  buildContactFormData,
  validateContactForm,
} from "../lib/contactFormValidation";
import { useLang, useContent } from "../i18n/useLang";

// ---------- Sub-components (kept small & memoisable) ----------

const TextField = ({ label, error, hint, children }) => (
  <label className="cf-field">
    <span className="cf-label">{label}</span>
    {children}
    {hint && !error && <span className="cf-hint">{hint}</span>}
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

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`);

// ---------- Main component ----------

const ContactForm = () => {
  const lang = useLang();
  const t = useContent().contactForm;
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInput = useRef(null);
  const { toast } = useToast();

  const setField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const onChange = useCallback(
    (field) => (ev) => setField(field, ev.target.type === "checkbox" ? ev.target.checked : ev.target.value),
    [setField]
  );

  const onFileChange = useCallback(
    (ev) => {
      setField("file", ev.target.files?.[0] || null);
    },
    [setField]
  );

  const removeFile = useCallback(() => {
    setField("file", null);
    if (fileInput.current) fileInput.current.value = "";
  }, [setField]);

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitted(false);
    setSending(false);
  }, []);

  const notifyFailure = useCallback(
    (err) => {
      const detail = err?.response?.data?.detail;
      toast({
        title: t.errorToastTitle,
        description: typeof detail === "string" ? detail : t.errorToastBody,
        variant: "destructive",
      });
    },
    [toast, t]
  );

  const onSubmit = useCallback(
    (ev) => {
      ev.preventDefault();
      if (sending) return;
      const validationErrors = validateContactForm(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const body = buildContactFormData(form);

      if (form.file) {
        // A file can fail for reasons the visitor needs to see (size, format, a slow
        // upload), so wait for the real answer instead of confirming optimistically.
        setSending(true);
        submitContactForm(body)
          .then(() => {
            setSubmitted(true);
            setForm(INITIAL_FORM);
            setErrors({});
          })
          .catch(notifyFailure)
          .finally(() => setSending(false));
        return;
      }

      // No file: show the confirmation immediately — the request keeps sending in the
      // background so a slow/cold backend doesn't stall the user's feedback.
      setSubmitted(true);
      setForm(INITIAL_FORM);
      setErrors({});
      submitContactForm(body).catch(notifyFailure);
    },
    [form, sending, notifyFailure]
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

      <TextField label={t.messageLabel} error={errors.message && t.validation[errors.message]}>
        <textarea
          value={form.message}
          onChange={onChange("message")}
          rows={5}
          className={`cf-input cf-textarea ${errors.message ? "cf-error" : ""}`}
          placeholder={t.messagePlaceholder}
        />
      </TextField>

      <div className="cf-field">
        <span className="cf-label">{t.fileLabel}</span>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={onFileChange}
          className="sr-only"
          id="contact-file"
        />
        {form.file ? (
          <div className={`cf-file ${errors.file ? "cf-error" : ""}`}>
            <FileUp size={16} className="shrink-0 text-[color:var(--arroyo-accent)]" />
            <span className="truncate">{form.file.name}</span>
            <span className="text-[color:var(--arroyo-muted)] shrink-0">{formatSize(form.file.size)}</span>
            <button type="button" onClick={removeFile} className="cf-file__remove" aria-label={t.fileRemove}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <label htmlFor="contact-file" className="cf-file cf-file--empty">
            <FileUp size={16} className="shrink-0 text-[color:var(--arroyo-accent)]" />
            <span>{t.fileChoose}</span>
          </label>
        )}
        {errors.file ? (
          <span className="cf-error-text">{t.validation[errors.file]}</span>
        ) : (
          <span className="cf-hint">{t.fileHint}</span>
        )}
      </div>

      <div className="cf-row">
        <TextField label={t.quantityLabel} error={errors.quantity && t.validation[errors.quantity]}>
          <input
            type="text"
            inputMode="numeric"
            value={form.quantity}
            onChange={onChange("quantity")}
            className={`cf-input ${errors.quantity ? "cf-error" : ""}`}
            placeholder={t.quantityPlaceholder}
          />
        </TextField>
        <TextField label={t.deadlineLabel}>
          <input
            type="text"
            value={form.deadline}
            onChange={onChange("deadline")}
            className="cf-input"
            placeholder={t.deadlinePlaceholder}
          />
        </TextField>
      </div>

      <div className="cf-row">
        <TextField label={t.materialLabel}>
          <input
            type="text"
            value={form.material}
            onChange={onChange("material")}
            className="cf-input"
            placeholder={t.materialPlaceholder}
          />
        </TextField>
        <div className="cf-field" role="radiogroup" aria-label={t.hasDesignLabel}>
          <span className="cf-label">{t.hasDesignLabel}</span>
          <div className="cf-segmented">
            {[
              { value: "true", label: t.yes },
              { value: "false", label: t.no },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={form.hasDesign === option.value}
                className={form.hasDesign === option.value ? "is-active" : ""}
                onClick={() => setField("hasDesign", form.hasDesign === option.value ? "" : option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="cf-checkbox">
        <input type="checkbox" checked={form.privacyAccepted} onChange={onChange("privacyAccepted")} />
        <span>
          {t.privacyPrefix}{" "}
          <a className="link-underline" href={lang === "es" ? "/es/privacy-policy" : "/privacy-policy"}>
            {t.privacyLinkText}
          </a>
          .
        </span>
      </label>
      {errors.privacyAccepted && <span className="cf-error-text">{t.validation[errors.privacyAccepted]}</span>}

      <div className="mt-2">
        <button type="submit" className="contact-pill contact-pill--solid" disabled={sending}>
          {sending ? t.sending : t.submit} {!sending && <ArrowRight size={16} />}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
