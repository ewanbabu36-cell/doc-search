/**
 * DocSearch Clinical Sweepers Daemon
 * -----------------------------------
 * Runs scheduled clinical sweepers in the background:
 * 1. Blood Bank 48-Hour Crossmatch Expiration Sweep:
 *    Auto-sweeps expired surgical crossmatch holds and restores PRBC/FFP bags to emergency inventory.
 * 2. Bed Turnaround Cleaning Priority Auto-Escalation Sweep:
 *    Auto-escalates uncompleted dirty bed cleaning missions exceeding the 20-minute turnaround SLA.
 */

import { getDatabase, sql } from '../packages/database/dist/index.js';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const INTERVAL_SECONDS = parseInt(process.env.SWEEPER_INTERVAL_SECONDS || '60', 10);
const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';

console.log('============================================================');
console.log('🏥 DOCSEARCH AUTONOMOUS CLINICAL SWEEPERS DAEMON');
console.log(`Interval: Every ${INTERVAL_SECONDS} seconds | Tenant: ${CANONICAL_TENANT}`);
console.log('============================================================\n');

async function sweepCrossmatchReservations(db) {
  try {
    const expiredRes = await db.execute(sql`
      SELECT reservation_id, unit_barcode, patient_name
      FROM blood_bank_crossmatch_reservations
      WHERE reservation_status = 'ACTIVE_SURGERY_HOLD'
        AND expires_at < NOW();
    `);

    const expiredRows = expiredRes?.rows || [];
    if (expiredRows.length > 0) {
      await db.execute(sql`
        UPDATE blood_bank_unit_inventory
        SET status = 'AVAILABLE_UNRESERVED'
        WHERE unit_barcode IN (
          SELECT unit_barcode FROM blood_bank_crossmatch_reservations
          WHERE reservation_status = 'ACTIVE_SURGERY_HOLD'
            AND expires_at < NOW()
        );
      `);

      await db.execute(sql`
        UPDATE blood_bank_crossmatch_reservations
        SET reservation_status = 'EXPIRED_RELEASED_TO_GENERAL_POOL',
            released_at = NOW()
        WHERE reservation_status = 'ACTIVE_SURGERY_HOLD'
          AND expires_at < NOW();
      `);

      console.log(`[BloodBank] Auto-released ${expiredRows.length} expired crossmatched unit(s) back to emergency stock.`);
    }
  } catch (err) {
    console.warn(`[BloodBank] Notice during crossmatch sweep: ${err.message}`);
  }
}

async function sweepBedTurnaroundMissions(db) {
  try {
    const breachingRes = await db.execute(sql`
      SELECT id, bed_number, ward_name, cleaning_staff_name
      FROM bed_turnaround_missions
      WHERE cleaning_status IN ('DISPATCHED', 'IN_PROGRESS')
        AND dispatch_time < NOW() - INTERVAL '20 minutes';
    `);

    const breachingRows = breachingRes?.rows || [];
    if (breachingRows.length > 0) {
      await db.execute(sql`
        UPDATE bed_turnaround_missions
        SET cleaning_status = 'ESCALATED_SLA_BREACH'
        WHERE cleaning_status IN ('DISPATCHED', 'IN_PROGRESS')
          AND dispatch_time < NOW() - INTERVAL '20 minutes';
      `);

      try {
        await db.execute(sql`
          UPDATE clinical.inpatient_bed_turnaround
          SET status = 'ESCALATED', updated_at = NOW()
          WHERE status IN ('REQUESTED', 'IN_PROGRESS')
            AND requested_at < NOW() - INTERVAL '20 minutes';
        `);
      } catch {}

      console.log(`[BedTurnaround] Auto-escalated ${breachingRows.length} breaching bed turnaround mission(s) past 20-min SLA.`);
    }
  } catch (err) {
    console.warn(`[BedTurnaround] Notice during turnaround sweep: ${err.message}`);
  }
}

async function runCycle() {
  const db = getDatabase();
  const start = Date.now();
  await sweepCrossmatchReservations(db);
  await sweepBedTurnaroundMissions(db);
  const elapsed = Date.now() - start;
  console.log(`[${new Date().toISOString()}] Completed clinical sweeper cycle in ${elapsed}ms.`);
}

async function main() {
  await runCycle();
  setInterval(runCycle, INTERVAL_SECONDS * 1000);
}

main().catch(console.error);
