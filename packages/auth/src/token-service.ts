import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export interface TokenSignOptions {
  secret: string;
  expiresInSeconds?: number | undefined;
  issuer?: string | undefined;
  audience?: string | undefined;
}

export interface TokenVerifyOptions {
  secret: string;
  expectedIssuer?: string | undefined;
  expectedAudience?: string | undefined;
  clockToleranceSeconds?: number | undefined;
}

export const BaseJwtClaimsSchema = z.object({
  sub: z.string().min(1, 'Subject (sub) is mandatory'),
  iat: z.number().int({ message: 'Issued-at (iat) must be an integer' }),
  exp: z.number().int({ message: 'Expiration (exp) is mandatory and must be an integer' }),
  nbf: z.number().int().optional(),
  iss: z.string().min(1).optional(),
  aud: z.string().min(1).optional(),
  jti: z.string().min(1).optional()
});

export type BaseJwtClaims = z.infer<typeof BaseJwtClaimsSchema> & {
  [key: string]: unknown;
};

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf.toString('base64url');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

/**
 * Creates and signs a standard HS256 JSON Web Token with mandatory claims.
 */
export function signJwt<T extends Record<string, unknown> & { sub: string }>(
  payload: T,
  options: TokenSignOptions
): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresInSeconds ?? 900; // Default 15 minutes

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
    jti: randomBytes(16).toString('hex'),
    ...(options.issuer ? { iss: options.issuer } : {}),
    ...(options.audience ? { aud: options.audience } : {})
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const hmac = createHmac('sha256', options.secret);
  hmac.update(signatureInput);
  const signature = hmac.digest('base64url');

  return `${signatureInput}.${signature}`;
}

/**
 * Strict verification of an HS256 JSON Web Token:
 * - Rejects alg=none and any algorithm other than HS256
 * - Validates cryptographic signature with constant-time comparison
 * - Validates expiration (FAIL CLOSED if exp is missing or expired)
 * - Validates issuer and audience if configured
 * - Runtime validates all required claims with Zod
 */
export function verifyJwt<T extends BaseJwtClaims = BaseJwtClaims>(
  token: string,
  secretOrOptions: string | TokenVerifyOptions
): T {
  const options: TokenVerifyOptions =
    typeof secretOrOptions === 'string' ? { secret: secretOrOptions } : secretOrOptions;

  if (!token || typeof token !== 'string') {
    throw AppError.unauthorized('Missing token', ErrorCode.UNAUTHORIZED);
  }

  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || parts[2] === undefined) {
    throw AppError.unauthorized('Invalid token format: Must have 3 parts', ErrorCode.TOKEN_INVALID);
  }

  const [encodedHeader, encodedPayload, receivedSignature] = parts;

  // 1. Strict Header & Algorithm Verification
  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader));
  } catch {
    throw AppError.unauthorized('Invalid token header encoding', ErrorCode.TOKEN_INVALID);
  }

  if (!header || typeof header !== 'object') {
    throw AppError.unauthorized('Malformed token header', ErrorCode.TOKEN_INVALID);
  }

  if (header.alg !== 'HS256') {
    throw AppError.unauthorized(
      `Unsupported or prohibited JWT algorithm: ${header.alg || 'none'}. Only HS256 is accepted.`,
      ErrorCode.TOKEN_INVALID
    );
  }

  if (!receivedSignature) {
    throw AppError.unauthorized('Invalid token signature', ErrorCode.TOKEN_INVALID);
  }

  // 2. Cryptographic Signature Verification in Constant Time
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const hmac = createHmac('sha256', options.secret);
  hmac.update(signatureInput);
  const expectedSignature = hmac.digest('base64url');

  const receivedBuf = Buffer.from(receivedSignature, 'utf8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');

  if (receivedBuf.length !== expectedBuf.length || !timingSafeEqual(receivedBuf, expectedBuf)) {
    throw AppError.unauthorized('Invalid token signature', ErrorCode.TOKEN_INVALID);
  }

  // 3. Claims Decoding & Runtime Schema Validation
  let rawClaims: unknown;
  try {
    rawClaims = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw AppError.unauthorized('Invalid token payload encoding', ErrorCode.TOKEN_INVALID);
  }

  const parseResult = BaseJwtClaimsSchema.safeParse(rawClaims);
  if (!parseResult.success) {
    throw AppError.unauthorized(
      `Malformed JWT claims: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
      ErrorCode.TOKEN_INVALID
    );
  }

  const claims = rawClaims as T;
  const now = Math.floor(Date.now() / 1000);
  const tolerance = options.clockToleranceSeconds ?? 0;

  // 4. Strict Expiration Enforcement (FAIL CLOSED)
  if (typeof claims.exp !== 'number' || isNaN(claims.exp)) {
    throw AppError.unauthorized('Token is missing mandatory expiration (exp)', ErrorCode.TOKEN_INVALID);
  }

  if (claims.exp + tolerance < now) {
    throw new AppError({
      message: 'Token has expired',
      code: ErrorCode.TOKEN_EXPIRED,
      statusCode: 401
    });
  }

  // 5. Not-Before Check
  if (typeof claims.nbf === 'number' && claims.nbf - tolerance > now) {
    throw AppError.unauthorized('Token is not active yet (nbf)', ErrorCode.TOKEN_INVALID);
  }

  // 6. Issuer Verification
  if (options.expectedIssuer && claims.iss !== options.expectedIssuer) {
    throw AppError.unauthorized(
      `Invalid token issuer. Expected: ${options.expectedIssuer}`,
      ErrorCode.TOKEN_INVALID
    );
  }

  // 7. Audience Verification
  if (options.expectedAudience && claims.aud !== options.expectedAudience) {
    throw AppError.unauthorized(
      `Invalid token audience. Expected: ${options.expectedAudience}`,
      ErrorCode.TOKEN_INVALID
    );
  }

  return claims;
}

/**
 * Computes a secure SHA-256 cryptographic hash of a refresh token.
 * Raw refresh tokens are never persisted in databases or logs.
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generates an opaque, cryptographically random refresh token and its SHA-256 hash.
 */
export function generateRefreshToken(): { token: string; hashedToken: string } {
  const token = randomBytes(40).toString('hex');
  const hashedToken = hashRefreshToken(token);
  return { token, hashedToken };
}

/**
 * Generates an MFA Challenge Token with 5-minute validity.
 */
export function createMFAChallengeToken(
  userId: string,
  secret: string,
  options?: { issuer?: string; audience?: string }
): { challengeId: string; mfaToken: string } {
  const challengeId = randomBytes(16).toString('hex');
  const mfaToken = signJwt(
    {
      sub: userId,
      type: 'mfa_challenge',
      challengeId
    },
    {
      secret,
      expiresInSeconds: 300, // 5 minutes
      issuer: options?.issuer,
      audience: options?.audience
    }
  );

  return { challengeId, mfaToken };
}
