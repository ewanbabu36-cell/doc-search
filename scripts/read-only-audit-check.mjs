import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  console.log('--- PATIENTS ---');
  const patients = await client.query('SELECT id, tenant_id, mrn, first_name, last_name, status, created_at FROM clinical.patients');
  console.log(JSON.stringify(patients.rows, null, 2));

  console.log('--- ENCOUNTERS ---');
  const encounters = await client.query('SELECT id, tenant_id, patient_id, encounter_type, status, chief_complaint FROM clinical.encounters');
  console.log(JSON.stringify(encounters.rows, null, 2));

  console.log('--- CONSULTATIONS ---');
  const consultations = await client.query('SELECT id, tenant_id, patient_id, encounter_id, consultation_status, chief_complaint FROM clinical.consultations');
  console.log(JSON.stringify(consultations.rows, null, 2));

  console.log('--- ORDERS ---');
  const orders = await client.query('SELECT id, tenant_id, patient_id, order_number, priority, status, metadata FROM clinical.investigation_orders');
  console.log(JSON.stringify(orders.rows, null, 2));

  console.log('--- INVOICES ---');
  const invoices = await client.query('SELECT id, tenant_id, patient_id, invoice_number, total_amount, due_amount, status FROM clinical.billing_invoices');
  console.log(JSON.stringify(invoices.rows, null, 2));

  console.log('--- OPERATIONAL STAFF ---');
  const staff = await client.query('SELECT id, tenant_id, "fullName", work_email, employment_status, primary_role FROM clinical.operational_staff');
  console.log(JSON.stringify(staff.rows, null, 2));

  console.log('--- LICENSES ---');
  const licenses = await client.query('SELECT id, tenant_id, license_key, status, start_date, expiry_date, signature FROM company.licenses');
  console.log(JSON.stringify(licenses.rows, null, 2));

  await client.end();
}

main().catch(console.error);
