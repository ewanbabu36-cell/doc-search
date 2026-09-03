import crypto from 'node:crypto';

/**
 * Verifies the authenticity of an incoming Razorpay webhook payload using HMAC-SHA256.
 * Uses timing-safe equality comparison to prevent timing attacks.
 */
export function verifyRazorpaySignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!payload || !signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates an HMAC-SHA256 signature for Razorpay webhooks (used in test harnesses and mock dispatchers).
 */
export function generateRazorpaySignature(
  payload: string | Buffer,
  secret: string
): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Computes and verifies a PayU callback/webhook checksum using SHA-512.
 * PayU response callback format:
 * sha512(SALT|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUSignature(
  params: Record<string, unknown>,
  salt: string
): boolean {
  if (!params || !salt) {
    return false;
  }

  const receivedHash = ((params['hash'] as string) || '').toLowerCase();
  if (!receivedHash) {
    return false;
  }

  try {
    const status = (params['status'] as string) || '';
    const key = (params['key'] as string) || '';
    const txnid = (params['txnid'] as string) || '';
    const amount = (params['amount'] as string) || '';
    const productinfo = (params['productinfo'] as string) || '';
    const firstname = (params['firstname'] as string) || '';
    const email = (params['email'] as string) || '';
    const udf1 = (params['udf1'] as string) || '';
    const udf2 = (params['udf2'] as string) || '';
    const udf3 = (params['udf3'] as string) || '';
    const udf4 = (params['udf4'] as string) || '';
    const udf5 = (params['udf5'] as string) || '';

    // Reverse hash sequence according to PayU documentation
    const hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();

    const receivedBuffer = Buffer.from(receivedHash, 'utf8');
    const calculatedBuffer = Buffer.from(calculatedHash, 'utf8');

    if (receivedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates a PayU callback hash for testing and simulation purposes.
 */
export function generatePayUResponseHash(
  params: Record<string, unknown>,
  salt: string
): string {
  const status = (params['status'] as string) || '';
  const key = (params['key'] as string) || '';
  const txnid = (params['txnid'] as string) || '';
  const amount = (params['amount'] as string) || '';
  const productinfo = (params['productinfo'] as string) || '';
  const firstname = (params['firstname'] as string) || '';
  const email = (params['email'] as string) || '';
  const udf1 = (params['udf1'] as string) || '';
  const udf2 = (params['udf2'] as string) || '';
  const udf3 = (params['udf3'] as string) || '';
  const udf4 = (params['udf4'] as string) || '';
  const udf5 = (params['udf5'] as string) || '';

  const hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  return crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
}
