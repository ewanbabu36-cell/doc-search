import pg from 'pg';
import fs from 'fs';
import path from 'path';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();

  console.log('========================================================================');
  console.log('DOC SEARCH — CATEGORY 9: DEEP POSTGRESQL & ORM INTEGRITY SCAN');
  console.log('========================================================================\n');

  // 1. Column-by-column verification
  console.log('[1] Auditing PostgreSQL Table Columns vs Constraints...');
  const colRes = await client.query(`
    SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema IN ('clinical', 'company', 'core', 'billing', 'workflow', 'public')
    ORDER BY table_schema, table_name, ordinal_position;
  `);

  const dbColumnsByTable = new Map();
  colRes.rows.forEach(r => {
    const key = `${r.table_schema}.${r.table_name}`;
    if (!dbColumnsByTable.has(key)) dbColumnsByTable.set(key, new Map());
    dbColumnsByTable.get(key).set(r.column_name, r);
  });
  console.log(`    Total columns in DB: ${colRes.rows.length} across ${dbColumnsByTable.size} tables.`);

  // 2. Unindexed Foreign Keys Scan using pg_catalog
  console.log('\n[2] Checking for Unindexed Foreign Keys in PostgreSQL...');
  const unindexedFksRes = await client.query(`
    SELECT
      ns.nspname AS table_schema,
      cl.relname AS table_name,
      att.attname AS column_name,
      con.conname AS constraint_name,
      fcl.relname AS foreign_table_name
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    JOIN pg_class fcl ON fcl.oid = con.confrelid
    CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, n)
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
    WHERE con.contype = 'f'
      AND ns.nspname IN ('clinical', 'company', 'core', 'billing', 'workflow', 'public')
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index idx
        JOIN pg_class icl ON icl.oid = idx.indexrelid
        WHERE idx.indrelid = con.conrelid
          AND (idx.indkey::int2[])[0] = k.attnum
      )
    ORDER BY ns.nspname, cl.relname, att.attname;
  `);
  console.log(`    Found ${unindexedFksRes.rows.length} unindexed foreign keys.`);
  if (unindexedFksRes.rows.length > 0) {
    console.log('    Sample unindexed FKs (first 10):');
    unindexedFksRes.rows.slice(0, 10).forEach(r => {
      console.log(`      - ${r.table_schema}.${r.table_name} (${r.column_name}) -> ${r.foreign_table_name}`);
    });
  }

  // 3. Unique Constraints on Business Identifiers
  console.log('\n[3] Auditing Unique Constraints on Core Healthcare Business Identifiers...');
  const businessIdentifierTargets = [
    { schema: 'clinical', table: 'patients', column: 'uhid' },
    { schema: 'clinical', table: 'patients', column: 'mrn' },
    { schema: 'clinical', table: 'encounters', column: 'encounter_number' },
    { schema: 'clinical', table: 'lab_orders', column: 'order_number' },
    { schema: 'clinical', table: 'radiology_orders', column: 'order_number' },
    { schema: 'clinical', table: 'pharmacy_prescriptions', column: 'prescription_number' },
    { schema: 'clinical', table: 'billing_invoices', column: 'invoice_number' },
    { schema: 'company', table: 'partners', column: 'slug' },
    { schema: 'core', table: 'tenants', column: 'slug' }
  ];

  for (const target of businessIdentifierTargets) {
    const res = await client.query(`
      SELECT con.conname, con.contype
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
      WHERE ns.nspname = $1 AND cl.relname = $2 AND att.attname = $3
        AND con.contype IN ('p', 'u')
    `, [target.schema, target.table, target.column]);

    const idxRes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = $1 AND tablename = $2 AND indexdef LIKE '%UNIQUE%' AND (
        indexdef LIKE '%(' || $3 || ')' OR
        indexdef LIKE '%("' || $3 || '")' OR
        indexdef LIKE '%(' || $3 || ',%' OR
        indexdef LIKE '%("' || $3 || '",%'
      )
    `, [target.schema, target.table, target.column]);

    const isUnique = res.rows.length > 0 || idxRes.rows.length > 0;
    const fqn = `${target.schema}.${target.table}.${target.column}`;
    console.log(`    ${isUnique ? '[✔]' : '[!]'} ${fqn}: ${isUnique ? 'GUARANTEED UNIQUE' : 'MISSING UNIQUE CONSTRAINT / INDEX'}`);
  }

  // 4. Multi-Tenant Isolation: Tables with tenant_id missing tenant_id index
  console.log('\n[4] Auditing Multi-Tenant Isolation Indexes (tenant_id)...');
  const tenantColsRes = await client.query(`
    SELECT ns.nspname AS table_schema, cl.relname AS table_name
    FROM pg_attribute att
    JOIN pg_class cl ON cl.oid = att.attrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE att.attname = 'tenant_id'
      AND cl.relkind = 'r'
      AND ns.nspname IN ('clinical', 'company', 'core', 'billing', 'workflow', 'public')
    ORDER BY ns.nspname, cl.relname;
  `);

  const unindexedTenantTables = [];
  for (const row of tenantColsRes.rows) {
    const idxRes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = $1 AND tablename = $2 AND (
        indexdef LIKE '%(tenant_id%' OR
        indexdef LIKE '%("tenant_id"%'
      )
    `, [row.table_schema, row.table_name]);

    if (idxRes.rows.length === 0) {
      unindexedTenantTables.push(`${row.table_schema}.${row.table_name}`);
    }
  }
  console.log(`    Total tables with tenant_id: ${tenantColsRes.rows.length}`);
  console.log(`    Tables with tenant_id missing index: ${unindexedTenantTables.length}`);
  if (unindexedTenantTables.length > 0) {
    console.log('    Sample unindexed tenant tables:');
    unindexedTenantTables.slice(0, 10).forEach(t => console.log(`      - ${t}`));
  }

  // 5. Codebase Repository In-Memory & Transaction Scan
  console.log('\n[5] Auditing Repositories for In-Memory State & Swallowed Errors...');
  const reposDir = 'apps/api-gateway/src/repositories';
  function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat && stat.isDirectory()) results = results.concat(walk(full));
      else if (file.endsWith('.ts') || file.endsWith('.js')) results.push(full);
    });
    return results;
  }
  const repoFiles = walk(reposDir);
  console.log(`    Discovered ${repoFiles.length} repository source files.`);

  const findings = [];
  for (const file of repoFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const relFile = path.relative('.', file).replace(/\\/g, '/');

    // Check for in-memory Maps or Stores
    const mapRegex = /(?:private|public|protected|const|let|var)\s+(\w+)\s*=\s*new\s+Map\b/g;
    let mm;
    while ((mm = mapRegex.exec(code)) !== null) {
      findings.push({
        file: relFile,
        type: 'IN_MEMORY_MAP_FOUND',
        symbol: mm[1],
        line: code.slice(0, mm.index).split('\n').length
      });
    }

    // Check for empty/swallowed catch blocks
    const emptyCatchRegex = /catch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\/[^\n]*)?\s*\}/g;
    let ec;
    while ((ec = emptyCatchRegex.exec(code)) !== null) {
      findings.push({
        file: relFile,
        type: 'SWALLOWED_DATABASE_ERROR',
        line: code.slice(0, ec.index).split('\n').length
      });
    }
  }

  console.log(`    In-memory state / cache findings: ${findings.filter(f => f.type === 'IN_MEMORY_MAP_FOUND').length}`);
  console.log(`    Swallowed catch blocks: ${findings.filter(f => f.type === 'SWALLOWED_DATABASE_ERROR').length}`);
  findings.slice(0, 15).forEach(f => {
    console.log(`      - [${f.type}] ${f.file}:${f.line} (${f.symbol || ''})`);
  });

  await client.end();
  console.log('\n========================================================================');
}

main().catch(console.error);
