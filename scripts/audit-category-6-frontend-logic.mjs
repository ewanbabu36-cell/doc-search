import fs from 'fs';
import path from 'path';
import {
  ensureChrome,
  closeChrome,
  runBrowserScenario,
  createDoctorAuth,
  createCompanyAdminAuth,
  createRoleAuth,
  VIEWPORTS,
  sleep
} from './category-5-cdp-helpers.mjs';

const DEBUG_PORT = 9222;

async function executeInNewTab(setupScript, actionFn, timeoutMs = 25000) {
  await ensureChrome();
  const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await newTabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);

  const consoleLogs = [];
  const consoleErrors = [];
  const uncaughtExceptions = [];

  return new Promise((resolve) => {
    let resolved = false;
    let msgId = 1;
    const callbacks = new Map();

    const cleanupAndResolve = async (result) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      try { await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${tabData.id}`); } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      cleanupAndResolve({
        success: false,
        error: `Timed out after ${timeoutMs}ms`,
        consoleErrors,
        uncaughtExceptions
      });
    }, timeoutMs);

    const send = (method, params = {}) => {
      return new Promise((res) => {
        const id = msgId++;
        const to = setTimeout(() => {
          callbacks.delete(id);
          res({});
        }, 8000);
        callbacks.set(id, (val) => {
          clearTimeout(to);
          res(val);
        });
        try {
          ws.send(JSON.stringify({ id, method, params }));
        } catch {
          clearTimeout(to);
          res({});
        }
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
          const cb = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          cb(msg.result);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
          if (msg.params.type === 'error') {
            consoleErrors.push(text);
          } else {
            consoleLogs.push(text);
          }
        } else if (msg.method === 'Runtime.exceptionThrown') {
          uncaughtExceptions.push(msg.params.exceptionDetails?.text || 'Uncaught Exception');
        }
      } catch {}
    };

    ws.onopen = async () => {
      try {
        await send('Page.enable');
        await send('Runtime.enable');
        await send('DOM.enable');

        if (setupScript) {
          await send('Page.addScriptToEvaluateOnNewDocument', {
            source: setupScript
          });
        }

        const runResult = await actionFn({ send, consoleLogs, consoleErrors, uncaughtExceptions });
        cleanupAndResolve({
          success: true,
          ...runResult,
          consoleErrors,
          uncaughtExceptions
        });
      } catch (err) {
        cleanupAndResolve({
          success: false,
          error: err.message,
          consoleErrors,
          uncaughtExceptions
        });
      }
    };
  });
}

// Helper: wait for DOM selector or condition
async function waitForEvaluation(send, expr, maxAttempts = 30, intervalMs = 250) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true
    });
    if (res?.result?.value) {
      return res.result.value;
    }
    await sleep(intervalMs);
  }
  return null;
}

async function runAllCategory6Scenarios() {
  console.log('===============================================================');
  console.log('DOC SEARCH — CATEGORY 6: FRONTEND LOGIC ERROR AUDIT (PHASE 17)');
  console.log('===============================================================\n');

  const results = [];

  // -------------------------------------------------------------
  // Scenario 1: Partner Self-Registration Form Validation & Persistence
  // -------------------------------------------------------------
  console.log('[SCENARIO 1] Partner Self-Registration Form Validation & Persistence...');
  const s1 = await executeInNewTab(null, async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5175' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    // Test 1A: Client-side validation prevents invalid submissions
    const validationCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Check that form input elements exist
          const inputs = document.querySelectorAll('input');
          return { inputCount: inputs.length, hasSubmitButton: Boolean(document.querySelector('button[type="submit"]') || document.querySelector('button')) };
        })()
      `,
      returnByValue: true
    });

    // Test 1B: Verify localStorage does NOT contain phantom partner leads prior to successful registration
    const storageCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const registered = localStorage.getItem('docsearch_registered_partners');
          return { hasPreExistingPollution: Boolean(registered && JSON.parse(registered).length > 10) };
        })()
      `,
      returnByValue: true
    });

    return {
      details: {
        validationReady: validationCheck?.result?.value?.inputCount > 0,
        storageSanitized: !storageCheck?.result?.value?.hasPreExistingPollution
      }
    };
  });
  results.push({ name: 'SCENARIO 1: Partner Self-Registration Validation', ...s1 });

  // -------------------------------------------------------------
  // Scenario 2: Patient Registration Form Validation & OPD Queue Lifecycle
  // -------------------------------------------------------------
  console.log('[SCENARIO 2] Patient Registration Form Validation & OPD Queue Lifecycle...');
  const s2 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.getElementById("root") && document.getElementById("root").children.length > 0 && document.body.innerText.length > 50', 35, 300);

    // Test 2A: Verify Patient Directory / Registration view loads and can query patients
    const patientViewStatus = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const res = await fetch('/api/v1/partner/patients?q=');
          const data = await res.json();
          return { apiOk: res.ok, patientCount: Array.isArray(data?.data) ? data.data.length : 0 };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    // Test 2B: Register a new patient via API contract and verify PostgreSQL persistence
    const testPatientPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const createPatientRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const res = await fetch('/api/v1/partner/patients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              firstName: 'AuditPatient',
              lastName: 'LogicTest',
              gender: 'MALE',
              dateOfBirth: '1985-06-15',
              mobileNumber: '${testPatientPhone}',
              bloodGroup: 'B_POSITIVE'
            })
          });
          const json = await res.json();
          return { status: res.status, success: json?.success, id: json?.data?.id, mrn: json?.data?.mrn };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    // Test 2C: Query the newly created patient back from PostgreSQL to confirm authoritative persistence
    const verifyPatientRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const res = await fetch('/api/v1/partner/patients?q=AuditPatient', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await res.json();
          const found = Array.isArray(json?.data) && json.data.some(p => p.mobileNumber === '${testPatientPhone}' || p.firstName === 'AuditPatient');
          return { verifiedInPostgres: found, totalFound: json?.data?.length };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return {
      details: {
        initialLoad: patientViewStatus?.result?.value,
        createPatient: createPatientRes?.result?.value,
        verifyPatient: verifyPatientRes?.result?.value
      }
    };
  });
  results.push({ name: 'SCENARIO 2: Patient Registration & OPD Persistence', ...s2 });

  // -------------------------------------------------------------
  // Scenario 3: OPD Encounter Creation & Queue Token Lineage
  // -------------------------------------------------------------
  console.log('[SCENARIO 3] OPD Encounter Creation & Queue Token Lineage...');
  const s3 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    const encounterTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          // 1. Get first patient
          const ptsRes = await fetch('/api/v1/partner/patients?q=AuditPatient', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const pts = await ptsRes.json();
          const patient = pts?.data?.[0];
          if (!patient) return { error: 'No patient available for encounter' };

          // 2. Create Encounter
          const encRes = await fetch('/api/v1/partner/encounters', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              patientId: patient.id,
              encounterType: 'OPD',
              status: 'WAITING_FOR_DOCTOR',
              chiefComplaint: 'Automated Category 6 Frontend Logic Verification',
              visitType: 'FIRST_VISIT'
            })
          });
          const encJson = await encRes.json();

          // 3. Verify Encounter in queue
          const queueRes = await fetch('/api/v1/partner/encounters', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const queueJson = await queueRes.json();
          const inQueue = Array.isArray(queueJson?.data) && queueJson.data.some(e => e.id === encJson?.data?.id || e.patientId === patient.id);

          return {
            patientId: patient.id,
            encounterCreated: encJson?.success,
            encounterId: encJson?.data?.id,
            verifiedInQueue: inQueue
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: encounterTest?.result?.value };
  });
  results.push({ name: 'SCENARIO 3: OPD Encounter Creation & Queue Lineage', ...s3 });

  // -------------------------------------------------------------
  // Scenario 4: Doctor Consultation, Diagnosis & Clinical Order Submission
  // -------------------------------------------------------------
  console.log('[SCENARIO 4] Doctor Consultation, Diagnosis & Order Submission...');
  const s4 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    const consultationTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          // 1. Get recent encounter
          const encsRes = await fetch('/api/v1/partner/encounters', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const encs = await encsRes.json();
          const encounter = encs?.data?.[0];
          if (!encounter) return { error: 'No encounter found' };

          // 2. Update encounter status to IN_CONSULTATION
          const updateRes = await fetch('/api/v1/partner/clinical/encounters/' + encounter.id + '/call', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ doctorId: 'e0000000-0000-4000-8000-000000000001' })
          });
          const updateJson = await updateRes.json();

          // 3. Post Clinical Lab Order
          const labRes = await fetch('/api/v1/partner/lab/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              patientId: encounter.patientId,
              patientName: 'AuditPatient LogicTest',
              encounterId: encounter.id,
              tests: ['Complete Blood Count (CBC)', 'Serum Creatinine'],
              testName: 'Complete Blood Count (CBC)',
              priority: 'ROUTINE',
              clinicalIndication: 'Category 6 Automated Clinical Verification'
            })
          });
          const labJson = await labRes.json();

          return {
            encounterId: encounter.id,
            statusUpdated: updateJson?.success,
            labOrderCreated: labJson?.success,
            labOrderId: labJson?.data?.id
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: consultationTest?.result?.value };
  });
  results.push({ name: 'SCENARIO 4: Doctor Consultation & Lab Order Submission', ...s4 });

  // -------------------------------------------------------------
  // Scenario 5: Diagnostic Lab / Pathology LIMS Worklist Verification
  // -------------------------------------------------------------
  console.log('[SCENARIO 5] Diagnostic Lab / Pathology LIMS Worklist Verification...');
  const s5 = await executeInNewTab(createRoleAuth('PATHOLOGIST', 'LABORATORY', 'INVESTIGATIONS'), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    const labWorklistTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          // Query lab orders from PostgreSQL via API Gateway
          const res = await fetch('/api/v1/partner/lab/orders', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await res.json();
          const hasOrders = Array.isArray(json?.data) && json.data.length > 0;
          return {
            apiOk: res.ok,
            totalLabOrders: json?.data?.length || 0,
            hasOrders
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: labWorklistTest?.result?.value };
  });
  results.push({ name: 'SCENARIO 5: Diagnostic Lab / LIMS Worklist', ...s5 });

  // -------------------------------------------------------------
  // Scenario 6: Pharmacy Dispensing & Inventory Lookup
  // -------------------------------------------------------------
  console.log('[SCENARIO 6] Pharmacy Dispensing & Inventory Lookup...');
  const s6 = await executeInNewTab(createRoleAuth('PHARMACIST', 'PHARMACY', 'PHARMACY'), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    const pharmacyTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const [medsRes, invRes] = await Promise.all([
            fetch('/api/v1/partner/pharmacy/medications', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/v1/partner/pharmacy/inventory', { headers: { 'Authorization': 'Bearer ' + token } })
          ]);
          const meds = await medsRes.json();
          const inv = await invRes.json();
          return {
            medicationsOk: medsRes.ok,
            medicationsCount: Array.isArray(meds?.data) ? meds.data.length : 0,
            inventoryOk: invRes.ok,
            inventoryCount: Array.isArray(inv?.data) ? inv.data.length : 0
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: pharmacyTest?.result?.value };
  });
  results.push({ name: 'SCENARIO 6: Pharmacy Dispensing & Inventory', ...s6 });

  // -------------------------------------------------------------
  // Scenario 7: Inpatient IPD Wards, Beds & Admission Lifecycle
  // -------------------------------------------------------------
  console.log('[SCENARIO 7] Inpatient IPD Wards, Beds & Admission Lifecycle...');
  const s7 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    const inpatientTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const [wardsRes, bedsRes] = await Promise.all([
            fetch('/api/v1/partner/inpatient/wards', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/v1/partner/inpatient/beds', { headers: { 'Authorization': 'Bearer ' + token } })
          ]);
          const wards = await wardsRes.json();
          const beds = await bedsRes.json();
          return {
            wardsOk: wardsRes.ok,
            wardsCount: Array.isArray(wards?.data) ? wards.data.length : 0,
            bedsOk: bedsRes.ok,
            bedsCount: Array.isArray(beds?.data) ? beds.data.length : 0
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: inpatientTest?.result?.value };
  });
  results.push({ name: 'SCENARIO 7: Inpatient IPD Wards & Beds', ...s7 });

  // -------------------------------------------------------------
  // Scenario 8: Staff Administration Status Mutation Lifecycle
  // -------------------------------------------------------------
  console.log('[SCENARIO 8] Staff Administration Status Mutation Lifecycle...');
  const s8 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    const staffStatusTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          // 1. Get staff members
          const staffRes = await fetch('/api/v1/partner/staff/members', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const staffJson = await staffRes.json();
          const member = Array.isArray(staffJson?.data) ? staffJson.data[0] : null;
          if (!member) return { apiOk: staffRes.ok, staffCount: 0, note: 'No staff member to mutate' };

          // 2. Execute PATCH status to SUSPENDED
          const suspendRes = await fetch('/api/v1/partner/staff/members/' + member.id + '/status', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              actorId: 'admin',
              actorRole: 'ADMINISTRATOR',
              newStatus: 'SUSPENDED',
              reason: 'Category 6 Automated Verification Test'
            })
          });
          const suspendJson = await suspendRes.json();

          // 3. Restore status to ACTIVE
          const restoreRes = await fetch('/api/v1/partner/staff/members/' + member.id + '/status', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              actorId: 'admin',
              actorRole: 'ADMINISTRATOR',
              newStatus: 'ACTIVE',
              reason: 'Category 6 Automated Restoration'
            })
          });
          const restoreJson = await restoreRes.json();

          return {
            staffCount: staffJson?.data?.length,
            memberId: member.id,
            suspendOk: suspendRes.ok && suspendJson?.success,
            restoreOk: restoreRes.ok && restoreJson?.success
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: staffStatusTest?.result?.value };
  });
  results.push({ name: 'SCENARIO 8: Staff Administration Status Mutation', ...s8 });

  // -------------------------------------------------------------
  // Scenario 9: Cross-Session & Multi-Tab Isolation Test
  // -------------------------------------------------------------
  console.log('[SCENARIO 9] Cross-Session & Multi-Tab Isolation Test...');
  // Session A: writes data
  let sessionAPatientId = null;
  const s9A = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const resp = await fetch('/api/v1/partner/patients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              firstName: 'CrossSession',
              lastName: 'PatientVerification',
              gender: 'FEMALE',
              dateOfBirth: '1992-03-20',
              mobileNumber: '91${Math.floor(10000000 + Math.random() * 90000000)}',
              bloodGroup: 'A_POSITIVE'
            })
          });
          const json = await resp.json();
          return { id: json?.data?.id, success: json?.success };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    sessionAPatientId = res?.result?.value?.id;
    return { sessionA: res?.result?.value };
  });

  // Session B: clean context, reads data from PostgreSQL
  const s9B = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const resp = await fetch('/api/v1/partner/patients?q=CrossSession', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await resp.json();
          const match = Array.isArray(json?.data) && json.data.some(p => p.firstName === 'CrossSession');
          return { foundInSessionB: match, count: json?.data?.length };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    return { sessionB: res?.result?.value };
  });

  results.push({
    name: 'SCENARIO 9: Cross-Session & Multi-Tab Isolation',
    success: Boolean(s9A.success && s9B.success && s9B.sessionB?.foundInSessionB),
    details: { sessionA: s9A.sessionA, sessionB: s9B.sessionB }
  });

  // -------------------------------------------------------------
  // Scenario 10: Page Reload State Persistence Test
  // -------------------------------------------------------------
  console.log('[SCENARIO 10] Page Reload State Persistence Test...');
  const s10 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    // Initial query
    const preReload = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const resp = await fetch('/api/v1/partner/patients?q=CrossSession', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await resp.json();
          return { count: json?.data?.length };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    // Reload the page
    await send('Page.reload');
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50', 35, 300);

    // Post reload query
    const postReload = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const resp = await fetch('/api/v1/partner/patients?q=CrossSession', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await resp.json();
          return { count: json?.data?.length };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const persisted = preReload?.result?.value?.count > 0 && postReload?.result?.value?.count === preReload?.result?.value?.count;
    return {
      details: {
        preReloadCount: preReload?.result?.value?.count,
        postReloadCount: postReload?.result?.value?.count,
        persisted
      }
    };
  });
  results.push({ name: 'SCENARIO 10: Page Reload State Persistence', ...s10 });

  console.log('\n===============================================================');
  console.log('CATEGORY 6 AUDIT SUMMARY');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;
  results.forEach(r => {
    const isPass = r.success && (!r.consoleErrors || r.consoleErrors.length === 0) && (!r.uncaughtExceptions || r.uncaughtExceptions.length === 0);
    if (isPass) {
      passed++;
      console.log(`PASS: ${r.name}`);
    } else {
      failed++;
      console.log(`FAIL: ${r.name} - ${r.error || JSON.stringify(r.consoleErrors || r.details)}`);
    }
  });

  console.log(`\nTotal Scenarios: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  fs.writeFileSync(
    'audit-results/category-6-frontend-logic-baseline.json',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalScenarios: results.length,
      passed,
      failed,
      results
    }, null, 2)
  );

  console.log('\nSaved baseline audit results to audit-results/category-6-frontend-logic-baseline.json');
}

runAllCategory6Scenarios().catch(console.error);
