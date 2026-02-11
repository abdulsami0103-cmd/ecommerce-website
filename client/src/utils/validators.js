// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (min 6 chars)
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Phone validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Required field validation
export const isRequired = (value) => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
};

// Min length validation
export const minLength = (value, min) => {
  return value && value.length >= min;
};

// Max length validation
export const maxLength = (value, max) => {
  return !value || value.length <= max;
};

// Number range validation
export const isInRange = (value, min, max) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

// Positive number validation
export const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const fieldRules = rules[field];

    fieldRules.forEach((rule) => {
      if (errors[field]) return; // Skip if already has error

      switch (rule.type) {
        case 'required':
          if (!isRequired(value)) {
            errors[field] = rule.message || 'This field is required';
          }
          break;
        case 'email':
          if (value && !isValidEmail(value)) {
            errors[field] = rule.message || 'Invalid email address';
          }
          break;
        case 'minLength':
          if (value && !minLength(value, rule.value)) {
            errors[field] = rule.message || `Minimum ${rule.value} characters`;
          }
          break;
        case 'maxLength':
          if (value && !maxLength(value, rule.value)) {
            errors[field] = rule.message || `Maximum ${rule.value} characters`;
          }
          break;
        case 'match':
          if (value !== data[rule.field]) {
            errors[field] = rule.message || 'Fields do not match';
          }
          break;
        case 'positive':
          if (value && !isPositiveNumber(value)) {
            errors[field] = rule.message || 'Must be a positive number';
          }
          break;
        default:
          break;
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
