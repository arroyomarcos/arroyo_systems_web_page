// Validation utilities for the contact form. Language-agnostic: returns
// error keys, which the form translates via content.contactForm.validation.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INITIAL_FORM = {
  name: "",
  email: "",
  company: "",
  project_type: "",
  message: "",
  privacyAccepted: false,
};

/**
 * Validate the contact form.
 * @param {typeof INITIAL_FORM} form
 * @returns {{[key: string]: "required"|"invalidEmail"|"messageTooShort"}} map of field -> error key
 */
export const validateContactForm = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "required";
  if (!form.email.trim()) {
    errors.email = "required";
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.email = "invalidEmail";
  }
  if (!form.message.trim() || form.message.trim().length < 10) {
    errors.message = "messageTooShort";
  }
  if (!form.privacyAccepted) {
    errors.privacyAccepted = "required";
  }
  return errors;
};

/**
 * Build the API payload from the form state, trimming and stripping empty optional fields.
 */
export const buildContactPayload = (form) => {
  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    message: form.message.trim(),
    privacyAccepted: true,
  };
  const company = form.company.trim();
  if (company) payload.company = company;
  if (form.project_type) payload.project_type = form.project_type;
  return payload;
};
