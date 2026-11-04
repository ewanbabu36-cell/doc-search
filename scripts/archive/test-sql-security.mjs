import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', 'test-tenant-123']);
    const res = await client.query('SELECT current_setting($1, true) as val', ['app.current_tenant_id']);
    console.log('Result current_setting:', res.rows[0].val);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
