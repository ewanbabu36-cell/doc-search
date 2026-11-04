import fs from 'fs';
import path from 'path';
import pg from 'pg';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const MIGRATIONS_DIR = 'packages/database/migrations';
const SCHEMA_DIR = 'packages/database/src/schema';

function walk(dir, exts = ['.ts', '.js', '.sql']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach((f) => {
    if (f === 'node_modules' || f === 'dist' || f === '.git' || f === 'build') return;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results.push(...walk(p, exts));
    else if (exts.some((ext) => p.endsWith(ext))) results.push(p);
  });
  return results;
}

async function runDatabaseBaselineAudit() {
  console.log('========================================================================');
  console.log('DOC SEARCH — CATEGORY 9: DATABASE ARCHITECTURE DISCOVERY & BASELINE AUDIT');
  console.log('========================================================================\n');

  const baseline = {
    timestamp: new Date().toISOString(),
    connection: {
      url: DB_URL.replace(/:[^:@]+@/, ':****@'),
      connected: false,
      version: null,
      database: null,
      serverTime: null
    },
    schemas: [],
    tables: {
      total: 0,
      bySchema: {},
      list: []
    },
    views: {
      total: 0,
      list: []
    },
    columns: {
      total: 0
    },
    indexes: {
      total: 0,
      list: []
    },
    constraints: {
      total: 0,
      primaryKeys: 0,
      foreignKeys: 0,
      uniqueKeys: 0,
      checkConstraints: 0,
      foreignKeyList: [],
      uniqueKeyList: []
    },
    enums: {
      total: 0,
      list: []
    },
    sequences: {
      total: 0,
      list: []
    },
    triggers: {
      total: 0,
      list: []
    },
    extensions: {
      total: 0,
      list: []
    },
    migrations: {
      diskCount: 0,
      files: [],
      dbTrackingTable: null,
      appliedInDbCount: 0,
      appliedList: [],
      pendingList: []
    },
    ormSchema: {
      fileCount: 0,
      tableCount: 0,
      tables: []
    },
    comparison: {
      verifiedMatches: 0,
      codeOnlyTables: [],
      dbOnlyTables: []
    },
    fallbacks: {
      found: 0,
      items: []
    }
  };

  // 1. Connect to PostgreSQL
  const client = new pg.Client({ connectionString: DB_URL });
  try {
    await client.connect();
    baseline.connection.connected = true;

    const verRes = await client.query('SELECT version(), current_database(), NOW() as now');
    baseline.connection.version = verRes.rows[0].version;
    baseline.connection.database = verRes.rows[0].current_database;
    baseline.connection.serverTime = verRes.rows[0].now;

    console.log(`[✔] Connected to PostgreSQL: ${baseline.connection.database}`);
    console.log(`    Engine: ${baseline.connection.version}`);

    // Schemas
    const schemaRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    baseline.schemas = schemaRes.rows.map((r) => r.schema_name);
    console.log(`    Schemas discovered (${baseline.schemas.length}): ${baseline.schemas.join(', ')}`);

    // Tables
    const tablesRes = await client.query(`
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name
    `);
    const tables = tablesRes.rows.filter((r) => r.table_type === 'BASE TABLE');
    const views = tablesRes.rows.filter((r) => r.table_type === 'VIEW');
    baseline.tables.total = tables.length;
    baseline.views.total = views.length;

    tables.forEach((t) => {
      baseline.tables.bySchema[t.table_schema] = (baseline.tables.bySchema[t.table_schema] || 0) + 1;
      baseline.tables.list.push({ schema: t.table_schema, name: t.table_name });
    });
    views.forEach((v) => {
      baseline.views.list.push({ schema: v.table_schema, name: v.table_name });
    });
    console.log(`    Base Tables: ${baseline.tables.total} across ${Object.keys(baseline.tables.bySchema).length} schemas`);
    console.log(`    Views: ${baseline.views.total}`);

    // Columns count
    const colsRes = await client.query(`
      SELECT count(*) as total
      FROM information_schema.columns
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `);
    baseline.columns.total = parseInt(colsRes.rows[0].total, 10);
    console.log(`    Total Columns: ${baseline.columns.total}`);

    // Indexes
    const idxRes = await client.query(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename, indexname
    `);
    baseline.indexes.total = idxRes.rows.length;
    baseline.indexes.list = idxRes.rows.map((r) => ({
      schema: r.schemaname,
      table: r.tablename,
      name: r.indexname,
      definition: r.indexdef
    }));
    console.log(`    Indexes: ${baseline.indexes.total}`);

    // Constraints (PK, FK, Unique, Check)
    const constrRes = await client.query(`
      SELECT tc.constraint_schema, tc.table_name, tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY tc.constraint_schema, tc.table_name, tc.constraint_name
    `);
    baseline.constraints.total = constrRes.rows.length;
    constrRes.rows.forEach((c) => {
      if (c.constraint_type === 'PRIMARY KEY') baseline.constraints.primaryKeys++;
      else if (c.constraint_type === 'FOREIGN KEY') baseline.constraints.foreignKeys++;
      else if (c.constraint_type === 'UNIQUE') baseline.constraints.uniqueKeys++;
      else if (c.constraint_type === 'CHECK') baseline.constraints.checkConstraints++;
    });
    console.log(`    Constraints: ${baseline.constraints.total} (PK: ${baseline.constraints.primaryKeys}, FK: ${baseline.constraints.foreignKeys}, Unique: ${baseline.constraints.uniqueKeys}, Check: ${baseline.constraints.checkConstraints})`);

    // Foreign Keys details
    const fkRes = await client.query(`
      SELECT tc.constraint_schema, tc.table_name, kcu.column_name,
             ccu.table_schema AS foreign_table_schema,
             ccu.table_name AS foreign_table_name,
             ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.constraint_schema, tc.table_name
    `);
    baseline.constraints.foreignKeyList = fkRes.rows;

    // Enums
    const enumRes = await client.query(`
      SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    baseline.enums.total = enumRes.rows.length;
    baseline.enums.list = enumRes.rows;
    console.log(`    Enums: ${baseline.enums.total}`);

    // Sequences
    const seqRes = await client.query(`
      SELECT sequence_schema, sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY sequence_schema, sequence_name
    `);
    baseline.sequences.total = seqRes.rows.length;
    baseline.sequences.list = seqRes.rows;
    console.log(`    Sequences: ${baseline.sequences.total}`);

    // Triggers
    const trigRes = await client.query(`
      SELECT trigger_schema, event_object_table, trigger_name, action_statement
      FROM information_schema.triggers
      WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY trigger_schema, event_object_table, trigger_name
    `);
    baseline.triggers.total = trigRes.rows.length;
    baseline.triggers.list = trigRes.rows;
    console.log(`    Triggers: ${baseline.triggers.total}`);

    // Extensions
    const extRes = await client.query(`
      SELECT extname, extversion FROM pg_extension ORDER BY extname
    `);
    baseline.extensions.total = extRes.rows.length;
    baseline.extensions.list = extRes.rows;
    console.log(`    Extensions: ${baseline.extensions.total} (${baseline.extensions.list.map((e) => `${e.extname} ${e.extversion}`).join(', ')})`);

    // Check Drizzle migration tracking table
    const migCheck = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('__drizzle_migrations', 'drizzle_migrations', '_drizzle_migrations')
    `);
    if (migCheck.rows.length > 0) {
      baseline.migrations.dbTrackingTable = `${migCheck.rows[0].table_schema}.${migCheck.rows[0].table_name}`;
      const drizzleRows = await client.query(`SELECT id, hash, created_at FROM ${baseline.migrations.dbTrackingTable} ORDER BY id`);
      baseline.migrations.appliedInDbCount = drizzleRows.rows.length;
      baseline.migrations.appliedList = drizzleRows.rows;
    }
  } catch (err) {
    console.error('[-] Database query error:', err);
    baseline.connection.error = String(err);
  } finally {
    await client.end();
  }

  // 2. Migration Files from Disk
  const sqlFiles = walk(MIGRATIONS_DIR, ['.sql']).sort();
  baseline.migrations.diskCount = sqlFiles.length;
  baseline.migrations.files = sqlFiles.map((f) => path.basename(f));
  console.log(`\n[*] Migrations on disk: ${baseline.migrations.diskCount} files in ${MIGRATIONS_DIR}`);

  // 3. ORM Schema Discovery from Disk
  const schemaFiles = walk(SCHEMA_DIR, ['.ts']);
  baseline.ormSchema.fileCount = schemaFiles.length;
  console.log(`[*] ORM Schema files: ${baseline.ormSchema.fileCount} TypeScript files in ${SCHEMA_DIR}`);

  const tableRegex = /export\s+const\s+(\w+)\s*=\s*(?:(\w+)\.)?table\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const pgTableRegex = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*['"`]([^'"`]+)['"`]/g;

  schemaFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const normFile = path.relative('.', file).replace(/\\/g, '/');

    // Extract pgSchema declarations in file
    const schemaDeclRegex = /export\s+const\s+(\w+)\s*=\s*pgSchema\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    const schemasInFile = {};
    let sm;
    while ((sm = schemaDeclRegex.exec(content)) !== null) {
      schemasInFile[sm[1]] = sm[2];
    }

    let m;
    while ((m = tableRegex.exec(content)) !== null) {
      const varName = m[1];
      const schemaPrefix = m[2];
      const tableName = m[3];
      const resolvedSchema = schemasInFile[schemaPrefix] || (schemaPrefix ? schemaPrefix.replace('Schema', '') : 'public');

      baseline.ormSchema.tables.push({
        varName,
        tableName,
        schema: resolvedSchema,
        file: normFile
      });
    }

    while ((m = pgTableRegex.exec(content)) !== null) {
      const varName = m[1];
      const tableName = m[2];
      if (!baseline.ormSchema.tables.some((t) => t.file === normFile && t.varName === varName)) {
        baseline.ormSchema.tables.push({
          varName,
          tableName,
          schema: 'public',
          file: normFile
        });
      }
    }
  });
  baseline.ormSchema.tableCount = baseline.ormSchema.tables.length;
  console.log(`    Discovered ${baseline.ormSchema.tableCount} ORM tables in TypeScript schema definitions.`);

  // 4. Schema ↔ ORM Comparison
  const dbTableSet = new Set(baseline.tables.list.map((t) => `${t.schema}.${t.name}`));
  let matches = 0;
  baseline.ormSchema.tables.forEach((t) => {
    const fqn = `${t.schema}.${t.tableName}`;
    if (dbTableSet.has(fqn) || dbTableSet.has(`public.${t.tableName}`)) {
      matches++;
    } else {
      baseline.comparison.codeOnlyTables.push(fqn);
    }
  });
  baseline.comparison.verifiedMatches = matches;

  // DB tables not in ORM schema
  const ormTableNames = new Set(baseline.ormSchema.tables.map((t) => t.tableName));
  baseline.tables.list.forEach((t) => {
    if (!ormTableNames.has(t.name)) {
      baseline.comparison.dbOnlyTables.push(`${t.schema}.${t.name}`);
    }
  });

  console.log(`    Verified ORM ↔ PostgreSQL matches: ${baseline.comparison.verifiedMatches}`);
  console.log(`    Code-only definitions (unmigrated or sub-tables): ${baseline.comparison.codeOnlyTables.length}`);
  console.log(`    DB-only definitions (runtime partition / internal): ${baseline.comparison.dbOnlyTables.length}`);

  // 5. Database Fallbacks & Mock Persistence Scan
  const backendFiles = [
    ...walk('apps/api-gateway/src', ['.ts']),
    ...walk('packages/database/src', ['.ts'])
  ];

  backendFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const normFile = path.relative('.', file).replace(/\\/g, '/');

    if (content.includes('ALLOW_EMBEDDED_POSTGRES = true') || content.includes('ALLOW_EMBEDDED_POSTGRES=true')) {
      baseline.fallbacks.items.push({
        file: normFile,
        type: 'EMBEDDED_POSTGRES_ENABLEMENT',
        snippet: 'ALLOW_EMBEDDED_POSTGRES enabled in source'
      });
    }

    if (content.includes('pg-mem') && !normFile.includes('test') && !normFile.includes('spec')) {
      baseline.fallbacks.items.push({
        file: normFile,
        type: 'PG_MEM_RUNTIME_REFERENCE',
        snippet: 'pg-mem referenced in non-test runtime file'
      });
    }
  });
  baseline.fallbacks.found = baseline.fallbacks.items.length;
  console.log(`\n[*] Database Fallback Scan: ${baseline.fallbacks.found} findings.`);

  // 6. Save Baseline Reports
  fs.mkdirSync('reports/database', { recursive: true });
  fs.writeFileSync('reports/database/baseline.json', JSON.stringify(baseline, null, 2));

  const md = `# DOC SEARCH — CATEGORY 9: DATABASE AUDIT BASELINE

**Generated:** ${baseline.timestamp}
**Target Environment:** Native PostgreSQL 18.4 on Port 5432
**Database Name:** ${baseline.connection.database || 'docsearch'}

---

## 1. Executive Summary

| Metric | Result |
| :--- | :--- |
| **PostgreSQL Engine** | ${baseline.connection.version || 'UNKNOWN'} |
| **Connection Status** | ${baseline.connection.connected ? 'CONNECTED (127.0.0.1:5432)' : 'DISCONNECTED'} |
| **Database Schemas** | ${baseline.schemas.length} (${baseline.schemas.join(', ')}) |
| **Database Base Tables** | **${baseline.tables.total}** tables |
| **Database Views** | **${baseline.views.total}** views |
| **Total Database Columns** | **${baseline.columns.total}** columns |
| **Database Indexes** | **${baseline.indexes.total}** indexes |
| **Total Constraints** | **${baseline.constraints.total}** (PK: ${baseline.constraints.primaryKeys}, FK: ${baseline.constraints.foreignKeys}, Unique: ${baseline.constraints.uniqueKeys}, Check: ${baseline.constraints.checkConstraints}) |
| **Database Enums** | **${baseline.enums.total}** custom enum types |
| **Sequences** | **${baseline.sequences.total}** |
| **Triggers** | **${baseline.triggers.total}** |
| **Installed Extensions** | **${baseline.extensions.total}** (${baseline.extensions.list.map((e) => e.extname).join(', ')}) |
| **SQL Migrations on Disk** | **${baseline.migrations.diskCount}** files (${MIGRATIONS_DIR}) |
| **ORM Schema Tables** | **${baseline.ormSchema.tableCount}** tables (${SCHEMA_DIR}) |
| **Verified ORM ↔ DB Matches**| **${baseline.comparison.verifiedMatches}** tables |

---

## 2. Table Distribution by PostgreSQL Schema

| Schema | Table Count |
| :--- | :--- |
${Object.entries(baseline.tables.bySchema).map(([s, count]) => `| \`${s}\` | **${count}** |`).join('\n')}

