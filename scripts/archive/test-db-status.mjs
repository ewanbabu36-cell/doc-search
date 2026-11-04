import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function main() {
  const v = await pool.query('SELECT version(), current_database(), inet_server_addr(), inet_server_port();');
  console.log('Postgres Info:', v.rows[0]);

  const companyTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'company' ORDER BY table_name;");
  console.log('Company Tables count:', companyTables.rows.length);
  console.log('Company Tables:', companyTables.rows.map(r => r.table_name).join(', '));

  const licenses = await pool.query("SELECT * FROM company.licenses;");
  console.log('Licenses count:', licenses.rows.length);

  const partners = await pool.query("SELECT * FROM company.partner_profiles;");
  console.log('Partner profiles count:', partners.rows.length);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
