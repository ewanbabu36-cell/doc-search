import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function main() {
  const res = await pool.query(`
    SELECT DISTINCT pe.plan_id, p.name, p.code 
    FROM company.plan_entitlements pe 
    LEFT JOIN company.plans p ON pe.plan_id = p.id
  `);
  console.log('Plans with entitlements:', res.rows);

  const allFeatures = await pool.query('SELECT id, code, name FROM company.features');
  console.log('\nAll Features in DB:');
  for (const f of allFeatures.rows) {
    console.log(`- ${f.code}: ${f.id} (${f.name})`);
  }

  await pool.end();
}

main().catch(console.error);
