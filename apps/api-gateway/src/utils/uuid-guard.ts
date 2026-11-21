/**
 * Canonical UUID Validation Utility (RFC 4122 & RFC 9562 compliant)
 *
 * Prevents PostgreSQL driver errors:
 * "ERROR: invalid input syntax for type uuid (22P02)"
 * when untrusted or prefixed identifiers (e.g., 'KYC-xxxx', 'partner-usr-xxxx')
 * are queried against native PostgreSQL UUID columns.
 * Supports v1-v8 UUIDs, UUIDv7, and Nil UUID (00000000-0000-0000-0000-000000000000).
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
