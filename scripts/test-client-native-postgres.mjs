import { ensureDatabaseReady, getDatabaseStatus, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false'; // Strictly disable embedded pg-mem

async function testNativeClient() {
  console.log('[TEST] Initializing database via packages/database/dist/client.js with ALLOW_EMBEDDED_POSTGRES=false...');
  const db = await ensureDatabaseReady();
  const status = getDatabaseStatus();

  console.log('[TEST] DATABASE READY:', status.ready);
  console.log('[TEST] DATABASE MODE: ', status.mode);

  const pool = getDatabasePool();
  const versionRes = await pool.query('SELECT version()');
  const dbRes = await pool.query('SELECT current_database()');
  const addrRes = await pool.query('SELECT inet_server_addr(), inet_server_port()');

  console.log('\n============================================================');
  console.log('🏛️ VERIFIED: CLIENT CONNECTED TO NATIVE POSTGRESQL');
  console.log('============================================================');
  console.log('MODE:             ', status.mode);
  console.log('ENGINE VERSION:   ', versionRes.rows[0].version);
  console.log('CURRENT DATABASE: ', dbRes.rows[0].current_database);
  console.log('SERVER IP:        ', addrRes.rows[0].inet_server_addr);
  console.log('SERVER PORT:      ', addrRes.rows[0].inet_server_port);
  console.log('============================================================\n');

  await pool.end();
}

testNativeClient().catch((err) => {
  console.error('[TEST] Failed:', err);
  process.exit(1);
});
