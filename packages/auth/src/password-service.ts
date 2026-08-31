import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keyLen: 64,
  saltLen: 16
};

/**
 * Secure password hashing using Node.js scrypt with per-user cryptographic salt.
 * Produces format: $scrypt$N=16384,r=8,p=1$<saltHex>$<derivedKeyHex>
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SCRYPT_PARAMS.saltLen);
  const derivedKey = scryptSync(password, salt, SCRYPT_PARAMS.keyLen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: 32 * 1024 * 1024
  });

  return `$scrypt$N=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

/**
 * Constant-time verification of a plaintext password against a stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    // Format: ["", "scrypt", "N=...,r=...,p=...", "<saltHex>", "<derivedKeyHex>"]
    if (parts.length !== 5 || parts[1] !== 'scrypt') {
      return false;
    }

    const saltHex = parts[3];
    const hashHex = parts[4];
    if (!saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expectedKey = Buffer.from(hashHex, 'hex');

    const derivedKey = scryptSync(password, salt, expectedKey.length, {
      N: SCRYPT_PARAMS.N,
      r: SCRYPT_PARAMS.r,
      p: SCRYPT_PARAMS.p,
      maxmem: 32 * 1024 * 1024
    });

    return timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}
