import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function run() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'clinical' AND table_name = 'patients' ORDER BY ordinal_position;");
  console.log('Columns of clinical.patients:');
  res.rows.forEach(r => console.log(' - ' + r.column_name + ' (' + r.data_type + ')'));

  const encRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'clinical' AND table_name = 'encounters' ORDER BY ordinal_position;");
  console.log('\nColumns of clinical.encounters:');
  encRes.rows.forEach(r => console.log(' - ' + r.column_name + ' (' + r.data_type + ')'));

  await pool.end();
}

run().catch(console.error);
