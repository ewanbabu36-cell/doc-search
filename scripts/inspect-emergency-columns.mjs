import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();

  const c1 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'clinical' AND table_name = 'blood_components'`);
  console.log('blood_components columns:', c1.rows.map(r => r.column_name));

  const c2 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'clinical' AND table_name = 'emergency_departments'`);
  console.log('emergency_departments columns:', c2.rows.map(r => r.column_name));

  const c3 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'clinical' AND table_name = 'emergency_encounters'`);
  console.log('emergency_encounters columns:', c3.rows.map(r => r.column_name));

  const c4 = await client.query(`SELECT count(*), tenant_id FROM clinical.emergency_encounters GROUP BY tenant_id`);
  console.log('emergency_encounters count by tenant:', c4.rows);

  const c5 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'clinical' AND table_name = 'blood_requests'`);
  console.log('blood_requests columns:', c5.rows.map(r => r.column_name));

  await client.end();
}

main().catch(console.error);
