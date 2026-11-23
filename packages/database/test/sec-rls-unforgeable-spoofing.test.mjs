import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import crypto from 'node:crypto';

const APP_DB_URL = process.env.TEST_APP_DATABASE_URL || 'postgresql://docsearch_app:docsearch_app_secure_pass@127.0.0.1:5432/docsearch';
const ADMIN_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const RLS_SIGNING_KEY = 'docsearch_master_hmac_rls_signing_key_2026_unforgeable';

function computeSig(tenantId, branchId, isSuper) {
  const payload = `${tenantId || ''}:${branchId || ''}:${isSuper ? 'true' : 'false'}`;
  return crypto.createHmac('sha256', RLS_SIGNING_KEY).update(payload).digest('hex');
}

test('SEC-001 & SEC-003: Unforgeable RLS Context & Audit Immutability Certification', async (t) => {
  const appClient = new pg.Client({ connectionString: APP_DB_URL });
  const adminClient = new pg.Client({ connectionString: ADMIN_DB_URL });

  await appClient.connect();
  await adminClient.connect();

  t.after(async () => {
    await appClient.end();
    await adminClient.end();
  });

  await t.test('SEC-001 (Adversarial): docsearch_app attempting SET LOCAL app.is_super_admin = true is rejected', async () => {
    await appClient.query('BEGIN');
    // Malicious attempt to spoof super-admin via custom GUC
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

  await t.test('SEC-001 (Authorized): Valid HMAC signature correctly sets and verifies tenant context', async () => {
    await appClient.query('BEGIN');
    const validTenant = '81111111-1111-4111-8111-111111111111';
    const sig = computeSig(validTenant, '', false);

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
