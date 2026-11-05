import pg from 'pg';
const { Client } = pg;

async function checkRoles() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();
  const res = await client.query(`
    SELECT rolname, rolsuper, rolbypassrls, rolinherit, rolcanlogin
    FROM pg_roles
    WHERE rolcanlogin = true;
  `);
  console.log('Login roles:', res.rows);
  await client.end();
}
checkRoles();
