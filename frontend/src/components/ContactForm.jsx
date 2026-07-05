import React, { useCallback, useState } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { submitContact } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import {
  INITIAL_FORM,
  PROJECT_TYPES,
  buildContactPayload,
  validateContactForm,
} from "../lib/contactFormValidation";

// ---------- Sub-components (kept small & memoisable) ----------

const TextField = ({ label, error, children }) => (
  <label className="cf-field">
    <span className="cf-label">{label}</span>
    {children}
    {error && <span className="cf-error-text">{error}</span>}
  </label>
);

const SuccessCard = ({ onReset }) => (
  <div className="contact-form-success">
    <CheckCircle2 size={40} className="text-[color:var(--arroyo-accent)]" />
    <h3 className="arroyo-display text-xl md:text-2xl mt-4">Message received.</h3>
    <p className="arroyo-body mt-2 max-w-sm">
      Thanks for contacting Arroyo Systems. We&apos;ll review your enquiry and
      come back to you shortly.
    </p>
    <button className="contact-pill mt-6" onClick={onReset}>
      Send another message
    </button>
  </div>
);

// ---------- Main component ----------

const ContactForm = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const onChange = useCallback(
    (field) => (ev) => {
      const value = ev.target.value;
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
    async (ev) => {
      ev.preventDefault();
      const validationErrors = validateContactForm(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setSubmitting(true);
      try {
        await submitContact(buildContactPayload(form));
        setSubmitted(true);
        setForm(INITIAL_FORM);
        setErrors({});
        toast({
          title: "Message sent",
          description: "Thanks for reaching out. We'll get back to you shortly.",
        });
      } catch (err) {
        const detail = err?.response?.data?.detail;
        toast({
          title: "Something went wrong",
          description:
            typeof detail === "string"
              ? detail
              : "Could not submit your message. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [form, toast]
  );

  if (submitted) return <SuccessCard onReset={resetForm} />;

  return (
    <form onSubmit={onSubmit} className="contact-form" noValidate>
      <div className="cf-row">
        <TextField label="Name *" error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={onChange("name")}
            className={`cf-input ${errors.name ? "cf-error" : ""}`}
            placeholder="Your full name"
            autoComplete="name"
          />
        </TextField>
        <TextField label="Email *" error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={onChange("email")}
            className={`cf-input ${errors.email ? "cf-error" : ""}`}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </TextField>
      </div>

      <div className="cf-row">
        <TextField label="Company">
          <input
            type="text"
            value={form.company}
            onChange={onChange("company")}
            className="cf-input"
            placeholder="Company name"
            autoComplete="organization"
          />
        </TextField>
        <TextField label="Project type">
          <select
            value={form.project_type}
            onChange={onChange("project_type")}
            className="cf-input cf-select"
          >
            <option value="">Select an option</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </TextField>
      </div>

      <TextField label="Message *" error={errors.message}>
        <textarea
          value={form.message}
          onChange={onChange("message")}
          rows={5}
          className={`cf-input cf-textarea ${errors.message ? "cf-error" : ""}`}
          placeholder="Tell us about your component, requirements, timeline..."
        />
      </TextField>

      <div className="mt-2">
        <button type="submit" disabled={submitting} className="contact-pill">
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending...
            </>
          ) : (
            <>
              Send message <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
