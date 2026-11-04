import pg from 'pg';
import { licenseService } from '../apps/api-gateway/dist/services/company/LicenseService.js';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function reSign() {
  await client.connect();
  const res = await client.query('SELECT * FROM company.licenses');
  console.log(`Re-signing ${res.rows.length} licenses with active system secret...`);

  for (const row of res.rows) {
    const expiryIso = new Date(row.expiry_date).toISOString();
    const correctSig = licenseService.signLicensePayload({
      licenseKey: row.license_key,
      partnerId: row.partner_id,
      tenantId: row.tenant_id,
      subscriptionId: row.subscription_id,
      planId: row.plan_id,
      expiryDate: expiryIso
    });

    console.log(`License ${row.license_key}: updating signature to ${correctSig}`);
    await client.query('UPDATE company.licenses SET signature = $1 WHERE id = $2', [correctSig, row.id]);

    // Verify immediately
    const checkObj = {
      id: row.id,
      licenseKey: row.license_key,
      partnerId: row.partner_id,
      tenantId: row.tenant_id,
      subscriptionId: row.subscription_id,
      planId: row.plan_id,
      status: row.status,
      signature: correctSig,
      expiryDate: expiryIso,
      metadata: row.metadata
    };
    const isValid = licenseService.verifyLicenseSignature(checkObj);
    console.log(`Verification for ${row.license_key}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
  }

  await client.end();
  console.log('All licenses re-signed successfully.');
}

reSign().catch(console.error);
