#!/usr/bin/env node
/**
 * DocSearch Unified Production Credentials Audit & Setup CLI
 * -----------------------------------------------------------
 * Usage:
 *   1. Full Audit across Gmail, Firebase, Telegram, Razorpay, Stripe, ABDM, DLT SMS:
 *      node scripts/setup-production-credentials.mjs --check
 *
 *   2. Set specific keys cleanly in .env:
 *      node scripts/setup-production-credentials.mjs --set TELEGRAM_BOT_TOKEN=123456:ABC --set TELEGRAM_ADMIN_CHAT_ID=987654
 *
 *   3. Verify live connectivity for a channel:
 *      node scripts/setup-production-credentials.mjs --test telegram
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

const require = createRequire(path.join(ROOT_DIR, 'apps/api-gateway/package.json'));
const nodemailer = require('nodemailer');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const CHANNEL_SPECS = [
  {
    id: 'gmail',
    label: 'Gmail SMTP',
    keys: ['GMAIL_USER', 'GMAIL_APP_PASSWORD'],
    placeholders: ['your-email@gmail.com', 'your-16-char-app-password']
  },
  {
    id: 'firebase',
    label: 'Firebase FCM HTTP v1 & Auth',
    keys: ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_KEY'],
    placeholders: ['your-firebase-project-id', 'your-firebase-server-key']
  },
  {
    id: 'telegram',
    label: 'Telegram Healthcare Bot',
    keys: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID'],
    placeholders: ['1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ']
  },
  {
    id: 'razorpay',
    label: 'Razorpay Split Escrow',
    keys: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'],
    placeholders: ['rzp_test_xxxxxxxxxxxx', 'your_razorpay_key_secret']
  },
  {
    id: 'stripe',
    label: 'Stripe Billing',
    keys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    placeholders: ['sk_test_xxxxxxxxxxxx']
  },
  {
    id: 'abdm',
    label: 'ABDM NHA Bridge',
    keys: ['ABDM_CLIENT_ID', 'ABDM_CLIENT_SECRET', 'ABDM_HIP_ID'],
    placeholders: ['SBX_xxxxxx', 'your_abdm_client_secret']
  },
  {
    id: 'dltSms',
    label: 'DLT SMS (MSG91 / Gupshup)',
    keys: ['MSG91_AUTH_KEY', 'GUPSHUP_API_KEY'],
    placeholders: ['your_msg91_auth_key', 'your_gupshup_api_key']
  },
  {
    id: 'whatsapp',
    label: 'Meta WhatsApp Cloud API',
    keys: ['META_WA_ACCESS_TOKEN', 'META_WA_PHONE_NUMBER_ID'],
    placeholders: ['your_meta_whatsapp_token', 'your_phone_number_id']
  }
];

function parseEnvFile() {
  const map = new Map();
  if (!fs.existsSync(ENV_PATH)) return map;
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) {
      map.set(m[1], m[2].replace(/^['"]|['"]$/g, '').trim());
    }
  }
  return map;
}

function saveEnvKey(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const singleLine = value.replace(/[\r\n]+/g, ' ').trim();
  const formatted = singleLine.startsWith('{') && singleLine.endsWith('}')
    ? `'${singleLine.replace(/'/g, '')}'`
    : singleLine.includes(' ')
      ? `"${singleLine}"`
      : singleLine;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${formatted}`);
  } else {
    content = `${content.trimEnd()}\n${key}=${formatted}`;
  }
  fs.writeFileSync(ENV_PATH, content.trimEnd() + '\n', 'utf8');
}

function printAudit(envMap) {
  console.log(`\n${BOLD}${CYAN}=================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}     DOC SEARCH — PRODUCTION CREDENTIALS READINESS MATRIX        ${RESET}`);
  console.log(`${BOLD}${CYAN}=================================================================${RESET}\n`);

  let configured = 0;
  for (const spec of CHANNEL_SPECS) {
    const statuses = spec.keys.map((k) => {
      const val = envMap.get(k);
      const valid = Boolean(val && val.length > 0 && !spec.placeholders.some((p) => val.includes(p)));
      return { key: k, valid, masked: valid ? `${val.slice(0, 4)}***` : 'MISSING' };
    });

    const isChannelLive = spec.id === 'dltSms'
      ? statuses.some((s) => s.valid)
      : spec.id === 'firebase'
        ? (statuses.every((s) => s.valid) || Boolean(envMap.get('FIREBASE_SERVER_KEY') && !spec.placeholders.some((p) => envMap.get('FIREBASE_SERVER_KEY').includes(p))))
        : statuses.every((s) => s.valid);

    if (isChannelLive) configured++;

    const badge = isChannelLive ? `${GREEN}[LIVE CONFIGURED]${RESET}` : `${YELLOW}[SIMULATION MODE]${RESET}`;
    console.log(`${badge} ${BOLD}${spec.label}${RESET}`);
    for (const st of statuses) {
      console.log(`   • ${st.key.padEnd(28)}: ${st.valid ? GREEN + st.masked : RED + 'UNSET'}${RESET}`);
    }
  }

  const pct = Math.round((configured / CHANNEL_SPECS.length) * 100);
  console.log(`\n${BOLD}Overall Production Readiness Score:${RESET} ${pct}% (${configured}/${CHANNEL_SPECS.length} channels live)\n`);
}

async function testChannel(channel, envMap) {
  if (channel === 'gmail') {
    const user = envMap.get('GMAIL_USER');
    const pass = (envMap.get('GMAIL_APP_PASSWORD') || '').replace(/\s+/g, '');
    if (!user || !pass) {
      console.log(`${RED}[FAIL] GMAIL_USER or GMAIL_APP_PASSWORD missing in .env${RESET}`);
      process.exitCode = 1;
      return;
    }
    try {
      const t = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
      await t.verify();
      console.log(`${GREEN}[PASS] Gmail SMTP verified cleanly for ${user}${RESET}`);
    } catch (err) {
      console.log(`${RED}[FAIL] Gmail SMTP verification error: ${err.message}${RESET}`);
      process.exitCode = 1;
    }
  } else if (channel === 'telegram') {
    const token = envMap.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      console.log(`${RED}[FAIL] TELEGRAM_BOT_TOKEN missing in .env${RESET}`);
      process.exitCode = 1;
      return;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (data.ok) {
        console.log(`${GREEN}[PASS] Telegram Bot verified: @${data.result.username}${RESET}`);
      } else {
        console.log(`${RED}[FAIL] Telegram API error: ${data.description}${RESET}`);
        process.exitCode = 1;
      }
    } catch (err) {
      console.log(`${RED}[FAIL] Telegram network error: ${err.message}${RESET}`);
      process.exitCode = 1;
    }
  } else {
    console.log(`${YELLOW}[INFO] Live probe for '${channel}' checked via env schema; API Gateway handles simulation fallback.${RESET}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let didMutate = false;
  let testTarget = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--set' && args[i + 1]) {
      const kv = args[i + 1];
      const eqIdx = kv.indexOf('=');
      if (eqIdx > 0) {
        const k = kv.slice(0, eqIdx).trim();
        const v = kv.slice(eqIdx + 1).trim();
        saveEnvKey(k, v);
        console.log(`${GREEN}[SAVED]${RESET} ${k} updated in .env`);
        didMutate = true;
      }
      i++;
    } else if (args[i] === '--test' && args[i + 1]) {
      testTarget = args[i + 1];
      i++;
    }
  }

  const envMap = parseEnvFile();
  if (testTarget) {
    await testChannel(testTarget, envMap);
  } else if (!didMutate || args.includes('--check')) {
    printAudit(envMap);
  }
}

main();
