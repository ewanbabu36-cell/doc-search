import pg from 'pg';

async function verify() {
  const rootClient = new pg.Client({
    connectionString: 'postgresql://postgres:password@127.0.0.1:5432/postgres'
  });
  await rootClient.connect();

  const checkDb = await rootClient.query("SELECT 1 FROM pg_database WHERE datname = 'docsearch'");
  if (checkDb.rows.length === 0) {
    console.log('[PG-CHECK] Creating database "docsearch"...');
    await rootClient.query("CREATE DATABASE docsearch WITH ENCODING = 'UTF8'");
  }
  await rootClient.end();

  const client = new pg.Client({
    connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
  });
  await client.connect();

  const versionRes = await client.query('SELECT version()');
  const dbRes = await client.query('SELECT current_database()');
  const addrRes = await client.query('SELECT inet_server_addr(), inet_server_port()');
  const encRes = await client.query('SELECT pg_encoding_to_char(encoding) as encoding FROM pg_database WHERE datname = current_database()');

  console.log('\n============================================================');
  console.log('🏛️ RUNTIME PROOF: NATIVE POSTGRESQL');
  console.log('============================================================');
  console.log('ENGINE VERSION:   ', versionRes.rows[0].version);
  console.log('CURRENT DATABASE: ', dbRes.rows[0].current_database);
  console.log('ENCODING:         ', encRes.rows[0].encoding);
  console.log('SERVER IP:        ', addrRes.rows[0].inet_server_addr);
  console.log('SERVER PORT:      ', addrRes.rows[0].inet_server_port);
  console.log('============================================================\n');

  await client.end();
}

verify().catch((err) => {
  console.error('[PG-CHECK] Error:', err);
  process.exit(1);
});
