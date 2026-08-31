import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM

export interface EncryptedPayload {
  iv: string;
  data: string;
  tag: string;
}

export function hashString(value: string, salt = ''): string {
  return createHash('sha256').update(value + salt).digest('hex');
}

export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex');
}

export function encryptString(plaintext: string, keyHex: string): EncryptedPayload {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (256 bits) hex encoded.');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    data: encrypted,
    tag: tag.toString('hex')
  };
}

export function decryptString(payload: EncryptedPayload, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (256 bits) hex encoded.');
  }

  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
