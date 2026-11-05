/**
 * DOC SEARCH ENTERPRISE DISASTER RECOVERY — BACKUP DAEMON
 * Scheduled 6-hour backup job runner with rotation and integrity logging.
 */

import { runFullBackup } from './dr-backup-engine.mjs';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

async function executeCycle() {
  console.log(`[DR-Daemon] Triggering scheduled backup cycle at ${new Date().toISOString()}...`);
  try {
    const res = await runFullBackup();
    console.log(`[DR-Daemon] Cycle completed successfully. Checksum: ${res.sha256}`);
  } catch (err) {
    console.error(`[DR-Daemon] ALERT: Backup cycle failed! Error: ${err.message}`);
  }
}

// Run initial cycle
executeCycle();

// Schedule recurring cycle
setInterval(executeCycle, SIX_HOURS_MS);
console.log(`[DR-Daemon] Scheduled daemon initialized for 6-hour recurring cycles.`);
