/**
 * Canonical UUID Validation Utility (RFC 4122)
 *
 * Prevents PostgreSQL driver errors:
 * "ERROR: invalid input syntax for type uuid (22P02)"
 * when untrusted or prefixed identifiers (e.g., 'KYC-xxxx', 'partner-usr-xxxx')
 * are queried against native PostgreSQL UUID columns.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
}

/**
 * Returns a valid UUID if valid; otherwise returns null.
 */
export function sanitizeUuidOrNull(val: unknown): string | null {
  if (isValidUuid(val)) {
    return val.trim().toLowerCase();
  }
  return null;
}
