import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const rootDir = process.cwd();

async function runAudit() {
  console.log('=== DOC SEARCH FULL MONOREPO ABNORMALITY AUDIT ===\n');

  // 1. FRONTEND / UI/UX AUDIT
  let deadBtnCount = 0;
  const deadBtns = [];
  let nativeAlertCount = 0;
  const nativeAlerts = [];

  function scanFrontend(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item === 'dist' || item === '.git') continue;
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scanFrontend(full);
      } else if (full.endsWith('.tsx') || full.endsWith('.jsx')) {
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('onClick={() => {}}') || line.includes('onClick={() => console.')) {
            deadBtnCount++;
            if (deadBtns.length < 10) {
              deadBtns.push(`${full.replace(rootDir, '').replace(/^[\\\/]/, '')}:${idx + 1}`);
            }
          }
          if (line.includes('window.alert(') || line.includes('window.confirm(') || line.includes('alert(')) {
            if (!line.includes('Alert') && !line.includes('//') && !line.includes('isAlert') && !line.includes('showAlert')) {
              if (/\b(window\.)?(alert|confirm)\s*\(/.test(line)) {
                nativeAlertCount++;
                if (nativeAlerts.length < 10) {
                  nativeAlerts.push(`${full.replace(rootDir, '').replace(/^[\\\/]/, '')}:${idx + 1}: ${line.trim()}`);
                }
              }
            }
          }
        });
      }
    }
  }

  scanFrontend(path.join(rootDir, 'apps'));
  console.log('1. [UI/UX & FRONTEND]');
  console.log(`- Dead / Stubbed onClick Handlers: ${deadBtnCount} occurrences`);
  console.log('  Top samples:', deadBtns.slice(0, 6));
  console.log(`- Native alert() / confirm() Dialogs: ${nativeAlertCount} occurrences`);
  console.log('  Top samples:', nativeAlerts.slice(0, 6));

  // 2. DATABASE LAYER AUDIT
  console.log('\n2. [DATABASE LAYER]');
  try {
    const { Client } = pg;
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
    });
    await client.connect();

    const tablesRes = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname IN ('public', 'clinical', 'company', 'billing', 'inventory', 'analytics')
      ORDER BY schemaname, tablename;
    `);

    let zeroRowCount = 0;
    const zeroRowTables = [];
    let populatedCount = 0;

    for (const row of tablesRes.rows) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) as count FROM "${row.schemaname}"."${row.tablename}";`);
        const c = parseInt(countRes.rows[0].count, 10);
        if (c === 0) {
          zeroRowCount++;
          if (zeroRowTables.length < 10) {
            zeroRowTables.push(`${row.schemaname}.${row.tablename}`);
          }
        } else {
          populatedCount++;
        }
      } catch {
        // Table might have partition or special syntax
      }
    }

    console.log(`- Total Monorepo Tables: ${tablesRes.rows.length}`);
    console.log(`- Populated Tables: ${populatedCount}`);
    console.log(`- Zero-Row (Unseeded) Tables: ${zeroRowCount}`);
    console.log('  Sample unseeded tables:', zeroRowTables.slice(0, 8));

    // Check Partitioned vs flat invoice tables
    const invoiceCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name LIKE '%invoice%' AND table_schema = 'clinical';
    `);
    console.log('- Invoice tables present in clinical schema:', invoiceCheck.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.log('- Database audit notice:', err.message);
  }

  // 3. API & BACKEND AUDIT
  console.log('\n3. [API & BACKEND LAYER]');
  let mockFallbackCount = 0;
  const mockEndpoints = [];
  function scanRoutes(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        scanRoutes(full);
      } else if (full.endsWith('.routes.ts') || full.endsWith('.routes.js')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('MOCK_') || content.includes('demoFallback') || content.includes('FALLBACK_')) {
          mockFallbackCount++;
          if (mockEndpoints.length < 8) {
            mockEndpoints.push(full.replace(rootDir, '').replace(/^[\\\/]/, ''));
          }
        }
      }
    }
  }
  scanRoutes(path.join(rootDir, 'apps/api-gateway/src/routes'));
  console.log(`- Routes with In-Memory Mock Fallbacks: ${mockFallbackCount}`);
  console.log('  Sample routes with mock fallbacks:', mockEndpoints.slice(0, 5));
}

runAudit().catch(console.error);
