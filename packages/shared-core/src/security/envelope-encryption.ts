import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV standard for GCM

export interface EnvelopeEncryptedToken {
  version: 'v1';
  algorithm: 'aes-256-gcm';
  keyId: string;
  encryptedDekHex: string;
  ivHex: string;
  tagHex: string;
  ciphertextHex: string;
}

/**
 * Standard list of sensitive clinical & financial fields requiring
 * zero-trust AES-256-GCM field-level envelope encryption at rest.
 */
export const SENSITIVE_ENVELOPE_FIELDS = [
  'psychiatric_notes',
  'hiv_serology_status',
  'cancer_staging',
  'billing_credit_card_tokens'
] as const;

export type SensitiveEnvelopeField = (typeof SENSITIVE_ENVELOPE_FIELDS)[number];

export interface EnvelopeKmsConfig {
  masterKeyArn?: string;
  masterKeySecret?: string;
}

// Default simulated AWS KMS / HashiCorp Vault Key Encryption Key (KEK) for local/test environments
const DEFAULT_SIMULATED_KEK = createHash('sha256')
  .update(process.env['DOCSEARCH_KMS_MASTER_KEY'] || 'DOCSEARCH_UNIVERSAL_HOSPITAL_KMS_KEK_MASTER_SECRET_2026')
  .digest();

const DEFAULT_KEY_ARN = process.env['AWS_KMS_KEY_ARN'] || 'arn:aws:kms:ap-south-1:docsearch:hospital-phi-master-kek';

/**
 * Encrypts a plaintext string using AES-256-GCM envelope encryption.
 * Generates an ephemeral Data Encryption Key (DEK), encrypts the data,
 * encrypts the DEK using the Master KEK, and bundles into an envelope string.
 */
export function encryptEnvelopeField(
  plaintext: string,
  config?: EnvelopeKmsConfig
): string {
  if (!plaintext) return plaintext;

  const keyId = config?.masterKeyArn || DEFAULT_KEY_ARN;
  const masterKek = config?.masterKeySecret
    ? createHash('sha256').update(config.masterKeySecret).digest()
    : DEFAULT_SIMULATED_KEK;

  // 1. Generate an ephemeral 256-bit Data Encryption Key (DEK)
  const dek = randomBytes(32);

  // 2. Encrypt the plaintext using the ephemeral DEK with AES-256-GCM
  const dataIv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, dek, dataIv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // 3. Encrypt the DEK using the Master Key Encryption Key (KEK)
  const kekIv = randomBytes(IV_LENGTH);
  const kekCipher = createCipheriv(ALGORITHM, masterKek, kekIv);
  let encryptedDek = kekCipher.update(dek.toString('hex'), 'utf8', 'hex');
  encryptedDek += kekCipher.final('hex');
  const kekTag = kekCipher.getAuthTag();

  // Combined encrypted DEK package: kekIv(24 chars) + kekTag(32 chars) + encryptedDek
  const encryptedDekBundle = `${kekIv.toString('hex')}:${kekTag.toString('hex')}:${encryptedDek}`;

  // 4. Return standard envelope token format
  return `enc:v1:aes-256-gcm:${encodeURIComponent(keyId)}:${encryptedDekBundle}:${dataIv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
}

/**
 * Decrypts an AES-256-GCM envelope token back into its original plaintext.
 */
export function decryptEnvelopeField(
  token: string,
  config?: EnvelopeKmsConfig
): string {
  if (!token || typeof token !== 'string' || !token.startsWith('enc:v1:aes-256-gcm:')) {
    return token;
  }

  const parts = token.split(':');
  if (parts.length < 8) {
    throw new Error('Invalid envelope encryption token structure');
  }

  const [, version, algorithm, _rawKeyId, kekIvHex, kekTagHex, encryptedDekHex, dataIvHex, authTagHex, ...rest] = parts;
  const ciphertextHex = rest.join(':');

  if (version !== 'v1' || algorithm !== 'aes-256-gcm') {
    throw new Error(`Unsupported envelope version or algorithm: ${version}/${algorithm}`);
  }

  if (!kekIvHex || !kekTagHex || !encryptedDekHex || !dataIvHex || !authTagHex) {
    throw new Error('Invalid envelope encryption token structure: missing cryptographic fields');
  }

  const masterKek = config?.masterKeySecret
    ? createHash('sha256').update(config.masterKeySecret).digest()
    : DEFAULT_SIMULATED_KEK;

  // 1. Recover the ephemeral DEK by decrypting it using the Master KEK
  const kekDecipher = createDecipheriv(ALGORITHM, masterKek, Buffer.from(kekIvHex, 'hex'));
  kekDecipher.setAuthTag(Buffer.from(kekTagHex, 'hex'));
  let dekHex = kekDecipher.update(encryptedDekHex, 'hex', 'utf8');
  dekHex = dekHex + kekDecipher.final('utf8');
  const dek = Buffer.from(dekHex, 'hex');

  // 2. Decrypt the ciphertext using the recovered DEK and verify the GCM auth tag
  const decipher = createDecipheriv(ALGORITHM, dek, Buffer.from(dataIvHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let plaintext = decipher.update(ciphertextHex, 'hex', 'utf8');
  plaintext = plaintext + decipher.final('utf8');

  return plaintext;
}

/**
 * Checks if a value is encrypted with the envelope token format.
 */
export function isEnvelopeEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('enc:v1:aes-256-gcm:');
}

/**
 * Automatically encrypts any sensitive fields present in a clinical record object.
 */
export function encryptSensitiveClinicalRecord<T extends Record<string, unknown>>(
  record: T,
  config?: EnvelopeKmsConfig
): T {
  const result: Record<string, unknown> = { ...record };
  for (const field of SENSITIVE_ENVELOPE_FIELDS) {
    const val = result[field];
    if (typeof val === 'string' && !isEnvelopeEncrypted(val)) {
      result[field] = encryptEnvelopeField(val, config);
    }
  }
  return result as T;
}

/**
 * Automatically decrypts any sensitive fields present in a clinical record object.
 */
export function decryptSensitiveClinicalRecord<T extends Record<string, unknown>>(
  record: T,
  config?: EnvelopeKmsConfig
): T {
  const result: Record<string, unknown> = { ...record };
  for (const field of SENSITIVE_ENVELOPE_FIELDS) {
    const val = result[field];
    if (typeof val === 'string' && isEnvelopeEncrypted(val)) {
      result[field] = decryptEnvelopeField(val, config);
    }
  }
  return result as T;
}
