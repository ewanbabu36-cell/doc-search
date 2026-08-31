import { z } from 'zod';
import { validateEnv, validateSecretQuality, AppError } from '@docsearch/shared-core';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/docsearch'),
  DATABASE_SSL: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  DATABASE_SSL_CA: z.string().optional(),
  JWT_SECRET: z.string().default('docsearch_master_jwt_secret_dev_32char_key_only'),
  JWT_ISSUER: z.string().default('docsearch-api'),
  JWT_AUDIENCE: z.string().default('docsearch-platform'),
  ENCRYPTION_KEY: z
    .string()
    .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60000),

  // External ABDM National Health Gateway Configuration
  ABDM_BASE_URL: z.string().url().optional(),
  ABDM_CLIENT_ID: z.string().optional(),
  ABDM_CLIENT_SECRET: z.string().optional(),
  ABDM_HIP_ID: z.string().default('IN0710002981'),
  ABDM_HIU_ID: z.string().default('HIU-001'),

  // External Cloud Speech-to-Text Configuration
  STT_PROVIDER: z.enum(['NONE', 'GOOGLE_CLOUD_SPEECH', 'OPENAI_WHISPER', 'AWS_TRANSCRIBE']).default('NONE'),
  STT_PROVIDER_API_KEY: z.string().optional(),
  STT_PROVIDER_URL: z.string().optional(),

  // Physical Hardware Peripherals Configuration
  HARDWARE_BRIDGE_ENABLED: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  ZEBRA_PRINTER_DEFAULT_DPI: z.coerce.number().default(203)
});

export type Env = z.infer<typeof EnvSchema>;

export const env = validateEnv(EnvSchema);

// Additional Production Security Validations
if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    console.warn('[WARN] JWT_SECRET is shorter than 32 characters in production.');
  }

  if (!env.DATABASE_URL) {
    throw AppError.badRequest('DATABASE_URL must be configured in production.');
  }
}

/**
 * Deterministic External Integration Readiness Diagnostic Check
 */
export function getExternalReadinessReport() {
  return {
    abdm: {
      status: env.ABDM_CLIENT_ID && env.ABDM_CLIENT_SECRET ? 'CONFIGURED' : 'BLOCKED_MISSING_CREDENTIALS',
      baseUrl: env.ABDM_BASE_URL || 'https://dev.abdm.gov.in/gateway (DEFAULT)',
      hasClientId: Boolean(env.ABDM_CLIENT_ID),
      hasClientSecret: Boolean(env.ABDM_CLIENT_SECRET),
      hipId: env.ABDM_HIP_ID,
      hiuId: env.ABDM_HIU_ID
    },
    stt: {
      status: env.STT_PROVIDER !== 'NONE' && env.STT_PROVIDER_API_KEY ? 'CONFIGURED' : 'BLOCKED_MISSING_CREDENTIALS',
      provider: env.STT_PROVIDER,
      hasApiKey: Boolean(env.STT_PROVIDER_API_KEY)
    },
    hardware: {
      status: env.HARDWARE_BRIDGE_ENABLED ? 'BRIDGE_ACTIVE_AWAITING_PHYSICAL_USB' : 'DISABLED',
      zebraDefaultDpi: env.ZEBRA_PRINTER_DEFAULT_DPI
    }
  };
}
