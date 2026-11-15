import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();

  const schemas = ['clinical', 'company', 'core', 'public'];
  const zeroRowTables = [];
  const populatedTables = [];

  for (const s of schemas) {
    const tRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${s}' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    for (const row of tRes.rows) {
      try {
        const cRes = await client.query(`SELECT count(*) FROM "${s}"."${row.table_name}"`);
        const cnt = parseInt(cRes.rows[0].count, 10);
        if (cnt === 0) {
          zeroRowTables.push(`${s}.${row.table_name}`);
        } else {
          populatedTables.push({ table: `${s}.${row.table_name}`, count: cnt });
        }
      } catch (err) {
        // ignore
      }
    }
  }

  console.log(`Total Populated Tables: ${populatedTables.length}`);
  console.log(`Total Zero-Row Tables: ${zeroRowTables.length}`);

  const clinicalZero = zeroRowTables.filter(t => t.startsWith('clinical.'));
  const companyZero = zeroRowTables.filter(t => t.startsWith('company.'));
  const coreZero = zeroRowTables.filter(t => t.startsWith('core.'));

  console.log(`\nClinical Zero-Row Tables (${clinicalZero.length}):`);
  console.log(clinicalZero);

  console.log(`\nCompany Zero-Row Tables (${companyZero.length}):`);
  console.log(companyZero);

  console.log(`\nCore Zero-Row Tables (${coreZero.length}):`);
  console.log(coreZero);

  // Tenant ID audit on populated tables in clinical
  console.log('\n--- Checking Tenant IDs on Populated Clinical Tables ---');
  const CANONICAL = '11111111-1111-4111-8111-111111111111';
  const tenantMismatches = [];

  for (const item of populatedTables) {
    if (item.table.startsWith('clinical.')) {
      const tableName = item.table.replace('clinical.', '');
      const hasTenantCol = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'clinical' AND table_name = $1 AND column_name = 'tenant_id'
        ) as exists
      `, [tableName]);
      if (hasTenantCol.rows[0].exists) {
        const tenantCounts = await client.query(`
          SELECT tenant_id, count(*) as count 
          FROM "clinical"."${tableName}" 
          GROUP BY tenant_id
        `);
        const nonCanonical = tenantCounts.rows.filter(r => r.tenant_id !== CANONICAL);
        if (nonCanonical.length > 0) {
          tenantMismatches.push({
            table: item.table,
            canonicalCount: tenantCounts.rows.find(r => r.tenant_id === CANONICAL)?.count || 0,
            nonCanonical: nonCanonical
          });
        }
      }
    }
  }

  console.log(`\nClinical Tables with Non-Canonical Tenant IDs (${tenantMismatches.length}):`);
  console.dir(tenantMismatches, { depth: null });

  await client.end();
}

main().catch(console.error);
