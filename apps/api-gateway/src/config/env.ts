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
  PARTNER_PORTAL_URL: z.string().default(process.env['NODE_ENV'] === 'production' ? 'https://partner.docsearch.in' : 'http://localhost:5173'),
  COMPANY_PORTAL_URL: z.string().default(process.env['NODE_ENV'] === 'production' ? 'https://hq.docsearch.in' : 'http://localhost:5177'),
  PATIENT_PORTAL_URL: z.string().default(process.env['NODE_ENV'] === 'production' ? 'https://patient.docsearch.in' : 'http://localhost:5174'),
  MEDIA_CDN_BASE_URL: z.string().url().optional(),
  FINANCING_ESCROW_API_KEY: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60000),
  REDIS_URL: z.string().optional(),

  // External ABDM National Health Gateway Configuration
  ABDM_BASE_URL: z.string().url().optional(),
  ABDM_CLIENT_ID: z.string().optional(),
  ABDM_CLIENT_SECRET: z.string().optional(),
  ABDM_HIP_ID: z.string().default('IN0710002981'),
  ABDM_HIU_ID: z.string().default('HIU-001'),

  // Meta WhatsApp Cloud API (v18.0) Configuration
  META_WA_API_URL: z.string().url().default('https://graph.facebook.com/v18.0'),
  META_WA_ACCESS_TOKEN: z.string().optional(),
  META_WA_PHONE_NUMBER_ID: z.string().optional(),
  META_WA_BUSINESS_ACCOUNT_ID: z.string().optional(),
  META_WA_WEBHOOK_VERIFY_TOKEN: z.string().default('docsearch_wa_webhook_verify_token_prod'),

  // IRDAI HCX (National Health Claims Exchange) Gateway Configuration
  HCX_BASE_URL: z.string().url().default('https://hcx-mock-service.swasth.app/v0.7'),
  HCX_PARTICIPANT_CODE: z.string().default('HOSP_DOCSEARCH_01'),
  HCX_AUTH_TOKEN: z.string().optional(),

  // Dynamic UPI & Soundbox Gateway Configuration
  UPI_VPA: z.string().default('docsearch.hospital@icici'),
  UPI_MERCHANT_NAME: z.string().default('DocSearch Multispeciality Hospital'),
  UPI_SOUNDBOX_WEBHOOK_SECRET: z.string().default('docsearch_soundbox_secret_default'),

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
  ZEBRA_PRINTER_DEFAULT_DPI: z.coerce.number().default(203),

  // Omnichannel Communication (Gmail, Firebase, Telegram)
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  GMAIL_FROM: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_SERVER_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional(),

  // Payment Gateways (Razorpay & Stripe)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // TRAI DLT Compliant SMS Providers
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().default('DOCSRH'),
  GUPSHUP_API_KEY: z.string().optional(),
  GUPSHUP_APP_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional()
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
 * Reads live from process.env so runtime updates reflect immediately.
 */
