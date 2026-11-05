import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  console.log('[RLS-Gen] Connected to database docsearch.');

  // Check function return type
  const fRes = await client.query(`
    SELECT routine_name, data_type 
    FROM information_schema.routines 
    WHERE routine_schema = 'core' AND routine_name = 'get_current_tenant_id';
  `);
  console.log('[RLS-Gen] Function return type:', fRes.rows);

  // Check column types for tenant_id and partner_id
  const colTypesRes = await client.query(`
    SELECT table_schema, table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    AND column_name IN ('tenant_id', 'partner_id');
  `);
  
  const typeMap = new Map();
  for (const r of colTypesRes.rows) {
    const key = `${r.table_schema}.${r.table_name}.${r.column_name}`;
    typeMap.set(key, r.udt_name);
  }

  // 1. Get all user tables and their schemas
  const tablesRes = await client.query(`
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename;
  `);

  const allTables = tablesRes.rows;

  // 2. Get column information for each table
  const colRes = await client.query(`
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    AND column_name IN ('tenant_id', 'partner_id');
  `);

  const tableColumns = new Map();
  for (const row of colRes.rows) {
    const key = `${row.table_schema}.${row.table_name}`;
    if (!tableColumns.has(key)) {
      tableColumns.set(key, new Set());
    }
    tableColumns.get(key).add(row.column_name);
  }

  // 3. Categorize tables
  const tenantTables = [];
  const partnerTables = [];
  const systemMasterTables = [];
  const alreadySecured = [];

  for (const t of allTables) {
    const key = `${t.schemaname}.${t.tablename}`;
    const cols = tableColumns.get(key) || new Set();

    if (t.rowsecurity) {
      alreadySecured.push({ schema: t.schemaname, table: t.tablename });
    }

    if (cols.has('tenant_id')) {
      const colType = typeMap.get(`${t.schemaname}.${t.tablename}.tenant_id`);
      tenantTables.push({ schema: t.schemaname, table: t.tablename, colType });
    } else if (cols.has('partner_id')) {
      const colType = typeMap.get(`${t.schemaname}.${t.tablename}.partner_id`);
      partnerTables.push({ schema: t.schemaname, table: t.tablename, colType });
    } else {
      systemMasterTables.push({ schema: t.schemaname, table: t.tablename });
    }
  }

  console.log(`[RLS-Gen] Tables with direct tenant_id: ${tenantTables.length}`);
  console.log(`[RLS-Gen] Tables with partner_id only: ${partnerTables.length}`);
  console.log(`[RLS-Gen] System master/shared tables: ${systemMasterTables.length}`);

  // 4. Generate migration SQL
  let sql = `-- ==============================================================================
-- Migration: 0070_comprehensive_tenant_rls_hardening.sql
-- Description: Comprehensive Row-Level Security (RLS) hardening across all tenant-bound
--              and partner-bound entity tables in docsearch.
-- Enforces: SuperAdmin bypass, Tenant Isolation via core.get_current_tenant_id(),
--           and FORCE ROW LEVEL SECURITY to prevent tenant leaks across all roles.
-- ==============================================================================

BEGIN;

`;

  let rollbackSql = `-- ==============================================================================
-- Rollback Migration: 0070_rollback_rls_hardening.sql
-- Description: Safely drops generated tenant isolation policies and reverts RLS.
-- ==============================================================================

BEGIN;

`;

  let policyCount = 0;

  // Process tenant_id tables
  for (const { schema, table, colType } of tenantTables) {
    const policyName = `p_${schema}_${table}_tenant_isolation`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // If colType is varchar or text, cast core.get_current_tenant_id()::text or cast tenant_id::uuid
    const compExpr = (colType === 'uuid') 
      ? `tenant_id = core.get_current_tenant_id()` 
      : `tenant_id = core.get_current_tenant_id()::text`;

    sql += `-- Table: "${schema}"."${table}" (Type: ${colType})\n`;
    sql += `ALTER TABLE "${schema}"."${table}" ENABLE ROW LEVEL SECURITY;\n`;
    sql += `ALTER TABLE "${schema}"."${table}" FORCE ROW LEVEL SECURITY;\n`;
    sql += `DROP POLICY IF EXISTS "${policyName}" ON "${schema}"."${table}";\n`;
    sql += `CREATE POLICY "${policyName}" ON "${schema}"."${table}"\n`;
    sql += `  FOR ALL\n`;
    sql += `  USING (\n`;
    sql += `    core.is_super_admin() = true\n`;
    sql += `    OR ${compExpr}\n`;
    sql += `  )\n`;
    sql += `  WITH CHECK (\n`;
    sql += `    core.is_super_admin() = true\n`;
    sql += `    OR ${compExpr}\n`;
    sql += `  );\n\n`;

    rollbackSql += `DROP POLICY IF EXISTS "${policyName}" ON "${schema}"."${table}";\n`;
    const wasSecured = alreadySecured.some(s => s.schema === schema && s.table === table);
    if (!wasSecured) {
      rollbackSql += `ALTER TABLE "${schema}"."${table}" NO FORCE ROW LEVEL SECURITY;\n`;
      rollbackSql += `ALTER TABLE "${schema}"."${table}" DISABLE ROW LEVEL SECURITY;\n`;
    }

    policyCount++;
  }

  // Process partner_id tables
  for (const { schema, table, colType } of partnerTables) {
    const policyName = `p_${schema}_${table}_partner_isolation`.replace(/[^a-zA-Z0-9_]/g, '_');
    const compExpr = (colType === 'uuid') 
      ? `partner_id = core.get_current_tenant_id()` 
      : `partner_id = core.get_current_tenant_id()::text`;

    sql += `-- Table: "${schema}"."${table}" (Partner-scoped, Type: ${colType})\n`;
    sql += `ALTER TABLE "${schema}"."${table}" ENABLE ROW LEVEL SECURITY;\n`;
    sql += `ALTER TABLE "${schema}"."${table}" FORCE ROW LEVEL SECURITY;\n`;
    sql += `DROP POLICY IF EXISTS "${policyName}" ON "${schema}"."${table}";\n`;
    sql += `CREATE POLICY "${policyName}" ON "${schema}"."${table}"\n`;
    sql += `  FOR ALL\n`;
    sql += `  USING (\n`;
    sql += `    core.is_super_admin() = true\n`;
    sql += `    OR ${compExpr}\n`;
    sql += `  )\n`;
    sql += `  WITH CHECK (\n`;
    sql += `    core.is_super_admin() = true\n`;
    sql += `    OR ${compExpr}\n`;
    sql += `  );\n\n`;

    rollbackSql += `DROP POLICY IF EXISTS "${policyName}" ON "${schema}"."${table}";\n`;
    const wasSecured = alreadySecured.some(s => s.schema === schema && s.table === table);
    if (!wasSecured) {
      rollbackSql += `ALTER TABLE "${schema}"."${table}" NO FORCE ROW LEVEL SECURITY;\n`;
      rollbackSql += `ALTER TABLE "${schema}"."${table}" DISABLE ROW LEVEL SECURITY;\n`;
    }

    policyCount++;
  }

  sql += `COMMIT;\n`;
  rollbackSql += `COMMIT;\n`;

  const migPath = path.resolve('packages/database/migrations/0070_comprehensive_tenant_rls_hardening.sql');
  const rollbackPath = path.resolve('packages/database/migrations/0070_rollback_rls_hardening.sql');

  fs.writeFileSync(migPath, sql, 'utf-8');
  fs.writeFileSync(rollbackPath, rollbackSql, 'utf-8');

  console.log(`[RLS-Gen] Successfully regenerated migration with ${policyCount} hardened policies.`);

  await client.end();
}

run().catch(console.error);
