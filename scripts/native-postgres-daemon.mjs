import EmbeddedPostgres from 'embedded-postgres';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data/db-native-utf8');

console.log('[PostgreSQL] Configuring native PostgreSQL 18.4 engine on port 5432...');
console.log('[PostgreSQL] Data Directory:', dataDir);

const pgServer = new EmbeddedPostgres({
  port: 5432,
  user: 'postgres',
  password: 'password',
  persistent: true,
  databaseDir: dataDir,
  initdbFlags: ['--encoding=UTF8', '--locale=C']
});

async function main() {
  const isInit = fs.existsSync(path.join(dataDir, 'PG_VERSION'));
  if (!isInit) {
    console.log('[PostgreSQL] Initializing UTF-8 cluster with C locale...');
    await pgServer.initialise();
    console.log('[PostgreSQL] Cluster initialized successfully.');
  } else {
    console.log('[PostgreSQL] Cluster already initialized at', dataDir);
  }
  
  await pgServer.start();
  console.log('[PostgreSQL] Native PostgreSQL server listening on 127.0.0.1:5432');

  // Connect to default 'postgres' database to ensure 'docsearch' exists
  const rootClient = new pg.Client({
    connectionString: 'postgresql://postgres:password@127.0.0.1:5432/postgres'
  });
  await rootClient.connect();

  const checkDb = await rootClient.query("SELECT 1 FROM pg_database WHERE datname = 'docsearch'");
  if (checkDb.rows.length === 0) {
    console.log('[PostgreSQL] Creating database "docsearch"...');
    await rootClient.query("CREATE DATABASE docsearch WITH ENCODING = 'UTF8' LC_COLLATE = 'C' LC_CTYPE = 'C'");
    console.log('[PostgreSQL] Database "docsearch" created successfully with UTF-8 encoding.');
  } else {
    console.log('[PostgreSQL] Database "docsearch" already exists.');
  }
  await rootClient.end();

  // Connect to 'docsearch' database
  const client = new pg.Client({
    connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
  });
  await client.connect();
  console.log('[PostgreSQL] Connected to "docsearch" over TCP socket.');

  const versionRes = await client.query('SELECT version()');
  const dbRes = await client.query('SELECT current_database()');
  const addrRes = await client.query('SELECT inet_server_addr(), inet_server_port()');
  const encRes = await client.query('SELECT pg_encoding_to_char(encoding) as encoding FROM pg_database WHERE datname = current_database()');

  console.log('\n============================================================');
  console.log('✅ NATIVE POSTGRESQL PROOF OF RUNTIME');
  console.log('============================================================');
  console.log('VERSION:      ', versionRes.rows[0].version);
  console.log('DATABASE:     ', dbRes.rows[0].current_database);
  console.log('ENCODING:     ', encRes.rows[0].encoding);
  console.log('SERVER IP:    ', addrRes.rows[0].inet_server_addr);
  console.log('SERVER PORT:  ', addrRes.rows[0].inet_server_port);
  console.log('============================================================\n');

  await client.end();

  console.log('[PostgreSQL] Daemon running. Keeping native PostgreSQL 18.4 active on port 5432.');
  setInterval(() => {}, 60000);
}

main().catch((err) => {
  console.error('[PostgreSQL] Error:', err);
  process.exit(1);
});
