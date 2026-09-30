import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();
  const res = await client.query('SELECT version(), current_database(), inet_server_addr(), inet_server_port()');
  console.log(JSON.stringify(res.rows[0], null, 2));
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
