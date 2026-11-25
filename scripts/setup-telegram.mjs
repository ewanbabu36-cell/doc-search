#!/usr/bin/env node
/**
 * DocSearch Universal Telegram Healthcare Bot Setup & Verification CLI
 * ----------------------------------------------------------------------
 * Verifies @BotFather Bot Token live via Telegram Bot API (/getMe),
 * auto-discovers Admin Chat ID via recent bot messages (/getUpdates) if omitted,
 * optionally dispatches a live verification message, and saves to .env.
 *
 * Usage:
 *   1. Inspect current .env Telegram status & auto-discover chatId:
 *      node scripts/setup-telegram.mjs
 *
 *   2. Setup & Verify with BotFather token (auto-detects chatId if you sent /start):
 *      node scripts/setup-telegram.mjs "123456789:ABCdefGHIjkl..." --save
 *
 *   3. Explicitly pass Bot Token + Admin Chat ID + send live test ping:
 *      node scripts/setup-telegram.mjs "123456789:ABCdef..." "987654321" --test-send --save
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${BOLD}${CYAN}`);
console.log('===============================================================');
console.log('      DOC SEARCH — TELEGRAM BOT SETUP & VERIFICATION CLI       ');
console.log('===============================================================' + RESET);

const args = process.argv.slice(2);
let botToken = '';
let adminChatId = '';
let shouldSave = false;
let shouldTestSend = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--save') shouldSave = true;
  else if (a === '--test-send') shouldTestSend = true;
  else if (!a.startsWith('--') && !botToken) botToken = a.trim();
  else if (!a.startsWith('--') && !adminChatId) adminChatId = a.trim();
}

let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';

if (!botToken) {
  const m = envContent.match(/^TELEGRAM_BOT_TOKEN=(.+)$/m);
  if (m) botToken = m[1].trim().replace(/^['"]|['"]$/g, '');
}
if (!adminChatId) {
  const m = envContent.match(/^TELEGRAM_ADMIN_CHAT_ID=(.+)$/m);
  if (m) adminChatId = m[1].trim().replace(/^['"]|['"]$/g, '');
}

if (!botToken || botToken.includes('1234567890:ABCdef')) {
  console.log(`\n${YELLOW}⚠️  TELEGRAM_BOT_TOKEN not found in .env or CLI arguments!${RESET}\n`);
  console.log(`${BOLD}How to create your Free Telegram Healthcare Bot (60 seconds):${RESET}`);
  console.log('  1. Open Telegram app -> Search for "@BotFather" (verified blue tick).');
  console.log('  2. Send /newbot command to @BotFather.');
  console.log('  3. Enter Display Name (e.g. "DocSearch Healthcare Alert Bot").');
  console.log('  4. Enter Username ending with "bot" (e.g. "DocSearchHealthBot").');
  console.log('  5. @BotFather will give you a Bot HTTP API Token (like 7123456789:AAH...).');
  console.log('  6. Open your new bot link (t.me/YourBot) and click START (or send Hi).\n');
  console.log(`${BOLD}Then run:${RESET}`);
  console.log(`  node scripts/setup-telegram.mjs "<BOT_TOKEN>" --test-send --save\n`);
  process.exit(1);
}

console.log(`\n🔍 ${BOLD}Verifying Telegram Bot Token:${RESET}`);
console.log(`  • Token Hint: ${CYAN}${botToken.slice(0, 10)}...${botToken.slice(-4)}${RESET}`);

async function run() {
  const apiBase = `https://api.telegram.org/bot${botToken}`;
  try {
    const meRes = await fetch(`${apiBase}/getMe`, { signal: AbortSignal.timeout(8000) });
    const meData = await meRes.json();
    if (!meRes.ok || !meData.ok) {
      throw new Error(meData.description || meRes.statusText || 'Telegram /getMe rejected token');
    }

    const bot = meData.result;
    console.log(`\n${GREEN}✅ SUCCESS: Connected to Telegram Bot @${bot.username} (${bot.first_name}, ID: ${bot.id})${RESET}`);

    // Auto-discover Admin Chat ID if not provided
    if (!adminChatId) {
      console.log(`\n🔎 Searching recent chats via /getUpdates to auto-detect your Chat ID...`);
      const updRes = await fetch(`${apiBase}/getUpdates?limit=20`, { signal: AbortSignal.timeout(8000) });
      const updData = await updRes.json();
      if (updData.ok && Array.isArray(updData.result) && updData.result.length > 0) {
        const chats = new Map();
        for (const u of updData.result) {
          const msg = u.message || u.channel_post || u.my_chat_member;
          if (msg?.chat?.id) {
            chats.set(String(msg.chat.id), msg.chat);
          }
        }
        const entries = [...chats.values()];
        if (entries.length > 0) {
          const latest = entries[entries.length - 1];
          adminChatId = String(latest.id);
          const chatName = latest.title || [latest.first_name, latest.last_name].filter(Boolean).join(' ') || latest.username || adminChatId;
          console.log(`${GREEN}🎯 Auto-detected Admin Chat ID: ${BOLD}${adminChatId}${RESET} ${GREEN}(${chatName}, type=${latest.type})${RESET}`);
        }
      }
      if (!adminChatId) {
        console.log(`${YELLOW}ℹ️  No inbound message found yet. Open https://t.me/${bot.username} and send /start, then re-run to auto-capture Chat ID.${RESET}`);
      }
    } else {
      console.log(`  • Admin Chat ID: ${CYAN}${adminChatId}${RESET}`);
    }

    if (shouldTestSend) {
      if (!adminChatId) {
        console.log(`${YELLOW}⚠️  Cannot dispatch test message yet because Admin Chat ID is unknown.${RESET}`);
      } else {
        const msgText = [
          '🏥 <b>DocSearch Healthcare Bot Connected!</b>',
          '━━━━━━━━━━━━━━━━━━━━━',
          `🤖 <b>Bot:</b> @${bot.username}`,
          `🆔 <b>Chat ID:</b> <code>${adminChatId}</code>`,
          '✅ Real-time Critical Lab Alerts, OPD Queue & Code Blue channels are now <b>LIVE</b>.'
        ].join('\n');
        const sendRes = await fetch(`${apiBase}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: adminChatId, text: msgText, parse_mode: 'HTML' }),
          signal: AbortSignal.timeout(8000)
        });
        const sendData = await sendRes.json();
        if (!sendRes.ok || !sendData.ok) {
          throw new Error(`sendMessage failed: ${sendData.description || sendRes.statusText}`);
        }
        console.log(`${GREEN}🚀 LIVE TEST SENT: Telegram delivered msg_id=${sendData.result?.message_id} to chat ${adminChatId}!${RESET}`);
      }
    }

    if (shouldSave) {
      const updates = { TELEGRAM_BOT_TOKEN: botToken };
      if (adminChatId) updates.TELEGRAM_ADMIN_CHAT_ID = adminChatId;
      for (const [k, v] of Object.entries(updates)) {
        const re = new RegExp(`^${k}=.*$`, 'm');
        if (re.test(envContent)) envContent = envContent.replace(re, `${k}=${v}`);
        else envContent = `${envContent.trimEnd()}\n${k}=${v}`;
      }
      fs.writeFileSync(ENV_PATH, envContent.trimEnd() + '\n', 'utf8');
      console.log(`${GREEN}💾 SAVED: Telegram credentials persisted to .env!${RESET}\n`);
    }
  } catch (err) {
    console.error(`\n${RED}❌ ERROR: Telegram setup failed: ${err.message}${RESET}\n`);
    process.exit(1);
  }
}

run();
