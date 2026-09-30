import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAndValidateInvoice,
  parseInvoiceTextOrCsv,
  validateInvoiceText,
  SAMPLE_MARG_ERP_INVOICE,
  SAMPLE_VYAPAR_INVOICE,
  SAMPLE_MAA_KALI_INVOICE,
  SAMPLE_MAA_KALI_INVOICE_TEXT
} from '../../../apps/partner-platform/dist/services/wholesale-invoice-parser.js';
import { wholesaleInvoiceIngestionService } from '../dist/services/partner/WholesaleInvoiceIngestionService.js';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { getDatabase, pharmacyBatches, pharmacyStockMovements, eq, inArray } from '@docsearch/database';

test('?? Wholesale Pharmacy Bill Parser & Valid vs Invalid Classifier', async (t) => {
  // Test 1: Valid Marg ERP Invoice Text
  await t.test('1. Valid Marg ERP stockist bill is recognized with high confidence and valid status', () => {
    const validMargText = `
      TAX INVOICE / CASH MEMO
      MAHAVEER MEDI-SALES & DISTRIBUTORS PVT LTD
      GSTIN: 27AABCM8942F1Z8 | DL No: 20B/21B-4920
      Invoice No: INV-MMS-2026-94812 | Date: 07/09/2026
      Item Name,Batch No,Expiry,Qty,Free,PTR,MRP,GST%
      Augmentin 625 Duo Tab 10s,BTH-AUG-8491,08/28,40,4,142.50,201.20,12
      Dolo 650 Tablets 15s,BTH-DL-39201,04/28,60,6,22.20,34.34,12
      Pan-D Capsules 15s,BTH-PND-9812,11/27,30,3,130.00,199.00,12
      Monocef 1g Injection,BTH-MNC-4421,06/27,50,5,42.00,68.50,12
      Total Amount: 24892.40
    `;

    const report = classifyAndValidateInvoice(validMargText);
    assert.equal(report.isValid, true, 'Valid Marg ERP bill must pass validation');
    assert.equal(report.classification, 'VALID_PHARMA_WHOLESALE_INVOICE');
    assert.ok(report.confidenceScore >= 85, 'Confidence score must be >= 85%');
    assert.equal(report.gstinStatus.validFormat, true, 'GSTIN must be recognized as valid');
    assert.equal(report.gstinStatus.gstin, '27AABCM8942F1Z8');
    assert.ok(report.itemCount >= 4, 'Must parse at least 4 items');
    assert.ok(report.formularyMatchCount >= 4, 'Must match all 4 medicines in formulary');

    const parsed = parseInvoiceTextOrCsv(validMargText);
    assert.equal(parsed.items.length, 4);
    assert.equal(parsed.items[0].matchedBrandName, 'Augmentin 625 Duo');
  });

  // Test 2: Invalid Doctor's Prescription (Rx)
  await t.test('2. Doctor Prescription (Rx) is accurately identified as INVALID_DOCTOR_PRESCRIPTION', () => {
    const doctorRxText = `
      DR. A. K. VERMA, MD (MEDICINE)
      Reg No: MCI-2014-9842
      City Care Clinic, MG Road, Mumbai
      Patient: Ramesh Kumar, Age: 42/M | Date: 07-Sep-2026
      Diagnosis: Acute Bronchitis with fever
      Rx:
      1. Tab Augmentin 625 Duo - 1 Tab TDS x 5 days (After meals)
      2. Tab Dolo 650 - 1 Tab SOS for fever
      3. Tab Pan-D - 1 Tab OD before breakfast
      Follow up after 5 days.
    `;

    const report = classifyAndValidateInvoice(doctorRxText);
    assert.equal(report.isValid, false, 'Doctor prescription must NEVER be validated as wholesale bill');
    assert.equal(report.classification, 'INVALID_DOCTOR_PRESCRIPTION');
    assert.ok(report.validationErrors.some(e => e.includes('Doctor Prescription') || e.includes('patient prescription') || e.includes('OPD Rx')));
  });

  // Test 3: Invalid Diagnostic Pathology Lab Report
  await t.test('3. Pathology Lab Report is accurately identified as INVALID_LAB_PATHOLOGY_REPORT', () => {
    const labReportText = `
      APEX CLINICAL PATHOLOGY LABORATORY
      Patient: Suresh Rao | Age: 55/M | Ref By: Dr. Gupta
      COMPLETE BLOOD COUNT (CBC) REPORT
      Test Name          Observed Value    Reference Range     Unit
      Hemoglobin         14.2              13.0 - 17.0         g/dL
      Total WBC Count    7,800             4,000 - 11,000      /cumm
      Platelet Count     2.4               1.5 - 4.5           Lakh/cumm
      RBC Count          4.8               4.5 - 5.5           mil/cumm
      Method: Fully Automated Cell Counter
    `;

    const report = classifyAndValidateInvoice(labReportText);
    assert.equal(report.isValid, false, 'Pathology lab report must be rejected');
    assert.equal(report.classification, 'INVALID_LAB_PATHOLOGY_REPORT');
  });

  // Test 4: Invalid Non-Pharma General Receipt (Restaurant / Grocery)
  await t.test('4. Restaurant / Grocery / Retail bill is accurately rejected as INVALID_GENERAL_RETAIL_OR_FOOD', () => {
    const foodBillText = `
      HALDIRAM SWEETS & RESTAURANT
      Order #4092 | Table 12
      1. Masala Dosa          x 2    240.00
      2. Chole Bhature        x 1    180.00
      3. Sweet Lassi          x 2    140.00
      4. Gulab Jamun (2 pcs)  x 1     90.00
      Subtotal: 650.00
      CGST 2.5%: 16.25
      SGST 2.5%: 16.25
      Total Payable: 682.50
      Thank you, Visit Again!
    `;

    const report = classifyAndValidateInvoice(foodBillText);
    assert.equal(report.isValid, false, 'Restaurant receipt must be rejected');
    assert.equal(report.classification, 'INVALID_GENERAL_RETAIL_OR_FOOD');
  });

  // Test 5: Pipe-separated Marg ERP Export Parsing
  await t.test('5. Multi-delimiter parsing: Pipe | and space aligned invoice lines', () => {
    const pipeText = `
      INVOICE NO: INV-VARDHMAN-8819 | DATE: 2026-09-07
      GSTIN: 27AABCV8941F1Z1
      Taxim-O 200 Tab 10s | BTH-TXM-9912 | 06/28 | 40 | 4 | 78.00 | 118.00 | 12%
      Zerodol-SP Tab 10s  | BTH-ZSP-4819 | 02/28 | 50 | 5 | 76.50 | 114.50 | 12%
    `;

    const report = classifyAndValidateInvoice(pipeText);
    assert.equal(report.isValid, true);
    assert.equal(report.itemCount, 2);

    const parsed = parseInvoiceTextOrCsv(pipeText);
    assert.equal(parsed.items.length, 2);
    assert.equal(parsed.items[0].matchedBrandName, 'Taxim-O 200');
    assert.equal(parsed.items[1].matchedBrandName, 'Zerodol-SP');
  });

  // Test 6: Invalid Smartphone & Electronics Store Bill (Phonyfi Samsung & iPhone)
  await t.test('6. Smartphone & Electronics bill (Phonyfi Samsung/iPhone) is accurately rejected', () => {
    const mobileStoreText = `
      PHONYFI RETAIL STORE - CONNAUGHT PLACE, NEW DELHI
      Invoice No: INV/24-25/000123 | Date: 20 May 2025
      Customer: Amit Kumar | Mobile: 98765 43210
      Item: Samsung Galaxy S24 5G (256GB), IMEI: 354689700123456, Qty: 1, Rate: 40000, GST 18%, Total: 47200.00
      Trade-In / Exchange: iPhone 12 (64GB), IMEI: 353051110987654, Approved Value: 15000.00
      Finance / EMI: Bajaj Finserv, Application ID: BF1234567890, Down Payment: 5800.00
      Grand Total: 47200.00 | Net Amount: 32200.00
    `;
    const report = classifyAndValidateInvoice(mobileStoreText);
    assert.equal(report.isValid, false, 'Mobile phone retail bill must NEVER be validated as wholesale pharma bill');
    assert.equal(report.classification, 'INVALID_GENERAL_RETAIL_OR_FOOD');
    assert.ok(report.validationErrors.some(e => e.includes('Smartphone') || e.includes('Electronics') || e.includes('Non-Pharma')));
  });

  // Test 7: Genuine Bihar Wholesale Bill (Maa Kali Medicos & Surgical, Katihar)
  await t.test('7. Genuine printed wholesale bill (Maa Kali Medicos, Katihar) is 100% valid with 18 items', () => {
    const report = classifyAndValidateInvoice(SAMPLE_MAA_KALI_INVOICE_TEXT);
    assert.equal(report.isValid, true, 'Genuine printed pharmacy invoice must pass validation');
    assert.equal(report.classification, 'VALID_PHARMA_WHOLESALE_INVOICE');
    assert.ok(report.confidenceScore >= 90, 'Confidence score must be >= 90%');
    assert.equal(report.gstinStatus.validFormat, true);
    assert.equal(report.gstinStatus.gstin, '10ABEFM0970C1ZY');
    assert.equal(report.gstinStatus.state, 'Bihar');
    assert.equal(report.itemCount, 18, 'Must parse all 18 medicines');
  });

  // Test 8: Pre-Packaged Maa Kali Invoice Structure
  await t.test('8. Pre-packaged Maa Kali invoice has 18 items, valid Bihar GSTIN, and ₹5,108.00 total', () => {
    assert.equal(SAMPLE_MAA_KALI_INVOICE.items.length, 18);
    assert.equal(SAMPLE_MAA_KALI_INVOICE.totalBilledAmount, 5108.00);
    assert.equal(SAMPLE_MAA_KALI_INVOICE.distributorGstin, '10ABEFM0970C1ZY');
    assert.equal(SAMPLE_MAA_KALI_INVOICE.invoiceNumber, '1CC003699');
    assert.equal(SAMPLE_MAA_KALI_INVOICE.totalUnitsReceived, 402);
    // Spot check item 1 (Syringe 10ml) and item 5 (Pantra DSR)
    assert.equal(SAMPLE_MAA_KALI_INVOICE.items[0].rawItemDescription, 'DR. PLUS 10ML SYRING');
    assert.equal(SAMPLE_MAA_KALI_INVOICE.items[0].unitCostPtr, 3.65);
    assert.equal(SAMPLE_MAA_KALI_INVOICE.items[0].mrp, 13.00);
    assert.equal(SAMPLE_MAA_KALI_INVOICE.items[4].rawItemDescription, 'PANTRA DSR CAP');
    assert.equal(SAMPLE_MAA_KALI_INVOICE.items[4].unitCostPtr, 12.50);
  });

  // Test 8b: parseInvoiceTextOrCsv parsing of Maa Kali text produces accurate units, distributor, invoice number and date
  await t.test('8b. parseInvoiceTextOrCsv extracts authentic Maa Kali record without free quantity overlap bug', () => {
    const parsed = parseInvoiceTextOrCsv(SAMPLE_MAA_KALI_INVOICE_TEXT);
    assert.equal(parsed.items.length, 18, 'Must parse all 18 medicines');
    assert.equal(parsed.distributorName, 'MAA KALI MEDICOS & SURGICAL AGENCY', 'Distributor must match header');
    assert.equal(parsed.invoiceNumber, '1CC003699', 'Invoice number must be 1CC003699');
    assert.equal(parsed.invoiceDate, '2026-08-30', 'Date must normalize 30/08/26 to 2026-08-30');
    assert.equal(parsed.distributorGstin, '10ABEFM0970C1ZY', 'GSTIN must match Bihar state code');
    assert.equal(parsed.totalUnitsReceived, 402, 'Total units received must equal exactly 402 packs');
    assert.equal(parsed.totalBilledAmount, 5108.00, 'Total billed amount must match stated bill total ₹5,108.00');
    assert.ok(parsed.items.every(it => it.freeQuantity === 0), '6-column invoice without free column must have 0 free quantity for all items');
  });

  // Test 9: Dynamic Wholesale Ingestion of SAMPLE_MARG_ERP_WHOLESALE_BILL.csv
  await t.test('9. Ingest SAMPLE_MARG_ERP_WHOLESALE_BILL.csv dynamically and persist into live database stock ledger', async () => {
    const session = {
      tenantId: '11111111-1111-4111-8111-111111111111',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: 'usr-pharma-lead',
      roles: ['PHARMACIST', 'HOSPITAL_ADMIN']
    };

    const result = await wholesaleInvoiceIngestionService.ingestWholesaleInvoice(session, {
      useSampleMargErp: true
    });

    assert.equal(result.success, true, 'Ingestion must succeed');
    assert.equal(result.invoiceNumber, 'INV-MMS-2026-94812');
    assert.equal(result.distributorGstin, '27AABCM8942F1Z8');
    assert.equal(result.distributorState, 'Maharashtra');
    assert.equal(result.itemCount, 8, 'Must ingest all 8 pharmaceutical items from CSV');
    assert.equal(result.totalUnitsReceived, 310, 'Total units received must match billed + free sum (310 packs)');
    assert.equal(result.createdBatchIds.length, 8, '8 batches must be created in pharmacy_batches');
    assert.equal(result.stockMovementIds.length, 8, '8 stock movements must be recorded in pharmacy_stock_movements');
    assert.ok(result.totalBilledAmount > 30000, 'Total billed amount must be > 30,000 INR');
  });

  // Test 10: Verify Database Stock Ledger Persistence
  await t.test('10. Database stock ledger verifies batches and stock movement records are persisted', async () => {
    const db = getDatabase();

    // Query batches created for Augmentin, Dolo, Pan-D, Monocef
    const batches = await db
      .select()
      .from(pharmacyBatches)
      .where(
        inArray(pharmacyBatches.batchNumber, [
          'BTH-AUG-8491',
          'BTH-DL-39201',
          'BTH-PND-9812',
          'BTH-MNC-4421'
        ])
      );

    assert.ok(batches.length >= 4, 'Batches must be present in live database');
    const augBatch = batches.find(b => b.batchNumber === 'BTH-AUG-8491');
    assert.ok(augBatch, 'Augmentin batch must exist');
    assert.equal(augBatch.receivedQuantity, 44, 'Augmentin quantity must be 40 billed + 4 free = 44');
    assert.equal(augBatch.status, 'ACTIVE');

    // Query stock movements
    const movements = await db
      .select()
      .from(pharmacyStockMovements)
      .where(eq(pharmacyStockMovements.referenceId, 'INV-MMS-2026-94812'));

    assert.ok(movements.length >= 8, 'All 8 stock movement ledger records must exist in database');
    assert.equal(movements[0].movementType, 'RECEIPT');
  });

  // Test 11: Fastify REST API Endpoint (POST /api/v1/partner/pharmacy/invoices/ingest-wholesale)
  await t.test('11. REST Endpoint POST /api/v1/partner/pharmacy/invoices/ingest-wholesale returns HTTP 201', async () => {
    const app = await buildApp();
    await app.ready();

    const token = signJwt(
      {
        sub: 'usr-pharma-01',
        email: 'pharmacist@apexhealth.in',
        tenantId: '11111111-1111-4111-8111-111111111111',
        branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        roles: ['PHARMACIST', 'HOSPITAL_ADMIN'],
        permissions: ['pharmacy:inventory:read', 'pharmacy:inventory:create'],
        iss: 'docsearch-api',
        aud: 'docsearch-platform'
      },
      {
        secret: 'docsearch_master_jwt_secret_dev_32char_key_only',
        issuer: 'docsearch-api',
        audience: 'docsearch-platform',
        expiresInSeconds: 3600
      }
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/invoices/ingest-wholesale',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        useSampleMargErp: true
      }
    });

    assert.equal(response.statusCode, 201);
    const body = JSON.parse(response.body);
    assert.equal(body.success, true);
    assert.equal(body.data.invoiceNumber, 'INV-MMS-2026-94812');
    assert.equal(body.data.itemCount, 8);

    await app.close();
  });

  // Test 12: Dynamic Marg ERP Invoice Generator Function
  await t.test('12. wholesaleInvoiceIngestionService.generateDynamicMargErpInvoice produces authentic Marg ERP format', () => {
    const dynamicCsv = wholesaleInvoiceIngestionService.generateDynamicMargErpInvoice({
      invoiceNumber: 'INV-DYN-2026-1001',
      invoiceDate: '2026-09-09',
      distributorName: 'Apex Pharmaceuticals Wholesale Ltd',
      distributorGstin: '27AABCA9842F1Z2'
    });

    assert.ok(dynamicCsv.includes('INVOICE NO: INV-DYN-2026-1001'), 'Must include custom invoice number');
    assert.ok(dynamicCsv.includes('DISTRIBUTOR: Apex Pharmaceuticals Wholesale Ltd'), 'Must include custom distributor');
    assert.ok(dynamicCsv.includes('GSTIN: 27AABCA9842F1Z2'), 'Must include custom GSTIN');
    assert.ok(dynamicCsv.includes('S.No,ITEM_DESCRIPTION,PACK,HSN_CODE,MFR,BATCH_NO,EXPIRY_DATE'), 'Must include 17-column header');
    assert.ok(dynamicCsv.includes('# GST SUMMARY:'), 'Must include GST slab summary');
    assert.ok(dynamicCsv.includes('# BANK:'), 'Must include RTGS bank details');

    // Verify it can be parsed back
    const parsed = wholesaleInvoiceIngestionService.parseInvoiceLines(dynamicCsv);
    assert.equal(parsed.invoiceNumber, 'INV-DYN-2026-1001');
    assert.equal(parsed.distributorGstin, '27AABCA9842F1Z2');
    assert.equal(parsed.items.length, 8);
  });

  // Test 13: Dynamic Marg ERP Sample REST Endpoints
  await t.test('13. REST Endpoints generate-dynamic-sample and sample-marg-erp return HTTP 200 CSV', async () => {
    const app = await buildApp();
    await app.ready();

    const token = signJwt(
      {
        sub: 'usr-pharma-01',
        email: 'pharmacist@apexhealth.in',
        tenantId: '11111111-1111-4111-8111-111111111111',
        branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        roles: ['PHARMACIST'],
        permissions: ['pharmacy:inventory:read'],
        iss: 'docsearch-api',
        aud: 'docsearch-platform'
      },
      {
        secret: 'docsearch_master_jwt_secret_dev_32char_key_only',
        issuer: 'docsearch-api',
        audience: 'docsearch-platform',
        expiresInSeconds: 3600
      }
    );

    // GET /sample-marg-erp
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/invoices/sample-marg-erp',
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(getRes.statusCode, 200);
    assert.ok(getRes.headers['content-type']?.includes('text/csv'));
    assert.ok(getRes.body.includes('INV-MMS-2026-94812'));

    // POST /generate-dynamic-sample
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/invoices/generate-dynamic-sample',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        invoiceNumber: 'INV-API-TEST-9921'
      }
    });
    assert.equal(postRes.statusCode, 200);
    assert.ok(postRes.body.includes('INV-API-TEST-9921'));

    await app.close();
  });
});
