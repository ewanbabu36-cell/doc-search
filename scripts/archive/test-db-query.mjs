import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();
  const medRes = await client.query('SELECT count(*) FROM clinical.medication_catalog');
  console.log('Medications count:', medRes.rows[0].count);
  const pkgRes = await client.query('SELECT count(*) FROM clinical.diagnostic_health_packages');
  console.log('Diagnostic packages count:', pkgRes.rows[0].count);
  const tubeRes = await client.query('SELECT count(*) FROM clinical.vacutainer_tube_catalog');
  console.log('Vacutainer tubes count:', tubeRes.rows[0].count);
  const tmplRes = await client.query('SELECT count(*) FROM clinical.prescription_templates');
  console.log('Prescription templates count:', tmplRes.rows[0].count);
  const wardRes = await client.query('SELECT count(*) FROM clinical.inpatient_wards');
  console.log('Inpatient wards count:', wardRes.rows[0].count);
  await client.end();
}

main().catch(console.error);
