import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();
for (const t of [
  'clinical.medication_catalog',
  'clinical.investigation_catalog',
  'clinical.insurance_payers',
  'clinical.surgical_procedures',
  'clinical.corporate_tpa_clients',
  'clinical.diagnostic_health_packages',
  'clinical.prescription_templates',
  'clinical.inpatient_wards',
  'clinical.vacutainer_tube_catalog'
]) {
  try {
    const res = await client.query('SELECT count(*) FROM ' + t);
    console.log(`${t} count: ${res.rows[0].count}`);
  } catch(e) {
    console.log(`${t} error: ${e.message}`);
  }
}
await client.end();
