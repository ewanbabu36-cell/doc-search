import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function main() {
  const res = await pool.query('SELECT * FROM company.plan_entitlements LIMIT 1');
  console.log('Sample row:', res.rows[0]);
  await pool.end();
}

main().catch(console.error);
