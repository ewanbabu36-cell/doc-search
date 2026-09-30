import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function main() {
  const res1 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'branches';");
  console.log('branches columns:', res1.rows.map(r => r.column_name));

  const res2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'operational_facilities';");
  console.log('operational_facilities columns:', res2.rows.map(r => r.column_name));

  const res3 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'operational_partners';");
  console.log('operational_partners columns:', res3.rows.map(r => r.column_name));

  const res4 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'operational_organizations';");
  console.log('operational_organizations columns:', res4.rows.map(r => r.column_name));

  const res5 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients';");
  console.log('patients columns:', res5.rows.map(r => r.column_name));

  await pool.end();
}

main().catch(console.error);
