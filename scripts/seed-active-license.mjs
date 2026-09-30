import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

const MASTER_SECRET = process.env.LICENSE_HMAC_SECRET || 'docsearch_master_jwt_secret_dev_32char_key_only';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const BRANCH_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const BRANCH_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const PRODUCT_ID = '33333333-3333-4333-8333-333333333333';
const PLAN_ID = '44444444-4444-4444-8444-444444444444';
const PARTNER_A_ID = '55555555-5555-4555-8555-555555555555';
const SUBSCRIPTION_A_ID = '66666666-6666-4666-8666-666666666666';
const LICENSE_A_ID = '77777777-7777-4777-8777-777777777777';
const LICENSE_KEY = 'LIC-2026-METR-HOSP';

const EXPIRY_DATE_ISO = '2027-12-31T23:59:59.000Z';
const GRACE_DATE_ISO = '2028-01-31T23:59:59.000Z';

function generateSignature(licenseKey, partnerId, tenantId, subscriptionId, planId, expiryDateIso) {
  const dataToSign = `${licenseKey}:${partnerId}:${tenantId}:${subscriptionId}:${planId}:${expiryDateIso}`;
  return crypto.createHmac('sha256', MASTER_SECRET).update(dataToSign).digest('hex');
}

async function seed() {
  console.log('Seeding prerequisite commercial records into Native PostgreSQL 18.4...');

  // 1. Tenants
  await pool.query(`
    INSERT INTO core.tenants (id, name, slug, type, status, metadata)
    VALUES 
      ($1, 'Metro Healthcare Hospital', 'metro-hospital', 'HOSPITAL', 'ACTIVE', '{}'),
      ($2, 'Apex Diagnostic Care', 'apex-diagnostic', 'DIAGNOSTIC_CENTRE', 'ACTIVE', '{}')
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      status = 'ACTIVE';
  `, [TENANT_A, TENANT_B]);
  console.log('[✔] core.tenants seeded');

  // 2. Branches
  await pool.query(`
    INSERT INTO core.branches (id, tenant_id, name, code, status, timezone)
    VALUES 
      ($1, $2, 'Metro Hospital Main Campus', 'MAIN', 'ACTIVE', 'Asia/Kolkata'),
      ($3, $4, 'Apex Diagnostics City Branch', 'CITY', 'ACTIVE', 'Asia/Kolkata')
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      status = 'ACTIVE';
  `, [BRANCH_A, TENANT_A, BRANCH_B, TENANT_B]);
  console.log('[✔] core.branches seeded');

  // 3. Product
  await pool.query(`
    INSERT INTO company.products (id, code, name, description, category, status, version)
    VALUES ($1, 'DOCSEARCH_CORE', 'DocSearch Hospital Platform', 'Universal Healthcare ERP', 'CORE', 'ACTIVE', '1.0.0')
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
  `, [PRODUCT_ID]);
  console.log('[✔] company.products seeded');

  // 4. Plan
  await pool.query(`
    INSERT INTO company.plans (
      id, product_id, code, name, description, status, version,
      base_price, currency, billing_interval, trial_duration_days,
      max_concurrent_users, max_doctors, max_branches, max_beds,
      storage_quota_gb, monthly_whatsapp_credits
    )
    VALUES ($1, $2, 'HOSPITAL_ENTERPRISE', 'Hospital Enterprise Plan', 'Full Clinical, LIMS, RIS, Pharmacy, Billing', 'ACTIVE', '1.0.0',
      100000, 'INR', 'YEARLY', 365, 100, 50, 10, 200, 100, 5000)
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
  `, [PLAN_ID, PRODUCT_ID]);
  console.log('[✔] company.plans seeded');

  // 5. Partner Profile
  await pool.query(`
    INSERT INTO company.partner_profiles (
      id, tenant_id, partner_type, lifecycle_status, verification_status,
      legal_name, trade_name, primary_contact_name, primary_contact_email,
      primary_contact_phone, primary_contact_role, active_profiles, operating_model
    )
    VALUES (
      $1, $2, 'HOSPITAL', 'ACTIVE', 'VERIFIED',
      'Metro Healthcare Hospital Ltd', 'Metro Hospital', 'Dr. Rajesh Sharma', 'rajesh.sharma@docsearch.health',
      '+919876543210', 'DIRECTOR', '["HOSPITAL", "CLINICAL", "LIMS", "PHARMACY"]'::jsonb, 'HYBRID'
    )
    ON CONFLICT (id) DO UPDATE SET 
      lifecycle_status = 'ACTIVE',
      verification_status = 'VERIFIED';
  `, [PARTNER_A_ID, TENANT_A]);
  console.log('[✔] company.partner_profiles seeded');

  // 6. Subscription
  await pool.query(`
    INSERT INTO company.subscriptions (
      id, partner_id, product_id, plan_id, plan_version, status, billing_cycle,
      start_date, renewal_date, end_date
    )
    VALUES (
      $1, $2, $3, $4, '1.0.0', 'ACTIVE', 'YEARLY',
      NOW(), NOW() + INTERVAL '365 days', NOW() + INTERVAL '365 days'
    )
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
  `, [SUBSCRIPTION_A_ID, PARTNER_A_ID, PRODUCT_ID, PLAN_ID]);
  console.log('[✔] company.subscriptions seeded');

  // 7. HMAC-Signed License
  const signature = generateSignature(
    LICENSE_KEY,
    PARTNER_A_ID,
    TENANT_A,
    SUBSCRIPTION_A_ID,
    PLAN_ID,
    EXPIRY_DATE_ISO
  );

  await pool.query(`
    INSERT INTO company.licenses (
      id, license_key, partner_id, tenant_id, subscription_id, plan_id,
      license_type, status, activation_status, max_concurrent_users, max_doctors, max_branches,
      issued_at, start_date, expiry_date, grace_period_end, signature, metadata
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      'COMMERCIAL', 'ACTIVE', 'ACTIVATED', 100, 50, 10,
      NOW(), NOW(), $7, $8, $9, '{"includedModules": ["CLINICAL", "LIMS", "PHARMACY", "BILLING", "RADIOLOGY"]}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET 
      status = 'ACTIVE',
      expiry_date = EXCLUDED.expiry_date,
      signature = EXCLUDED.signature;
  `, [
    LICENSE_A_ID,
    LICENSE_KEY,
    PARTNER_A_ID,
    TENANT_A,
    SUBSCRIPTION_A_ID,
    PLAN_ID,
    EXPIRY_DATE_ISO,
    GRACE_DATE_ISO,
    signature
  ]);
  console.log(`[✔] company.licenses seeded with valid HMAC signature: ${signature.slice(0, 16)}...`);

  await pool.end();
  console.log('\nAll prerequisite commercial records successfully seeded and verified in Native PostgreSQL 18.4!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
