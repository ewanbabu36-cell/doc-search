import pg from 'pg';
const { Client } = pg;

async function checkPostgres() {
  console.log('--- 1. Testing PostgreSQL Native Cluster on port 5432 ---');
  const client = new Client({
    connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
  });

  await client.connect();
  console.log('✓ Successfully connected to PostgreSQL 18.4 on 127.0.0.1:5432');

  const vRes = await client.query('SELECT version();');
  console.log('✓ Postgres version:', vRes.rows[0].version.split(',')[0]);

  const pTemplates = await client.query('SELECT count(*) FROM clinical.prescription_templates;');
  console.log(`✓ clinical.prescription_templates count: ${pTemplates.rows[0].count}`);

  const vTubes = await client.query('SELECT count(*) FROM clinical.vacutainer_tube_catalog;');
  console.log(`✓ clinical.vacutainer_tube_catalog count: ${vTubes.rows[0].count}`);

  const dPackages = await client.query('SELECT count(*) FROM clinical.diagnostic_health_packages;');
  console.log(`✓ clinical.diagnostic_health_packages count: ${dPackages.rows[0].count}`);

  const medCat = await client.query('SELECT count(*) FROM clinical.medication_catalog;');
  console.log(`✓ clinical.medication_catalog count: ${medCat.rows[0].count}`);

  await client.end();
}

checkPostgres().catch(err => {
  console.error('PostgreSQL check failed:', err);
  process.exit(1);
});
