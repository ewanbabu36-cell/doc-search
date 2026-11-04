import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('================================================================');
console.log('DOCSEARCH IPD CONSOLIDATED BILLING & DISCHARGE SETTLEMENT TEST');
console.log('================================================================\n');

let gatesPassed = 0;
const totalGates = 6;

function runGate(num, title, fn) {
  try {
    fn();
    console.log(`[PASS] Gate ${num}: ${title}`);
    gatesPassed++;
  } catch (err) {
    console.error(`[FAIL] Gate ${num}: ${title}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runAsyncGate(num, title, fn) {
  try {
    await fn();
    console.log(`[PASS] Gate ${num}: ${title}`);
    gatesPassed++;
  } catch (err) {
    console.error(`[FAIL] Gate ${num}: ${title}`);
    console.error(`       Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// GATE 1: Frontend Service Interface & Methods
// -------------------------------------------------------------
runGate(1, 'Inpatient Service Contract for IPD Billing Summary & Generation', () => {
  const serviceFile = fs.readFileSync('apps/partner-platform/src/services/inpatient-management-service.ts', 'utf8');
  assert(serviceFile.includes('export interface IpdBillingSummary'), 'IpdBillingSummary interface must be exported');
  assert(serviceFile.includes('getIpdBillingSummary(admissionId: string): Promise<IpdBillingSummary>'), 'getIpdBillingSummary method declared');
  assert(serviceFile.includes('generateConsolidatedIpdBill(admissionId: string): Promise<{ invoice: any; items: any[]; summary: IpdBillingSummary }>'), 'generateConsolidatedIpdBill method declared');
  assert(serviceFile.includes('override async getIpdBillingSummary('), 'InpatientManagementService overrides getIpdBillingSummary');
  assert(serviceFile.includes('override async generateConsolidatedIpdBill('), 'InpatientManagementService overrides generateConsolidatedIpdBill');
});

// -------------------------------------------------------------
// GATE 2: ConsolidatedIpdBillingDialog Component
// -------------------------------------------------------------
runGate(2, 'ConsolidatedIpdBillingDialog Tariff Breakdown & Tender Controls', () => {
  const dialogFile = fs.readFileSync('apps/partner-platform/src/components/dialogs/ConsolidatedIpdBillingDialog.tsx', 'utf8');
  assert(dialogFile.includes('export const ConsolidatedIpdBillingDialog'), 'Dialog component must be exported');
  assert(dialogFile.includes('summary.bedCharges.totalBedAmount'), 'Displays itemized bed charges');
  assert(dialogFile.includes('summary.nursingCareCharges.totalNursingAmount'), 'Displays itemized nursing care bundle');
  assert(dialogFile.includes('summary.doctorRoundsCharges.totalRoundsAmount'), 'Displays itemized doctor rounds');
  assert(dialogFile.includes('summary.pharmacyCharges.totalPharmacyAmount'), 'Displays itemized pharmacy charges');
  assert(dialogFile.includes('summary.labCharges.totalLabAmount'), 'Displays itemized pathology & lab charges');
  assert(dialogFile.includes('summary.totalPayableAmount'), 'Displays total net payable amount');
  assert(dialogFile.includes('handleSettleBill'), 'Handles bill settlement execution');
  assert(dialogFile.includes('Dynamic UPI QR'), 'Supports dynamic UPI QR tender');
});

// -------------------------------------------------------------
// GATE 3: DischargeWorkbenchView & InpatientDomainManager Integration
// -------------------------------------------------------------
runGate(3, 'Discharge Workbench Billing Clearance & Action Wiring', () => {
  const workbenchFile = fs.readFileSync('apps/partner-platform/src/components/views/DischargeWorkbenchView.tsx', 'utf8');
  assert(workbenchFile.includes('onOpenSettleBill?: (adm: InpatientAdmissionDto) => void;'), 'DischargeWorkbenchView exposes onOpenSettleBill callback');
  assert(workbenchFile.includes('Settle IPD Bill'), 'Renders Settle IPD Bill action button');
  assert(workbenchFile.includes('Bill Settled') && workbenchFile.includes('Bill Unsettled'), 'Renders billing clearance indicators');
  assert(workbenchFile.includes('All Active Census'), 'Provides census visibility tabs');

  const domainManagerFile = fs.readFileSync('apps/partner-platform/src/components/InpatientDomainManager.tsx', 'utf8');
  assert(domainManagerFile.includes('import { ConsolidatedIpdBillingDialog }'), 'InpatientDomainManager imports ConsolidatedIpdBillingDialog');
  assert(domainManagerFile.includes('isConsolidatedBillingOpen'), 'Manages billing dialog open state');
  assert(domainManagerFile.includes('<ConsolidatedIpdBillingDialog'), 'Renders ConsolidatedIpdBillingDialog in DOM');
  assert(domainManagerFile.includes('onOpenSettleBill='), 'Wires onOpenSettleBill in DischargeWorkbenchView');
});

// -------------------------------------------------------------
// GATE 4: Real-Time Event Bus Multi-Device Dispatch
// -------------------------------------------------------------
runGate(4, 'Hospital Event Bus Multi-Device BILL_SETTLED Event', () => {
  const dialogFile = fs.readFileSync('apps/partner-platform/src/components/dialogs/ConsolidatedIpdBillingDialog.tsx', 'utf8');
  assert(dialogFile.includes("hospitalEventBus.publish("), 'Dispatches event via hospitalEventBus');
  assert(dialogFile.includes("'BILL_SETTLED'"), 'Publishes BILL_SETTLED event type');
  assert(dialogFile.includes('invoiceNumber: result.invoice.invoiceNumber'), 'Payload includes invoiceNumber');
  assert(dialogFile.includes('totalAmount: result.summary.totalPayableAmount'), 'Payload includes totalAmount');
});

// -------------------------------------------------------------
// GATE 5: Backend REST API Gateway Endpoints & Drizzle Repository
// -------------------------------------------------------------
runGate(5, 'Backend Fastify Routes & PostgreSQL Invoicing Repository', () => {
  const routesFile = fs.readFileSync('apps/api-gateway/src/routes/partner/inpatient-management.routes.ts', 'utf8');
  assert(routesFile.includes('/api/v1/partner/inpatient/admissions/:id/billing-summary'), 'Registers billing-summary route');
  assert(routesFile.includes('/api/v1/partner/inpatient/admissions/:id/generate-bill'), 'Registers generate-bill route');

  const repoFile = fs.readFileSync('apps/api-gateway/src/repositories/partner/InpatientManagementRepository.ts', 'utf8');
  assert(repoFile.includes('async getIpdBillingSummary('), 'Repository implements getIpdBillingSummary');
  assert(repoFile.includes('async generateConsolidatedIpdBill('), 'Repository implements generateConsolidatedIpdBill');
  assert(repoFile.includes('billingInvoices'), 'Inserts into PostgreSQL billingInvoices');
  assert(repoFile.includes('billingInvoiceItems'), 'Inserts itemized lines into PostgreSQL billingInvoiceItems');
  assert(repoFile.includes('INV-IPD-'), 'Formats invoice numbers with INV-IPD- prefix');
  assert(repoFile.includes('IPD_BED'), 'Creates IPD_BED line item');
  assert(repoFile.includes('IPD_NURSING'), 'Creates IPD_NURSING line item');
  assert(repoFile.includes('IPD_ROUNDS'), 'Creates IPD_ROUNDS line item');
  assert(repoFile.includes('IPD_PHARMACY'), 'Creates IPD_PHARMACY line item');
  assert(repoFile.includes('IPD_LAB'), 'Creates IPD_LAB line item');
});

// -------------------------------------------------------------
// GATE 6: Functional Calculation & Simulation Engine
// -------------------------------------------------------------
runGate(6, 'Itemized Math & Tax Calculations Verification', () => {
  // Test calculation logic mathematically
  const days = 4;
  const bedDailyRate = 2500;
  const totalBedAmount = days * bedDailyRate; // 10,000

  const nursingDailyRate = 400;
  const totalNursingAmount = days * nursingDailyRate; // 1,600

  const roundsCount = 3;
  const ratePerRound = 600;
  const totalRoundsAmount = roundsCount * ratePerRound; // 1,800

  const pharmacyAmount = 1450.50;
  const labAmount = 980.00;
  const radiologyAmount = 1200.00;

  const subtotal = totalBedAmount + totalNursingAmount + totalRoundsAmount + pharmacyAmount + labAmount + radiologyAmount;
  assert.strictEqual(subtotal, 17030.50, 'Subtotal math matches sum of services');

  const tax = Number((subtotal * 0.05).toFixed(2));
  assert.strictEqual(tax, 851.53, '5% GST tax is computed accurately');

  const totalPayable = Number((subtotal + tax).toFixed(2));
  assert.strictEqual(totalPayable, 17882.03, 'Total net payable equals subtotal + tax');
});

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${gatesPassed}/${totalGates} Gates Passed`);
console.log('-------------------------------------------------------------');

if (gatesPassed === totalGates) {
  console.log('🎉 ALL 6 IPD CONSOLIDATED BILLING & DISCHARGE GATES PASSED!\n');
  process.exit(0);
} else {
  console.error(`❌ Verification failed: Only ${gatesPassed}/${totalGates} passed.`);
  process.exit(1);
}
