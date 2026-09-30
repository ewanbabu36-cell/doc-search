import pg from 'pg';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function testImmutability() {
  const [sample] = (await pool.query('SELECT id FROM core.audit_events LIMIT 1')).rows;
  console.log('Testing immutability on audit event:', sample?.id);

  try {
    await pool.query('UPDATE core.audit_events SET event_type = $1 WHERE id = $2', ['TAMPERED_TYPE', sample.id]);
    console.error('FAIL: UPDATE succeeded! Immutability broken!');
  } catch (err) {
    console.log('SUCCESS: UPDATE was blocked as expected:', err.message);
  }

  try {
    await pool.query('DELETE FROM core.audit_events WHERE id = $1', [sample.id]);
    console.error('FAIL: DELETE succeeded! Delete protection broken!');
  } catch (err) {
    console.log('SUCCESS: DELETE was blocked as expected:', err.message);
  }

  await pool.end();
}

testImmutability().catch(err => {
  console.error(err);
  process.exit(1);
});
