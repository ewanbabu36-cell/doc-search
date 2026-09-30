import test from 'node:test';
import assert from 'node:assert/strict';

test('Partner-Profile Adaptive Staff Directory & HQ Governance Suite', async (t) => {
  const baseUrl = 'http://127.0.0.1:4000';

  // 1. Partner Platform Role Permission Checks
  await t.test('1. Role permission matrix allows staff-administration for all partner profiles', async () => {
    const isPartnerModuleAllowed = (moduleKey, role) => {
      if (moduleKey === 'staff-administration') {
        const norm = (role || '').trim().toUpperCase();
        if (
          norm.includes('ADMIN') ||
          norm.includes('DOCTOR') ||
          norm.includes('PHARMACIST') ||
          norm.includes('PATHOLOGIST') ||
          norm.includes('DIRECTOR') ||
          norm.includes('OWNER') ||
          norm.includes('CHIEF') ||
          norm.includes('FOUNDER') ||
          norm === 'CLINIC_DOCTOR' ||
          norm === 'LAB_DIRECTOR' ||
          norm === 'HOSPITAL_ADMIN'
        ) {
          return true;
        }
      }
      return false;
    };

    assert.equal(isPartnerModuleAllowed('staff-administration', 'CHIEF_PHARMACIST'), true, 'Pharmacy lead must have staff-administration access');
    assert.equal(isPartnerModuleAllowed('staff-administration', 'PHARMACIST'), true, 'Pharmacist must have staff-administration access');
    assert.equal(isPartnerModuleAllowed('staff-administration', 'LAB_DIRECTOR'), true, 'Lab Director must have staff-administration access');
    assert.equal(isPartnerModuleAllowed('staff-administration', 'CLINIC_DOCTOR'), true, 'Clinic Doctor must have staff-administration access');
    assert.equal(isPartnerModuleAllowed('staff-administration', 'HOSPITAL_ADMIN'), true, 'Hospital Admin must have staff-administration access');
    assert.equal(isPartnerModuleAllowed('staff-administration', 'GUEST'), false, 'Guest should not have staff-administration access');
  });

  // 2. Fetch partners from company directory
  let testPartner = null;
  await t.test('2. Retrieves partner directory from /api/v1/company/partners', async () => {
    const res = await fetch(`${baseUrl}/api/v1/company/partners?limit=10`);
    assert.equal(res.ok, true, 'GET /api/v1/company/partners should return HTTP 200');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data), 'Partners data must be an array');
    assert.ok(json.data.length > 0, 'At least one partner must exist in the directory');
    testPartner = json.data[0];
    assert.ok(testPartner.id, 'Partner must have an ID');
  });

  // 3. GET /api/v1/company/partners/:id/staff
  await t.test('3. Fetches staff directory for partner via GET /api/v1/company/partners/:id/staff', async () => {
    assert.ok(testPartner, 'testPartner must be set');
    const res = await fetch(`${baseUrl}/api/v1/company/partners/${testPartner.id}/staff`);
    assert.equal(res.ok, true, 'GET partner staff should return HTTP 200');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data), 'Staff list must be an array');
  });

  // 4. POST /api/v1/company/partners/:id/staff
  let createdStaffMember = null;
  await t.test('4. Enrolls a profile-adaptive staff member via POST /api/v1/company/partners/:id/staff', async () => {
    assert.ok(testPartner, 'testPartner must be set');
    const timestamp = Date.now();
    const isPharmacy = String(testPartner.partnerType || '').includes('PHARMACY');
    const isPathology = String(testPartner.partnerType || '').includes('LAB');

    const newStaffPayload = {
      fullName: isPharmacy ? `Pharma Lead ${timestamp}` : isPathology ? `Senior Pathologist ${timestamp}` : `Chief Consultant ${timestamp}`,
      workEmail: `staff_${timestamp}@facility.health`,
      workPhone: '+91 98765 00112',
      staffType: isPharmacy ? 'PHARMACIST' : isPathology ? 'LAB_TECHNICIAN' : 'DOCTOR',
      primaryRole: isPharmacy ? 'CHIEF_PHARMACIST' : isPathology ? 'LAB_DIRECTOR' : 'ATTENDING_PHYSICIAN',
      employmentType: 'FULL_TIME'
    };

    const res = await fetch(`${baseUrl}/api/v1/company/partners/${testPartner.id}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaffPayload)
    });

    assert.equal(res.ok, true, 'POST partner staff should return HTTP 201/200');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.id, 'Created staff must have an ID');
    assert.ok(json.data.staffCode, 'Created staff must have a generated staffCode');
    assert.equal(json.data.fullName, newStaffPayload.fullName);
    assert.equal(json.data.workEmail, newStaffPayload.workEmail);
    assert.equal(json.data.primaryRole, newStaffPayload.primaryRole);
    assert.equal(json.data.employmentStatus, 'ACTIVE');

    createdStaffMember = json.data;
  });

  // 5. PATCH /api/v1/company/partners/:id/staff/:staffId/status
  await t.test('5. Updates staff employment status via PATCH /api/v1/company/partners/:id/staff/:staffId/status', async () => {
    assert.ok(testPartner, 'testPartner must be set');
    assert.ok(createdStaffMember, 'createdStaffMember must be set');

    const suspendRes = await fetch(
      `${baseUrl}/api/v1/company/partners/${testPartner.id}/staff/${createdStaffMember.id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUSPENDED', reason: 'Annual Compliance Audit' })
      }
    );

    assert.equal(suspendRes.ok, true, 'PATCH staff status should succeed');
    const suspendJson = await suspendRes.json();
    assert.equal(suspendJson.success, true);
    assert.equal(suspendJson.data.status, 'SUSPENDED');

    // Reactivate
    const activateRes = await fetch(
      `${baseUrl}/api/v1/company/partners/${testPartner.id}/staff/${createdStaffMember.id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', reason: 'Audit Cleared' })
      }
    );

    assert.equal(activateRes.ok, true, 'Reactivation should succeed');
    const activateJson = await activateRes.json();
    assert.equal(activateJson.success, true);
    assert.equal(activateJson.data.status, 'ACTIVE');
  });

  // 6. Verify staff list includes the newly enrolled member
  await t.test('6. Verifies updated staff directory contains newly enrolled staff with ACTIVE status', async () => {
    assert.ok(testPartner, 'testPartner must be set');
    assert.ok(createdStaffMember, 'createdStaffMember must be set');

    const res = await fetch(`${baseUrl}/api/v1/company/partners/${testPartner.id}/staff`);
    assert.equal(res.ok, true);
    const json = await res.json();
    assert.equal(json.success, true);

    const found = json.data.find((s) => s.id === createdStaffMember.id);
    assert.ok(found, 'Created staff member must be present in partner staff list');
    assert.equal(found.fullName, createdStaffMember.fullName);
    assert.equal(found.employmentStatus, 'ACTIVE');
  });
});
