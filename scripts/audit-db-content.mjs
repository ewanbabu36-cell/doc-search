import { pool } from '../packages/database/src/client.js';

async function checkDatabaseState() {
  console.log('Connecting to PostgreSQL database to verify real persistent records...');
  try {
    const counts = {};
    const tables = [
      'company.partners',
      'company.legal_entities',
      'company.operational_facilities',
      'company.subscriptions',
      'company.licenses',
      'company.leads',
      'company.invoices',
      'clinical.operational_staff',
      'clinical.departments',
      'clinical.patients',
      'clinical.encounters',
      'clinical.appointments',
      'clinical.vitals',
      'clinical.investigation_orders',
      'clinical.investigation_specimens',
      'clinical.investigation_results',
      'clinical.radiology_orders',
      'clinical.prescriptions',
      'clinical.prescription_items',
      'clinical.pharmacy_dispensing',
      'clinical.billing_invoices',
      'clinical.inpatient_admissions',
      'core.users',
      'core.roles',
      'workflow.tasks',
      'workflow.workflows'
    ];

    for (const t of tables) {
      try {
        const res = await pool.query(`SELECT count(*)::int as cnt FROM ${t}`);
        counts[t] = res.rows[0].cnt;
      } catch (err) {
        counts[t] = `TABLE ERROR: ${err.message}`;
      }
    }

    console.log('--- DATABASE REAL RECORD COUNTS ---');
    console.log(JSON.stringify(counts, null, 2));

    // Sample partners
    try {
      const pRes = await pool.query(`SELECT id, legal_business_name, partner_type, kyc_status, operational_status FROM company.partners ORDER BY created_at DESC LIMIT 5`);
      console.log('\n--- RECENT PARTNERS IN DB ---');
      console.log(JSON.stringify(pRes.rows, null, 2));
    } catch (e) {
      console.log('Failed to query partners:', e.message);
    }

    // Sample patients
    try {
      const ptRes = await pool.query(`SELECT id, full_name, phone_number, uhid, created_at FROM clinical.patients ORDER BY created_at DESC LIMIT 5`);
      console.log('\n--- RECENT PATIENTS IN DB ---');
      console.log(JSON.stringify(ptRes.rows, null, 2));
    } catch (e) {
      console.log('Failed to query patients:', e.message);
    }

    // Sample encounters
    try {
      const encRes = await pool.query(`SELECT id, patient_id, encounter_type, status, current_stage, created_at FROM clinical.encounters ORDER BY created_at DESC LIMIT 5`);
      console.log('\n--- RECENT ENCOUNTERS IN DB ---');
      console.log(JSON.stringify(encRes.rows, null, 2));
    } catch (e) {
      console.log('Failed to query encounters:', e.message);
    }

    // Sample lab orders
    try {
      const labRes = await pool.query(`SELECT id, patient_id, status, test_name, created_at FROM clinical.investigation_orders ORDER BY created_at DESC LIMIT 5`);
      console.log('\n--- RECENT LAB ORDERS IN DB ---');
      console.log(JSON.stringify(labRes.rows, null, 2));
    } catch (e) {
      console.log('Failed to query lab orders:', e.message);
    }

    // Sample radiology orders
    try {
      const radRes = await pool.query(`SELECT id, patient_id, status, modality, procedure_name, created_at FROM clinical.radiology_orders ORDER BY created_at DESC LIMIT 5`);
      console.log('\n--- RECENT RADIOLOGY ORDERS IN DB ---');
      console.log(JSON.stringify(radRes.rows, null, 2));
    } catch (e) {
      console.log('Failed to query radiology orders:', e.message);
    }

    // Sample billing invoices
    try {
      const invRes = await pool.query(`SELECT id, patient_id, invoice_number, total_amount, payment_status, created_at FROM clinical.billing_invoices ORDER BY created_at DESC LIMIT 5`);
      console.log('\n--- RECENT BILLING INVOICES IN DB ---');
      console.log(JSON.stringify(invRes.rows, null, 2));
    } catch (e) {
      console.log('Failed to query billing invoices:', e.message);
    }

  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseState();
