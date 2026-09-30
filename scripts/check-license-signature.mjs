import pg from 'pg';
import { licenseService } from '../apps/api-gateway/dist/services/company/LicenseService.js';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function check() {
  await client.connect();
  const res = await client.query('SELECT * FROM company.licenses');
  console.log('Found licenses:', res.rows.length);
  for (const row of res.rows) {
    console.log('\n--- License:', row.license_key, 'Tenant:', row.tenant_id);
    console.log('Status in DB:', row.status);
    console.log('Signature in DB:', row.signature);
    
    // Map snake_case to camelCase
    const licObj = {
      id: row.id,
      licenseKey: row.license_key,
      partnerId: row.partner_id,
      tenantId: row.tenant_id,
      subscriptionId: row.subscription_id,
      planId: row.plan_id,
      status: row.status,
      signature: row.signature,
      expiryDate: row.expiry_date ? new Date(row.expiry_date).toISOString() : null,
      metadata: row.metadata
    };
    
    const expected = licenseService.signLicensePayload({
      licenseKey: row.license_key,
      partnerId: row.partner_id,
      tenantId: row.tenant_id,
      subscriptionId: row.subscription_id,
      planId: row.plan_id,
      expiryDate: new Date(row.expiry_date).toISOString()
    });
    const isValid = licenseService.verifyLicenseSignature(licObj);
    console.log('Expected signature:', expected);
    console.log('verifyLicenseSignature result:', isValid);
  }
  await client.end();
}

check().catch(console.error);
