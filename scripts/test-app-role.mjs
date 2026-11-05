import pg from 'pg';
const { Client } = pg;

async function testAppRole() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  await client.query('BEGIN');
  await client.query(`SET ROLE docsearch_app`);
  await client.query(`SET LOCAL app.is_super_admin = 'true'`);

  const res = await client.query(`SELECT COUNT(*) FROM clinical.operational_partners`);
  console.log('Result under docsearch_app with super_admin=true:', res.rows[0].count);

  await client.query('ROLLBACK');
  await client.end();
}
testAppRole().catch(console.error);
