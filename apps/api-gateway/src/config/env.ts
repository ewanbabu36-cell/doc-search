import { z } from 'zod';
import { validateEnv } from '@docsearch/shared-core';

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
  CORS_ORIGIN: z
    .string()
    .default(
      'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:5176,http://127.0.0.1:5177'
    ),
  PARTNER_PORTAL_URL: z.string().default('http://localhost:5173'),
  COMPANY_PORTAL_URL: z.string().default('http://localhost:5177'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60000),
  REDIS_URL: z.string().optional(),

  // External ABDM National Health Gateway Configuration
  ABDM_BASE_URL: z.string().url().optional(),
  ABDM_CLIENT_ID: z.string().optional(),
  ABDM_CLIENT_SECRET: z.string().optional(),
  ABDM_HIP_ID: z.string().default('IN0710002981'),
  ABDM_HIU_ID: z.string().default('HIU-001'),

  // Speech-to-Text Configuration
  STT_PROVIDER: z.enum([
    'NONE',
    'GOOGLE_CLOUD_SPEECH',
    'OPENAI_WHISPER',
    'AWS_TRANSCRIBE',
    'SELF_HOSTED_WHISPER',
    'WHISPER_LOCAL'
  ]).default('SELF_HOSTED_WHISPER'),
  STT_PROVIDER_API_KEY: z.string().optional(),
  STT_PROVIDER_URL: z.string().optional(),
  WHISPER_MODEL: z.string().default('base'),
  WHISPER_DEVICE: z.string().default('auto'),
  WHISPER_TIMEOUT_SECONDS: z.coerce.number().default(300),
  WHISPER_MAX_CONCURRENCY: z.coerce.number().default(1),
  WHISPER_PYTHON_PATH: z.string().optional(),
  WHISPER_FFMPEG_PATH: z.string().optional(),
  WHISPER_MODEL_DIR: z.string().optional(),
  WHISPER_LANGUAGE: z.string().default('auto'),

  // External Cloud Text-to-Speech Configuration
  TTS_PROVIDER: z.enum(['NONE', 'GOOGLE_CLOUD_TTS', 'OPENAI_TTS', 'AWS_POLLY']).default('NONE'),
  TTS_PROVIDER_API_KEY: z.string().optional(),
  TTS_PROVIDER_URL: z.string().optional(),

  // Physical Hardware Peripherals Configuration
  HARDWARE_BRIDGE_ENABLED: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  ZEBRA_PRINTER_DEFAULT_DPI: z.coerce.number().default(203)
});

export type Env = z.infer<typeof EnvSchema>;

export const env = validateEnv(EnvSchema);

export const DEV_DEFAULT_JWT_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
export const DEV_DEFAULT_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Additional Production Security Validations (Fail-Closed)
if (env.NODE_ENV === 'production') {
  const fatalErrors: string[] = [];

  if (!env.JWT_SECRET || env.JWT_SECRET === DEV_DEFAULT_JWT_SECRET) {
    fatalErrors.push('FATAL: JWT_SECRET must be configured with a unique production secret and cannot use the development default.');
  } else if (env.JWT_SECRET.length < 32) {
    fatalErrors.push('FATAL: JWT_SECRET must be at least 32 characters in production.');
  }

  if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY === DEV_DEFAULT_ENCRYPTION_KEY) {
    fatalErrors.push('FATAL: ENCRYPTION_KEY must be configured with a unique 64-character hex key in production.');
  } else if (env.ENCRYPTION_KEY.length !== 64) {
    fatalErrors.push('FATAL: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes AES-256).');
  }

  if (!env.DATABASE_URL || (!process.env['ALLOW_LOCALHOST_DB_IN_PROD'] && env.DATABASE_URL.includes('localhost'))) {
    fatalErrors.push('FATAL: Production requires an external DATABASE_URL and cannot connect to unconfigured localhost without ALLOW_LOCALHOST_DB_IN_PROD.');
  }

  if (fatalErrors.length > 0) {
    console.error('================================================================================');
    console.error('CRITICAL PRODUCTION SECURITY CONFIGURATION FAILURE (FAIL-CLOSED):');
    fatalErrors.forEach((err) => console.error('  - ' + err));
    console.error('Server boot aborted. Please supply valid production environment variables.');
    console.error('================================================================================');
    throw new Error(`Production Fail-Closed Boot Error: \n${fatalErrors.join('\n')}`);
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
      status:
        env.STT_PROVIDER === 'SELF_HOSTED_WHISPER' || env.STT_PROVIDER === 'WHISPER_LOCAL'
          ? 'SELF_HOSTED_LOCAL_ACTIVE'
          : env.STT_PROVIDER !== 'NONE' && env.STT_PROVIDER_API_KEY
            ? 'CONFIGURED'
            : 'BLOCKED_MISSING_CREDENTIALS',
      provider: env.STT_PROVIDER,
      model: env.WHISPER_MODEL,
      device: env.WHISPER_DEVICE,
      hasApiKey: Boolean(env.STT_PROVIDER_API_KEY)
    },
    tts: {
      status: env.TTS_PROVIDER !== 'NONE' && env.TTS_PROVIDER_API_KEY ? 'CONFIGURED' : 'BLOCKED_MISSING_CREDENTIALS',
      provider: env.TTS_PROVIDER,
      hasApiKey: Boolean(env.TTS_PROVIDER_API_KEY)
    },
    hardware: {
      status: env.HARDWARE_BRIDGE_ENABLED ? 'BRIDGE_ACTIVE_AWAITING_PHYSICAL_USB' : 'DISABLED',
      zebraDefaultDpi: env.ZEBRA_PRINTER_DEFAULT_DPI
    }
  };
}
