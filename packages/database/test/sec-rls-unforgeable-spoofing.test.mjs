import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import crypto from 'node:crypto';

const APP_DB_URL = process.env.TEST_APP_DATABASE_URL || 'postgresql://docsearch_app:docsearch_app_secure_pass@127.0.0.1:5432/docsearch';
const ADMIN_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

// P0-01: Dynamically generate 256-bit high-entropy secret outside source control
const DYNAMIC_RLS_KEY = process.env.DATABASE_CONTEXT_SECRET || crypto.randomBytes(32).toString('hex');
process.env.DATABASE_CONTEXT_SECRET = DYNAMIC_RLS_KEY;

// P0-01: Former compromised/static key to prove rejection in negative test
const COMPROMISED_STATIC_KEY = 'docsearch_master_hmac_rls_signing_key_2026_unforgeable';

function computeSig(tenantId, branchId, isSuper, signingKey = DYNAMIC_RLS_KEY) {
  const payload = `${tenantId || ''}:${branchId || ''}:${isSuper ? 'true' : 'false'}`;
  return crypto.createHmac('sha256', signingKey).update(payload).digest('hex');
}

test('SEC-001 & SEC-003: Unforgeable RLS Context, Secret Rotation & Audit Immutability Certification', async (t) => {
  const appClient = new pg.Client({ connectionString: APP_DB_URL });
  const adminClient = new pg.Client({ connectionString: ADMIN_DB_URL });

  await appClient.connect();
  await adminClient.connect();

  // Capture current secret so we restore it cleanly on teardown
  const currentSecretRes = await adminClient.query('SELECT secret FROM core.context_secrets WHERE id = 1');
  const originalSecret = currentSecretRes.rows[0]?.secret || process.env.DATABASE_CONTEXT_SECRET;

  // Provision dynamic secret into database via administrative rotation function
  await adminClient.query('SELECT core.rotate_context_secret($1)', [DYNAMIC_RLS_KEY]);

  t.after(async () => {
    if (originalSecret) {
      await adminClient.query('SELECT core.rotate_context_secret($1)', [originalSecret]).catch(() => {});
    }
    await appClient.end();
    await adminClient.end();
  });

  await t.test('P0-02 Pre-flight Role Proof: docsearch_app is strictly non-superuser and non-bypassrls', async () => {
    const res = await appClient.query(`
      SELECT current_user, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user;
    `);
    assert.equal(res.rows.length, 1, 'Current user must exist in pg_roles');
    const { current_user, rolsuper, rolbypassrls } = res.rows[0];
    assert.equal(current_user, 'docsearch_app', 'Connected role must be docsearch_app');
    assert.equal(rolsuper, false, 'docsearch_app MUST NOT be superuser');
    assert.equal(rolbypassrls, false, 'docsearch_app MUST NOT have bypassrls');
  });

  await t.test('SEC-001 (Adversarial): docsearch_app attempting SET LOCAL app.is_super_admin = true is rejected', async () => {
    await appClient.query('BEGIN');
    await appClient.query("SET LOCAL app.is_super_admin = 'true'");
    const res = await appClient.query("SELECT core.is_super_admin() AS is_super");
    await appClient.query('ROLLBACK');

    assert.equal(res.rows[0].is_super, false, 'Spoofed is_super_admin must evaluate to false without valid signature');
  });

  await t.test('SEC-001 (Adversarial): docsearch_app attempting to spoof tenant ID GUC without signature returns NULL', async () => {
    await appClient.query('BEGIN');
    const fakeTenant = '99999999-9999-4999-8999-999999999999';
    await appClient.query(`SET LOCAL app.current_tenant_id = '${fakeTenant}'`);
    const res = await appClient.query("SELECT core.get_current_tenant_id() AS tid");
    await appClient.query('ROLLBACK');

    assert.equal(res.rows[0].tid, null, 'Unverified tenant GUC must return NULL');
  });

  await t.test('P0-01 (Negative Test): Old public/compromised HMAC key is strictly REJECTED for tenant context and super-admin', async () => {
    await appClient.query('BEGIN');
    const victimTenant = '99999999-9999-4999-8999-999999999999';

    // 1. Attempt to set super-admin context using old compromised key
    const forgedSuperSig = computeSig('', '', true, COMPROMISED_STATIC_KEY);
    const superRes = await appClient.query(
      "SELECT core.verify_and_set_context($1, $2, $3, $4) AS verified",
      ['', '', true, forgedSuperSig]
    );
    assert.equal(superRes.rows[0].verified, false, 'Signature with old compromised key must return false');
    const checkSuper = await appClient.query("SELECT core.is_super_admin() AS is_super");
    assert.equal(checkSuper.rows[0].is_super, false, 'is_super_admin must remain false when forged with old key');

    // 2. Attempt to hijack victim tenant using old compromised key
    const forgedTenantSig = computeSig(victimTenant, '', false, COMPROMISED_STATIC_KEY);
    const tenantRes = await appClient.query(
      "SELECT core.verify_and_set_context($1, $2, $3, $4) AS verified",
      [victimTenant, '', false, forgedTenantSig]
    );
    assert.equal(tenantRes.rows[0].verified, false, 'Tenant context assertion with old key must return false');
    const checkTenant = await appClient.query("SELECT core.get_current_tenant_id() AS tid");
    assert.equal(checkTenant.rows[0].tid, null, 'Current tenant ID must remain NULL when signed with old key');

    await appClient.query('ROLLBACK');
  });

  await t.test('SEC-001 (Authorized): Valid HMAC signature with dynamic secret correctly sets and verifies tenant context', async () => {
    await appClient.query('BEGIN');
    const validTenant = '81111111-1111-4111-8111-111111111111';
    const sig = computeSig(validTenant, '', false, DYNAMIC_RLS_KEY);

    const setRes = await appClient.query(
      "SELECT core.verify_and_set_context($1, $2, $3, $4) AS verified",
      [validTenant, '', false, sig]
    );
    assert.equal(setRes.rows[0].verified, true, 'Valid signature must be verified');

    const tidRes = await appClient.query("SELECT core.get_current_tenant_id() AS tid");
    assert.equal(tidRes.rows[0].tid, validTenant, 'Verified tenant ID must match');

    const superRes = await appClient.query("SELECT core.is_super_admin() AS is_super");
    assert.equal(superRes.rows[0].is_super, false, 'Regular tenant is not super admin');

    await appClient.query('ROLLBACK');
  });

  await t.test('SEC-002: docsearch_app cannot call core.rotate_context_secret', async () => {
    let errorCaught = false;
    try {
      await appClient.query("SELECT core.rotate_context_secret('malicious_override_secret_32char_key')");
    } catch (err) {
      errorCaught = true;
      assert.match(err.message, /permission denied/i);
    }
    assert.equal(errorCaught, true, 'docsearch_app must be denied execute access to core.rotate_context_secret');
  });

  await t.test('SEC-002: docsearch_app cannot read core.context_secrets', async () => {
    let errorCaught = false;
    try {
      await appClient.query("SELECT * FROM core.context_secrets");
    } catch (err) {
      errorCaught = true;
      assert.match(err.message, /permission denied/i);
    }
    assert.equal(errorCaught, true, 'docsearch_app must be denied access to core.context_secrets');
  });

  await t.test('SEC-003: TRUNCATE on core.audit_events via docsearch_app is strictly prohibited', async () => {
    let truncateBlocked = false;
    let errorMsg = '';
    try {
      await appClient.query("TRUNCATE core.audit_events");
    } catch (err) {
      truncateBlocked = true;
      errorMsg = err.message;
    }
    assert.equal(truncateBlocked, true, 'TRUNCATE must be blocked');
    assert.ok(
      errorMsg.includes('permission denied') || errorMsg.includes('P0001') || errorMsg.includes('strictly prohibited'),
      `Expected security violation or permission denied, got: ${errorMsg}`
    );
  });
});
