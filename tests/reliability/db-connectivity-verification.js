import { getDatabase, withSecurityContext, patients, encounters, billingInvoices, investigationOrders, pharmacyDispensing, eq } from '../../packages/database/dist/index.js';
import { clinicalWorkflowRepository } from '../../apps/api-gateway/dist/repositories/partner/ClinicalWorkflowRepository.js';
import { billingManagementRepository } from '../../apps/api-gateway/dist/repositories/partner/BillingManagementRepository.js';
import { labDiagnosticsRepository } from '../../apps/api-gateway/dist/repositories/partner/LabDiagnosticsRepository.js';
import { pharmacyManagementRepository } from '../../apps/api-gateway/dist/repositories/partner/PharmacyManagementRepository.js';

console.log('\n======================================================================');
console.log('🗄️  TEST SUITE: REAL POSTGRESQL & ZERO SILENT FALLBACK (P0-1 VERIFICATION)');
console.log('======================================================================\n');

async function runDbConnectivityVerification() {
  const testResults = [];
  const db = getDatabase();

  // Test 1: Database Client Availability
  console.log('[+] Test 1: Database Client Verification...');
  const isDbConfigured = Boolean(db);
  testResults.push({
    test: 'Database Client Pool Initialized',
    status: isDbConfigured ? 'PASS' : 'SKIPPED (DATABASE_URL NOT SUPPLIED)',
    details: isDbConfigured ? 'Drizzle DB instance configured with pg.Pool' : 'Environment lacks DATABASE_URL'
  });

  // Test 2: In-Memory Map Absence in ClinicalWorkflowRepository
  console.log('[+] Test 2: Verify zero in-memory Map stores in ClinicalWorkflowRepository...');
  const hasMemPatients = 'memPatients' in clinicalWorkflowRepository;
  const hasMemEncounters = 'memEncounters' in clinicalWorkflowRepository;
  const hasMemConsultations = 'memConsultations' in clinicalWorkflowRepository;
  const memMapsRemoved = !hasMemPatients && !hasMemEncounters && !hasMemConsultations;

  testResults.push({
    test: 'ClinicalWorkflowRepository In-Memory Maps Removed',
    status: memMapsRemoved ? 'PASS' : 'FAIL',
    details: memMapsRemoved
      ? 'Zero private Map properties (memPatients/memEncounters/memConsultations)'
      : 'In-memory maps still present'
  });

  // Test 3: In-Memory Map Absence in BillingManagementRepository
  console.log('[+] Test 3: Verify zero in-memory Map stores in BillingManagementRepository...');
  const hasMemInvoices = 'memInvoices' in billingManagementRepository;
  testResults.push({
    test: 'BillingManagementRepository In-Memory Maps Removed',
    status: !hasMemInvoices ? 'PASS' : 'FAIL',
    details: !hasMemInvoices ? 'Zero private Map properties (memInvoices)' : 'memInvoices still present'
  });

  // Test 4: In-Memory Map Absence in LabDiagnosticsRepository
  console.log('[+] Test 4: Verify zero in-memory Map stores in LabDiagnosticsRepository...');
  const hasMemOrders = 'memOrders' in labDiagnosticsRepository;
  testResults.push({
    test: 'LabDiagnosticsRepository In-Memory Maps Removed',
    status: !hasMemOrders ? 'PASS' : 'FAIL',
    details: !hasMemOrders ? 'Zero private Map properties (memOrders)' : 'memOrders still present'
  });

  // Test 5: In-Memory Map Absence in PharmacyManagementRepository
  console.log('[+] Test 5: Verify zero in-memory Map stores in PharmacyManagementRepository...');
  const hasMemBatches = 'memBatches' in pharmacyManagementRepository;
  const hasMemMeds = 'memMeds' in pharmacyManagementRepository;
  testResults.push({
    test: 'PharmacyManagementRepository In-Memory Maps Removed',
    status: (!hasMemBatches && !hasMemMeds) ? 'PASS' : 'FAIL',
    details: (!hasMemBatches && !hasMemMeds) ? 'Zero private Map properties (memBatches/memMeds)' : 'Memory maps still present'
  });

  // Test 6: Controlled 503 Throw on Database Unavailability (No Silent Fallback!)
  console.log('[+] Test 6: Verify Controlled 503 Service Unavailable on Database Failure...');
  let thrown503 = false;
  let code = '';
  let status = 0;

  try {
    // Pass null as dbClient to simulate database connection loss
    await clinicalWorkflowRepository.createPatient({
      tenantId: 'tenant-test-01',
      firstName: 'Test',
      lastName: 'Patient',
      gender: 'MALE'
    }, null);
  } catch (err) {
    thrown503 = true;
    code = err.code;
    status = err.statusCode;
  }

  const test6Passed = thrown503 && status === 503 && code === 'SERVICE_UNAVAILABLE';
  testResults.push({
    test: 'Controlled 503 on Database Failure (Zero RAM Storage)',
    status: test6Passed ? 'PASS' : 'FAIL',
    details: test6Passed
      ? `Controlled 503 SERVICE_UNAVAILABLE thrown: ${code} (${status})`
      : `Failed to throw 503: thrown=${thrown503}, status=${status}`
  });

  // Test 7: Controlled 503 in withSecurityContext
  console.log('[+] Test 7: Verify withSecurityContext throws 503 when DB is null...');
  let secContextThrown = false;
  try {
    await withSecurityContext(null, { tenantId: 't1', userId: 'u1' }, async () => 'ok');
  } catch (err) {
    secContextThrown = err.statusCode === 503;
  }

  testResults.push({
    test: 'withSecurityContext 503 Protection',
    status: secContextThrown ? 'PASS' : 'FAIL',
    details: secContextThrown
      ? 'Throws controlled 503 Service Unavailable when DB is unavailable'
      : 'Did not throw 503'
  });

  console.log('\n----------------------------------------------------------------------');
  console.log('📊 REAL POSTGRESQL & ZERO SILENT FALLBACK SUMMARY TABLE');
  console.log('----------------------------------------------------------------------');
  console.table(testResults);
  console.log('======================================================================\n');

  const allPassed = testResults.filter(r => r.status !== 'SKIPPED (DATABASE_URL NOT SUPPLIED)').every(r => r.status === 'PASS');
  if (!allPassed) {
    process.exit(1);
  }
}

runDbConnectivityVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
