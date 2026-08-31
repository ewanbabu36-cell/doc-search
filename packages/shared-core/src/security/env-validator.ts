import { z } from 'zod';
import { AppError } from '../errors/app-error.js';

const INSECURE_EXACT_VALUES = [
  'secret',
  'password',
  'changeme',
  'development',
  'dev-secret',
  'placeholder',
  'sample',
  'test-secret',
  '12345678',
  'admin'
];

const INSECURE_SUBSTRINGS = [
  'changeme',
  'dev-secret',
  '12345678',
  'password',
  'placeholder'
];

/**
 * Validates the cryptographic quality of a production secret.
 * Throws AppError without logging or exposing the secret value.
 */
export function validateSecretQuality(name: string, value: string | undefined, minLength = 32): void {
  if (!value || typeof value !== 'string') {
    throw AppError.badRequest(`${name} is required in production.`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw AppError.badRequest(`${name} must be at least ${minLength} characters in production.`);
  }

  const lower = trimmed.toLowerCase();
  for (const exact of INSECURE_EXACT_VALUES) {
    if (lower === exact) {
      throw AppError.badRequest(`${name} uses an insecure placeholder or development value.`);
    }
  }

  for (const substr of INSECURE_SUBSTRINGS) {
    if (lower.includes(substr)) {
      throw AppError.badRequest(`${name} uses an insecure placeholder or development value.`);
    }
  }
}


export function validateEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  env: Record<string, string | undefined> = process.env
): z.infer<z.ZodObject<T>> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));

    // Log sanitized field names only, never secrets or credential values
    console.error(
      'Environment variable validation failed:',
      JSON.stringify(
        issues.map((i) => ({ field: i.field, reason: i.message })),
        null,
        2
      )
    );

    throw AppError.badRequest('Invalid environment configuration', issues);
  }
  return result.data;
}

