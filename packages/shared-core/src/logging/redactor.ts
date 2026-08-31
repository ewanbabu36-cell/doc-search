const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /bearer/i,
  /cookie/i,
  /ssn/i,
  /mrn/i,
  /aadhaar/i,
  /credit_?card/i,
  /cvv/i,
  /pin/i,
  /date_?of_?birth|dob/i,
  /medical_?record/i,
  /prescription/i,
  /diagnosis/i
];

const MASK_STRING = '[REDACTED]';

export function redactSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH_REACHED]';
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Check for email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj)) {
      const parts = obj.split('@');
      const name = parts[0] ?? '';
      const domain = parts[1] ?? '';
      return `${name.slice(0, 2)}***@${domain}`;
    }
    // Check for potential JWT or Auth Header
    if (/^Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(obj)) {
      return 'Bearer [REDACTED_JWT]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitive) {
        result[key] = MASK_STRING;
      } else {
        result[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}
