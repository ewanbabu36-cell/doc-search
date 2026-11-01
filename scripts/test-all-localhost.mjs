import pg from 'pg';

async function testAll() {
  console.log('============================================================');
  console.log('DOCSEARCH LOCALHOST FULL-STACK HEALTH CHECK');
  console.log('============================================================');

  // 1. PostgreSQL 18.4
  try {
    const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
    await client.connect();
    const res = await client.query('SELECT version();');
    console.log('✔ [PORT 5432] PostgreSQL 18.4: ONLINE (' + res.rows[0].version.split(',')[0] + ')');
    await client.end();
  } catch (e) {
    console.error('✘ [PORT 5432] PostgreSQL error:', e.message);
  }

  // 2. Fastify API Gateway
  try {
    const r = await fetch('http://127.0.0.1:4000/health');
    const d = await r.json();
    console.log(`✔ [PORT 4000] API Gateway: ONLINE (HTTP ${r.status}, DB mode: ${d.database})`);
  } catch (e) {
    console.error('✘ [PORT 4000] API Gateway error:', e.message);
  }

  // 3. Partner Platform
  try {
    const r = await fetch('http://127.0.0.1:5173');
    console.log(`✔ [PORT 5173] Partner Platform: ONLINE (HTTP ${r.status})`);
  } catch (e) {
    console.error('✘ [PORT 5173] Partner Platform error:', e.message);
  }

  // 4. Patient App
  try {
    const r = await fetch('http://127.0.0.1:5174');
    console.log(`✔ [PORT 5174] Patient App: ONLINE (HTTP ${r.status})`);
  } catch (e) {
    console.error('✘ [PORT 5174] Patient App error:', e.message);
  }

  // 5. Company Platform
  try {
    const r = await fetch('http://127.0.0.1:5177');
    console.log(`✔ [PORT 5177] Company Platform: ONLINE (HTTP ${r.status})`);
  } catch (e) {
    console.error('✘ [PORT 5177] Company Platform error:', e.message);
  }

  console.log('============================================================');
}

testAll();