---

## 3. Database Constraints Summary

- **Primary Keys:** ${baseline.constraints.primaryKeys}
- **Foreign Keys:** ${baseline.constraints.foreignKeys}
- **Unique Constraints:** ${baseline.constraints.uniqueKeys}
- **Check Constraints:** ${baseline.constraints.checkConstraints}

---

## 4. Installed Extensions

${baseline.extensions.list.map((e) => `- **${e.extname}** (v${e.extversion})`).join('\n')}

---

## 5. Migrations Inventory (${baseline.migrations.diskCount} Files)

${baseline.migrations.files.slice(0, 20).map((f) => `- \`${f}\``).join('\n')}
${baseline.migrations.files.length > 20 ? `\n... and ${baseline.migrations.files.length - 20} more migration files.` : ''}

---

## 6. Database Fallbacks & In-Memory Isolation

- **Findings:** ${baseline.fallbacks.found}
${baseline.fallbacks.items.map((it) => `- [${it.type}] \`${it.file}\`: ${it.snippet}`).join('\n') || '- None detected in production runtime.'}
`;

  fs.writeFileSync('reports/database/baseline.md', md);
  console.log('\n[✔] Baseline reports successfully written to:');
  console.log('    - reports/database/baseline.json');
  console.log('    - reports/database/baseline.md');
  console.log('========================================================================\n');
}

runDatabaseBaselineAudit().catch(console.error);
