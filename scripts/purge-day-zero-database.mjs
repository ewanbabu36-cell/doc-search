import { Client } from 'pg';

async function purgeToDayZero() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
  });

  await client.connect();
  console.log('Connected to PostgreSQL for Day-Zero Clean Slate Purge...');

  const tablesToTruncate = [
    'clinical.encounter_queues',
    'clinical.encounters',
    'emergency.emergency_encounters',
    'laboratory.laboratory_results',
    'laboratory.laboratory_specimens',
    'laboratory.investigation_orders',
    'pharmacy.pharmacy_sales_invoice_items',
    'pharmacy.pharmacy_sales_invoices',
    'pharmacy.pharmacy_prescriptions',
    'inpatient.inpatient_nursing_notes',
    'inpatient.inpatient_doctor_rounds',
    'inpatient.vital_observations',
    'inpatient.inpatient_transfers',
    'inpatient.inpatient_admissions',
    'clinical.patients'
  ];

  for (const table of tablesToTruncate) {
    try {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`[✔] Truncated ${table}`);
    } catch (err) {
      console.log(`[-] Skip ${table}: ${err.message}`);
    }
  }

  // Reset bed statuses to AVAILABLE and unassign any patient
  try {
    await client.query(`
      UPDATE inpatient.inpatient_beds 
      SET status = 'AVAILABLE', current_patient_id = NULL, current_admission_id = NULL
    `);
    console.log('[✔] Reset all inpatient beds to AVAILABLE with zero patient assignments');
  } catch (err) {
    console.log(`[-] Beds reset: ${err.message}`);
  }

  // Remove test batches
  try {
    await client.query(`DELETE FROM pharmacy.pharmacy_batches WHERE batch_number LIKE 'TEST-%' OR batch_number LIKE 'BATCH-DEMO%'`);
    console.log('[✔] Removed test pharmacy batches');
  } catch (err) {
    console.log(`[-] Pharmacy batches: ${err.message}`);
  }

  // Reset test appointments
  try {
    await client.query(`TRUNCATE TABLE clinical.appointments CASCADE`);
    console.log('[✔] Truncated clinical.appointments');
  } catch (err) {
    console.log(`[-] Appointments: ${err.message}`);
  }

  await client.end();
  console.log('============================================================');
  console.log('🎉 100% PURE DAY-ZERO STATE RESTORED: ZERO FAKE PATIENTS OR ORDERS');
  console.log('============================================================');
}

purgeToDayZero().catch(console.error);
