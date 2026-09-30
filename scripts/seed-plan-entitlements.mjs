import pg from 'pg';
import crypto from 'node:crypto';
import { licenseService } from '../apps/api-gateway/dist/services/company/LicenseService.js';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function main() {
  const REAL_HOSPITAL_PLAN_ID = 'e9604516-3049-d6ab-799b-7c8255df12f5';

  // 1. Update any legacy licenses pointing to dummy plan 4444
  console.log('[*] Aligning company.licenses to canonical plan ID...');
  await pool.query(`
    UPDATE company.licenses 
    SET plan_id = $1 
    WHERE plan_id = '44444444-4444-4444-8444-444444444444'
  `, [REAL_HOSPITAL_PLAN_ID]);

  // 2. Seed all 13 features for Hospital Founding Partner plan
  const featuresRes = await pool.query('SELECT id, code FROM company.features');
  console.log(`[*] Seeding ${featuresRes.rows.length} features into Hospital plan ${REAL_HOSPITAL_PLAN_ID}...`);

  for (const feat of featuresRes.rows) {
    const check = await pool.query('SELECT 1 FROM company.plan_entitlements WHERE plan_id = $1 AND feature_id = $2', [REAL_HOSPITAL_PLAN_ID, feat.id]);
    if (check.rows.length === 0) {
      await pool.query(`
        INSERT INTO company.plan_entitlements (id, plan_id, feature_id, entitlement_type, value, status, metadata, created_at)
        VALUES ($1, $2, $3, 'FEATURE_ACCESS', '{"enabled": true}', 'ACTIVE', '{}', NOW())
      `, [crypto.randomUUID(), REAL_HOSPITAL_PLAN_ID, feat.id]);
      console.log(`  Added ${feat.code} to Hospital plan`);
    }
  }

  // 3. Re-sign all active licenses
  const lics = await pool.query('SELECT * FROM company.licenses');
  for (const row of lics.rows) {
    const expiryIso = new Date(row.expiry_date).toISOString();
    const correctSig = licenseService.signLicensePayload({
      licenseKey: row.license_key,
      partnerId: row.partner_id,
      tenantId: row.tenant_id,
      subscriptionId: row.subscription_id,
      planId: row.plan_id,
      expiryDate: expiryIso
    });

    await pool.query('UPDATE company.licenses SET signature = $1 WHERE id = $2', [correctSig, row.id]);
    console.log(`  Re-signed license ${row.license_key} (sig: ${correctSig.slice(0, 16)}...)`);
  }

  console.log('[✔] All hospital plan entitlements and license signatures successfully aligned.');
  await pool.end();
}

main().catch(console.error);
