import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

function createAdminToken() {
  const claims = {
    sub: crypto.randomUUID(),
    email: 'admin@docsearch.company',
    tenantId: '00000000-0000-4000-8000-000000000001',
    roles: ['SUPER_ADMIN'],
    permissions: ['partners:create', 'partners:read', 'partners:update'],
    iss: ISSUER,
    aud: AUDIENCE
  };
  return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
}

test('Onboard Partner Lead Wizard API: Combo and 365-Day Free Activation', async (t) => {
  const app = await buildApp();
  await app.ready();
  const adminToken = createAdminToken();

  t.after(async () => {
    await app.close();
  });

  await t.test('Successfully activates COMBO_CLINIC_PATHOLOGY with 365 days free and combined lab permissions', async () => {
    const payload = {
      partnerName: 'Apex PolyClinic & Pathology Lab',
      classification: 'COMBO_CLINIC_PATHOLOGY',
      contactPerson: 'Dr. Vivek Sharma',
      phone: '+91 9876543210',
      email: 'lead.clinicpath@docsearch.test',
      password: 'DocSearch2026!',
      city: 'Gurugram',
      state: 'Haryana',
      streetAddress: 'Plot 42, Sector 29',
      pincode: '122001',
      planTier: 'Combo Clinic + Pathology Platinum',
      monthlyFee: 0,
      features: ['OPD Consultations', 'Lab Pathology Orders', 'Universal Staff Directory & RBAC'],
      documents: [
        { type: 'DOCTOR_SMC_REG', fileName: 'smc.pdf', documentNumber: 'SMC-9988', status: 'VERIFIED' },
        { type: 'NABL_OR_CEA_LAB_LICENSE', fileName: 'nabl.pdf', documentNumber: 'NABL-5544', status: 'VERIFIED' }
      ]
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners/complete-onboarding-activation',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json'
      },
      payload
    });

    assert.equal(res.statusCode, 201, 'Should return 201 Created');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.partnerName, payload.partnerName);
    assert.equal(body.data.classification, 'COMBO_CLINIC_PATHOLOGY');
    assert.equal(body.data.credentials.loginUrl, 'http://localhost:5173/clinic');

    // Verify 365-day free license
    assert.equal(body.data.subscriptionPlan.isFirstYearFree, true);
    assert.equal(body.data.subscriptionPlan.freeDurationDays, 365);
    assert.equal(body.data.subscriptionPlan.monthlyFee, 0);

    const expiry = new Date(body.data.subscriptionPlan.expiryDate);
    const now = new Date();
    const diffDays = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.ok(diffDays >= 364 && diffDays <= 366, `Expiry should be ~365 days out, got ${diffDays}`);
  });

  await t.test('Successfully activates COMBO_CLINIC_PHARMACY with 365 days free and retail pharmacy permissions', async () => {
    const payload = {
      partnerName: 'Lifecare Clinic & Chemist Hub',
      classification: 'COMBO_CLINIC_PHARMACY',
      contactPerson: 'Dr. Neha Verma',
      phone: '+91 9876543211',
      email: 'lead.clinicpharma@docsearch.test',
      password: 'DocSearch2026!',
      city: 'Noida',
      state: 'Uttar Pradesh',
      streetAddress: 'Shop 14, Commercial Complex, Sector 62',
      pincode: '201301',
      planTier: 'Combo Clinic + Pharmacy Platinum',
      monthlyFee: 0,
      features: ['OPD Consultations', 'Pharmacy Drug Inventory & POS', 'Universal Staff Directory & RBAC'],
      documents: [
        { type: 'DOCTOR_SMC_REG', fileName: 'smc.pdf', documentNumber: 'SMC-7766', status: 'VERIFIED' },
        { type: 'RETAIL_DRUG_LICENSE_20_21', fileName: 'dl.pdf', documentNumber: 'DL-20-21-4433', status: 'VERIFIED' }
      ]
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners/complete-onboarding-activation',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json'
      },
      payload
    });

    assert.equal(res.statusCode, 201, 'Should return 201 Created');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.partnerName, payload.partnerName);
    assert.equal(body.data.classification, 'COMBO_CLINIC_PHARMACY');
    assert.equal(body.data.credentials.loginUrl, 'http://localhost:5173/clinic');

    // Verify 365-day free license
    assert.equal(body.data.subscriptionPlan.isFirstYearFree, true);
    assert.equal(body.data.subscriptionPlan.freeDurationDays, 365);
  });

  await t.test('Newly onboarded partner appears in CRM All Partners Directory', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/directory?search=${encodeURIComponent('Apex PolyClinic')}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });

    assert.equal(res.statusCode, 200, 'Directory fetch should return 200');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 1, 'Newly onboarded partner must appear in directory');
    const matched = body.data.find((p) => p.legalName.includes('Apex PolyClinic') || p.tradeName.includes('Apex PolyClinic'));
    assert.ok(matched, 'Partner Apex PolyClinic found in directory');
    assert.equal(matched.lifecycleStatus, 'ACTIVE');
    assert.equal(matched.verificationStatus, 'VERIFIED');
    assert.ok(matched.createdAt, 'Should have createdAt timestamp');
    assert.ok(matched.updatedAt, 'Should have updatedAt timestamp');
  });

  await t.test('Newly onboarded partner can successfully log in via /api/v1/auth/login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: {
        'content-type': 'application/json'
      },
      payload: {
        email: 'lead.clinicpath@docsearch.test',
        password: 'DocSearch2026!'
      }
    });

    assert.equal(res.statusCode, 200, 'Partner login should return 200 OK');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken, 'Must return JWT access token');
    assert.equal(body.data.user.email, 'lead.clinicpath@docsearch.test');
    assert.equal(body.data.user.status, 'ACTIVE');
  });

  await t.test('Updating partner via PATCH updates updatedAt timestamp', async () => {
    // 1. Get current partner record
    const dirRes = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/directory?search=${encodeURIComponent('Lifecare Clinic')}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    const dirBody = JSON.parse(dirRes.payload);
    const partner = dirBody.data.find((p) => p.tradeName.includes('Lifecare Clinic'));
    assert.ok(partner, 'Lifecare Clinic partner found');

    const originalUpdatedAt = new Date(partner.updatedAt).getTime();

    // Small delay to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 50));

    // 2. Patch partner
    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${partner.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json'
      },
      payload: {
        tradeName: 'Lifecare Clinic & Chemist Super Hub',
        city: 'Greater Noida'
      }
    });
    assert.equal(patchRes.statusCode, 200, 'PATCH should return 200');

    // 3. Verify directory reflects update and new updatedAt
    const updatedDirRes = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/directory?search=${encodeURIComponent('Super Hub')}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    const updatedDirBody = JSON.parse(updatedDirRes.payload);
    const updatedPartner = updatedDirBody.data.find((p) => p.id === partner.id);
    assert.ok(updatedPartner, 'Updated partner found');
    assert.equal(updatedPartner.tradeName, 'Lifecare Clinic & Chemist Super Hub');
    const newUpdatedAt = new Date(updatedPartner.updatedAt).getTime();
    assert.ok(newUpdatedAt >= originalUpdatedAt, 'updatedAt timestamp must be updated on modification');
  });
});
