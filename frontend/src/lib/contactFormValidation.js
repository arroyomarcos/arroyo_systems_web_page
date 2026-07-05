// Validation utilities for the contact form.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PROJECT_TYPES = [
  "DFM",
  "Structural Validation",
  "Engineering Performance",
  "Other",
];

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
 * @returns {{[key: string]: string}} map of field -> error message (empty object when valid)
 */
export const validateContactForm = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "Required";
  if (!form.email.trim()) {
    errors.email = "Required";
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.email = "Invalid email";
  }
  if (!form.message.trim() || form.message.trim().length < 10) {
    errors.message = "Please provide at least 10 characters";
  }
  if (!form.privacyAccepted) {
    errors.privacyAccepted = "Required";
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
