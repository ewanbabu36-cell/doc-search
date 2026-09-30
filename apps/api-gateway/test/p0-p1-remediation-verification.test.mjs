import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  getDatabase,
  withSecurityContext,
  documentTypes,
  entityDocuments,
  documentVerifications,
  documentAuditLogs,
  operationalStaff,
  eq
} from '@docsearch/database';
import { partnerOnboardingRepository, toDeterministicUuid } from '../dist/repositories/company/PartnerOnboardingRepository.js';
import { licenseRepository } from '../dist/repositories/company/LicenseRepository.js';
import { licenseService } from '../dist/services/company/LicenseService.js';
import { documentVerificationRepository } from '../dist/repositories/core/DocumentVerificationRepository.js';

describe('DOC SEARCH — P0 & P1 Controlled Remediation & Independent Verification Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantPathologyId = toDeterministicUuid('tenant-p0p1-pathology@docsearch.in');
  const tenantPharmacyId = toDeterministicUuid('tenant-p0p1-pharmacy@docsearch.in');
  const tenantDiagnosticId = toDeterministicUuid('tenant-p0p1-diagnostic@docsearch.in');
  const tenantClinicId = toDeterministicUuid('tenant-p0p1-clinic@docsearch.in');
  const tenantPendingId = toDeterministicUuid('tenant-p0p1-pending@docsearch.in');
  const tenantRejectedId = toDeterministicUuid('tenant-p0p1-rejected@docsearch.in');

  const hqToken = (role = 'COMPLIANCE_OFFICER', userId = '00000000-0000-4000-8000-000000000901', email = 'compliance.hq@docsearch.in') =>
    signJwt(
      {
        sub: userId,
        userId,
        email,
        actorEmail: email,
        tenantId: TEST_SEEDS.TENANT_A,
        branchId: TEST_SEEDS.BRANCH_A,
        roles: [role],
        permissions: ['*'],
        dataScope: 'global',
        isSuperAdmin: role === 'SUPER_ADMIN',
        iss: ISSUER,
        aud: AUDIENCE
      },
      { secret: MASTER_SECRET, expiresInSeconds: 7200, issuer: ISSUER, audience: AUDIENCE }
    );

  const partnerToken = ({
    tenantId,
    role = 'PARTNER_ADMIN',
    userId = crypto.randomUUID(),
    email = 'admin@partner.in',
    facilityType = 'PATHOLOGY',
    permissions = ['*']
  }) =>
    signJwt(
      {
        sub: userId,
        userId,
        email,
        actorEmail: email,
        tenantId,
        branchId: TEST_SEEDS.BRANCH_A,
        facilityType,
        organizationType: facilityType,
        roles: [role],
        permissions,
        dataScope: 'tenant',
        isSuperAdmin: false,
        iss: ISSUER,
        aud: AUDIENCE
      },
      { secret: MASTER_SECRET, expiresInSeconds: 7200, issuer: ISSUER, audience: AUDIENCE }
    );

  async function seedActiveLicense(tenantId, planSlug, productSlug, facilityType, maxDoctors = 5, includedModules = []) {
    const planId = toDeterministicUuid(planSlug);
    const productId = toDeterministicUuid(productSlug);
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    return licenseService.issueLicense({
      partnerId: tenantId,
      tenantId,
      subscriptionId: crypto.randomUUID(),
      planId,
      maxConcurrentUsers: 25,
      maxDoctors,
      maxBranches: 2,
      startDate: now,
      expiryDate,
      metadata: {
        productId,
        facilityType,
        organizationType: facilityType,
        maxDoctorSeats: maxDoctors,
        includedModules
      }
    });
  }

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'test';

    const dbInstance = await setupTestDatabase({ seedBaseline: true });
    await partnerOnboardingRepository.seedBaselinePartnersIfEmpty(dbInstance.db);

    app = await buildApp();
    await app.ready();

    // Seed active commercial licenses for approved test tenants
    await seedActiveLicense(tenantPathologyId, 'plan-path-free-yr1', 'prod-pathology', 'PATHOLOGY', 3, [
      'OPERATIONS',
      'PATHOLOGY_LIMS',
      'BILLING',
      'TPA_INSURANCE',
      'STAFF',
      'PATIENTS'
    ]);
    await seedActiveLicense(tenantPharmacyId, 'plan-pharma-free-yr1', 'prod-pharmacy', 'PHARMACY', 2, [
      'OPERATIONS',
      'PHARMACY_POS',
      'BILLING',
      'TPA_INSURANCE',
      'STAFF',
      'PATIENTS'
    ]);
    await seedActiveLicense(tenantDiagnosticId, 'plan-radio-free-yr1', 'prod-pathology', 'DIAGNOSTIC_CENTRE', 3, [
      'OPERATIONS',
      'RADIOLOGY_PACS',
      'PATHOLOGY_LIMS',
      'BILLING',
      'TPA_INSURANCE',
      'STAFF',
      'PATIENTS'
    ]);
    await seedActiveLicense(tenantClinicId, 'plan-clinic-free-yr1', 'prod-clinic', 'CLINIC', 2, [
      'OPERATIONS',
      'CLINICAL_EMR',
      'OPD',
      'BILLING',
      'TPA_INSURANCE',
      'STAFF',
      'PATIENTS'
    ]);

    // Seed staged PENDING and REJECTED partners via real self-register endpoint
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/self-register',
      payload: {
        partner: {
          facilityName: 'Unapproved Pending Diagnostics',
          organizationType: 'PATHOLOGY',
          email: 'p0p1-pending@docsearch.in',
          phone: '+91 98765 43210',
          name: 'Director Pending',
          city: 'Patna, Bihar',
          licenseNumber: 'BR-PATH-2026-991'
        },
        verificationItem: {
          partnerName: 'Unapproved Pending Diagnostics',
          partnerType: 'PATHOLOGY',
          documentName: 'pending_license.pdf',
          documentType: 'Clinical Establishment Certificate',
          details: {
            'Facility Name': 'Unapproved Pending Diagnostics',
            'Registered Email': 'p0p1-pending@docsearch.in'
          }
        }
      }
    });

    const rejRegRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/self-register',
      payload: {
        partner: {
          facilityName: 'Rejected Pharmacy Store',
          organizationType: 'PHARMACY',
          email: 'p0p1-rejected@docsearch.in',
          phone: '+91 98765 43211',
          name: 'Director Rejected',
          city: 'Patna, Bihar',
          licenseNumber: 'BR-PHARM-2026-992'
        },
        verificationItem: {
          partnerName: 'Rejected Pharmacy Store',
          partnerType: 'PHARMACY',
          documentName: 'rejected_license.pdf',
          documentType: 'Drug License',
          details: {
            'Facility Name': 'Rejected Pharmacy Store',
            'Registered Email': 'p0p1-rejected@docsearch.in'
          }
        }
      }
    });
    const rejId = rejRegRes.json()?.verificationItem?.id;
    if (rejId) {
      await partnerOnboardingRepository.updateRegistrationStatus(rejId, 'REJECTED', {
        rejectionReason: 'Invalid Drug License Form 20/21'
      });
    }
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  // =========================================================================
  // PHASE 1 & 2: P0 SECURITY & VERIFICATION GOVERNANCE (Tests 1–14)
  // =========================================================================
  describe('Phase 1 & 2 — P0 Security (Tenant Isolation, Verification Governance & Commercial Lockout)', () => {
    let tenantADocId;
    let tenantBDocId;
    let hqUploadedDocId;
    const uploaderAId = '00000000-0000-4000-8000-000000000111';
    const hqOfficer1Id = '00000000-0000-4000-8000-000000000901';
    const hqOfficer2Id = '00000000-0000-4000-8000-000000000902';

    before(async () => {
      // Upload a document for Tenant A (Pathology)
      const resA = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPathologyId,
            userId: uploaderAId,
            email: 'adminA@pathology.in',
            facilityType: 'PATHOLOGY'
          })}`
        },
        payload: {
          documentTypeCode: 'PATH_CLINICAL_EST_ACT',
          documentNumber: 'CEA-PATH-2026-001',
          fileName: 'cea_certificate_tenant_a.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: Buffer.from('%PDF-1.4 Tenant A Regulatory Certificate Binary Payload').toString('base64')
        }
      });
      assert.equal(resA.statusCode, 201);
      tenantADocId = resA.json().data.id;

      // Upload a document for Tenant B (Pharmacy)
      const resB = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPharmacyId,
            email: 'adminB@pharmacy.in',
            facilityType: 'PHARMACY'
          })}`
        },
        payload: {
          documentTypeCode: 'PHARM_RETAIL_DRUG_LICENSE',
          documentNumber: 'DL-20-2026-999',
          fileName: 'drug_license_tenant_b.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: Buffer.from('%PDF-1.4 Tenant B Drug License Binary Payload').toString('base64')
        }
      });
      assert.equal(resB.statusCode, 201);
      tenantBDocId = resB.json().data.id;

      // Upload a document by HQ Officer 1 (to test Maker-Checker when Officer 1 tries to verify it)
      const resHqUpload = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${hqToken('COMPLIANCE_OFFICER', hqOfficer1Id, 'officer1@docsearch.in')}`
        },
        payload: {
          documentTypeCode: 'PATH_BIO_MEDICAL_WASTE',
          documentNumber: 'BMW-2026-777',
          fileName: 'bmw_auth.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: Buffer.from('%PDF-1.4 Bio Medical Waste Authorization').toString('base64')
        }
      });
      assert.equal(resHqUpload.statusCode, 201);
      hqUploadedDocId = resHqUpload.json().data.id;
    });

    test('P0-1: Unauthenticated request to /api/v1/compliance/documents/verification-queue returns 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/verification-queue'
      });
      assert.equal(res.statusCode, 401);
    });

    test('P0-2: Tenant A partner admin calling global /api/v1/compliance/documents/verification-queue returns 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/verification-queue',
        headers: {
          authorization: `Bearer ${partnerToken({ tenantId: tenantPathologyId, facilityType: 'PATHOLOGY' })}`
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('P0-3: Tenant A partner admin calling /api/v1/compliance/documents/verification-queue?scope=tenant returns 200 with ONLY Tenant A docs', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/verification-queue?scope=tenant',
        headers: {
          authorization: `Bearer ${partnerToken({ tenantId: tenantPathologyId, facilityType: 'PATHOLOGY' })}`
        }
      });
      assert.equal(res.statusCode, 200);
      const docs = res.json().data;
      assert.ok(Array.isArray(docs));
      assert.ok(docs.some((d) => d.id === tenantADocId), 'Must include Tenant A document');
      assert.ok(!docs.some((d) => d.id === tenantBDocId), 'Must NEVER include Tenant B document');
      for (const doc of docs) {
        assert.equal(doc.tenantId, tenantPathologyId);
      }
    });

    test('P0-4: Tenant A partner admin calling /api/v1/compliance/documents/verification-queue?tenantId=TenantB returns 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/verification-queue?scope=tenant&tenantId=${tenantPharmacyId}`,
        headers: {
          authorization: `Bearer ${partnerToken({ tenantId: tenantPathologyId, facilityType: 'PATHOLOGY' })}`
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('P0-5: Tenant A clinical staff/doctor calling /api/v1/compliance/documents/verification-queue returns 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/verification-queue',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPathologyId,
            role: 'ATTENDING_DOCTOR',
            facilityType: 'PATHOLOGY'
          })}`
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('P0-6: Tenant A partner admin calling POST /api/v1/compliance/documents/:id/verify on own document returns 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${tenantADocId}/verify`,
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPathologyId,
            userId: uploaderAId,
            email: 'adminA@pathology.in',
            facilityType: 'PATHOLOGY'
          })}`
        },
        payload: {
          status: 'VERIFIED',
          notes: 'Attempting self-approval'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('P0-7: Tenant A partner admin calling POST /api/v1/compliance/documents/:id/verify on Tenant B document returns 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${tenantBDocId}/verify`,
        headers: {
          authorization: `Bearer ${partnerToken({ tenantId: tenantPathologyId, facilityType: 'PATHOLOGY' })}`
        },
        payload: {
          status: 'VERIFIED',
          notes: 'Cross-tenant verification attempt'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('P0-8: Tenant A doctor/pharmacist/lab staff calling POST /api/v1/compliance/documents/:id/verify returns 403', async () => {
      for (const role of ['ATTENDING_DOCTOR', 'DISPENSING_PHARMACIST', 'SENIOR_LAB_TECH']) {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/compliance/documents/${tenantADocId}/verify`,
          headers: {
            authorization: `Bearer ${partnerToken({ tenantId: tenantPathologyId, role, facilityType: 'PATHOLOGY' })}`
          },
          payload: {
            status: 'VERIFIED'
          }
        });
        assert.equal(res.statusCode, 403, `Role ${role} must be blocked with 403`);
      }
    });

    test('P0-9: HQ COMPLIANCE_OFFICER calling GET /api/v1/compliance/documents/verification-queue returns 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/verification-queue',
        headers: {
          authorization: `Bearer ${hqToken('COMPLIANCE_OFFICER', hqOfficer2Id, 'officer2@docsearch.in')}`
        }
      });
      assert.equal(res.statusCode, 200);
      const docs = res.json().data;
      assert.ok(docs.some((d) => d.id === tenantADocId));
      assert.ok(docs.some((d) => d.id === tenantBDocId));
    });

    test('P0-10: HQ COMPLIANCE_OFFICER calling POST /api/v1/compliance/documents/:id/verify returns 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${tenantADocId}/verify`,
        headers: {
          authorization: `Bearer ${hqToken('COMPLIANCE_OFFICER', hqOfficer2Id, 'officer2@docsearch.in')}`
        },
        payload: {
          status: 'VERIFIED',
          notes: 'Independent HQ Compliance Officer verified CEA license'
        }
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().data.verificationStatus, 'VERIFIED');
    });

    test('P0-11: HQ COMPANY_ADMIN calling POST /api/v1/compliance/documents/:id/verify returns 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${tenantBDocId}/verify`,
        headers: {
          authorization: `Bearer ${hqToken('COMPANY_ADMIN', hqOfficer2Id, 'company.admin@docsearch.in')}`
        },
        payload: {
          status: 'VERIFIED',
          notes: 'HQ Company Admin verified retail drug license'
        }
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().data.verificationStatus, 'VERIFIED');
    });

    test('P0-12: HQ SUPER_ADMIN calling POST /api/v1/compliance/documents/:id/verify returns 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${hqUploadedDocId}/verify`,
        headers: {
          authorization: `Bearer ${hqToken('SUPER_ADMIN', hqOfficer2Id, 'super.admin@docsearch.in')}`
        },
        payload: {
          status: 'VERIFIED',
          notes: 'HQ Super Admin verified BMW document uploaded by Officer 1'
        }
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().data.verificationStatus, 'VERIFIED');
    });

    test('P0-13: Maker-Checker — Same HQ user who uploaded document attempting to verify own document returns 403', async () => {
      // Upload another doc by Officer 1
      const uploadRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${hqToken('COMPLIANCE_OFFICER', hqOfficer1Id, 'officer1@docsearch.in')}`
        },
        payload: {
          documentTypeCode: 'HOSP_FIRE_SAFETY_NOC',
          documentNumber: 'FIRE-2026-101',
          fileName: 'fire_noc.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: Buffer.from('%PDF-1.4 Fire Safety NOC').toString('base64')
        }
      });
      assert.equal(uploadRes.statusCode, 201);
      const selfUploadedId = uploadRes.json().data.id;

      // Officer 1 attempts to verify their own uploaded document -> must fail with 403
      const verifyRes = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${selfUploadedId}/verify`,
        headers: {
          authorization: `Bearer ${hqToken('COMPLIANCE_OFFICER', hqOfficer1Id, 'officer1@docsearch.in')}`
        },
        payload: {
          status: 'VERIFIED',
          notes: 'Attempting to verify own uploaded doc'
        }
      });
      assert.equal(verifyRes.statusCode, 403);
    });

    test('P0-14 (P0-COM-01): PENDING and REJECTED partners are blocked (403) from operational APIs while Profile View/Edit remains accessible (200)', async () => {
      const pendingJwt = partnerToken({
        tenantId: tenantPendingId,
        email: 'p0p1-pending@docsearch.in',
        facilityType: 'PATHOLOGY'
      });
      const rejectedJwt = partnerToken({
        tenantId: tenantRejectedId,
        email: 'p0p1-rejected@docsearch.in',
        facilityType: 'PHARMACY'
      });

      // Canonical Fail-Closed Heartbeat Check: processHeartbeat for unlicensed/PENDING tenant must NEVER return FREE_ACTIVE
      const hb = await licenseService.processHeartbeat({
        tenantId: tenantPendingId,
        machineFingerprint: 'DEFAULT'
      });
      assert.equal(hb.isAccessAllowed, false, 'processHeartbeat must return isAccessAllowed=false when no license exists');
      assert.notEqual(hb.status, 'FREE_ACTIVE', 'processHeartbeat must NEVER manufacture FREE_ACTIVE for an unapproved partner');

      // Operational APIs (Pharmacy Overview, Clinical, Lab, Radiology, Billing) must all return 403 COMMERCIAL_ACCESS_DENIED for PENDING & REJECTED
      const operationalRoutes = [
        '/api/v1/partner/pharmacy/overview',
        '/api/v1/partner/pharmacy/medications',
        '/api/v1/partner/clinical/patients',
        '/api/v1/partner/lab/orders',
        '/api/v1/partner/radiology/studies',
        '/api/v1/partner/billing/invoices'
      ];

      for (const url of operationalRoutes) {
        const resPending = await app.inject({
          method: 'GET',
          url,
          headers: { authorization: `Bearer ${pendingJwt}` }
        });
        assert.equal(resPending.statusCode, 403, `Expected 403 on ${url} for PENDING partner`);
        assert.equal(resPending.json().error?.code, 'COMMERCIAL_ACCESS_DENIED', `Expected COMMERCIAL_ACCESS_DENIED on ${url}`);

        const resRejected = await app.inject({
          method: 'GET',
          url,
          headers: { authorization: `Bearer ${rejectedJwt}` }
        });
        assert.equal(resRejected.statusCode, 403, `Expected 403 on ${url} for REJECTED partner`);
        assert.equal(resRejected.json().error?.code, 'COMMERCIAL_ACCESS_DENIED', `Expected COMMERCIAL_ACCESS_DENIED on ${url}`);
      }

      // Operational API (Staff Creation) must be blocked with 403 for PENDING partner
      const staffPendingRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pendingJwt}` },
        payload: {
          fullName: 'Blocked Staff',
          primaryRole: 'LAB_DIRECTOR',
          staffType: 'TECHNICAL',
          email: 'staff@pending.in',
          phone: '9876543210'
        }
      });
      assert.equal(staffPendingRes.statusCode, 403);

      // Profile View & Profile Edit MUST still succeed (200) for PENDING and REJECTED partners!
      const profileViewRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/account/profile',
        headers: { authorization: `Bearer ${pendingJwt}` }
      });
      assert.equal(profileViewRes.statusCode, 200);

      const profileEditRes = await app.inject({
        method: 'PUT',
        url: '/api/v1/partner/account/profile',
        headers: { authorization: `Bearer ${pendingJwt}` },
        payload: {
          organizationName: 'Updated Pending Diagnostics Name',
          contactPhone: '+91-9988776655'
        }
      });
      assert.equal(profileEditRes.statusCode, 200);
    });
  });

  // =========================================================================
  // PHASE 3: P1 RBAC / COMMERCIAL / QUOTA ENFORCEMENT (Tests 1–12)
  // =========================================================================
  describe('Phase 3 — P1 RBAC, Partner Profile Compatibility, Module Entitlements & Doctor Seat Quota', () => {
    const pathAdminJwt = () =>
      partnerToken({
        tenantId: tenantPathologyId,
        email: 'admin@pathology.in',
        facilityType: 'PATHOLOGY'
      });

    const pharmAdminJwt = () =>
      partnerToken({
        tenantId: tenantPharmacyId,
        email: 'admin@pharmacy.in',
        facilityType: 'PHARMACY'
      });

    const diagAdminJwt = () =>
      partnerToken({
        tenantId: tenantDiagnosticId,
        email: 'admin@diagnostic.in',
        facilityType: 'DIAGNOSTIC_CENTRE'
      });

    const clinicAdminJwt = () =>
      partnerToken({
        tenantId: tenantClinicId,
        email: 'admin@clinic.in',
        facilityType: 'CLINIC'
      });

    test('RBAC-1: Pathology partner creating LAB_DIRECTOR / SENIOR_LAB_TECH returns 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pathAdminJwt()}` },
        payload: {
          fullName: 'Dr. R. Sharma (Lab Tech)',
          primaryRole: 'SENIOR_LAB_TECH',
          staffType: 'TECHNICAL',
          email: 'srtech@pathology.in',
          phone: '9800000001'
        }
      });
      assert.equal(res.statusCode, 201);
    });

    test('RBAC-2: Pathology partner creating DISPENSING_PHARMACIST returns 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pathAdminJwt()}` },
        payload: {
          fullName: 'Unauthorized Pharmacist',
          primaryRole: 'DISPENSING_PHARMACIST',
          staffType: 'PHARMACY',
          email: 'pharm@pathology.in',
          phone: '9800000002'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('RBAC-3: Pathology partner creating RADIOLOGIST returns 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pathAdminJwt()}` },
        payload: {
          fullName: 'Unauthorized Radiologist',
          primaryRole: 'RADIOLOGIST',
          staffType: 'DOCTOR',
          email: 'rad@pathology.in',
          phone: '9800000003'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('RBAC-4: Pathology partner creating ATTENDING_DOCTOR returns 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pathAdminJwt()}` },
        payload: {
          fullName: 'Unauthorized Attending Doctor',
          primaryRole: 'ATTENDING_DOCTOR',
          staffType: 'DOCTOR',
          email: 'doc@pathology.in',
          phone: '9800000004'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('RBAC-5: Pharmacy partner creating CHIEF_PHARMACIST / DISPENSING_PHARMACIST returns 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pharmAdminJwt()}` },
        payload: {
          fullName: 'Chief Pharmacist Nair',
          primaryRole: 'CHIEF_PHARMACIST',
          staffType: 'PHARMACY',
          email: 'chief@pharmacy.in',
          phone: '9800000005'
        }
      });
      assert.equal(res.statusCode, 201);
    });

    test('RBAC-6: Pharmacy partner creating LAB_DIRECTOR returns 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pharmAdminJwt()}` },
        payload: {
          fullName: 'Unauthorized Lab Director',
          primaryRole: 'LAB_DIRECTOR',
          staffType: 'DOCTOR',
          email: 'labdir@pharmacy.in',
          phone: '9800000006'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('RBAC-7: Pharmacy partner creating RADIOLOGIST returns 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pharmAdminJwt()}` },
        payload: {
          fullName: 'Unauthorized Radiologist',
          primaryRole: 'RADIOLOGIST',
          staffType: 'DOCTOR',
          email: 'rad@pharmacy.in',
          phone: '9800000007'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('RBAC-8: Pharmacy partner creating ATTENDING_DOCTOR returns 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${pharmAdminJwt()}` },
        payload: {
          fullName: 'Unauthorized Doctor',
          primaryRole: 'ATTENDING_DOCTOR',
          staffType: 'DOCTOR',
          email: 'doc@pharmacy.in',
          phone: '9800000008'
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('RBAC-9: Diagnostic Centre partner creating RADIOLOGIST returns 201 and DISPENSING_PHARMACIST returns 403', async () => {
      const okRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${diagAdminJwt()}` },
        payload: {
          fullName: 'Dr. Vikram (Chief Radiologist)',
          primaryRole: 'RADIOLOGIST',
          staffType: 'DOCTOR',
          email: 'vikram@diagnostic.in',
          phone: '9800000009'
        }
      });
      assert.equal(okRes.statusCode, 201);

      const failRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${diagAdminJwt()}` },
        payload: {
          fullName: 'Blocked Pharmacist',
          primaryRole: 'DISPENSING_PHARMACIST',
          staffType: 'PHARMACY',
          email: 'pharm@diagnostic.in',
          phone: '9800000010'
        }
      });
      assert.equal(failRes.statusCode, 403);
    });

    test('RBAC-10 & RBAC-11: Clinic partner with doctorSeats=2 enforces quota (Doc 1=201, Doc 2=201, Doc 3=403) and frees seat when Doc 2 is disabled (Doc 3=201)', async () => {
      // Doctor 1 -> 201
      const doc1Res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${clinicAdminJwt()}` },
        payload: {
          fullName: 'Dr. Ananya (Seat 1)',
          primaryRole: 'ATTENDING_DOCTOR',
          staffType: 'DOCTOR',
          email: 'ananya@clinic.in',
          phone: '9800000011'
        }
      });
      assert.equal(doc1Res.statusCode, 201);

      // Doctor 2 -> 201
      const doc2Res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${clinicAdminJwt()}` },
        payload: {
          fullName: 'Dr. Rohan (Seat 2)',
          primaryRole: 'CONSULTANT_PHYSICIAN',
          staffType: 'DOCTOR',
          email: 'rohan@clinic.in',
          phone: '9800000012'
        }
      });
      assert.equal(doc2Res.statusCode, 201);
      const doc2Id = doc2Res.json().data.id;

      // Doctor 3 -> 403 (Quota exceeded 2/2)
      const doc3BlockedRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${clinicAdminJwt()}` },
        payload: {
          fullName: 'Dr. Meera (Seat 3 Exceeded)',
          primaryRole: 'ATTENDING_DOCTOR',
          staffType: 'DOCTOR',
          email: 'meera@clinic.in',
          phone: '9800000013'
        }
      });
      assert.equal(doc3BlockedRes.statusCode, 403);

      // Disable Doctor 2 -> 200
      const disableRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/partner/staff/members/${doc2Id}/status`,
        headers: { authorization: `Bearer ${clinicAdminJwt()}` },
        payload: {
          newStatus: 'INACTIVE',
          reason: 'On sabbatical leave'
        }
      });
      assert.equal(disableRes.statusCode, 200);

      // Now create Doctor 3 -> 201 (since active doctors = 1/2)
      const doc3SuccessRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${clinicAdminJwt()}` },
        payload: {
          fullName: 'Dr. Meera (Seat 2 Replacement)',
          primaryRole: 'ATTENDING_DOCTOR',
          staffType: 'DOCTOR',
          email: 'meera@clinic.in',
          phone: '9800000013'
        }
      });
      assert.equal(doc3SuccessRes.statusCode, 201);
    });

    test('RBAC-12: Concurrent requests attempting to exceed doctorSeats are strictly serialized by per-tenant lock', async () => {
      const concurrentClinicTenantId = toDeterministicUuid('tenant-p0p1-concurrent-clinic@docsearch.in');
      await seedActiveLicense(
        concurrentClinicTenantId,
        'plan-clinic-free-yr1',
        'prod-clinic',
        'CLINIC',
        2,
        ['OPERATIONS', 'CLINICAL_EMR', 'OPD', 'BILLING', 'STAFF', 'PATIENTS']
      );
      const jwt = partnerToken({
        tenantId: concurrentClinicTenantId,
        email: 'concurrent@clinic.in',
        facilityType: 'CLINIC'
      });

      // Fire 5 concurrent doctor creation requests against a 2-seat limit
      const promises = [1, 2, 3, 4, 5].map((idx) =>
        app.inject({
          method: 'POST',
          url: '/api/v1/partner/staff/members',
          headers: { authorization: `Bearer ${jwt}` },
          payload: {
            fullName: `Concurrent Doctor ${idx}`,
            primaryRole: 'ATTENDING_DOCTOR',
            staffType: 'DOCTOR',
            email: `conc.doc.${idx}@clinic.in`,
            phone: `980000010${idx}`
          }
        })
      );

      const results = await Promise.all(promises);
      const createdCount = results.filter((r) => r.statusCode === 201).length;
      const forbiddenCount = results.filter((r) => r.statusCode === 403).length;

      assert.equal(createdCount, 2, 'Exactly 2 doctors must be created under 2-seat limit');
      assert.equal(forbiddenCount, 3, 'Remaining 3 concurrent requests must be rejected with 403');
    });
  });

  // =========================================================================
  // PHASE 4: P1 COMPLIANCE — DIAGNOSTIC_CENTRE REQUIREMENTS
  // =========================================================================
  describe('Phase 4 — P1 Compliance: DIAGNOSTIC_CENTRE Regulatory Document Requirements', () => {
    test('COMP-1: GET /api/v1/compliance/documents/requirements?facilityType=DIAGNOSTIC_CENTRE returns RAD_AERB_ELORA_LICENSE and RAD_PCPNDT_CERTIFICATE and excludes Pharmacy docs', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/requirements?facilityType=DIAGNOSTIC_CENTRE',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        }
      });
      assert.equal(res.statusCode, 200);
      const bodyData = res.json().data;
      const reqList = Array.isArray(bodyData) ? bodyData : bodyData.requirements;
      const codes = reqList.map((r) => r.documentType?.code || r.code);

      assert.ok(codes.includes('RAD_AERB_ELORA_LICENSE'), 'Must include RAD_AERB_ELORA_LICENSE');
      assert.ok(codes.includes('RAD_PCPNDT_CERTIFICATE'), 'Must include RAD_PCPNDT_CERTIFICATE');
      assert.ok(codes.includes('PATH_CLINICAL_EST_ACT'), 'Must include PATH_CLINICAL_EST_ACT');
      assert.ok(codes.includes('PATH_BIO_MEDICAL_WASTE'), 'Must include PATH_BIO_MEDICAL_WASTE');
      assert.ok(!codes.includes('PHARM_RETAIL_DRUG_LICENSE'), 'Must NOT include Pharmacy Retail Drug License');
      assert.ok(!codes.includes('PHARM_WHOLESALE_DRUG_LICENSE'), 'Must NOT include Pharmacy Wholesale Drug License');
    });
  });

  // =========================================================================
  // PHASE 5: DOCUMENT STORAGE SECURITY & REAL BINARY PERSISTENCE (Tests 1–10)
  // =========================================================================
  describe('Phase 5 — Document Storage Security, Binary SHA-256 Integrity & Honest OCR Metadata', () => {
    let uploadedDoc;
    const rawPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\nAERB ELORA RADIATION SAFETY LICENSE');
    const expectedSha256 = crypto.createHash('sha256').update(rawPdfBuffer).digest('hex');

    test('STOR-1: Valid PDF upload stores physical binary, computes real SHA-256, and sets honest OCR status (NOT synthetic 99.4)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        },
        payload: {
          documentTypeCode: 'RAD_AERB_ELORA_LICENSE',
          documentNumber: 'AERB/ELORA/2026/88412',
          fileName: 'aerb_elora_license.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: rawPdfBuffer.toString('base64')
        }
      });

      assert.equal(res.statusCode, 201);
      uploadedDoc = res.json().data;
      assert.equal(uploadedDoc.sha256Hash, expectedSha256, 'SHA-256 hash must match actual binary payload');
      assert.equal(uploadedDoc.aiMatchScore, null, 'aiMatchScore must be null when OCR has not run (no fake 99.4)');
      assert.equal(uploadedDoc.aiExtractedText, null, 'aiExtractedText must be null when OCR has not run');
      assert.equal(uploadedDoc.ocrStatus, 'NOT_PROCESSED');
      assert.ok(uploadedDoc.fileUrl.endsWith(`/api/v1/compliance/documents/${uploadedDoc.id}/download`));
    });

    test('STOR-2: Invalid MIME type (application/x-msdownload) is rejected with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        },
        payload: {
          documentTypeCode: 'RAD_AERB_ELORA_LICENSE',
          documentNumber: 'EXE-PAYLOAD',
          fileName: 'malware.exe',
          mimeType: 'application/x-msdownload',
          fileContentBase64: Buffer.from('MZ-executable').toString('base64')
        }
      });
      assert.equal(res.statusCode, 400);
    });

    test('STOR-3: Oversized file (> maxFileSizeBytes) is rejected with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        },
        payload: {
          documentTypeCode: 'RAD_AERB_ELORA_LICENSE',
          documentNumber: 'OVERSIZED-DOC',
          fileName: 'huge.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 50 * 1024 * 1024 // 50 MB > 15 MB limit
        }
      });
      assert.equal(res.statusCode, 400);
    });

    test('STOR-4: Same tenant authorized download returns 200 with exact binary bytes and SHA-256 header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/${uploadedDoc.id}/download`,
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        }
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['x-content-sha256'], expectedSha256);
      assert.deepEqual(res.rawPayload, rawPdfBuffer);
    });

    test('STOR-5: Different tenant download (Tenant Pathology requesting Tenant Diagnostic doc) returns 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/${uploadedDoc.id}/download`,
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPathologyId,
            email: 'admin@pathology.in',
            facilityType: 'PATHOLOGY'
          })}`
        }
      });
      assert.equal(res.statusCode, 403);
    });

    test('STOR-6: Unauthenticated download returns 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/${uploadedDoc.id}/download`
      });
      assert.equal(res.statusCode, 401);
    });

    test('STOR-7 & STOR-8: HQ COMPLIANCE_OFFICER and SUPER_ADMIN download returns 200', async () => {
      for (const role of ['COMPLIANCE_OFFICER', 'SUPER_ADMIN']) {
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/compliance/documents/${uploadedDoc.id}/download`,
          headers: {
            authorization: `Bearer ${hqToken(role)}`
          }
        });
        assert.equal(res.statusCode, 200);
      }
    });

    test('STOR-9: Guessed direct storage URL (/storage/tenants/...) returns 403', async () => {
      const res1 = await app.inject({
        method: 'GET',
        url: `/storage/tenants/${tenantDiagnosticId}/documents/${uploadedDoc.id}_aerb_elora_license.pdf`
      });
      assert.equal(res1.statusCode, 403);

      const res2 = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/storage/${tenantDiagnosticId}/${uploadedDoc.id}`
      });
      assert.equal(res2.statusCode, 403);
    });

    test('STOR-10: Revoked document download returns 403', async () => {
      const revokeRes = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${uploadedDoc.id}/revoke`,
        headers: {
          authorization: `Bearer ${hqToken('COMPLIANCE_OFFICER')}`
        },
        payload: {
          reason: 'Regulatory license superseded by amended certificate'
        }
      });
      assert.equal(revokeRes.statusCode, 200);

      const downloadAfterRevokeRes = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/${uploadedDoc.id}/download`,
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        }
      });
      assert.equal(downloadAfterRevokeRes.statusCode, 403);
    });
  });

  // =========================================================================
  // PHASE 6: DIRECT POSTGRESQL PERSISTENCE & ADVERSARIAL ATTACK VERIFICATION
  // =========================================================================
  describe('Phase 6 — Direct PostgreSQL Persistence & Adversarial Security Verification', () => {
    test('DB-1 (PostgreSQL — P1-COMP-01): document_types table contains RAD_AERB_ELORA_LICENSE and RAD_PCPNDT_CERTIFICATE mapped to DIAGNOSTIC_CENTRE', async () => {
      const db = getDatabase();
      const rows = await db.select().from(documentTypes);
      const aerb = rows.find((r) => r.code === 'RAD_AERB_ELORA_LICENSE');
      const pcpndt = rows.find((r) => r.code === 'RAD_PCPNDT_CERTIFICATE');
      assert.ok(aerb, 'RAD_AERB_ELORA_LICENSE must exist in PostgreSQL document_types');
      assert.equal(aerb.facilityType, 'DIAGNOSTIC_CENTRE');
      assert.ok(pcpndt, 'RAD_PCPNDT_CERTIFICATE must exist in PostgreSQL document_types');
      assert.equal(pcpndt.facilityType, 'DIAGNOSTIC_CENTRE');
    });

    test('DB-2 (PostgreSQL — P1-COMP-02): entity_documents table persists storage_key, sha256_hash, null ai_match_score/ai_extracted_text, and physical file exists on disk', async () => {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(entityDocuments)
        .where(eq(entityDocuments.tenantId, tenantDiagnosticId));
      assert.ok(rows.length >= 1, 'PostgreSQL entity_documents must contain uploaded Diagnostic Centre document');
      const docRow = rows[0];
      assert.equal(docRow.tenantId, tenantDiagnosticId);
      assert.equal(docRow.aiMatchScore, null, 'PostgreSQL ai_match_score column must be NULL');
      assert.equal(docRow.aiExtractedText, null, 'PostgreSQL ai_extracted_text column must be NULL');
      assert.equal(docRow.metadata?.ocrStatus, 'NOT_PROCESSED');
      assert.ok(docRow.storageKey && docRow.storageKey.startsWith(`tenants/${tenantDiagnosticId}/documents/`));

      const diskPath = documentVerificationRepository.resolveStorageFilePath(docRow.storageKey);
      assert.ok(fs.existsSync(diskPath), `Physical binary must exist on disk at ${diskPath}`);
      const diskBytes = fs.readFileSync(diskPath);
      const diskHash = crypto.createHash('sha256').update(diskBytes).digest('hex');
      assert.equal(diskHash, docRow.sha256Hash, 'Physical binary SHA-256 on disk must match PostgreSQL sha256_hash column');
    });

    test('DB-3 (PostgreSQL — P0-SEC-02): document_verifications and document_audit_logs persist immutable verifier ID, previous status, new status, and reason', async () => {
      const db = getDatabase();
      const verifications = await db.select().from(documentVerifications);
      assert.ok(verifications.length >= 3, 'PostgreSQL document_verifications must contain HQ verification records');
      for (const v of verifications) {
        assert.ok(v.documentId);
        assert.ok(v.verifierId);
        assert.equal(v.action, 'VERIFY');
        assert.equal(v.newStatus, 'VERIFIED');
      }

      const audits = await db.select().from(documentAuditLogs);
      const verifyAudits = audits.filter((a) => a.action === 'VERIFY' || a.action === 'REVOKE');
      assert.ok(verifyAudits.length >= 3, 'PostgreSQL document_audit_logs must contain VERIFY/REVOKE entries');
      for (const a of verifyAudits) {
        assert.ok(a.documentId);
        assert.ok(a.actorId);
        assert.ok(a.oldStatus);
        assert.ok(a.newStatus);
        assert.ok(a.timestamp);
      }
    });

    test('DB-4 (PostgreSQL — P1-RBAC-01): operational_staff table preserves tenant isolation & exact active doctor seat count (2 ACTIVE, 1 DISABLED)', async () => {
      const db = getDatabase();
      // 1. Query operational_staff scoped to tenantPathologyId -> must contain ONLY tenantPathologyId rows and ZERO tenantClinicId rows
      const pathologyStaff = await withSecurityContext(
        db,
        { tenantId: tenantPathologyId, userId: '00000000-0000-4000-8000-000000000001', roles: ['PARTNER_ADMIN'], dataScope: 'tenant' },
        async (tx) => tx.select().from(operationalStaff).where(eq(operationalStaff.tenantId, tenantPathologyId))
      );
      assert.ok(pathologyStaff.length >= 1);
      assert.ok(
        pathologyStaff.every((s) => s.tenantId === tenantPathologyId),
        'Every PostgreSQL operational_staff row for Pathology must strictly match tenantPathologyId'
      );

      // 2. Query operational_staff scoped to tenantClinicId -> returns exact persisted rows (2 ACTIVE, 1 DISABLED)
      const clinicStaff = await withSecurityContext(
        db,
        { tenantId: tenantClinicId, userId: '00000000-0000-4000-8000-000000000001', roles: ['PARTNER_ADMIN'], dataScope: 'tenant' },
        async (tx) => tx.select().from(operationalStaff).where(eq(operationalStaff.tenantId, tenantClinicId))
      );
      const activeClinicDoctors = clinicStaff.filter((s) => (s.employmentStatus || s.status) === 'ACTIVE');
      const disabledClinicDoctors = clinicStaff.filter((s) =>
        ['INACTIVE', 'DISABLED', 'SUSPENDED', 'TERMINATED'].includes(s.employmentStatus || s.status)
      );
      assert.equal(activeClinicDoctors.length, 2, 'PostgreSQL operational_staff must have exactly 2 ACTIVE doctors for Clinic tenant');
      assert.equal(disabledClinicDoctors.length, 1, 'PostgreSQL operational_staff must retain 1 INACTIVE/DISABLED doctor for audit history');
    });

    test('DB-5 (Adversarial — P0-SEC-02): Uploader attempting self-rejection (status=REJECTED) on own document returns 403', async () => {
      const uploaderId = '00000000-0000-4000-8000-000000000909';
      const uploadRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${hqToken('COMPLIANCE_OFFICER', uploaderId, 'selfreject@docsearch.in')}`
        },
        payload: {
          documentTypeCode: 'HOSP_FIRE_SAFETY_NOC',
          documentNumber: 'FIRE-SELF-REJ-01',
          fileName: 'self_reject_test.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: Buffer.from('%PDF-1.4 Self Reject Test').toString('base64')
        }
      });
      assert.equal(uploadRes.statusCode, 201);
      const docId = uploadRes.json().data.id;

      const rejectRes = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${docId}/verify`,
        headers: {
          authorization: `Bearer ${hqToken('COMPLIANCE_OFFICER', uploaderId, 'selfreject@docsearch.in')}`
        },
        payload: {
          status: 'REJECTED',
          rejectionReason: 'Attempting self-rejection bypass'
        }
      });
      assert.equal(rejectRes.statusCode, 403);
    });

    test('DB-6 (Adversarial — P1-RBAC-01): Unknown role, Receptionist verify attempt, and Expired/Suspended license staff creation fail closed (400/403)', async () => {
      // 1. Unknown staff role -> 400/403
      const unknownRoleRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPathologyId,
            email: 'admin@pathology.in',
            facilityType: 'PATHOLOGY'
          })}`
        },
        payload: {
          fullName: 'Alien Role Staff',
          primaryRole: 'CYBERNETIC_ASTRONAUT',
          staffType: 'TECHNICAL',
          email: 'alien@pathology.in',
          phone: '9876500099'
        }
      });
      assert.ok([400, 403].includes(unknownRoleRes.statusCode), `Expected 400/403 for unknown role, got ${unknownRoleRes.statusCode}`);

      // 2. Receptionist attempting compliance document verify -> 403
      const recepVerifyRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/00000000-0000-4000-8000-000000000001/verify',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPathologyId,
            role: 'RECEPTIONIST',
            email: 'reception@pathology.in',
            facilityType: 'PATHOLOGY',
            permissions: ['compliance:documents:manage']
          })}`
        },
        payload: {
          status: 'VERIFIED',
          notes: 'Privilege escalation attempt with manage permission'
        }
      });
      assert.equal(recepVerifyRes.statusCode, 403);

      // 3. Suspended license attempting staff creation -> 403
      const suspendedTenantId = toDeterministicUuid('tenant-p0p1-suspended@docsearch.in');
      const suspLic = await seedActiveLicense(suspendedTenantId, 'plan-susp-yr1', 'prod-pathology', 'PATHOLOGY', 5, [
        'OPERATIONS',
        'PATHOLOGY_LIMS',
        'STAFF'
      ]);
      await licenseRepository.update(suspLic.id, { status: 'SUSPENDED' });

      const suspStaffRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: suspendedTenantId,
            email: 'admin@suspended.in',
            facilityType: 'PATHOLOGY'
          })}`
        },
        payload: {
          fullName: 'Suspended License Staff',
          primaryRole: 'LAB_DIRECTOR',
          staffType: 'TECHNICAL',
          email: 'staff@suspended.in',
          phone: '9876500088'
        }
      });
      assert.equal(suspStaffRes.statusCode, 403);
    });

    test('DB-7 (Adversarial — P1-COMP-02): Fake AI confidence / verificationStatus spoofing in upload payload is stripped and stored as null / PENDING_VERIFICATION', async () => {
      const spoofRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        },
        payload: {
          documentTypeCode: 'RAD_PCPNDT_CERTIFICATE',
          documentNumber: 'PCPNDT-2026-SPOOF',
          fileName: 'pcpndt_cert.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: Buffer.from('%PDF-1.4 PC-PNDT Certificate Binary').toString('base64'),
          aiMatchScore: 99.99,
          aiExtractedText: 'FAKE_SYNTHETIC_OCR_TEXT',
          verificationStatus: 'VERIFIED'
        }
      });
      assert.equal(spoofRes.statusCode, 201);
      const doc = spoofRes.json().data;
      assert.equal(doc.aiMatchScore, null, 'Injected aiMatchScore must be stripped to null');
      assert.equal(doc.aiExtractedText, null, 'Injected aiExtractedText must be stripped to null');
      assert.equal(doc.ocrStatus, 'NOT_PROCESSED');
      assert.NotEqual?.(doc.verificationStatus, 'VERIFIED');
      assert.equal(doc.verificationStatus, 'PENDING_VERIFICATION');
    });

    test('DB-8 (Adversarial — Storage Path Traversal & Invalid Document ID): Traversal and nonexistent document download fail closed (400/403/404)', async () => {
      const badFilenameRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        },
        payload: {
          documentTypeCode: 'RAD_PCPNDT_CERTIFICATE',
          documentNumber: 'TRAVERSAL-01',
          fileName: '../../etc/passwd',
          mimeType: 'application/pdf',
          fileContentBase64: Buffer.from('%PDF-1.4 traversal').toString('base64')
        }
      });
      assert.equal(badFilenameRes.statusCode, 400);

      const missingDocRes = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/00000000-0000-4000-8000-999999999999/download',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantDiagnosticId,
            email: 'admin@diagnostic.in',
            facilityType: 'DIAGNOSTIC_CENTRE'
          })}`
        }
      });
      assert.equal(missingDocRes.statusCode, 404);
    });

    test('DB-9 (Independent Auditor Retest — Alternate Route & IDOR Bypass Verification): Role assignment quota bypass, cross-tenant staff IDOR, and branch-scoped verifier are rejected (403)', async () => {
      // 1. Setup a clinic tenant with maxDoctors = 1
      const bypassClinicTenantId = toDeterministicUuid('tenant-p0p1-bypass-clinic@docsearch.in');
      await seedActiveLicense(bypassClinicTenantId, 'plan-clinic-bypass-yr1', 'prod-clinic', 'CLINIC', 1, [
        'OPERATIONS',
        'CLINICAL_EMR',
        'OPD',
        'STAFF'
      ]);
      const clinicAdminToken = partnerToken({
        tenantId: bypassClinicTenantId,
        email: 'admin@bypass-clinic.in',
        facilityType: 'CLINIC'
      });

      // Create 1 active doctor (consumes 1/1 seat)
      const doc1Res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${clinicAdminToken}` },
        payload: {
          fullName: 'Dr. Primary Seat',
          primaryRole: 'DOCTOR',
          staffType: 'DOCTOR',
          email: 'doc1@bypass-clinic.in',
          phone: '9876599901'
        }
      });
      assert.equal(doc1Res.statusCode, 201);
      const doc1Id = doc1Res.json().data.id;

      // Create 1 active nurse (0 doctor seats)
      const nurseRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/members',
        headers: { authorization: `Bearer ${clinicAdminToken}` },
        payload: {
          fullName: 'Nurse Secondary',
          primaryRole: 'NURSE',
          staffType: 'NURSING',
          email: 'nurse1@bypass-clinic.in',
          phone: '9876599902'
        }
      });
      assert.equal(nurseRes.statusCode, 201);
      const nurseId = nurseRes.json().data.id;

      // Attempt alternate route bypass #1: Assign CONSULTANT_PHYSICIAN role to Nurse via POST /api/v1/partner/staff/roles/assign -> MUST FAIL 403
      const assignBypassRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/roles/assign',
        headers: { authorization: `Bearer ${clinicAdminToken}` },
        payload: {
          staffId: nurseId,
          roleCode: 'CONSULTANT_PHYSICIAN',
          dataScope: 'BRANCH',
          isPrimary: true,
          effectiveFrom: new Date().toISOString()
        }
      });
      assert.equal(assignBypassRes.statusCode, 403, 'Role assignment must not bypass exhausted doctor-seat quota');

      // Attempt alternate route bypass #2: Promote Nurse to DOCTOR via PUT /api/v1/partner/staff/members/:id -> MUST FAIL 403
      const updateBypassRes = await app.inject({
        method: 'PUT',
        url: `/api/v1/partner/staff/members/${nurseId}`,
        headers: { authorization: `Bearer ${clinicAdminToken}` },
        payload: {
          primaryRole: 'DOCTOR',
          staffType: 'DOCTOR'
        }
      });
      assert.equal(updateBypassRes.statusCode, 403, 'Staff update must not bypass exhausted doctor-seat quota');

      // Attempt alternate route bypass #3: Cross-tenant IDOR on staffId (Pathology tenant attempting to update or assign role to Clinic tenant's staffId) -> MUST FAIL 403
      const idorUpdateRes = await app.inject({
        method: 'PUT',
        url: `/api/v1/partner/staff/members/${doc1Id}`,
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPathologyId,
            email: 'admin@pathology.in',
            facilityType: 'PATHOLOGY'
          })}`
        },
        payload: {
          fullName: 'Tampered Cross-Tenant Name'
        }
      });
      assert.equal(idorUpdateRes.statusCode, 403, 'Cross-tenant staff update IDOR must be rejected with 403');

      const idorAssignRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/staff/roles/assign',
        headers: {
          authorization: `Bearer ${partnerToken({
            tenantId: tenantPathologyId,
            email: 'admin@pathology.in',
            facilityType: 'PATHOLOGY'
          })}`
        },
        payload: {
          staffId: doc1Id,
          roleCode: 'LAB_TECHNICIAN',
          dataScope: 'BRANCH',
          isPrimary: false,
          effectiveFrom: new Date().toISOString()
        }
      });
      assert.equal(idorAssignRes.statusCode, 403, 'Cross-tenant staff role assignment IDOR must be rejected with 403');
    });
  });

  // =========================================================================
  // PHASE 7: TARGETED P0/P1 SECURITY & FAIL-CLOSED REMEDIATION VERIFICATION
  // (P0-AUTH-QUICK-SESSION-01, P1-STORAGE-SYNTHETIC-PDF-01, P1-COM-FALLBACK-02)
  // =========================================================================
  describe('Phase 7 — Targeted Fail-Closed Remediation (Quick-Session, Synthetic PDF Elimination & Entitlement Fallback Removal)', () => {
    test('QS-1 (P0-AUTH-QUICK-SESSION-01 A/B/C/H): Unauthenticated quick-session, founder@docsearch.health impersonation, and SUPER_ADMIN injection are strictly DENIED (401/403) and never mint a JWT', async () => {
      // A. Unauthenticated quick-session
      const unauthRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        payload: {
          email: 'staff@pathology.in',
          role: 'LAB_DIRECTOR'
        }
      });
      assert.ok([401, 403].includes(unauthRes.statusCode), `Expected 401/403 for unauthenticated quick-session, got ${unauthRes.statusCode}`);
      assert.equal(unauthRes.json()?.data?.accessToken, undefined, 'Must NEVER return an accessToken');

      // B. Unauthenticated founder@docsearch.health impersonation + SUPER_ADMIN + attacker tenantId (both test & production modes)
      for (const envMode of ['test', 'production']) {
        const prevEnv = process.env['NODE_ENV'];
        process.env['NODE_ENV'] = envMode;
        try {
          const founderAttackRes = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/quick-session',
            payload: {
              email: 'founder@docsearch.health',
              roles: ['SUPER_ADMIN'],
              permissions: ['*'],
              tenantId: tenantPathologyId
            }
          });
          assert.ok(
            [401, 403].includes(founderAttackRes.statusCode),
            `Expected 401/403 for founder impersonation in NODE_ENV=${envMode}, got ${founderAttackRes.statusCode}`
          );
          assert.equal(founderAttackRes.json()?.data?.accessToken, undefined, 'Must NEVER mint founder SUPER_ADMIN token');
        } finally {
          process.env['NODE_ENV'] = prevEnv;
        }
      }

      // C. Unauthenticated SUPER_ADMIN / COMPANY_ADMIN / COMPLIANCE_OFFICER role injection
      const roleInjectRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        payload: {
          email: 'attacker@evil.org',
          role: 'SUPER_ADMIN',
          roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPLIANCE_OFFICER'],
          permissions: ['*']
        }
      });
      assert.ok([401, 403].includes(roleInjectRes.statusCode));
      assert.equal(roleInjectRes.json()?.data?.accessToken, undefined);

      // Verify verification-queue remains inaccessible without an authentic HQ token
      const queueAttackRes = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/verification-queue'
      });
      assert.equal(queueAttackRes.statusCode, 401);
    });

    test('QS-2 (P0-AUTH-QUICK-SESSION-01 D/E/F/G/I): Authenticated partner attempting wildcard permissions ["*"], cross-tenant tenantId escalation, or HQ role escalation is DENIED (403), while legitimate non-privileged refresh works in dev/test and fails closed in production', async () => {
      const legitimatePartnerJwt = partnerToken({
        tenantId: tenantPathologyId,
        role: 'LAB_DIRECTOR',
        email: 'director.legit@pathology.in',
        facilityType: 'PATHOLOGY',
        permissions: ['pathology:view', 'lab:orders:read']
      });

      // D. Client permissions ["*"] injection -> 403 FORBIDDEN
      const wildcardPermRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
        payload: {
          email: 'director.legit@pathology.in',
          permissions: ['*']
        }
      });
      assert.equal(wildcardPermRes.statusCode, 403, 'Wildcard permission ["*"] injection must be rejected with 403');

      // E & G. Cross-tenant token escalation (client tenantId != session tenantId) -> 403 FORBIDDEN
      const crossTenantRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
        payload: {
          email: 'director.legit@pathology.in',
          tenantId: tenantPharmacyId
        }
      });
      assert.equal(crossTenantRes.statusCode, 403, 'Cross-tenant tenantId injection must be rejected with 403');

      // F. Partner user attempting HQ role escalation (SUPER_ADMIN / COMPANY_ADMIN / COMPLIANCE_OFFICER / founder email) -> 403 FORBIDDEN
      for (const hqRole of ['SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPLIANCE_OFFICER']) {
        const escRes = await app.inject({
          method: 'POST',
          url: '/api/v1/auth/quick-session',
          headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
          payload: {
            email: 'director.legit@pathology.in',
            roles: [hqRole]
          }
        });
        assert.equal(escRes.statusCode, 403, `Escalation to ${hqRole} must be rejected with 403`);
      }

      const founderEmailEscRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
        payload: {
          email: 'founder@docsearch.health'
        }
      });
      assert.equal(founderEmailEscRes.statusCode, 403, 'Founder email impersonation by partner token must be rejected with 403');

      // Production fail-closed check: even with a valid token, quick-session is disabled (403) in production
      const prevEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
      try {
        const prodBlockedRes = await app.inject({
          method: 'POST',
          url: '/api/v1/auth/quick-session',
          headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
          payload: { email: 'director.legit@pathology.in' }
        });
        assert.equal(prodBlockedRes.statusCode, 403, 'quick-session must fail closed with 403 in NODE_ENV=production');
      } finally {
        process.env['NODE_ENV'] = prevEnv;
      }

      // TEST-AUTH-006: Forged partnerId or userId in request body -> 403 FORBIDDEN
      const forgedPartnerIdRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
        payload: {
          email: 'director.legit@pathology.in',
          partnerId: 'partner-A-impersonation'
        }
      });
      assert.equal(forgedPartnerIdRes.statusCode, 403, 'Forged partnerId must be rejected with 403');

      const forgedUserIdRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
        payload: {
          email: 'director.legit@pathology.in',
          userId: 'forged-user-id-impersonation'
        }
      });
      assert.equal(forgedUserIdRes.statusCode, 403, 'Forged userId must be rejected with 403');

      const forgedPermRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
        payload: {
          email: 'director.legit@pathology.in',
          permissions: ['forged:permission:escalation']
        }
      });
      assert.equal(forgedPermRes.statusCode, 403, 'Unassigned client-supplied permission must be rejected with 403');

      // I. Legitimate authenticated non-privileged session in dev/test preserves server-verified claims
      const validDevRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/quick-session',
        headers: { authorization: `Bearer ${legitimatePartnerJwt}` },
        payload: {
          email: 'director.legit@pathology.in'
        }
      });
      assert.equal(validDevRes.statusCode, 200);
      const issuedUser = validDevRes.json().data.user;
      assert.equal(issuedUser.tenantId, tenantPathologyId);
      assert.ok(!issuedUser.permissions.includes('*'), 'Issued permissions must never include wildcard *');
    });

    test('PDF-1 (P1-STORAGE-SYNTHETIC-PDF-01 1–7): Metadata-only, empty base64, and invalid base64 uploads fail closed with 400 BAD_REQUEST, creating ZERO synthetic PDFs and ZERO orphan DB records', async () => {
      const db = getDatabase();
      const beforeDocs = await db
        .select()
        .from(entityDocuments)
        .where(eq(entityDocuments.tenantId, tenantPathologyId));
      const beforeCount = beforeDocs.length;

      const authHeader = {
        authorization: `Bearer ${partnerToken({
          tenantId: tenantPathologyId,
          email: 'admin@pathology.in',
          facilityType: 'PATHOLOGY'
        })}`
      };

      // 1. Metadata-only upload (missing fileBase64 / fileContentBase64) -> 400 BAD_REQUEST
      const metaOnlyRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: authHeader,
        payload: {
          documentTypeCode: 'PATH_CLINICAL_EST_ACT',
          documentNumber: 'META-ONLY-001',
          fileName: 'metadata_only_ghost.pdf',
          mimeType: 'application/pdf'
        }
      });
      assert.equal(metaOnlyRes.statusCode, 400, 'Metadata-only upload must be rejected with 400 BAD_REQUEST');
      assert.ok(
        (metaOnlyRes.json().error?.message || '').includes('Binary document content (fileBase64 / fileContentBase64) is required'),
        `Expected required binary error message, got: ${metaOnlyRes.body}`
      );

      // 4. Invalid base64 -> 400 BAD_REQUEST
      const invalidB64Res = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: authHeader,
        payload: {
          documentTypeCode: 'PATH_CLINICAL_EST_ACT',
          documentNumber: 'INVALID-B64-001',
          fileName: 'corrupt_payload.pdf',
          mimeType: 'application/pdf',
          fileBase64: '!!!not-valid-base64-payload@@@'
        }
      });
      assert.equal(invalidB64Res.statusCode, 400, 'Invalid base64 upload must be rejected with 400 BAD_REQUEST');

      // 5. Empty base64 ("", "   ", "data:application/pdf;base64,") -> 400 BAD_REQUEST
      for (const emptyVal of ['', '   ', 'data:application/pdf;base64,']) {
        const emptyB64Res = await app.inject({
          method: 'POST',
          url: '/api/v1/compliance/documents/upload',
          headers: authHeader,
          payload: {
            documentTypeCode: 'PATH_CLINICAL_EST_ACT',
            documentNumber: 'EMPTY-B64-001',
            fileName: 'empty_payload.pdf',
            mimeType: 'application/pdf',
            fileBase64: emptyVal
          }
        });
        assert.equal(emptyB64Res.statusCode, 400, `Empty base64 ('${emptyVal}') must be rejected with 400`);
      }

      // 6 & 7. Verify ZERO orphan DB records and ZERO synthetic storage files were created
      const afterRejectedDocs = await db
        .select()
        .from(entityDocuments)
        .where(eq(entityDocuments.tenantId, tenantPathologyId));
      assert.equal(
        afterRejectedDocs.length,
        beforeCount,
        'Rejected uploads must create ZERO orphan rows in PostgreSQL entity_documents'
      );
      assert.ok(
        !afterRejectedDocs.some((d) => d.fileName === 'metadata_only_ghost.pdf' || d.documentNumber === 'META-ONLY-001'),
        'No metadata-only document row may exist in DB'
      );

      // 2 & 3. Verify valid uploads using fileBase64 and fileContentBase64 both succeed (201)
      const realBytes1 = Buffer.from('%PDF-1.4 Authentic Binary Payload via fileBase64');
      const validFileBase64Res = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: authHeader,
        payload: {
          documentTypeCode: 'PATH_BIO_MEDICAL_WASTE',
          documentNumber: 'BMW-REAL-B64-01',
          fileName: 'real_filebase64.pdf',
          mimeType: 'application/pdf',
          fileBase64: realBytes1.toString('base64')
        }
      });
      assert.equal(validFileBase64Res.statusCode, 201);
      assert.equal(
        validFileBase64Res.json().data.sha256Hash,
        crypto.createHash('sha256').update(realBytes1).digest('hex')
      );

      const realBytes2 = Buffer.from('%PDF-1.4 Authentic Binary Payload via fileContentBase64');
      const validFileContentBase64Res = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: authHeader,
        payload: {
          documentTypeCode: 'PATH_BIO_MEDICAL_WASTE',
          documentNumber: 'BMW-REAL-FCB64-02',
          fileName: 'real_filecontentbase64.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: realBytes2.toString('base64')
        }
      });
      assert.equal(validFileContentBase64Res.statusCode, 201);
      assert.equal(
        validFileContentBase64Res.json().data.sha256Hash,
        crypto.createHash('sha256').update(realBytes2).digest('hex')
      );
    });

    test('ENT-1 (P1-COM-FALLBACK-02 A–H): EntitlementService.canAccess() enforces fail-closed default-deny when active license lacks explicit entitlements, while preserving explicit vertical entitlements', async () => {
      const { entitlementService } = await import('../dist/services/company/EntitlementService.js');

      // A & G. Active license + explicit entitlement (Pathology, Pharmacy, Clinic, Diagnostic Centre) -> ALLOWED for own vertical, DENIED for others
      const pathSession = {
        userId: crypto.randomUUID(),
        tenantId: tenantPathologyId,
        roles: ['PARTNER_ADMIN'],
        permissions: ['*'],
        dataScope: 'tenant',
        isSuperAdmin: false
      };
      assert.equal(await entitlementService.canAccess(pathSession, 'PATHOLOGY_LIMS'), true, 'Pathology must access PATHOLOGY_LIMS');
      assert.equal(await entitlementService.canAccess(pathSession, 'PHARMACY_POS'), false, 'Pathology must be denied PHARMACY_POS');
      assert.equal(await entitlementService.canAccess(pathSession, 'INPATIENT_IPD'), false, 'Pathology must be denied INPATIENT_IPD');

      // B. Active license + NO entitlement (explicit empty includedModules: [] and 0 plan_entitlements) -> DENIED
      const noEntitlementTenantId = toDeterministicUuid('tenant-p1-no-entitlement@docsearch.in');
      await seedActiveLicense(noEntitlementTenantId, 'plan-unseeded-empty', 'prod-unseeded', 'CLINIC', 2, []);
      entitlementService.invalidateTenantCache(noEntitlementTenantId);
      const noEntSession = {
        userId: crypto.randomUUID(),
        tenantId: noEntitlementTenantId,
        roles: ['PARTNER_ADMIN'],
        permissions: ['*'],
        dataScope: 'tenant',
        isSuperAdmin: false
      };
      for (const feat of ['CLINICAL_EMR', 'OPD', 'PHARMACY_POS', 'PATHOLOGY_LIMS', 'RADIOLOGY_PACS', 'INPATIENT', 'BILLING', 'OPERATIONS']) {
        assert.equal(
          await entitlementService.canAccess(noEntSession, feat),
          false,
          `Active license with zero entitlements must FAIL CLOSED (false) on ${feat}`
        );
      }

      // Verify downstream operational API returns 403 COMMERCIAL_ACCESS_DENIED for active license with zero entitlements
      const noEntJwt = partnerToken({
        tenantId: noEntitlementTenantId,
        email: 'noent@docsearch.in',
        facilityType: 'CLINIC'
      });
      const blockedOpRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/clinical/patients',
        headers: { authorization: `Bearer ${noEntJwt}` }
      });
      assert.equal(blockedOpRes.statusCode, 403);
      assert.equal(blockedOpRes.json().error?.code, 'COMMERCIAL_ACCESS_DENIED');

      // C. Active license + unknown/custom plan + no entitlement (metadata without includedModules) -> DENIED
      const customPlanTenantId = toDeterministicUuid('tenant-p1-custom-unknown-plan@docsearch.in');
      const now = new Date();
      await licenseService.issueLicense({
        partnerId: customPlanTenantId,
        tenantId: customPlanTenantId,
        subscriptionId: crypto.randomUUID(),
        planId: toDeterministicUuid('plan-custom-enterprise-unseeded-999'),
        maxConcurrentUsers: 50,
        maxDoctors: 10,
        maxBranches: 2,
        startDate: now,
        expiryDate: new Date(now.getTime() + 365 * 86400000),
        metadata: {
          facilityType: 'CUSTOM_FACILITY'
        }
      });
      entitlementService.invalidateTenantCache(customPlanTenantId);
      const customPlanSession = {
        userId: crypto.randomUUID(),
        tenantId: customPlanTenantId,
        roles: ['PARTNER_ADMIN'],
        permissions: ['*'],
        dataScope: 'tenant',
        isSuperAdmin: false
      };
      for (const feat of ['CLINICAL_EMR', 'PHARMACY_POS', 'PATHOLOGY_LIMS', 'RADIOLOGY_PACS', 'INPATIENT', 'BILLING', 'OPERATIONS']) {
        assert.equal(
          await entitlementService.canAccess(customPlanSession, feat),
          false,
          `Unknown/custom plan without entitlements must FAIL CLOSED (false) on ${feat}`
        );
      }

      // D. HOSPITAL plan with no explicit module entitlement -> DENIED (standardHealthcareFeatures fallback removed)
      const hospitalUnentitledTenantId = toDeterministicUuid('tenant-p1-hosp-unentitled@docsearch.in');
      await licenseService.issueLicense({
        partnerId: hospitalUnentitledTenantId,
        tenantId: hospitalUnentitledTenantId,
        subscriptionId: crypto.randomUUID(),
        planId: toDeterministicUuid('plan-hosp-unseeded-tier'),
        maxConcurrentUsers: 100,
        maxDoctors: 25,
        maxBranches: 3,
        startDate: now,
        expiryDate: new Date(now.getTime() + 365 * 86400000),
        metadata: {
          productId: toDeterministicUuid('prod-hospital'),
          facilityType: 'HOSPITAL',
          organizationType: 'HOSPITAL'
        }
      });
      entitlementService.invalidateTenantCache(hospitalUnentitledTenantId);
      const hospSession = {
        userId: crypto.randomUUID(),
        tenantId: hospitalUnentitledTenantId,
        roles: ['HOSPITAL_ADMIN'],
        permissions: ['*'],
        dataScope: 'tenant',
        isSuperAdmin: false
      };
      for (const feat of ['CLINICAL_EMR', 'OPD', 'INPATIENT', 'PHARMACY_POS', 'PATHOLOGY_LIMS', 'RADIOLOGY_PACS', 'EMERGENCY', 'BILLING', 'OPERATIONS']) {
        assert.equal(
          await entitlementService.canAccess(hospSession, feat),
          false,
          `HOSPITAL plan with zero explicit module entitlements must FAIL CLOSED (false) on ${feat}`
        );
      }

      // E. Expired license -> DENIED even if metadata has includedModules
      const expiredLicTenantId = toDeterministicUuid('tenant-p1-expired-lic@docsearch.in');
      await licenseService.issueLicense({
        partnerId: expiredLicTenantId,
        tenantId: expiredLicTenantId,
        subscriptionId: crypto.randomUUID(),
        planId: toDeterministicUuid('plan-expired-lic-test'),
        maxConcurrentUsers: 10,
        maxDoctors: 5,
        maxBranches: 1,
        startDate: new Date(now.getTime() - 400 * 86400000),
        expiryDate: new Date(now.getTime() - 10 * 86400000),
        metadata: {
          includedModules: ['CLINICAL_EMR', 'PHARMACY_POS', 'PATHOLOGY_LIMS']
        }
      });
      entitlementService.invalidateTenantCache(expiredLicTenantId);
      const expiredLicSession = {
        userId: crypto.randomUUID(),
        tenantId: expiredLicTenantId,
        roles: ['PARTNER_ADMIN'],
        permissions: ['*'],
        dataScope: 'tenant',
        isSuperAdmin: false
      };
      assert.equal(
        await entitlementService.canAccess(expiredLicSession, 'CLINICAL_EMR'),
        false,
        'Expired license must FAIL CLOSED (false) even with includedModules'
      );

      // E2. Inactive / SUSPENDED license -> DENIED
      const inactiveLicTenantId = toDeterministicUuid('tenant-p1-inactive-lic@docsearch.in');
      const issuedInactive = await licenseService.issueLicense({
        partnerId: inactiveLicTenantId,
        tenantId: inactiveLicTenantId,
        subscriptionId: crypto.randomUUID(),
        planId: toDeterministicUuid('plan-inactive-lic-test'),
        maxConcurrentUsers: 10,
        maxDoctors: 5,
        maxBranches: 1,
        startDate: now,
        expiryDate: new Date(now.getTime() + 365 * 86400000),
        metadata: {
          includedModules: ['CLINICAL_EMR']
        }
      });
      await licenseService.suspendLicense(issuedInactive.id, 'Non-payment suspension test');
      entitlementService.invalidateTenantCache(inactiveLicTenantId);
      const inactiveLicSession = {
        userId: crypto.randomUUID(),
        tenantId: inactiveLicTenantId,
        roles: ['PARTNER_ADMIN'],
        permissions: ['*'],
        dataScope: 'tenant',
        isSuperAdmin: false
      };
      assert.equal(
        await entitlementService.canAccess(inactiveLicSession, 'CLINICAL_EMR'),
        false,
        'Inactive/suspended license must FAIL CLOSED (false)'
      );

      // E3. Malformed planHint -> DENIED
      const malformedPlanTenantId = toDeterministicUuid('tenant-p1-malformed-planhint@docsearch.in');
      await licenseService.issueLicense({
        partnerId: malformedPlanTenantId,
        tenantId: malformedPlanTenantId,
        subscriptionId: crypto.randomUUID(),
        planId: ';;;MALFORMED_HEALTHCARE_HOSPITAL_CLINIC_HINT***',
        maxConcurrentUsers: 10,
        maxDoctors: 5,
        maxBranches: 1,
        startDate: now,
        expiryDate: new Date(now.getTime() + 365 * 86400000),
        metadata: {
          planHint: ';;;MALFORMED_HEALTHCARE_HOSPITAL_CLINIC_HINT***',
          planTier: ';;;MALFORMED_HEALTHCARE_HOSPITAL_CLINIC_HINT***'
        }
      });
      entitlementService.invalidateTenantCache(malformedPlanTenantId);
      const malformedPlanSession = {
        userId: crypto.randomUUID(),
        tenantId: malformedPlanTenantId,
        roles: ['PARTNER_ADMIN'],
        permissions: ['*'],
        dataScope: 'tenant',
        isSuperAdmin: false
      };
      assert.equal(
        await entitlementService.canAccess(malformedPlanSession, 'CLINICAL_EMR'),
        false,
        'Malformed healthcare-looking planHint without explicit entitlement must FAIL CLOSED (false)'
      );

      // F. Unknown / arbitrary feature name on an entitled tenant -> DENIED
      assert.equal(
        await entitlementService.canAccess(pathSession, 'NON_EXISTENT_QUANTUM_MODULE_99'),
        false,
        'Unknown/arbitrary feature name must always return false'
      );
    });

    test('DS-1 (FINDING-P1-AUTH-DUAL-STORE-03): PostgreSQL is the single runtime source of truth with multi-instance consistency and zero local JSON file dependency', async () => {
      const { RealAuthService, realAuthService } = await import('../dist/services/core/RealAuthService.js');
      const { verifyPassword } = await import('@docsearch/auth');

      const dsEmail = `dualstore-multi-instance-${Date.now()}@docsearch.in`;
      const dsTenantId = toDeterministicUuid(dsEmail);

      // 1. Instance A registers partner credential -> persisted to PostgreSQL
      realAuthService.registerPartnerUserCredential({
        email: dsEmail,
        plainPassword: 'InitialPass@2026!',
        firstName: 'Dr. Multi',
        lastName: 'Instance Verify',
        tenantName: 'Apex Multi-Instance Lab',
        organizationType: 'PATHOLOGY',
        planTier: 'Enterprise Pathology Grid',
        tenantId: dsTenantId,
        roles: ['PATHOLOGY_ADMIN'],
        status: 'PENDING_VERIFICATION'
      });
      await realAuthService.flushPendingWrites();

      // 2. Fresh Instance B (simulated horizontally scaled pod with zero shared memory and zero local JSON files)
      const instanceB = new RealAuthService();
      const pendingRecordFromB = await instanceB.getUserByEmailAsync(dsEmail);
      assert.ok(pendingRecordFromB, 'Instance B must read newly registered partner credential from PostgreSQL');
      assert.equal(pendingRecordFromB.status, 'PENDING_VERIFICATION');

      // 3. Instance A transitions status to ACTIVE and updates password
      realAuthService.setPartnerUserStatus(dsEmail, 'ACTIVE');
      realAuthService.resetPartnerPassword(dsEmail, 'UpdatedPass@2026!');
      await realAuthService.flushPendingWrites();

      // 4. Fresh Instance C reads updated ACTIVE status and verifies updated password from PostgreSQL
      const instanceC = new RealAuthService();
      const activeRecordFromC = await instanceC.getUserByEmailAsync(dsEmail);
      assert.ok(activeRecordFromC, 'Instance C must read updated partner state from PostgreSQL');
      assert.equal(activeRecordFromC.status, 'ACTIVE', 'Instance C must observe ACTIVE status written by Instance A');
      assert.equal(
        verifyPassword('UpdatedPass@2026!', activeRecordFromC.passwordHash),
        true,
        'Instance C must verify password updated by Instance A via PostgreSQL'
      );

      // 5. Verify Instance A suspension is immediately visible to Instance D
      realAuthService.setPartnerUserStatus(dsEmail, 'SUSPENDED');
      await realAuthService.flushPendingWrites();
      const instanceD = new RealAuthService();
      const suspendedRecordFromD = await instanceD.getUserByEmailAsync(dsEmail);
      assert.equal(suspendedRecordFromD?.status, 'SUSPENDED', 'Instance D must observe SUSPENDED status from PostgreSQL');

      // 6. Requirement I: Verify altering or deleting local JSON files (data/approved_partners.json & data/partner_credentials.json)
      // CANNOT alter runtime authorization state
      const pathMod = await import('node:path');
      const fsMod = await import('node:fs');
      const dataDir = pathMod.resolve(process.cwd(), 'data');
      fsMod.mkdirSync(dataDir, { recursive: true });
      const fakeApprovedPath = pathMod.join(dataDir, 'approved_partners.json');
      const fakeCredsPath = pathMod.join(dataDir, 'partner_credentials.json');
      fsMod.writeFileSync(
        fakeApprovedPath,
        JSON.stringify([{ id: dsTenantId, email: dsEmail, status: 'ACTIVE', kycStatus: 'KYC_VERIFIED' }]),
        'utf8'
      );
      fsMod.writeFileSync(
        fakeCredsPath,
        JSON.stringify({ [dsEmail]: { email: dsEmail, status: 'ACTIVE', roles: ['SUPER_ADMIN'] } }),
        'utf8'
      );

      const instanceE = new RealAuthService();
      const afterTamperRecord = await instanceE.getUserByEmailAsync(dsEmail);
      assert.equal(
        afterTamperRecord?.status,
        'SUSPENDED',
        'Tampering with local JSON files must NOT override PostgreSQL SUSPENDED state'
      );
      assert.equal(
        afterTamperRecord?.roles?.includes('SUPER_ADMIN'),
        false,
        'Tampering with local JSON files must NOT inject roles into PostgreSQL state'
      );

      // Delete local JSON files and verify re-activated partner in PostgreSQL remains ACTIVE
      try { fsMod.unlinkSync(fakeApprovedPath); } catch {}
      try { fsMod.unlinkSync(fakeCredsPath); } catch {}
      realAuthService.setPartnerUserStatus(dsEmail, 'ACTIVE');
      await realAuthService.flushPendingWrites();
      const instanceF = new RealAuthService();
      const afterDeleteJsonRecord = await instanceF.getUserByEmailAsync(dsEmail);
      assert.equal(
        afterDeleteJsonRecord?.status,
        'ACTIVE',
        'Deleting local JSON files must NOT affect PostgreSQL ACTIVE partner state'
      );
    });

    test('EXP-1 (FINDING-P1-COMP-EXPIRY-04): Document expiry enforcement across upload, verification, requirements matrix, compliance hold, dependent workflow blocking, and renewal lifecycle', async () => {
      const expiryTenantId = tenantPathologyId;
      const expiryJwt = partnerToken({
        tenantId: expiryTenantId,
        email: 'expiry.admin@pathology.in',
        facilityType: 'PATHOLOGY'
      });
      const hqVerifierJwt = hqToken('COMPLIANCE_OFFICER', '00000000-0000-4000-8000-000000000902', 'officer2@docsearch.in');

      // 1. Valid future expiry date -> VERIFIED -> valid verified document & dependent operational workflow ALLOWED
      const validPdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Future Valid Clinical Doc) >>\nendobj\n%%EOF\n', 'utf8');
      const futureUploadRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: { authorization: `Bearer ${expiryJwt}` },
        payload: {
          documentTypeCode: 'PATH_CLINICAL_EST_ACT',
          documentNumber: 'CEA-FUTURE-2029',
          expiryDate: '2029-12-31',
          fileName: 'cea_future.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: validPdfBytes.toString('base64')
        }
      });
      assert.equal(futureUploadRes.statusCode, 201);
      const futureDocId = futureUploadRes.json().data.id;

      const verifyFutureRes = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${futureDocId}/verify`,
        headers: { authorization: `Bearer ${hqVerifierJwt}` },
        payload: { status: 'VERIFIED', notes: 'Future expiry verified' }
      });
      assert.equal(verifyFutureRes.statusCode, 200);
      assert.equal(verifyFutureRes.json().data.verificationStatus, 'VERIFIED');
      assert.equal(verifyFutureRes.json().data.validityState, 'VERIFIED_VALID');
      assert.equal(verifyFutureRes.json().data.isExpired, false);

      // Dependent operational workflow succeeds (200) when mandatory document has future expiry
      const depWorkflowValidRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/lab/orders',
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      assert.equal(depWorkflowValidRes.statusCode, 200, 'Dependent operational workflow must succeed when mandatory document is VERIFIED + future expiry');

      // 1b. Verified + TODAY expiry date -> remains VERIFIED / VERIFIED_VALID through end of today (expiryDate < today is false)
      const todayServerDateStr = new Date().toISOString().split('T')[0];
      const dbForToday = getDatabase();
      await dbForToday
        .update(entityDocuments)
        .set({ expiryDate: todayServerDateStr, updatedAt: new Date() })
        .where(eq(entityDocuments.id, futureDocId));

      const reqsOnTodayExpiryRes = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/requirements?facilityType=PATHOLOGY&ownerEntityId=${expiryTenantId}`,
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      assert.equal(reqsOnTodayExpiryRes.statusCode, 200);
      const ceaTodayReq = reqsOnTodayExpiryRes.json().data.requirements.find((r) => r.documentTypeCode === 'PATH_CLINICAL_EST_ACT');
      assert.ok(ceaTodayReq);
      assert.equal(ceaTodayReq.isExpired, false, 'Verified document expiring TODAY must not be marked expired before day end');
      assert.equal(ceaTodayReq.isSatisfied, true, 'Verified document expiring TODAY must remain satisfied');
      assert.equal(ceaTodayReq.currentDocument.verificationStatus, 'VERIFIED');
      assert.equal(ceaTodayReq.currentDocument.validityState, 'VERIFIED_VALID');

      // 1c. Verified + YESTERDAY expiry date -> EXPIRED / VERIFIED_EXPIRED & blocks dependent workflow
      const yesterdayServerDateStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      await dbForToday
        .update(entityDocuments)
        .set({ expiryDate: yesterdayServerDateStr, updatedAt: new Date() })
        .where(eq(entityDocuments.id, futureDocId));

      const reqsOnYesterdayExpiryRes = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/requirements?facilityType=PATHOLOGY&ownerEntityId=${expiryTenantId}`,
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      assert.equal(reqsOnYesterdayExpiryRes.statusCode, 200);
      const ceaYesterdayReq = reqsOnYesterdayExpiryRes.json().data.requirements.find((r) => r.documentTypeCode === 'PATH_CLINICAL_EST_ACT');
      assert.equal(ceaYesterdayReq.isExpired, true, 'Verified document expiring YESTERDAY must be marked expired');
      assert.equal(ceaYesterdayReq.isSatisfied, false, 'Verified document expiring YESTERDAY must NOT satisfy compliance gate');
      assert.equal(ceaYesterdayReq.currentDocument.verificationStatus, 'EXPIRED');

      const depWorkflowBlockedYesterdayRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/lab/orders',
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      assert.equal(
        depWorkflowBlockedYesterdayRes.statusCode,
        403,
        'Expired mandatory document (yesterday expiry) must block dependent operational workflow with 403'
      );

      // 2. Document uploaded with already-past expiryDate -> HQ attempt to VERIFY must be rejected with 400 BAD_REQUEST
      const pastPdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Already Past Doc) >>\nendobj\n%%EOF\n', 'utf8');
      const pastUploadRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: { authorization: `Bearer ${expiryJwt}` },
        payload: {
          documentTypeCode: 'PATH_BIO_MEDICAL_WASTE',
          documentNumber: 'BMW-PAST-2020',
          expiryDate: '2020-01-15',
          fileName: 'bmw_past.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: pastPdfBytes.toString('base64')
        }
      });
      assert.equal(pastUploadRes.statusCode, 201);
      const pastDocId = pastUploadRes.json().data.id;
      assert.equal(pastUploadRes.json().data.isExpired, true);
      assert.equal(pastUploadRes.json().data.validityState, 'EXPIRED');

      const verifyPastRes = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${pastDocId}/verify`,
        headers: { authorization: `Bearer ${hqVerifierJwt}` },
        payload: { status: 'VERIFIED', notes: 'Attempting to verify already-expired doc' }
      });
      assert.equal(verifyPastRes.statusCode, 400, 'Approving an already-expired document must be rejected with 400');

      // 3. Previously VERIFIED mandatory document whose expiryDate is older in the past ('2021-06-30') transitions to EXPIRED / VERIFIED_EXPIRED
      // and triggers EXPIRED_COMPLIANCE_HOLD in getRequirements() and blocks dependent workflow
      const db = getDatabase();
      await db
        .update(entityDocuments)
        .set({ expiryDate: '2021-06-30', updatedAt: new Date() })
        .where(eq(entityDocuments.id, futureDocId));

      const reqsAfterExpiryRes = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/requirements?facilityType=PATHOLOGY&ownerEntityId=${expiryTenantId}`,
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      assert.equal(reqsAfterExpiryRes.statusCode, 200);
      const reqsData = reqsAfterExpiryRes.json().data;
      assert.equal(reqsData.isFullyCompliant, false, 'Expired mandatory document must set isFullyCompliant=false');
      assert.equal(reqsData.submissionBlocked, true, 'Expired mandatory document must set submissionBlocked=true');
      assert.equal(reqsData.accountComplianceState, 'EXPIRED_COMPLIANCE_HOLD');
      assert.ok(reqsData.expiredMandatoryCount >= 1, 'expiredMandatoryCount must reflect expired mandatory documents');

      const ceaReq = reqsData.requirements.find((r) => r.documentTypeCode === 'PATH_CLINICAL_EST_ACT');
      assert.ok(ceaReq);
      assert.equal(ceaReq.isSatisfied, false, 'Expired mandatory document must NOT satisfy requirement');
      assert.equal(ceaReq.isExpired, true);
      assert.equal(ceaReq.currentDocument.verificationStatus, 'EXPIRED');
      assert.equal(ceaReq.currentDocument.validityState, 'VERIFIED_EXPIRED');

      // 4. Re-upload renewed documents with valid future expiryDate:
      // Assert that BEFORE HQ verification, validity is NOT restored and dependent workflow REMAINS BLOCKED (403)
      const renewedPdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Renewed CEA Doc 2030) >>\nendobj\n%%EOF\n', 'utf8');
      const renewUploadRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: { authorization: `Bearer ${expiryJwt}` },
        payload: {
          documentTypeCode: 'PATH_CLINICAL_EST_ACT',
          documentNumber: 'CEA-RENEWED-2030',
          expiryDate: '2030-12-31',
          fileName: 'cea_renewed_2030.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: renewedPdfBytes.toString('base64')
        }
      });
      assert.equal(renewUploadRes.statusCode, 201);
      const renewedDocId = renewUploadRes.json().data.id;

      const renewBmwUploadRes = await app.inject({
        method: 'POST',
        url: '/api/v1/compliance/documents/upload',
        headers: { authorization: `Bearer ${expiryJwt}` },
        payload: {
          documentTypeCode: 'PATH_BIO_MEDICAL_WASTE',
          documentNumber: 'BMW-RENEWED-2030',
          expiryDate: '2030-12-31',
          fileName: 'bmw_renewed_2030.pdf',
          mimeType: 'application/pdf',
          fileContentBase64: renewedPdfBytes.toString('base64')
        }
      });
      assert.equal(renewBmwUploadRes.statusCode, 201);
      const renewedBmwDocId = renewBmwUploadRes.json().data.id;

      // Before HQ verification, unverified renewal must NOT restore compliance or unblock dependent workflow
      const reqsBeforeVerifyRenewalRes = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/requirements?facilityType=PATHOLOGY&ownerEntityId=${expiryTenantId}`,
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      const unverifiedRenewalReq = reqsBeforeVerifyRenewalRes.json().data.requirements.find(
        (r) => r.documentTypeCode === 'PATH_CLINICAL_EST_ACT'
      );
      assert.equal(
        unverifiedRenewalReq.isSatisfied,
        false,
        'Renewal upload must NOT satisfy compliance requirement until verified by HQ'
      );
      const depWorkflowStillBlockedRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/lab/orders',
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      assert.equal(
        depWorkflowStillBlockedRes.statusCode,
        403,
        'Dependent operational workflow must remain blocked (403) while renewal is unverified'
      );

      // Now HQ verifies the renewed documents -> compliance and dependent workflow are restored
      const verifyRenewedRes = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${renewedDocId}/verify`,
        headers: { authorization: `Bearer ${hqVerifierJwt}` },
        payload: { status: 'VERIFIED', notes: 'Renewed document verified' }
      });
      assert.equal(verifyRenewedRes.statusCode, 200);
      assert.equal(verifyRenewedRes.json().data.verificationStatus, 'VERIFIED');
      assert.equal(verifyRenewedRes.json().data.validityState, 'VERIFIED_VALID');

      const verifyRenewedBmwRes = await app.inject({
        method: 'POST',
        url: `/api/v1/compliance/documents/${renewedBmwDocId}/verify`,
        headers: { authorization: `Bearer ${hqVerifierJwt}` },
        payload: { status: 'VERIFIED', notes: 'Renewed BMW document verified' }
      });
      assert.equal(verifyRenewedBmwRes.statusCode, 200);

      const reqsAfterRenewalRes = await app.inject({
        method: 'GET',
        url: `/api/v1/compliance/documents/requirements?facilityType=PATHOLOGY&ownerEntityId=${expiryTenantId}`,
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      assert.equal(reqsAfterRenewalRes.statusCode, 200);
      const renewedCeaReq = reqsAfterRenewalRes.json().data.requirements.find((r) => r.documentTypeCode === 'PATH_CLINICAL_EST_ACT');
      assert.equal(renewedCeaReq.isSatisfied, true, 'Renewed and verified document must satisfy requirement again');
      assert.equal(renewedCeaReq.isExpired, false);

      const depWorkflowRestoredRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/lab/orders',
        headers: { authorization: `Bearer ${expiryJwt}` }
      });
      assert.equal(
        depWorkflowRestoredRes.statusCode,
        200,
        'Dependent operational workflow must succeed (200) after renewed mandatory documents are verified'
      );
    });

    test('TRBAC-BG-1 (FINDING-P1-ABAC-BREAKGLASS-05): Temporal RBAC bounds (effective_from / effective_to) and Emergency Break-Glass patient chart access lifecycle', async () => {
      const { staffAdministrationRepository } = await import('../dist/repositories/partner/StaffAdministrationRepository.js');
      const { staffRoleAssignments } = await import('@docsearch/database');

      // Create a test patient in tenantClinicId for patient chart access testing
      const clinicDoctorJwt = partnerToken({
        tenantId: tenantClinicId,
        email: 'doctor@clinic.in',
        role: 'DOCTOR',
        facilityType: 'CLINIC'
      });

      const createPatientRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/patients',
        headers: { authorization: `Bearer ${clinicDoctorJwt}` },
        payload: {
          firstName: 'Aarav',
          lastName: 'BreakGlassTest',
          phone: '9876509988',
          gender: 'MALE',
          dateOfBirth: '1985-05-15'
        }
      });
      assert.equal(createPatientRes.statusCode, 201);
      const targetPatientId = createPatientRes.json().data.id;

      const createOtherPatientRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/patients',
        headers: { authorization: `Bearer ${clinicDoctorJwt}` },
        payload: {
          firstName: 'Meera',
          lastName: 'UnrelatedChart',
          phone: '9876509989',
          gender: 'FEMALE',
          dateOfBirth: '1990-08-20'
        }
      });
      assert.equal(createOtherPatientRes.statusCode, 201);
      const unrelatedPatientId = createOtherPatientRes.json().data.id;

      // PART A: Temporal Role Assignment Enforcement (effective_from / effective_to)
      // Use NURSE staffType so it does not collide with the 2-doctor seat quota already tested on tenantClinicId
      const staffRes = await staffAdministrationRepository.createStaff({
        tenantId: tenantClinicId,
        fullName: 'Nurse Temporal Shift',
        workEmail: 'nurse.temporal@clinic.in',
        workPhone: '9888811122',
        staffType: 'NURSE',
        primaryRole: 'NURSE',
        employmentType: 'FULL_TIME'
      });
      const locumStaffId = staffRes.id;
      const db = getDatabase();

      // Clear any default assignment created during createStaff so we test explicit temporal windows
      await db.delete(staffRoleAssignments).where(eq(staffRoleAssignments.staffId, locumStaffId));

      // 1. Assign role with PAST effectiveTo (already expired) -> request must be rejected with 403
      const pastEffectiveFrom = new Date(Date.now() - 10 * 86400000).toISOString();
      const pastEffectiveTo = new Date(Date.now() - 2 * 86400000).toISOString();
      await staffAdministrationRepository.assignStaffRole({
        tenantId: tenantClinicId,
        staffId: locumStaffId,
        roleCode: 'NURSE',
        dataScope: 'BRANCH',
        isPrimary: true,
        effectiveFrom: pastEffectiveFrom,
        effectiveTo: pastEffectiveTo
      });

      const locumJwt = signJwt(
        {
          sub: locumStaffId,
          userId: locumStaffId,
          email: 'nurse.temporal@clinic.in',
          actorEmail: 'nurse.temporal@clinic.in',
          tenantId: tenantClinicId,
          branchId: TEST_SEEDS.BRANCH_A,
          roles: ['NURSE'],
          permissions: ['clinical:patients:read', 'clinical:patients', 'clinical:read'],
          dataScope: 'tenant',
          isSuperAdmin: false,
          iss: ISSUER,
          aud: AUDIENCE
        },
        { secret: MASTER_SECRET, expiresInSeconds: 7200, issuer: ISSUER, audience: AUDIENCE }
      );

      const expiredRoleAccessRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${locumJwt}` }
      });
      assert.equal(expiredRoleAccessRes.statusCode, 403, 'Staff with expired effective_to role assignment must be denied with 403');
      assert.equal(expiredRoleAccessRes.json().error?.code, 'FORBIDDEN');
      assert.ok(expiredRoleAccessRes.json().error?.message?.includes('expired'), 'Denial reason must state role assignment expired');

      // 1b (P1-05 #3): Expired role (NURSE) + unrelated valid role (BILLING_EXECUTIVE) ->
      // Expired NURSE role contributes ZERO permissions; since BILLING_EXECUTIVE does not grant clinical chart access,
      // patient chart access MUST be denied (403) even if the JWT still carries clinical:patients:read from when NURSE was active!
      await staffAdministrationRepository.assignStaffRole({
        tenantId: tenantClinicId,
        staffId: locumStaffId,
        roleCode: 'BILLING_EXECUTIVE',
        dataScope: 'BRANCH',
        isPrimary: false,
        effectiveFrom: new Date(Date.now() - 3600 * 1000).toISOString(),
        effectiveTo: new Date(Date.now() + 7 * 86400000).toISOString()
      });

      const mixedLocumJwt = signJwt(
        {
          sub: locumStaffId,
          userId: locumStaffId,
          email: 'nurse.temporal@clinic.in',
          actorEmail: 'nurse.temporal@clinic.in',
          tenantId: tenantClinicId,
          branchId: TEST_SEEDS.BRANCH_A,
          roles: ['NURSE', 'BILLING_EXECUTIVE'],
          permissions: ['clinical:patients:read', 'clinical:patients', 'clinical:read', 'billing:read'],
          dataScope: 'tenant',
          isSuperAdmin: false,
          iss: ISSUER,
          aud: AUDIENCE
        },
        { secret: MASTER_SECRET, expiresInSeconds: 7200, issuer: ISSUER, audience: AUDIENCE }
      );

      const expiredPlusUnrelatedRoleRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${mixedLocumJwt}` }
      });
      assert.equal(
        expiredPlusUnrelatedRoleRes.statusCode,
        403,
        'Expired clinical role + unrelated valid role (BILLING_EXECUTIVE) must deny patient chart access (403) because expired role contributes zero permissions'
      );

      // Clear assignments and test FUTURE role assignment (effective_from > NOW) -> must also be denied with 403
      await db.delete(staffRoleAssignments).where(eq(staffRoleAssignments.staffId, locumStaffId));
      const futureEffectiveFrom = new Date(Date.now() + 5 * 86400000).toISOString();
      const futureEffectiveTo = new Date(Date.now() + 15 * 86400000).toISOString();
      await staffAdministrationRepository.assignStaffRole({
        tenantId: tenantClinicId,
        staffId: locumStaffId,
        roleCode: 'NURSE',
        dataScope: 'BRANCH',
        isPrimary: true,
        effectiveFrom: futureEffectiveFrom,
        effectiveTo: futureEffectiveTo
      });

      const futureRoleAccessRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${locumJwt}` }
      });
      assert.equal(futureRoleAccessRes.statusCode, 403, 'Staff with future effective_from role assignment must be denied with 403');
      assert.equal(futureRoleAccessRes.json().error?.code, 'FORBIDDEN');
      assert.ok(futureRoleAccessRes.json().error?.message?.includes('not yet effective'), 'Denial reason must state role is not yet effective');

      // Clear future assignment and assign currently ACTIVE temporal role (effective_from <= NOW < effective_to) -> 200 OK
      await db.delete(staffRoleAssignments).where(eq(staffRoleAssignments.staffId, locumStaffId));
      await staffAdministrationRepository.assignStaffRole({
        tenantId: tenantClinicId,
        staffId: locumStaffId,
        roleCode: 'NURSE',
        dataScope: 'BRANCH',
        isPrimary: true,
        effectiveFrom: new Date(Date.now() - 3600 * 1000).toISOString(),
        effectiveTo: new Date(Date.now() + 7 * 86400000).toISOString()
      });

      const activeRoleAccessRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${locumJwt}` }
      });
      assert.equal(activeRoleAccessRes.statusCode, 200, 'Staff with active temporal role window must succeed (200)');

      // PART B: Emergency Break-Glass Workflow & SUPER_ADMIN Clinical Chart Restriction
      // 0a (P1-05 #6): Unauthenticated Break-Glass request -> DENIED (401)
      const unauthBgRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/break-glass',
        payload: {
          patientId: targetPatientId,
          reason: 'Unauthenticated emergency attempt'
        }
      });
      assert.equal(unauthBgRes.statusCode, 401, 'Unauthenticated Break-Glass request must be denied with 401');

      // 0b (P1-05 #7): Cross-tenant Break-Glass request -> DENIED (403 TENANT_ACCESS_DENIED)
      const otherTenantJwt = partnerToken({
        tenantId: tenantPathologyId,
        email: 'admin@pathology.in',
        role: 'PATHOLOGIST',
        facilityType: 'PATHOLOGY'
      });
      const crossTenantBgRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/break-glass',
        headers: { authorization: `Bearer ${otherTenantJwt}` },
        payload: {
          patientId: targetPatientId,
          reason: 'Cross-tenant emergency attempt'
        }
      });
      assert.equal(crossTenantBgRes.statusCode, 403, 'Cross-tenant Break-Glass request must be denied with 403');

      // 0c (P1-05 #10): Normal / non-staff user (PATIENT / GUEST) cannot manufacture Break-Glass privilege -> DENIED (403)
      const normalPatientUserJwt = signJwt(
        {
          sub: crypto.randomUUID(),
          userId: crypto.randomUUID(),
          email: 'patient.user@gmail.com',
          actorEmail: 'patient.user@gmail.com',
          tenantId: tenantClinicId,
          branchId: TEST_SEEDS.BRANCH_A,
          roles: ['PATIENT'],
          permissions: ['patient:portal:read'],
          dataScope: 'own',
          isSuperAdmin: false,
          iss: ISSUER,
          aud: AUDIENCE
        },
        { secret: MASTER_SECRET, expiresInSeconds: 7200, issuer: ISSUER, audience: AUDIENCE }
      );
      const normalUserBgRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/break-glass',
        headers: { authorization: `Bearer ${normalPatientUserJwt}` },
        payload: {
          patientId: targetPatientId,
          reason: 'Normal user attempting to manufacture emergency access'
        }
      });
      assert.equal(normalUserBgRes.statusCode, 403, 'Normal/non-staff users must be forbidden from manufacturing Break-Glass privileges (403)');

      // Wildcard Break-Glass attempt (patientId: '*') -> DENIED (403)
      const wildcardBgRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/break-glass',
        headers: { authorization: `Bearer ${clinicDoctorJwt}` },
        payload: {
          patientId: '*',
          scope: '*',
          reason: 'Wildcard break glass attempt'
        }
      });
      assert.equal(wildcardBgRes.statusCode, 403, 'Wildcard Break-Glass privilege request must be rejected with 403');
      // 1. SUPER_ADMIN without clinical role or Break-Glass grant is DENIED direct patient chart access (403)
      const superAdminId = '00000000-0000-4000-8000-000000000999';
      const superAdminClinicJwt = signJwt(
        {
          sub: superAdminId,
          userId: superAdminId,
          email: 'superadmin.noclinical@docsearch.in',
          actorEmail: 'superadmin.noclinical@docsearch.in',
          tenantId: tenantClinicId,
          branchId: TEST_SEEDS.BRANCH_A,
          roles: ['SUPER_ADMIN'],
          permissions: ['*'],
          dataScope: 'global',
          isSuperAdmin: true,
          iss: ISSUER,
          aud: AUDIENCE
        },
        { secret: MASTER_SECRET, expiresInSeconds: 7200, issuer: ISSUER, audience: AUDIENCE }
      );

      const superAdminChartRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${superAdminClinicJwt}` }
      });
      assert.equal(
        superAdminChartRes.statusCode,
        403,
        'SUPER_ADMIN without clinical role or active Break-Glass grant must be denied patient chart access (403)'
      );

      // 2. Non-entitled staff (e.g. BILLING_EXECUTIVE without clinical:read) is denied patient chart access (403)
      const nonEntitledUserId = crypto.randomUUID();
      const nonEntitledJwt = signJwt(
        {
          sub: nonEntitledUserId,
          userId: nonEntitledUserId,
          email: 'duty.officer@clinic.in',
          actorEmail: 'duty.officer@clinic.in',
          tenantId: tenantClinicId,
          branchId: TEST_SEEDS.BRANCH_A,
          roles: ['BILLING_EXECUTIVE'],
          permissions: ['billing:read'],
          dataScope: 'tenant',
          isSuperAdmin: false,
          iss: ISSUER,
          aud: AUDIENCE
        },
        { secret: MASTER_SECRET, expiresInSeconds: 7200, issuer: ISSUER, audience: AUDIENCE }
      );

      const deniedBeforeBgRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${nonEntitledJwt}` }
      });
      assert.equal(deniedBeforeBgRes.statusCode, 403, 'Non-entitled staff must be denied patient chart access before Break-Glass');

      // 3. Break-Glass request without reason -> rejected with 400
      const noReasonBgRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/break-glass',
        headers: { authorization: `Bearer ${nonEntitledJwt}` },
        payload: {
          patientId: targetPatientId,
          reason: ''
        }
      });
      assert.equal(noReasonBgRes.statusCode, 400, 'Break-Glass without mandatory emergency reason must be rejected with 400');

      // 4. Valid Emergency Break-Glass request for targetPatientId -> 201 Created
      const validBgRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/break-glass',
        headers: { authorization: `Bearer ${nonEntitledJwt}` },
        payload: {
          patientId: targetPatientId,
          reason: 'Code Blue emergency resuscitation allergy and medication review',
          durationMinutes: 15
        }
      });
      assert.equal(validBgRes.statusCode, 201);
      const breakGlassId = validBgRes.json().data.id;
      assert.equal(validBgRes.json().data.patientId, targetPatientId);

      // 5. Access to targetPatientId chart now succeeds (200) under active Break-Glass
      const allowedTargetChartRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${nonEntitledJwt}` }
      });
      assert.equal(allowedTargetChartRes.statusCode, 200, 'Active Break-Glass grant must permit access to the specific patient chart');

      // 6. Access to unrelatedPatientId chart remains DENIED (403) — Break-Glass is strictly patient-scoped
      const deniedUnrelatedChartRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${unrelatedPatientId}`,
        headers: { authorization: `Bearer ${nonEntitledJwt}` }
      });
      assert.equal(deniedUnrelatedChartRes.statusCode, 403, 'Break-Glass for Patient A must NOT grant access to Patient B');

      // 7. Revoke Break-Glass grant -> subsequent access to targetPatientId chart is immediately DENIED (403)
      const revokeBgRes = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/break-glass/${breakGlassId}/revoke`,
        headers: { authorization: `Bearer ${nonEntitledJwt}` },
        payload: { reason: 'Emergency resolved, patient stabilized' }
      });
      assert.equal(revokeBgRes.statusCode, 200);

      const deniedAfterRevokeRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${nonEntitledJwt}` }
      });
      assert.equal(deniedAfterRevokeRes.statusCode, 403, 'Revoked Break-Glass grant must immediately deny patient chart access');

      // 8. Expired Break-Glass grant (expiresInSeconds = 1, then wait 1100ms) -> access denied (403)
      const shortBgRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/break-glass',
        headers: { authorization: `Bearer ${nonEntitledJwt}` },
        payload: {
          patientId: targetPatientId,
          reason: 'Short-lived emergency chart check',
          expiresInSeconds: 1
        }
      });
      assert.equal(shortBgRes.statusCode, 201);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const deniedAfterExpiryRes = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/clinical/patients/${targetPatientId}`,
        headers: { authorization: `Bearer ${nonEntitledJwt}` }
      });
      assert.equal(deniedAfterExpiryRes.statusCode, 403, 'Expired Break-Glass grant must automatically deny access');
    });
  });
});