export function getExternalReadinessReport() {
  const e = process.env;
  const isNonPlaceholder = (val: string | undefined, placeholders: string[] = []) => {
    if (!val || val.trim() === '') return false;
    const trimmed = val.trim();
    return !placeholders.some((p) => trimmed.includes(p));
  };

  const gmailConfigured = isNonPlaceholder(e['GMAIL_USER'], ['your-email@gmail.com']) &&
    isNonPlaceholder(e['GMAIL_APP_PASSWORD'], ['your-16-char-app-password']);
  const firebaseConfigured = isNonPlaceholder(e['FIREBASE_SERVER_KEY'], ['your-firebase-server-key']) ||
    (isNonPlaceholder(e['FIREBASE_PROJECT_ID']) && isNonPlaceholder(e['FIREBASE_SERVICE_ACCOUNT_KEY']));
  const telegramConfigured = isNonPlaceholder(e['TELEGRAM_BOT_TOKEN'], ['1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ']);
  const razorpayConfigured = isNonPlaceholder(e['RAZORPAY_KEY_ID'], ['rzp_test_xxxxxxxxxxxx']) &&
    isNonPlaceholder(e['RAZORPAY_KEY_SECRET'], ['your_razorpay_key_secret']);
  const stripeConfigured = isNonPlaceholder(e['STRIPE_SECRET_KEY'], ['sk_test_xxxxxxxxxxxx']);
  const abdmConfigured = isNonPlaceholder(e['ABDM_CLIENT_ID'] || env.ABDM_CLIENT_ID, ['SBX_xxxxxx']) &&
    isNonPlaceholder(e['ABDM_CLIENT_SECRET'] || env.ABDM_CLIENT_SECRET, ['your_abdm_client_secret']);
  const dltSmsConfigured =
    isNonPlaceholder(e['MSG91_AUTH_KEY'], ['your_msg91_auth_key']) ||
    isNonPlaceholder(e['GUPSHUP_API_KEY'], ['your_gupshup_api_key']) ||
    (isNonPlaceholder(e['TWILIO_ACCOUNT_SID']) && isNonPlaceholder(e['TWILIO_AUTH_TOKEN']));
  const whatsappConfigured =
    isNonPlaceholder(e['META_WA_ACCESS_TOKEN'] || env.META_WA_ACCESS_TOKEN, ['your_meta_whatsapp_token']) &&
    isNonPlaceholder(e['META_WA_PHONE_NUMBER_ID'] || env.META_WA_PHONE_NUMBER_ID, ['your_phone_number_id']);
  const hcxConfigured = isNonPlaceholder(e['HCX_AUTH_TOKEN'] || env.HCX_AUTH_TOKEN);

  const channels = [
    gmailConfigured,
    firebaseConfigured,
    telegramConfigured,
    razorpayConfigured,
    stripeConfigured,
    abdmConfigured,
    dltSmsConfigured,
    whatsappConfigured
  ];
  const configuredCount = channels.filter(Boolean).length;

  return {
    summary: {
      totalCoreChannels: channels.length,
      configuredCount,
      simulationCount: channels.length - configuredCount,
      readinessPercent: Math.round((configuredCount / channels.length) * 100)
    },
    gmail: {
      status: gmailConfigured ? 'CONFIGURED' : 'SIMULATION_FALLBACK_ACTIVE',
      configured: gmailConfigured,
      userHint: e['GMAIL_USER'] ? `${e['GMAIL_USER'].slice(0, 3)}***` : null,
      requiredVars: ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'GMAIL_FROM']
    },
    firebase: {
      status: firebaseConfigured ? 'CONFIGURED' : 'SIMULATION_FALLBACK_ACTIVE',
      configured: firebaseConfigured,
      projectId: e['FIREBASE_PROJECT_ID'] || null,
      hasServerKey: Boolean(e['FIREBASE_SERVER_KEY']),
      hasServiceAccount: Boolean(e['FIREBASE_SERVICE_ACCOUNT_KEY']),
      requiredVars: ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_KEY']
    },
    telegram: {
      status: telegramConfigured ? 'CONFIGURED' : 'SIMULATION_FALLBACK_ACTIVE',
      configured: telegramConfigured,
      hasBotToken: telegramConfigured,
      hasAdminChatId: Boolean(e['TELEGRAM_ADMIN_CHAT_ID']),
      requiredVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID']
    },
    razorpay: {
      status: razorpayConfigured ? 'CONFIGURED' : 'SIMULATION_FALLBACK_ACTIVE',
      configured: razorpayConfigured,
      keyIdHint: e['RAZORPAY_KEY_ID'] ? `${e['RAZORPAY_KEY_ID'].slice(0, 8)}***` : null,
      requiredVars: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']
    },
    stripe: {
      status: stripeConfigured ? 'CONFIGURED' : 'SIMULATION_FALLBACK_ACTIVE',
      configured: stripeConfigured,
      requiredVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
    },
    abdm: {
      status: abdmConfigured ? 'CONFIGURED' : 'BLOCKED_MISSING_CREDENTIALS',
      configured: abdmConfigured,
      baseUrl: e['ABDM_BASE_URL'] || env.ABDM_BASE_URL || 'https://dev.abdm.gov.in/gateway (DEFAULT)',
      hasClientId: Boolean(e['ABDM_CLIENT_ID'] || env.ABDM_CLIENT_ID),
      hasClientSecret: Boolean(e['ABDM_CLIENT_SECRET'] || env.ABDM_CLIENT_SECRET),
      hipId: e['ABDM_HIP_ID'] || env.ABDM_HIP_ID,
      hiuId: e['ABDM_HIU_ID'] || env.ABDM_HIU_ID,
      requiredVars: ['ABDM_BASE_URL', 'ABDM_CLIENT_ID', 'ABDM_CLIENT_SECRET', 'ABDM_HIP_ID']
    },
    dltSms: {
      status: dltSmsConfigured ? 'CONFIGURED' : 'SIMULATION_FALLBACK_ACTIVE',
      configured: dltSmsConfigured,
      providersConfigured: {
        msg91: isNonPlaceholder(e['MSG91_AUTH_KEY'], ['your_msg91_auth_key']),
        gupshup: isNonPlaceholder(e['GUPSHUP_API_KEY'], ['your_gupshup_api_key']),
        twilio: isNonPlaceholder(e['TWILIO_ACCOUNT_SID']) && isNonPlaceholder(e['TWILIO_AUTH_TOKEN'])
      },
      requiredVars: ['MSG91_AUTH_KEY', 'MSG91_SENDER_ID', 'GUPSHUP_API_KEY']
    },
    stt: {
      status:
        env.STT_PROVIDER === 'SELF_HOSTED_WHISPER' || env.STT_PROVIDER === 'WHISPER_LOCAL'
          ? 'SELF_HOSTED_LOCAL_ACTIVE'
          : env.STT_PROVIDER !== 'NONE' && (e['STT_PROVIDER_API_KEY'] || env.STT_PROVIDER_API_KEY)
            ? 'CONFIGURED'
            : 'BLOCKED_MISSING_CREDENTIALS',
      provider: env.STT_PROVIDER,
      model: env.WHISPER_MODEL,
      device: env.WHISPER_DEVICE,
      hasApiKey: Boolean(e['STT_PROVIDER_API_KEY'] || env.STT_PROVIDER_API_KEY)
    },
    tts: {
      status: env.TTS_PROVIDER !== 'NONE' && (e['TTS_PROVIDER_API_KEY'] || env.TTS_PROVIDER_API_KEY) ? 'CONFIGURED' : 'BLOCKED_MISSING_CREDENTIALS',
      configured: env.TTS_PROVIDER !== 'NONE' && Boolean(e['TTS_PROVIDER_API_KEY'] || env.TTS_PROVIDER_API_KEY),
      provider: env.TTS_PROVIDER,
      hasApiKey: Boolean(e['TTS_PROVIDER_API_KEY'] || env.TTS_PROVIDER_API_KEY)
    },
    hardware: {
      status: env.HARDWARE_BRIDGE_ENABLED ? 'BRIDGE_ACTIVE_AWAITING_PHYSICAL_USB' : 'DISABLED',
      zebraDefaultDpi: env.ZEBRA_PRINTER_DEFAULT_DPI
    },
    whatsapp: {
      status: whatsappConfigured ? 'CONFIGURED' : 'SANDBOX_SIMULATION_ACTIVE',
      configured: whatsappConfigured,
      apiUrl: env.META_WA_API_URL,
      hasAccessToken: Boolean(e['META_WA_ACCESS_TOKEN'] || env.META_WA_ACCESS_TOKEN),
      phoneNumberId: e['META_WA_PHONE_NUMBER_ID'] || env.META_WA_PHONE_NUMBER_ID || 'UNCONFIGURED (FALLBACK ACTIVE)',
      requiredVars: ['META_WA_ACCESS_TOKEN', 'META_WA_PHONE_NUMBER_ID']
    },
    hcx: {
      status: hcxConfigured ? 'CONFIGURED' : 'SANDBOX_SIMULATION_ACTIVE',
      configured: hcxConfigured,
      baseUrl: env.HCX_BASE_URL,
      participantCode: env.HCX_PARTICIPANT_CODE,
      hasAuthToken: hcxConfigured
    },
    upi: {
      status: isNonPlaceholder(e['UPI_VPA'] || env.UPI_VPA, ['docsearch.hospital@icici']) ? 'ACTIVE' : 'SANDBOX_DEFAULT_VPA',
      vpa: e['UPI_VPA'] || env.UPI_VPA,
      vpaConfigured: isNonPlaceholder(e['UPI_VPA'] || env.UPI_VPA, ['docsearch.hospital@icici']),
      merchantName: env.UPI_MERCHANT_NAME,
      soundboxConfigured: isNonPlaceholder(e['UPI_SOUNDBOX_WEBHOOK_SECRET'] || env.UPI_SOUNDBOX_WEBHOOK_SECRET, ['docsearch_soundbox_secret_default'])
    }
  };
}
