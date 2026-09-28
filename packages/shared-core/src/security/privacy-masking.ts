// Browser-safe deterministic HMAC-SHA256 implementation without node:crypto dependencies
function sha256Bytes(bytes: Uint8Array): Uint8Array {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  const words: number[] = [];
  const asciiBitLength = bytes.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  hash = hash.slice(0, 8);

  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, asciiBitLength >>> 0, false);
  view.setUint32(padded.length - 8, Math.floor(asciiBitLength / maxWord), false);

  for (i = 0; i < padded.length; i += 4) {
    words.push(view.getUint32(i, false));
  }

  for (j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15]!, w2 = w[i - 2]!;
      const a = hash[0]!, e = hash[4]!;
      const temp1 =
        (hash[7]! +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]!) ^ (~e & hash[6]!)) +
          k[i]! +
          (w[i] =
            i < 16
              ? w[i]!
              : (w[i - 16]! +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7]! +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0)) |
        0;
      const temp2 =
        ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]!) ^ (a & hash[2]!) ^ (hash[1]! & hash[2]!))) |
        0;
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4]! + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i]! + oldHash[i]!) | 0;
    }
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (i = 0; i < 8; i++) {
    outView.setUint32(i * 4, hash[i]!, false);
  }
  return out;
}

function stringToUtf8(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(utf8);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function pureHmacSha256(keyStr: string, dataStr: string): string {
  let key = stringToUtf8(keyStr);
  const data = stringToUtf8(dataStr);
  const blockSize = 64;
  if (key.length > blockSize) {
    key = sha256Bytes(key);
  }
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(key);

  const oPad = new Uint8Array(blockSize);
  const iPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oPad[i] = paddedKey[i]! ^ 0x5c;
    iPad[i] = paddedKey[i]! ^ 0x36;
  }

  const inner = new Uint8Array(blockSize + data.length);
  inner.set(iPad, 0);
  inner.set(data, blockSize);
  const innerHash = sha256Bytes(inner);

  const outer = new Uint8Array(blockSize + 32);
  outer.set(oPad, 0);
  outer.set(innerHash, blockSize);
  return bytesToHex(sha256Bytes(outer));
}

/**
 * Masks an Indian 12-digit Aadhaar number according to UIDAI and DPDP Act 2023 guidelines.
 * Preserves strictly the last 4 digits while replacing the first 8 digits with 'XXXX-XXXX-'.
 * Example: '542189028921' -> 'XXXX-XXXX-8921'
 * Example: '5421 8902 8921' -> 'XXXX-XXXX-8921'
 */
export function maskAadhaarNumber(aadhaar: string | null | undefined): string {
  if (!aadhaar) return '';
  const clean = aadhaar.replace(/[\s-]/g, '');
  if (clean.length === 12 && /^\d+$/.test(clean)) {
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }
  if (clean.length > 4) {
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }
  return 'XXXX-XXXX-XXXX';
}

/**
 * Masks an Ayushman Bharat Health Account (ABHA) address or 14-digit ABHA ID.
 * Example (ABHA Number): '14-8921-0941-8921' -> 'XX-XXXX-XXXX-8921'
 * Example (ABHA Address): 'ramesh.sharma@abdm' -> 'ra***ma@abdm'
 */
export function maskAbhaAddress(abha: string | null | undefined): string {
  if (!abha) return '';
  const clean = abha.trim();

  // If ABHA ID number format (14 digits)
  const digitsOnly = clean.replace(/[\s-]/g, '');
  if (digitsOnly.length === 14 && /^\d+$/.test(digitsOnly)) {
    return `XX-XXXX-XXXX-${digitsOnly.slice(-4)}`;
  }

  // If ABHA PHR Handle (e.g. user@abdm or user@sbx)
  if (clean.includes('@')) {
    const [handle, domain] = clean.split('@');
    if (!handle || handle.length <= 3) {
      return `***@${domain}`;
    }
    const start = handle.slice(0, 2);
    const end = handle.slice(-2);
    return `${start}***${end}@${domain}`;
  }

  if (clean.length > 4) {
    return `****${clean.slice(-4)}`;
  }
  return '****';
}

/**
 * Masks an Indian mobile phone number for privacy display.
 * Example: '+919820184920' -> '+91-XXXXX-4920'
 * Example: '9820184920' -> '+91-XXXXX-4920'
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = phone.replace(/[\s-+]/g, '');
  const digits = clean.startsWith('91') && clean.length === 12 ? clean.slice(2) : clean;
  if (digits.length === 10) {
    return `+91-XXXXX-${digits.slice(-4)}`;
  }
  if (digits.length > 4) {
    return `XXXXX-${digits.slice(-4)}`;
  }
  return 'XXXXX-XXXX';
}

/**
 * Computes a deterministic HMAC-SHA256 salted hash for duplicate Aadhaar/ABHA index lookups
 * without storing or exposing raw plaintext national identities in the database.
 */
export function generateSaltedHash(value: string, salt = 'docsearch-dpdp-india-2026'): string {
  if (!value) return '';
  const normalized = value.trim().toLowerCase().replace(/[\s-]/g, '');
  return pureHmacSha256(salt, normalized);
}

/**
 * Checks if a string is already in masked Aadhaar format.
 */
export function isMaskedAadhaar(val: string): boolean {
  return /^XXXX-XXXX-\d{4}$/.test(val);
}

/**
 * Computes deterministic SHA-256 hex string for any UTF-8 text.
 */
export function sha256Hex(dataStr: string): string {
  return bytesToHex(sha256Bytes(stringToUtf8(dataStr)));
}
