import { isNonEmptyString } from "./index.js";

/**
 * Validation result returned by common validators.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Checks whether a project name is valid.
 */
export function validateProjectName(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(value)) {
    return {
      valid: false,
      errors: ["Project name is required."],
    };
  }

  const name = value.trim();

  if (name.length < 2) {
    errors.push("Project name must contain at least 2 characters.");
  }

  if (name.length > 80) {
    errors.push("Project name cannot exceed 80 characters.");
  }

  /* eslint-disable no-control-regex */
  if (/[\u0000-\u001F\u007F]/.test(name)) {
    errors.push("Project name cannot contain control characters.");
  }
  /* eslint-enable no-control-regex */

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a URL's basic syntax and protocol.
 *
 * This checks syntax only. It does not establish that a remote URL
 * is safe to fetch or that its destination is trustworthy.
 */
export function validateWebsiteUrl(value: unknown): ValidationResult {
  if (!isNonEmptyString(value)) {
    return {
      valid: false,
      errors: ["Website URL is required."],
    };
  }

  const input = value.trim();

  if (input.length > 2048) {
    return {
      valid: false,
      errors: ["Website URL cannot exceed 2048 characters."],
    };
  }

  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return {
      valid: false,
      errors: ["Enter a valid absolute URL, including https:// or http://."],
    };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return {
      valid: false,
      errors: ["Only HTTP and HTTPS URLs are supported."],
    };
  }

  if (!url.hostname || url.hostname.length > 253) {
    return {
      valid: false,
      errors: ["Enter a valid hostname."],
    };
  }

  if (url.username || url.password) {
    return {
      valid: false,
      errors: ["URLs containing embedded credentials are not allowed."],
    };
  }

  return {
    valid: true,
    errors: [],
  };
}

/**
 * Validates an email address's basic format.
 *
 * This does not verify that the address exists or can receive email.
 */
export function validateEmail(value: unknown): ValidationResult {
  if (!isNonEmptyString(value)) {
    return {
      valid: false,
      errors: ["Email address is required."],
    };
  }

  const email = value.trim();

  if (email.length > 254) {
    return {
      valid: false,
      errors: ["Email address is too long."],
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return {
      valid: false,
      errors: ["Enter a valid email address."],
    };
  }

  return {
    valid: true,
    errors: [],
  };
}

/**
 * Checks whether a value is a valid positive integer.
 */
export function validatePositiveInteger(value: unknown): ValidationResult {
  const isValid =
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0;

  return {
    valid: isValid,
    errors: isValid ? [] : ["Value must be a positive integer."],
  };
}