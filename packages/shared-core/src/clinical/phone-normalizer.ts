/**
 * Canonical Patient Phone Normalization Utility
 * Supports Indian mobile numbers and international E.164 formats.
 */

export function normalizePhoneNumber(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasLeadingPlus = trimmed.startsWith('+');

  // Strip spaces, dashes, parentheses, dots
  const cleaned = trimmed.replace(/[\s\-().]/g, '');
  const digitsOnly = cleaned.replace(/\D/g, '');

  // Minimum generic digit length: 7
  if (digitsOnly.length < 7) {
    return null;
  }

  // Case 1: 10-digit Indian mobile (starts with 6, 7, 8, 9 or standard 10-digit)
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // Case 2: 11-digit starting with 0 (e.g. 09876543210 -> +919876543210)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+91${digitsOnly.slice(1)}`;
  }

  // Case 3: 12-digit starting with 91 (e.g. 919876543210 or +919876543210)
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
