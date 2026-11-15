import pg from 'pg';
import fs from 'fs';
import path from 'path';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function auditDatabase() {
  await client.connect();
  const res = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY table_schema, table_name;
  `);

  const zeroTables = [];
  const populatedTables = [];
  const tenantBreakdown = {};

  for (const r of res.rows) {
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${r.table_schema}"."${r.table_name}"`);
      const count = parseInt(countRes.rows[0].count, 10);
      const fullName = `${r.table_schema}.${r.table_name}`;
      if (count === 0) {
        zeroTables.push(fullName);
      } else {
        populatedTables.push({ table: fullName, count });
        // Check tenant distribution if column tenant_id exists
        const colRes = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2 AND column_name IN ('tenant_id', 'tenantId');
        `, [r.table_schema, r.table_name]);
        if (colRes.rows.length > 0) {
          const col = colRes.rows[0].column_name;
          const tenantRes = await client.query(`
            SELECT "${col}" as tid, count(*) as c FROM "${r.table_schema}"."${r.table_name}" GROUP BY "${col}"
          `);
          tenantBreakdown[fullName] = tenantRes.rows;
        }
      }
    } catch (err) {
      // Table might be a view or locked
    }
  }

  await client.end();
  return { populatedTables, zeroTables, tenantBreakdown };
}

async function auditFrontendAlertsAndConfirms() {
  const dirs = ['apps/partner-platform/src', 'apps/patient-app/src', 'apps/company-platform/src', 'apps/landing-page/src'];
  const matches = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        scanDir(full);
      } else if (e.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js'))) {
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.match(/\balert\s*\(/) && !line.includes('//') && !line.includes('News2') && !line.includes('Alert (')) {
            matches.push({ file: full, line: idx + 1, type: 'alert', text: line.trim() });
          }
          if (line.match(/\bconfirm\s*\(/) && !line.includes('//')) {
            matches.push({ file: full, line: idx + 1, type: 'confirm', text: line.trim() });
          }
          if (line.match(/localStorage\.(setItem|getItem)/) && (full.includes('Modal') || full.includes('View') || full.includes('Screen'))) {
            // potential state bypass
          }
        });
      }
    }
  }

  dirs.forEach(scanDir);
  return matches;
}

async function main() {
  console.log('Auditing PostgreSQL Database...');
  const dbData = await auditDatabase();
  console.log(`DB: ${dbData.populatedTables.length} Populated Tables, ${dbData.zeroTables.length} Zero-Row Tables`);

  console.log('\nAuditing Frontend Synchronous Dialogs & Alerts...');
  const dialogs = await auditFrontendAlertsAndConfirms();
  console.log(`Frontend: Found ${dialogs.length} remaining synchronous alert/confirm calls`);

  // Write detailed findings to file for examination
  const findings = {
    db: dbData,
    frontendDialogs: dialogs
  };
  fs.writeFileSync('audit-deep-findings.json', JSON.stringify(findings, null, 2));
  console.log('Detailed audit data saved to audit-deep-findings.json');
}

main().catch(console.error);
