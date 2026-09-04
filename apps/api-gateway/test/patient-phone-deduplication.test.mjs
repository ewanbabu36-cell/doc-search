import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS, patients, patientContacts, eq, and } from '@docsearch/database';

describe('PHASE 8 — PATIENT PHONE DEDUPLICATION & CONTACT PERSISTENCE', () => {
  let app;
  let poolRef;
  let dbRef;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchA = TEST_SEEDS.FACILITY_ID_A;
  const branchB = TEST_SEEDS.FACILITY_ID_B;

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-doctor-01',
      email: overrides.email || 'dr.smith@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchA,
      roles: overrides.roles || ['DOCTOR', 'ATTENDING_PHYSICIAN'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:patients:update',
        'clinical:patients:manage',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:consultations:create',
        'clinical:consultations:read'
      ]
    };
    return signJwt(claims, {
      secret: MASTER_SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresInSeconds: 7200
    });
  }

  let doctorTokenTenantA;
  let doctorTokenTenantB;

  before(async () => {
    const testDb = await setupTestDatabase();
    poolRef = testDb.pool;
    dbRef = testDb.db;

    await poolRef.query(`
      INSERT INTO "core"."branches" ("id", "tenant_id", "name", "code")
      VALUES 
        ('${branchA}', '${tenantA}', 'Tenant A Main Branch', 'BRA-MAIN-A'),
        ('${branchB}', '${tenantB}', 'Tenant B Main Branch', 'BRA-MAIN-B')
      ON CONFLICT DO NOTHING;
    `);

    doctorTokenTenantA = createTestToken({ tenantId: tenantA, branchId: branchA, userId: 'usr-doc-tenant-a' });
    doctorTokenTenantB = createTestToken({ tenantId: tenantB, branchId: branchB, userId: 'usr-doc-tenant-b' });

    app = await buildApp();
  });

  after(async () => {
    if (app) await app.close();
    if (poolRef) await poolRef.end();
  });

  let patientA1Id;

  // TEST 1: Same normalized phone + same tenant -> existing patient returned
  it('TEST 1: Same normalized phone + same tenant returns existing patient', async () => {
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Rajesh',
        lastName: 'Sharma',
        dateOfBirth: '1980-05-15',
        gender: 'MALE',
        mobileNumber: '+91 98765 43210'
      }
    });

    assert.equal(res1.statusCode, 201);
    const body1 = JSON.parse(res1.body);
    assert.equal(body1.success, true);
    patientA1Id = body1.data.id;
    assert.ok(patientA1Id, 'Patient ID must be created');

    // Verify contact was persisted in clinical.patient_contacts
    const [contact] = await dbRef
      .select()
      .from(patientContacts)
      .where(and(
        eq(patientContacts.tenantId, tenantA),
        eq(patientContacts.primaryMobile, '+919876543210')
      ));
    assert.ok(contact, 'patient_contacts row must exist');
    assert.equal(contact.patientId, patientA1Id);
    assert.equal(contact.primaryMobile, '+919876543210');

    // Second registration with same phone (unformatted)
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Rajesh',
        lastName: 'Sharma',
        dateOfBirth: '1980-05-15',
        gender: 'MALE',
        mobileNumber: '9876543210'
      }
    });

    assert.equal(res2.statusCode, 201);
    const body2 = JSON.parse(res2.body);
    assert.equal(body2.success, true);
    assert.equal(body2.data.id, patientA1Id, 'Must return original patient record');
  });

  // TEST 2: Same phone + different tenant -> allowed, no cross-tenant leak
  it('TEST 2: Same phone + different tenant is allowed and isolated', async () => {
    const resB = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantB}` },
      payload: {
        firstName: 'Anil',
        lastName: 'Kumar',
        dateOfBirth: '1982-08-20',
        gender: 'MALE',
        mobileNumber: '+91-98765-43210'
      }
    });

    assert.equal(resB.statusCode, 201);
    const bodyB = JSON.parse(resB.body);
    assert.equal(bodyB.success, true);
    const patientBId = bodyB.data.id;
    assert.notEqual(patientBId, patientA1Id, 'Different tenants must receive distinct patient IDs');
    assert.equal(bodyB.data.tenantId, tenantB);

    // Verify contact persisted in Tenant B
    const [contactB] = await dbRef
      .select()
      .from(patientContacts)
      .where(and(
        eq(patientContacts.tenantId, tenantB),
        eq(patientContacts.primaryMobile, '+919876543210')
      ));
    assert.ok(contactB, 'Tenant B contact must exist');
    assert.equal(contactB.patientId, patientBId);
  });

  // TEST 3: Equivalent phone formats -> deduplicated
  it('TEST 3: Multiple equivalent phone formats resolve to identical record', async () => {
    const formats = [
      '+91-9876543210',
      '919876543210',
      '09876543210',
      '+91 98765 43210'
    ];

    for (const fmt of formats) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/patients',
        headers: { authorization: `Bearer ${doctorTokenTenantA}` },
        payload: {
          firstName: 'Duplicate',
          lastName: 'Check',
          gender: 'MALE',
          mobileNumber: fmt
        }
      });
      assert.equal(res.statusCode, 201);
      const data = JSON.parse(res.body).data;
      assert.equal(data.id, patientA1Id, `Format "${fmt}" must deduplicate to ${patientA1Id}`);
    }
  });

  // TEST 4: Different phone + different MRN -> new patient created
  it('TEST 4: Different phone + different MRN creates new patient', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        mrn: 'MRN-DISTINCT-100',
        firstName: 'Sunita',
        lastName: 'Verma',
        gender: 'FEMALE',
        mobileNumber: '9876500001'
      }
    });

    assert.equal(res.statusCode, 201);
    const data = JSON.parse(res.body).data;
    assert.notEqual(data.id, patientA1Id);
    assert.equal(data.mrn, 'MRN-DISTINCT-100');
  });

  // TEST 5: Same MRN + same tenant -> duplicate prevented (Tier 1 Authority)
  it('TEST 5: Same MRN + same tenant prevents duplicate even with different phone', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        mrn: 'MRN-DISTINCT-100',
        firstName: 'Sunita',
        lastName: 'Modified',
        gender: 'FEMALE',
        mobileNumber: '9876500099' // different phone, but MRN matches
      }
    });

    assert.equal(res.statusCode, 201);
    const data = JSON.parse(res.body).data;
    assert.equal(data.mrn, 'MRN-DISTINCT-100');
  });

  // TEST 6: Same MRN + different tenant -> allowed
  it('TEST 6: Same MRN in different tenant is permitted', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantB}` },
      payload: {
        mrn: 'MRN-DISTINCT-100',
        firstName: 'Sunita',
        lastName: 'TenantB',
        gender: 'FEMALE',
        mobileNumber: '9876500055'
      }
    });

    assert.equal(res.statusCode, 201);
    const data = JSON.parse(res.body).data;
    assert.equal(data.tenantId, tenantB);
    assert.equal(data.mrn, 'MRN-DISTINCT-100');
  });

  // TEST 7: No phone + valid MRN -> registration succeeds
  it('TEST 7: Registration with valid MRN and no phone succeeds', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        mrn: 'MRN-NOPHONE-001',
        firstName: 'Anonymous',
        lastName: 'Emergency',
        gender: 'OTHER'
      }
    });

    assert.equal(res.statusCode, 201);
    const data = JSON.parse(res.body).data;
    assert.equal(data.mrn, 'MRN-NOPHONE-001');
  });

  // TEST 8: No MRN + valid phone -> phone deduplication works
  it('TEST 8: Registration without MRN but valid phone is deduplicated', async () => {
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Vikram',
        lastName: 'Seth',
        gender: 'MALE',
        mobileNumber: '+91-98765-11111'
      }
    });
    assert.equal(res1.statusCode, 201);
    const id1 = JSON.parse(res1.body).data.id;

    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Vikram',
        lastName: 'Seth',
        gender: 'MALE',
        mobileNumber: '9876511111'
      }
    });
    assert.equal(res2.statusCode, 201);
    const id2 = JSON.parse(res2.body).data.id;
    assert.equal(id1, id2, 'Must deduplicate to same patient');
  });

  // TEST 9: Null, empty, whitespace phone -> no false matches
  it('TEST 9: Null, empty, and whitespace phones do not cause false deduplication', async () => {
    const resEmpty = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Empty',
        lastName: 'Phone',
        gender: 'MALE',
        mobileNumber: ''
      }
    });
    assert.equal(resEmpty.statusCode, 201);
    const idEmpty = JSON.parse(resEmpty.body).data.id;

    const resSpace = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Whitespace',
        lastName: 'Phone',
        gender: 'FEMALE',
        mobileNumber: '    '
      }
    });
    assert.equal(resSpace.statusCode, 201);
    const idSpace = JSON.parse(resSpace.body).data.id;

    assert.notEqual(idEmpty, idSpace, 'Empty and whitespace phone registrations must be distinct');
  });

  // TEST 10: Existing patient phone updated -> patient_contacts updated
  it('TEST 10: Existing patient phone update propagates to patient_contacts', async () => {
    // Create initial patient with phone
    const resCreate = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Meena',
        lastName: 'Kumari',
        gender: 'FEMALE',
        mobileNumber: '9876522222'
      }
    });
    const patientId = JSON.parse(resCreate.body).data.id;

    // Update phone via PATCH
    const resPatch = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/patients/${patientId}`,
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        mobileNumber: '+91-98765-33333'
      }
    });
    assert.equal(resPatch.statusCode, 200);
    const patchData = JSON.parse(resPatch.body).data;
    assert.equal(patchData.mobileNumber, '+919876533333');

    // Verify contact in database
    const [contact] = await dbRef
      .select()
      .from(patientContacts)
      .where(and(
        eq(patientContacts.tenantId, tenantA),
        eq(patientContacts.patientId, patientId)
      ));
    assert.ok(contact);
    assert.equal(contact.primaryMobile, '+919876533333');
  });

  // ADVERSARIAL TEST 11: Cross-tenant lookup returns 404
  it('ADVERSARIAL TEST 11: Cross-tenant patient lookup returns 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/patients/${patientA1Id}`,
      headers: { authorization: `Bearer ${doctorTokenTenantB}` }
    });
    assert.equal(res.statusCode, 404);
  });

  // ADVERSARIAL TEST 12: Cross-tenant update returns 404
  it('ADVERSARIAL TEST 12: Cross-tenant patient update returns 404', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/patients/${patientA1Id}`,
      headers: { authorization: `Bearer ${doctorTokenTenantB}` },
      payload: {
        mobileNumber: '9876544444'
      }
    });
    assert.equal(res.statusCode, 404);
  });

  // ADVERSARIAL TEST 13: Phone collision in same tenant returns 409 Conflict
  it('ADVERSARIAL TEST 13: Updating phone to an existing patient phone in same tenant returns 409 Conflict', async () => {
    // Create Patient 1 with 9876588881
    const resP1 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Collision',
        lastName: 'One',
        gender: 'MALE',
        mobileNumber: '9876588881'
      }
    });
    assert.equal(resP1.statusCode, 201);

    // Create Patient 2 with 9876588882
    const resP2 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        firstName: 'Collision',
        lastName: 'Two',
        gender: 'FEMALE',
        mobileNumber: '9876588882'
      }
    });
    assert.equal(resP2.statusCode, 201);
    const p2Id = JSON.parse(resP2.body).data.id;

    // Attempt to update Patient 2 with Patient 1 phone
    const resUpdateConflict = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/patients/${p2Id}`,
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        mobileNumber: '9876588881'
      }
    });
    assert.equal(resUpdateConflict.statusCode, 409);
    const body = JSON.parse(resUpdateConflict.body);
    assert.ok(body.error.message.includes('already registered'));
  });

  // ADVERSARIAL TEST 14: Concurrent registration with identical phone
  it('ADVERSARIAL TEST 14: Concurrent registrations with identical phone return the exact same patient', async () => {
    const concurrentPhone = '9876577777';
    const [regA, regB] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/patients',
        headers: { authorization: `Bearer ${doctorTokenTenantA}` },
        payload: {
          firstName: 'Concurrent',
          lastName: 'Alpha',
          gender: 'MALE',
          mobileNumber: concurrentPhone
        }
      }),
      app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/patients',
        headers: { authorization: `Bearer ${doctorTokenTenantA}` },
        payload: {
          firstName: 'Concurrent',
          lastName: 'Beta',
          gender: 'MALE',
          mobileNumber: concurrentPhone
        }
      })
    ]);

    assert.equal(regA.statusCode, 201);
    assert.equal(regB.statusCode, 201);

    const patientIdA = JSON.parse(regA.body).data.id;
    const patientIdB = JSON.parse(regB.body).data.id;
    assert.equal(patientIdA, patientIdB, 'Both concurrent requests must resolve to the identical patient ID');

    // Verify only one contact row was created
    const contacts = await dbRef
      .select()
      .from(patientContacts)
      .where(and(
        eq(patientContacts.tenantId, tenantA),
        eq(patientContacts.primaryMobile, '+919876577777')
      ));
    assert.equal(contacts.length, 1, 'Exactly one contact row must exist in database');
  });

  // ADVERSARIAL TEST 15: Invalid phone on update returns 400 Bad Request
  it('ADVERSARIAL TEST 15: Invalid phone format on update returns 400 Bad Request', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/patients/${patientA1Id}`,
      headers: { authorization: `Bearer ${doctorTokenTenantA}` },
      payload: {
        mobileNumber: '123' // Too short (< 7 digits)
      }
    });
    assert.equal(res.statusCode, 400);
  });
});
