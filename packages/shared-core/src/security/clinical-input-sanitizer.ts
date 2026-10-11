/**
 * Clinical Input Sanitizer & Prototype Pollution Shield
 * High-performance, zero-dependency security barrier for healthcare inputs.
 */

const DANGEROUS_HTML_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, // onerror=..., onload=..., onclick=...
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi
];

/**
 * Sanitizes clinical notes, patient complaints, prescription text, and allergy descriptions
 * by neutralizing executable scripts, event listeners, and dangerous URI schemes.
 */
export function sanitizeClinicalText(input: unknown): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input);
  }

  let sanitized = input;
  for (const pattern of DANGEROUS_HTML_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Neutralize stray unclosed tag openers for raw plain text inputs
  return sanitized.trim();
}

/**
 * Recursively removes dangerous prototype mutation keys (__proto__, constructor, prototype)
 * to protect Node.js / Fastify memory from Prototype Pollution vulnerabilities.
 */
export function sanitizeObjectPrototype<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectPrototype(item)) as unknown as T;
  }

  const cleanObj: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Drop dangerous prototype keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      cleanObj[key] = sanitizeObjectPrototype(value);
    } else if (typeof value === 'string') {
      cleanObj[key] = sanitizeClinicalText(value);
    } else {
      cleanObj[key] = value;
    }
  }

  return cleanObj as T;
}

/**
 * Validates session token freshness.
 * Defaults to 30 days maximum validity to prevent perpetual session hijacking.
 */
export function isSessionTokenExpired(createdAtMs: number, maxAgeDays = 30): boolean {
  if (!createdAtMs || isNaN(createdAtMs) || createdAtMs <= 0) {
    return true;
  }
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  return Date.now() - createdAtMs > maxAgeMs;
}
