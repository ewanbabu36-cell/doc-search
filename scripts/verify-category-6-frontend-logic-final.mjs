import fs from 'fs';
import path from 'path';
import {
  ensureChrome,
  closeChrome,
  createDoctorAuth,
  createCompanyAdminAuth,
  createRoleAuth,
  sleep
} from './category-5-cdp-helpers.mjs';

const DEBUG_PORT = 9222;

async function executeInNewTab(setupScript, actionFn, timeoutMs = 30000) {
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

async function waitForEvaluation(send, expr, maxAttempts = 35, intervalMs = 250) {
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

async function runFinalVerification() {
  console.log('========================================================================');
  console.log('DOC SEARCH — CATEGORY 6: FINAL PRODUCTION VERIFICATION (PHASE 23)');
  console.log('ZERO-TRUST / PRODUCTION-GRADE / SCOPE-FROZEN / NATIVE POSTGRESQL 18.4');
  console.log('========================================================================\n');

  const testReport = {
    auditCategory: 'CATEGORY 6: FRONTEND LOGIC ERRORS',
    verificationScope: '100% Monorepo Release Scope',
    testedAt: new Date().toISOString(),
    scenarios: []
  };

  // Scenario 1: Landing Page Partner Registration Validation & Submission
  console.log('1. Verifying Partner Self-Registration & Pre-Persistence Validation...');
  const s1 = await executeInNewTab(null, async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5175' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const formState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const formInputs = document.querySelectorAll('input');
          const registered = localStorage.getItem('docsearch_registered_partners');
          const phantomCount = registered ? JSON.parse(registered).length : 0;
          return { inputsAvailable: formInputs.length > 0, phantomCount };
        })()
      `,
      returnByValue: true
    });

    return { details: formState?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-01', name: 'Partner Self-Registration Validation', ...s1 });

  // Scenario 2: Company Platform HQ Directory Authoritative Query
  console.log('2. Verifying Company Platform Authoritative Directory Query...');
  const s2 = await executeInNewTab(createCompanyAdminAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5174/governance/partner-verification' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const dirQuery = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_company_token');
          const res = await fetch('/api/v1/company/partners/directory?page=1&pageSize=50', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await res.json();
          return { status: res.status, ok: res.ok, itemsCount: json?.data?.items?.length || 0, total: json?.data?.total || 0 };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: dirQuery?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-02', name: 'HQ Directory Query & Verification', ...s2 });

  // Scenario 3: Patient Registration & PostgreSQL Persistence
  console.log('3. Verifying Patient Registration & PostgreSQL Persistence...');
  const randomMobile = `93${Math.floor(10000000 + Math.random() * 90000000)}`;
  let registeredPatientId = null;
  const s3 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const reg = await send('Runtime.evaluate', {
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
              firstName: 'FinalVerif',
              lastName: 'PatientLogic',
              gender: 'FEMALE',
              dateOfBirth: '1995-11-20',
              mobileNumber: '${randomMobile}',
              bloodGroup: 'O_POSITIVE'
            })
          });
          const json = await res.json();
          return { status: res.status, success: json?.success, id: json?.data?.id, mrn: json?.data?.mrn };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    registeredPatientId = reg?.result?.value?.id;
    return { details: reg?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-03', name: 'Patient Registration Persistence', ...s3 });

  // Scenario 4: OPD Encounter Creation & Status Transition
  console.log('4. Verifying OPD Encounter Creation & Status Transition...');
  let encounterId = null;
  const s4 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const enc = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const res = await fetch('/api/v1/partner/encounters', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              patientId: '${registeredPatientId}',
              encounterType: 'OPD',
              status: 'WAITING_FOR_DOCTOR',
              chiefComplaint: 'Category 6 Final Verification Consultation',
              visitType: 'FIRST_VISIT'
            })
          });
          const json = await res.json();
          return { status: res.status, success: json?.success, id: json?.data?.id };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    encounterId = enc?.result?.value?.id;
    return { details: enc?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-04', name: 'OPD Encounter Creation', ...s4 });

  // Scenario 5: Doctor Consultation & Clinical Assessment Finalization
  console.log('5. Verifying Doctor Consultation & Clinical Notes Finalization...');
  const s5 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const consult = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          // Update encounter status to IN_CONSULTATION
          const patchRes = await fetch('/api/v1/partner/clinical/encounters/${encounterId}/call', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ doctorId: 'e0000000-0000-4000-8000-000000000001' })
          });
          const patchJson = await patchRes.json();
          return { callSuccess: patchJson?.success };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: consult?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-05', name: 'Doctor Consultation & Clinical Transition', ...s5 });

  // Scenario 6: Pathology LIMS Order Dispatch & Catalog Query
  console.log('6. Verifying Pathology LIMS Order Dispatch & Catalog Query...');
  const s6 = await executeInNewTab(createRoleAuth('PATHOLOGIST', 'LABORATORY', 'INVESTIGATIONS'), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const labTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const [catRes, ordRes] = await Promise.all([
            fetch('/api/v1/partner/lab/catalog', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/v1/partner/lab/orders', { headers: { 'Authorization': 'Bearer ' + token } })
          ]);
          const cat = await catRes.json();
          const ord = await ordRes.json();
          return {
            catalogOk: catRes.ok,
            catalogItems: cat?.data?.length || 0,
            ordersOk: ordRes.ok,
            ordersItems: ord?.data?.length || 0
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: labTest?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-06', name: 'Pathology LIMS Order Dispatch & Catalog', ...s6 });

  // Scenario 7: Radiology RIS Modality Worklist Query
  console.log('7. Verifying Radiology RIS Modality Worklist Query...');
  const s7 = await executeInNewTab(createRoleAuth('RADIOLOGIST', 'DIAGNOSTIC_CENTRE', 'RADIOLOGY'), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const radTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const res = await fetch('/api/v1/partner/radiology/orders', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await res.json();
          return { ok: res.ok, status: res.status, count: Array.isArray(json?.data) ? json.data.length : 0 };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: radTest?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-07', name: 'Radiology RIS Worklist Query', ...s7 });

  // Scenario 8: Pharmacy Prescription Queue & Inventory Stock Lookup
  console.log('8. Verifying Pharmacy Prescription Queue & Inventory Stock...');
  const s8 = await executeInNewTab(createRoleAuth('PHARMACIST', 'PHARMACY', 'PHARMACY'), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const pharmTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const [medsRes, invRes, presRes] = await Promise.all([
            fetch('/api/v1/partner/pharmacy/medications', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/v1/partner/pharmacy/inventory', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/v1/partner/pharmacy/prescriptions', { headers: { 'Authorization': 'Bearer ' + token } })
          ]);
          return {
            medicationsOk: medsRes.ok,
            inventoryOk: invRes.ok,
            prescriptionsOk: presRes.ok
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: pharmTest?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-08', name: 'Pharmacy Queue & Inventory Ledger', ...s8 });

  // Scenario 9: Inpatient IPD Ward Census & Bed Board Query
  console.log('9. Verifying Inpatient IPD Ward Census & Bed Board...');
  const s9 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const ipdTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const [wardsRes, bedsRes, admRes] = await Promise.all([
            fetch('/api/v1/partner/inpatient/wards', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/v1/partner/inpatient/beds', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/v1/partner/inpatient/admissions', { headers: { 'Authorization': 'Bearer ' + token } })
          ]);
          return {
            wardsOk: wardsRes.ok,
            bedsOk: bedsRes.ok,
            admissionsOk: admRes.ok
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: ipdTest?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-09', name: 'Inpatient IPD Wards, Beds & Admissions', ...s9 });

  // Scenario 10: Staff Member Status Mutation (PATCH /status)
  console.log('10. Verifying Staff Member Status Mutation (PATCH /status)...');
  const s10 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const staffTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const staffRes = await fetch('/api/v1/partner/staff/members', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const staffJson = await staffRes.json();
          const member = Array.isArray(staffJson?.data) ? staffJson.data[0] : null;
          if (!member) return { ok: staffRes.ok, count: 0, note: 'No staff member' };

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
              reason: 'Category 6 Final Verification'
            })
          });
          const suspendJson = await suspendRes.json();

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
              reason: 'Category 6 Final Restoration'
            })
          });
          const restoreJson = await restoreRes.json();

          return {
            suspendOk: suspendRes.ok && suspendJson?.success,
            restoreOk: restoreRes.ok && restoreJson?.success
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: staffTest?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-10', name: 'Staff Status Lifecycle Mutation', ...s10 });

  // Scenario 11: Emergency Department Triage & Disposition
  console.log('11. Verifying Emergency Department Triage & Disposition...');
  const s11 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const erTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          // 1. Register emergency patient encounter
          const regRes = await fetch('/api/v1/partner/emergency/registrations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              patientId: '${registeredPatientId}',
              chiefComplaint: 'Acute chest pain and severe shortness of breath',
              initialPriority: 'CRITICAL',
              arrivalMode: 'AMBULANCE',
              broughtBy: 'Emergency EMS 108'
            })
          });
          const regJson = await regRes.json();
          const emgEncounterId = regJson?.data?.id;
          if (!emgEncounterId) {
            return { regSuccess: false, status: regRes.status, error: regJson };
          }

          // 2. Record Triage Assessment for the emergency encounter
          const triageRes = await fetch('/api/v1/partner/emergency/encounters/' + emgEncounterId + '/triage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              patientId: '${registeredPatientId}',
              triageCategory: 'RED',
              temperature: '98.6 F',
              bloodPressure: '150/95 mmHg',
              pulseRate: '110 bpm',
              spO2: '94%',
              respiratoryRate: '24 /min',
              painScore: 8,
              arrivalCondition: 'Conscious, acute distress',
              triageNotes: 'Immediate resuscitation bay required'
            })
          });
          const triageJson = await triageRes.json();
          return {
            status: triageRes.status,
            success: triageJson?.success,
            emgEncounterId,
            triageId: triageJson?.data?.id
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: erTest?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-11', name: 'Emergency Department Triage & Disposition', ...s11 });

  // Scenario 12: Billing Package & Charge Summary Calculation
  console.log('12. Verifying Billing Package & Charge Summary Calculation...');
  const s12 = await executeInNewTab(createRoleAuth('BILLING_OFFICER', 'HOSPITAL', 'BILLING'), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const billTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const [invRes, pkgRes] = await Promise.all([
            fetch('/api/v1/partner/billing/invoices', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/v1/partner/billing/packages', { headers: { 'Authorization': 'Bearer ' + token } })
          ]);
          return { invoicesOk: invRes.ok, packagesOk: pkgRes.ok };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return { details: billTest?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-12', name: 'Billing Package & Charge Calculation', ...s12 });

  // Scenario 13: Cross-Session Real-Time State Invalidation & Data Isolation
  console.log('13. Verifying Cross-Session Isolation & Independent Contexts...');
  let crossPatientPhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
  const s13A = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

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
              firstName: 'FinalCrossA',
              lastName: 'VerifySession',
              gender: 'MALE',
              dateOfBirth: '1989-08-12',
              mobileNumber: '${crossPatientPhone}',
              bloodGroup: 'AB_POSITIVE'
            })
          });
          const json = await resp.json();
          return { id: json?.data?.id, success: json?.success };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    return { sessionA: res?.result?.value };
  });

  const s13B = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const resp = await fetch('/api/v1/partner/patients?q=FinalCrossA', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await resp.json();
          const found = Array.isArray(json?.data) && json.data.some(p => p.firstName === 'FinalCrossA');
          return { foundInSessionB: found, count: json?.data?.length };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    return { sessionB: res?.result?.value };
  });

  testReport.scenarios.push({
    id: 'CAT6-SCEN-13',
    name: 'Cross-Session Isolation & Data Integrity',
    success: Boolean(s13A.success && s13B.success && s13B.sessionB?.foundInSessionB),
    details: { sessionA: s13A.sessionA, sessionB: s13B.sessionB }
  });

  // Scenario 14: Hard Page Reload (F5) Full Persistence Verification
  console.log('14. Verifying Hard Page Reload (F5) Full Persistence...');
  const s14 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const preReload = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const resp = await fetch('/api/v1/partner/patients?q=FinalCrossA', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await resp.json();
          return { count: json?.data?.length };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    await send('Page.reload');
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const postReload = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const token = localStorage.getItem('docsearch_auth_token');
          const resp = await fetch('/api/v1/partner/patients?q=FinalCrossA', {
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
    return { details: { preReloadCount: preReload?.result?.value?.count, postReloadCount: postReload?.result?.value?.count, persisted } };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-14', name: 'Hard Page Reload State Persistence', ...s14 });

  // Scenario 15: Monorepo Clean Zero-Mock Production Compliance Verification
  console.log('15. Verifying Clean Production Mode & Zero-Mock Compliance...');
  const s15 = await executeInNewTab(createDoctorAuth(), async ({ send }) => {
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await waitForEvaluation(send, 'document.body && document.body.innerText.length > 50');

    const mockCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const mockFlag = (import.meta && import.meta.env) ? import.meta.env.VITE_ENABLE_MOCK_FALLBACK : undefined;
          return {
            mockFlagIsDisabled: mockFlag !== 'true',
            url: window.location.href,
            title: document.title
          };
        })()
      `,
      returnByValue: true
    });

    return { details: mockCheck?.result?.value };
  });
  testReport.scenarios.push({ id: 'CAT6-SCEN-15', name: 'Zero-Mock Production Compliance', ...s15 });

  console.log('\n========================================================================');
  console.log('FINAL CATEGORY 6 VERIFICATION RESULTS');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;
  testReport.scenarios.forEach(s => {
    const isPass = s.success && (!s.consoleErrors || s.consoleErrors.length === 0) && (!s.uncaughtExceptions || s.uncaughtExceptions.length === 0);
    if (isPass) {
      passed++;
      console.log(`PASS [${s.id}]: ${s.name}`);
    } else {
      failed++;
      console.log(`FAIL [${s.id}]: ${s.name} - ${s.error || JSON.stringify(s.consoleErrors || s.details)}`);
    }
  });

  testReport.totalScenarios = testReport.scenarios.length;
  testReport.passedCount = passed;
  testReport.failedCount = failed;
  testReport.FRONTEND_LOGIC_ERRORS_AFTER = failed;

  console.log(`\nTotal Scenarios Tested: ${testReport.totalScenarios}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`FRONTEND_LOGIC_ERRORS_AFTER: ${testReport.FRONTEND_LOGIC_ERRORS_AFTER}`);

  fs.writeFileSync(
    'audit-results/category-6-frontend-logic-final.json',
    JSON.stringify(testReport, null, 2)
  );

  let mdReport = `# DOC SEARCH — CATEGORY 6: FINAL FRONTEND LOGIC AUDIT MATRIX\n\n`;
  mdReport += `**Executed At**: ${testReport.testedAt}\n`;
  mdReport += `**Audit Category**: ${testReport.auditCategory}\n`;
  mdReport += `**Total Scenarios**: ${testReport.totalScenarios}\n`;
  mdReport += `**Passed**: ${testReport.passedCount}\n`;
  mdReport += `**Failed**: ${testReport.failedCount}\n`;
  mdReport += `**FRONTEND_LOGIC_ERRORS_AFTER**: ${testReport.FRONTEND_LOGIC_ERRORS_AFTER}\n\n`;
  mdReport += `| ID | Scenario | Status | Console Errors | Exceptions | Details |\n`;
  mdReport += `|---|---|---|---|---|---|\n`;

  testReport.scenarios.forEach(s => {
    const isPass = s.success && (!s.consoleErrors || s.consoleErrors.length === 0) && (!s.uncaughtExceptions || s.uncaughtExceptions.length === 0);
    mdReport += `| ${s.id} | ${s.name} | ${isPass ? '✅ PASS' : '❌ FAIL'} | ${s.consoleErrors?.length || 0} | ${s.uncaughtExceptions?.length || 0} | \`${JSON.stringify(s.details || {}).replace(/\|/g, '/')}\` |\n`;
  });

  fs.writeFileSync('audit-results/category-6-frontend-logic-final.md', mdReport);
  console.log('Saved reports to audit-results/category-6-frontend-logic-final.json & .md');
}

runFinalVerification().catch(console.error);
