import pg from 'pg';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CANONICAL_PARTNER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  console.log('--- Checking Batches before update ---');
  const bBefore = await client.query('SELECT count(*), tenant_id, branch_id FROM clinical.pharmacy_batches GROUP BY tenant_id, branch_id');
  console.log(bBefore.rows);

  console.log('--- Checking Khata before update ---');
  const kBefore = await client.query('SELECT count(*), tenant_id FROM clinical.pharmacy_customer_khata GROUP BY tenant_id');
  console.log(kBefore.rows);

  console.log('--- Harmonizing pharmacy_batches ---');
  const resB = await client.query(`
    UPDATE clinical.pharmacy_batches
    SET tenant_id = $1, branch_id = $2
    WHERE tenant_id != $1 OR branch_id != $2
  `, [CANONICAL_TENANT, CANONICAL_BRANCH]);
  console.log(`Updated ${resB.rowCount} pharmacy_batches rows.`);

  console.log('--- Harmonizing pharmacy_customer_khata ---');
  const resK = await client.query(`
    UPDATE clinical.pharmacy_customer_khata
    SET tenant_id = $1
    WHERE tenant_id != $1
  `, [CANONICAL_TENANT]);
  console.log(`Updated ${resK.rowCount} pharmacy_customer_khata rows.`);

  // Also check if pharmacy_prescriptions or pharmacy_dispensations exist with mismatched tenant_id
  const hasPresc = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'clinical' AND table_name = 'pharmacy_prescriptions'
    );
  `);
  if (hasPresc.rows[0].exists) {
    const resP = await client.query(`
      UPDATE clinical.pharmacy_prescriptions
      SET tenant_id = $1, branch_id = COALESCE(branch_id, $2)
      WHERE tenant_id != $1
    `, [CANONICAL_TENANT, CANONICAL_BRANCH]);
    console.log(`Updated ${resP.rowCount} pharmacy_prescriptions rows.`);
  }

  const bAfter = await client.query('SELECT count(*), tenant_id, branch_id FROM clinical.pharmacy_batches GROUP BY tenant_id, branch_id');
  console.log('--- Batches after update ---', bAfter.rows);

  const kAfter = await client.query('SELECT count(*), tenant_id FROM clinical.pharmacy_customer_khata GROUP BY tenant_id');
  console.log('--- Khata after update ---', kAfter.rows);

  await client.end();
}

main().catch(console.error);
