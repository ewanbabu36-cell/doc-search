/**
 * Canonical Patient & Partner Phone Normalization Utility
 * Standardized for Indian 10-digit mobile numbers (^[6-9]\d{9}$) and E.164 formats.
 */

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const INDIAN_MOBILE_WITH_PREFIX_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;

/**
 * Extracts clean 10-digit Indian mobile number from raw input.
 * Strips non-digits, country code (+91 / 91), leading zero, etc.
 * Returns empty string if invalid.
 */
export function clean10DigitMobile(raw: unknown): string {
  if (typeof raw !== 'string' && typeof raw !== 'number') return '';
  const str = String(raw).trim();
  if (!str) return '';

  const digits = str.replace(/\D/g, '');

  // Exact 10-digit
  if (digits.length === 10) {
    return digits;
  }

  // 12-digit starting with 91 (e.g. 919876543210 -> 9876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  // 11-digit starting with 0 (e.g. 09876543210 -> 9876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits.length > 10 ? digits.slice(0, 10) : digits;
}

/**
 * Validates if the given input is a valid 10-digit Indian mobile number.
 * Must be 10 digits (or 11 with leading 0, or 12 with country code 91)
 * and start with 6, 7, 8, or 9.
 */
export function isValidIndianMobile(raw: unknown): boolean {
  if (!raw) return false;
  if (typeof raw !== 'string' && typeof raw !== 'number') return false;
  const str = String(raw).trim();
  const digits = str.replace(/\D/g, '');

  if (digits.length === 10) {
    return INDIAN_MOBILE_REGEX.test(digits);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return INDIAN_MOBILE_REGEX.test(digits.slice(1));
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return INDIAN_MOBILE_REGEX.test(digits.slice(2));
  }
  return false;
}

/**
 * Formats a 10-digit mobile number for display:
 * withPrefix=true: "+91 98765 43210"
 * withPrefix=false: "98765 43210"
 */
export function format10DigitMobile(raw: unknown, withPrefix = true): string {
  const cleaned = clean10DigitMobile(raw);
  if (!cleaned || cleaned.length !== 10) {
    return typeof raw === 'string' ? raw : '';
  }
  const part1 = cleaned.slice(0, 5);
  const part2 = cleaned.slice(5, 10);
  return withPrefix ? `+91 ${part1} ${part2}` : `${part1} ${part2}`;
}

/**
 * Real-time input sanitizer for React form fields.
 * Disallows non-numeric characters and limits length to max 10 digits.
 * If user pastes '+91' or leading '0', it cleanly strips it.
 */
export function sanitizeIndianMobileInput(input: string): string {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');

  // If user pasted a 12-digit number starting with 91, strip 91
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

/**
 * Canonical E.164 phone normalizer (preserves backward compatibility)
 */
export function normalizePhoneNumber(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasLeadingPlus = trimmed.startsWith('+');
  const cleaned = trimmed.replace(/[\s\-().]/g, '');
  const digitsOnly = cleaned.replace(/\D/g, '');

  if (digitsOnly.length < 7) {
    return null;
  }

  // Case 1: 10-digit Indian mobile
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // Case 2: 11-digit starting with 0
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+91${digitsOnly.slice(1)}`;
  }

  // Case 3: 12-digit starting with 91
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  // Case 4: International format with leading + (7 to 15 digits as per ITU-T E.164)
  if (hasLeadingPlus && digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  // Case 5: 11-15 digit generic international
  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  return null;
}
