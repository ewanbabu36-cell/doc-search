import pg from 'pg';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function checkNeighbors() {
  const events = (await pool.query(`
    SELECT id, event_type, timestamp, previous_hash, integrity_hash 
    FROM core.audit_events 
    WHERE tenant_id = '11111111-1111-4111-8111-111111111111' 
    ORDER BY timestamp ASC
  `)).rows;

  const idx = events.findIndex(e => e.id === 'ee64bd57-b82e-45d5-86d3-378b919a96b7');
  console.log(`Index of ee64bd57 is: ${idx} out of ${events.length}`);

  const slice = events.slice(Math.max(0, idx - 2), Math.min(events.length, idx + 3));
  console.log('Surrounding events:', slice);

  await pool.end();
}

checkNeighbors().catch(err => {
  console.error(err);
  process.exit(1);
});
