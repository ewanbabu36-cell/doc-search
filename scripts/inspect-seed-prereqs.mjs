import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();

  const ed = await client.query('SELECT id, department_name, tenant_id FROM clinical.emergency_departments LIMIT 3');
  console.log('emergency_departments:', ed.rows);

  const ee = await client.query('SELECT id, patient_name, tenant_id FROM clinical.emergency_encounters LIMIT 3');
  console.log('emergency_encounters:', ee.rows);

  const br = await client.query('SELECT id, patient_name, tenant_id FROM clinical.blood_requests LIMIT 3');
  console.log('blood_requests:', br.rows);

  const bc = await client.query('SELECT id, component_type, unit_number, tenant_id FROM clinical.blood_components LIMIT 3');
  console.log('blood_components:', bc.rows);

  const bd = await client.query('SELECT id, full_name, donor_code, tenant_id FROM clinical.blood_donors LIMIT 3');
  console.log('blood_donors:', bd.rows);

  const dp = await client.query('SELECT id, full_name, doctor_code, tenant_id FROM clinical.doctor_profiles LIMIT 3');
  console.log('doctor_profiles:', dp.rows);

  await client.end();
}

main().catch(console.error);
