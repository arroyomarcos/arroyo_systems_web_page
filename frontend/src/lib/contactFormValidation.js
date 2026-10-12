// Validation utilities for the contact form. Language-agnostic: returns
// error keys, which the form translates via content.contactForm.validation.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Must match the backend's CONTACT_ATTACHMENT_* limits; the server re-checks everything.
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = [".step", ".stp", ".pdf"];
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

export const INITIAL_FORM = {
  name: "",
  email: "",
  company: "",
  message: "",
  quantity: "",
  deadline: "",
  material: "",
  hasDesign: "", // "" | "true" | "false"
  file: null,
  privacyAccepted: false,
};

const extensionOf = (name) => {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
};

/**
 * Validate the contact form.
 * @param {typeof INITIAL_FORM} form
 * @returns {{[key: string]: string}} map of field -> error key
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
  if (form.quantity.trim() && !/^\d{1,7}$/.test(form.quantity.trim())) {
    errors.quantity = "quantityInvalid";
  }
  if (form.file) {
    if (!ACCEPTED_EXTENSIONS.includes(extensionOf(form.file.name))) {
      errors.file = "fileType";
    } else if (form.file.size > MAX_FILE_BYTES) {
      errors.file = "fileSize";
    }
  }
  if (!form.privacyAccepted) {
    errors.privacyAccepted = "required";
  }
  return errors;
};

/**
 * Build the multipart body from the form state, skipping empty optional fields.
 */
export const buildContactFormData = (form) => {
  const body = new FormData();
  body.append("name", form.name.trim());
  body.append("email", form.email.trim());
  body.append("message", form.message.trim());
  body.append("privacyAccepted", "true");
  const optional = {
    company: form.company.trim(),
    quantity: form.quantity.trim(),
    deadline: form.deadline.trim(),
    material: form.material.trim(),
    has_design: form.hasDesign,
  };
  Object.entries(optional).forEach(([key, value]) => {
    if (value) body.append(key, value);
  });
  if (form.file) body.append("file", form.file);
  return body;
};
