import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch',
  connectionTimeoutMillis: 5000
});

async function main() {
  try {
    console.log('[*] Connecting to 127.0.0.1:5432...');
    await client.connect();
    console.log('[✔] CONNECTED TO POSTGRESQL SUCCESSFULLY!');
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log('[*] DB Info:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('[X] Connection failed:', err.message);
  }
}

main();
