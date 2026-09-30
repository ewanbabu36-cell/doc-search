/**
 * Dynamic Multi-Format Wholesale ERP Ingestion Service
 * Handles Marg ERP, Vyapar, and standard wholesale pharmaceutical invoices.
 * Performs schema validation, GSTIN verification, batch tracking,
 * and live database stock ledger persistence.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  getDatabase,
  withSecurityContext,
  medicationCatalog,
  pharmacyBatches,
  pharmacyStockMovements,
  partnerProfiles,
  eq,
  and,
  asc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger, normalizeFacilityProfile } from '@docsearch/shared-core';
import { type SessionContext } from '@docsearch/auth';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { licenseService } from '../company/LicenseService.js';
import { documentVerificationRepository } from '../../repositories/core/DocumentVerificationRepository.js';
import { partnerOnboardingRepository, toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';

const logger = createLogger('wholesale-invoice-ingestion-service');

export const INDIAN_STATE_GST_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '19': 'West Bengal',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '36': 'Telangana'
};

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface DynamicMargErpItemInput {
  itemDescription: string;
  pack?: string;
  hsnCode?: string;
  mfr?: string;
  batchNumber?: string;
  expiryDate?: string;
  billedQuantity: number;
  freeQuantity?: number;
  unitCostPtr: number;
  mrp?: number;
  discountPercent?: number;
  gstRate?: number;
}

export interface DynamicMargErpInvoiceOptions {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  distributorName?: string;
  distributorAddress?: string;
  distributorGstin?: string;
  distributorDlNo?: string;
  distributorPan?: string;
  distributorFssai?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerGstin?: string;
  buyerDlNo?: string;
  paymentTerms?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  items?: DynamicMargErpItemInput[];
}

export interface IngestedWholesaleItem {
  id: string;
  itemDescription: string;
  matchedMedicationId: string;
  medicationCode: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  batchNumber: string;
  expiryDate: string; // ISO string
  billedQuantity: number;
  freeQuantity: number;
  totalReceivedQuantity: number;
  unitCostPtr: number;
  mrp: number;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  netAmount: number;
  batchId?: string;
  stockMovementId?: string;
}

export interface WholesaleIngestionResult {
  success: boolean;
  invoiceNumber: string;
  invoiceDate: string;
  distributorName: string;
  distributorGstin: string;
  distributorState: string;
  itemCount: number;
  totalUnitsReceived: number;
  totalBilledAmount: number;
  items: IngestedWholesaleItem[];
  createdBatchIds: string[];
  stockMovementIds: string[];
  persistedAt: string;
}

export interface WholesaleCustomerInput {
  businessName: string;
  customerType?: string | undefined; // PHARMACY_RETAIL, CLINIC, HOSPITAL, NURSING_HOME, DISTRIBUTOR
  contactPerson: string;
  contactPhone?: string | undefined;
  contactEmail?: string | undefined;
  billingAddress: string;
  shippingAddress?: string | undefined;
  gstin?: string | undefined;
  dlNumber: string; // Form 20/21 or 20B/21B Drug License
  dlExpiryDate?: string | undefined;
  creditTermsDays?: number | undefined;
  creditLimit?: number | undefined;
}

export interface StoredWholesaleCustomer extends WholesaleCustomerInput {
  id: string;
  tenantId: string;
  customerCode: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED_LICENSE';
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleSalesOrderItemInput {
  medicationId: string;
  batchId?: string | undefined;
  quantity: number;
  unitPrice: number;
  gstRate?: number | undefined;
  discountPercent?: number | undefined;
}

export interface CreateWholesaleSalesOrderInput {
  customerId: string;
  buyerName?: string | undefined;
  buyerGstin?: string | undefined;
  buyerDlNo?: string | undefined;
  branchId?: string | undefined;
  requestedDeliveryDate?: string | undefined;
  paymentTerms?: string | undefined;
  items: WholesaleSalesOrderItemInput[];
}

export interface StoredWholesaleSalesOrder {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerId: string;
  buyerName: string;
  buyerGstin?: string | undefined;
  buyerDlNo?: string | undefined;
  branchId: string;
  status: 'DRAFT' | 'CONFIRMED' | 'ALLOCATED' | 'PICKED' | 'PACKED' | 'INVOICED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  items: Array<{
    id: string;
    medicationId: string;
    medicationName?: string | undefined;
    batchId?: string | undefined;
    batchNumber?: string | undefined;
    quantity: number;
    allocatedQuantity?: number | undefined;
    unitPrice: number;
    gstRate: number;
    totalAmount: number;
  }>;
  dispatchChallanNumber?: string | undefined;
  invoiceNumber?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export class WholesaleInvoiceIngestionService {
  /**
   * Validates document text to ensure it is not a prescription, lab report, or general retail receipt.
   */
  classifyDocument(text: string): { isValid: boolean; classification: string; reason?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, classification: 'INVALID_BLURRY_OR_EMPTY', reason: 'Empty or blank document payload' };
    }

    const upper = text.toUpperCase();

    // Check for Doctor Prescription (Rx)
    const rxKeywords = ['DR.', 'DOCTOR', 'RX:', 'PRESCRIPTION', 'TDS', 'SOS', 'FOLLOW UP AFTER'];
    const rxCount = rxKeywords.filter((kw) => upper.includes(kw)).length;
    if (rxCount >= 3 && !upper.includes('TAX INVOICE') && !upper.includes('GSTIN')) {
      return {
        isValid: false,
        classification: 'INVALID_DOCTOR_PRESCRIPTION',
        reason: 'Input document appears to be a patient prescription (OPD Rx), not a wholesale supplier invoice.'
      };
    }

    // Check for Pathology Lab Report
    const labKeywords = ['PATHOLOGY', 'LABORATORY', 'OBSERVED VALUE', 'REFERENCE RANGE', 'HEMOGLOBIN', 'WBC COUNT', 'PLATELET'];
    const labCount = labKeywords.filter((kw) => upper.includes(kw)).length;
    if (labCount >= 3 && !upper.includes('TAX INVOICE') && !upper.includes('BILL NO')) {
      return {
        isValid: false,
        classification: 'INVALID_LAB_PATHOLOGY_REPORT',
        reason: 'Input document appears to be a clinical laboratory report, not a wholesale pharma invoice.'
      };
    }

    // Check for General Retail / Food
    const foodKeywords = ['SWEETS', 'RESTAURANT', 'MASALA DOSA', 'BURGER', 'SAMSUNG GALAXY', 'IPHONE', 'IMEI', 'RETAIL STORE'];
    const foodCount = foodKeywords.filter((kw) => upper.includes(kw)).length;
    if (foodCount >= 2) {
      return {
        isValid: false,
        classification: 'INVALID_GENERAL_RETAIL_OR_FOOD',
        reason: 'Input document appears to be general retail, electronics, or food receipt.'
      };
    }

    return { isValid: true, classification: 'VALID_PHARMA_WHOLESALE_INVOICE' };
  }

  /**
   * Extracts GSTIN and resolves state from invoice text.
   */
  extractGstin(text: string): { gstin: string; state: string; isValid: boolean } {
    const match = text.match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/);
    if (!match) {
      return { gstin: '', state: 'UNKNOWN', isValid: false };
    }

    const gstin = match[1]!;
    const stateCode = gstin.substring(0, 2);
    const state = INDIAN_STATE_GST_CODES[stateCode] || 'Other State';
    const isValid = GSTIN_REGEX.test(gstin);

    return { gstin, state, isValid };
  }

  /**
   * Normalizes an expiry string (e.g. "08/28", "2028-08-31", "2028-04") to a valid ISO date string.
   */
  normalizeExpiryDate(rawExpiry: string): string {
    if (!rawExpiry) {
      return new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0]!;
    }

    const clean = rawExpiry.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean;
    }
    if (/^\d{2}\/\d{2}$/.test(clean)) {
      const [mm, yy] = clean.split('/');
      const year = 2000 + parseInt(yy!, 10);
      const month = parseInt(mm!, 10);
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
    if (/^\d{2}\/\d{4}$/.test(clean)) {
      const [mm, yyyy] = clean.split('/');
      const month = parseInt(mm!, 10);
      const year = parseInt(yyyy!, 10);
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }

    return new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0]!;
  }

  /**
   * Parses invoice text or CSV lines into structured wholesale line items.
   */
  /**
   * Generates a fully compliant, dynamic Indian pharmaceutical wholesale Marg ERP 9+ invoice.
   */
  generateDynamicMargErpInvoice(options?: DynamicMargErpInvoiceOptions): string {
    const invNo = options?.invoiceNumber || 'INV-MMS-2026-94812';
    const invDate = options?.invoiceDate || '2026-09-06';
    const dueDate = options?.dueDate || '2026-09-21';
    const distName = options?.distributorName || 'Mahaveer Medi-Sales & Distributors Pvt Ltd';
    const distAddr = options?.distributorAddress || 'Gala No. 12-14, Ground Floor, Pharma Bhavan, Princess Street, Mumbai - 400002';
    const distGstin = options?.distributorGstin || '27AABCM8942F1Z8';
    const distDl = options?.distributorDlNo || '20B/MH-TZ-39201, 21B/MH-TZ-39202';
    const distPan = options?.distributorPan || 'AABCM8942F';
    const distFssai = options?.distributorFssai || '11521001000492';
    const buyerName = options?.buyerName || 'Apex Lifecare Hospital & Research Pharmacy';
    const buyerAddr = options?.buyerAddress || 'Plot 88, Sector 15, Vashi, Navi Mumbai - 400703';
    const buyerGstin = options?.buyerGstin || '27AABCA1234F1Z5';
    const buyerDl = options?.buyerDlNo || '20/21B-MH-NV-88412';
    const payTerms = options?.paymentTerms || '15 DAYS NET';
    const bank = options?.bankName || 'HDFC Bank Ltd';
    const acNo = options?.bankAccountNumber || '50200084920194';
    const ifsc = options?.bankIfsc || 'HDFC0000128';
    const branch = options?.bankBranch || 'Princess Street, Mumbai';

    const defaultItems: DynamicMargErpItemInput[] = [
      {
        itemDescription: 'Augmentin 625 Duo Tab 10s',
        pack: '10x10',
        hsnCode: '30041010',
        mfr: 'GSK',
        batchNumber: 'BTH-AUG-8491',
        expiryDate: '2028-08-31',
        billedQuantity: 40,
        freeQuantity: 4,
        unitCostPtr: 142.5,
        mrp: 201.2,
        discountPercent: 0,
        gstRate: 12
      },
      {
        itemDescription: 'Dolo 650 Tablets 15s',
        pack: '1x15',
        hsnCode: '30049060',
        mfr: 'Micro Labs',
        batchNumber: 'BTH-DL-39201',
        expiryDate: '2028-04-30',
        billedQuantity: 60,
        freeQuantity: 6,
        unitCostPtr: 22.2,
        mrp: 34.34,
        discountPercent: 0,
        gstRate: 12
      },
      {
        itemDescription: 'Pan-D Capsules 15s',
        pack: '1x15',
        hsnCode: '30049099',
        mfr: 'Alkem',
        batchNumber: 'BTH-PND-9812',
        expiryDate: '2027-11-30',
        billedQuantity: 30,
        freeQuantity: 3,
        unitCostPtr: 130.0,
        mrp: 199.0,
        discountPercent: 0,
        gstRate: 12
      },
      {
        itemDescription: 'Monocef 1g Injection Vial',
        pack: '1 Vial',
        hsnCode: '30042095',
        mfr: 'Aristo',
        batchNumber: 'BTH-MNC-4421',
        expiryDate: '2027-06-30',
        billedQuantity: 50,
        freeQuantity: 5,
        unitCostPtr: 42.0,
        mrp: 68.5,
        discountPercent: 0,
        gstRate: 12
      },
      {
        itemDescription: 'Telma 40 Tablets 15s',
        pack: '1x15',
        hsnCode: '30049099',
        mfr: 'Glenmark',
        batchNumber: 'BTH-TLM-1029',
        expiryDate: '2028-03-31',
        billedQuantity: 30,
        freeQuantity: 0,
        unitCostPtr: 154.0,
        mrp: 220.0,
        discountPercent: 0,
        gstRate: 12
      },
      {
        itemDescription: 'Azithral 500 Tablets 5s',
        pack: '1x5',
        hsnCode: '30042099',
        mfr: 'Alembic',
        batchNumber: 'BTH-AZT-7721',
        expiryDate: '2027-10-31',
        billedQuantity: 25,
        freeQuantity: 2,
        unitCostPtr: 85.0,
        mrp: 120.0,
        discountPercent: 0,
        gstRate: 12
      },
      {
        itemDescription: 'Montair-LC Tablets 10s',
        pack: '1x10',
        hsnCode: '30049099',
        mfr: 'Cipla',
        batchNumber: 'BTH-MLC-6502',
        expiryDate: '2028-01-31',
        billedQuantity: 35,
        freeQuantity: 3,
        unitCostPtr: 172.0,
        mrp: 245.0,
        discountPercent: 0,
        gstRate: 12
      },
      {
        itemDescription: 'Refresh Tears 0.5% Eye Drops',
        pack: '10ml',
        hsnCode: '30049099',
        mfr: 'Allergan',
        batchNumber: 'BTH-RFT-1182',
        expiryDate: '2027-09-30',
        billedQuantity: 15,
        freeQuantity: 2,
        unitCostPtr: 110.0,
        mrp: 158.0,
        discountPercent: 0,
        gstRate: 12
      }
    ];

    const rawItems = (options?.items && options.items.length > 0) ? options.items : defaultItems;

    let totalBilledQty = 0;
    let totalFreeQty = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    const itemRows = rawItems.map((item, idx) => {
      const sno = idx + 1;
      const billed = item.billedQuantity;
      const free = item.freeQuantity || 0;
      const ptr = item.unitCostPtr;
      const mrp = item.mrp || (ptr * 1.35);
      const disc = item.discountPercent || 0;
      const gstRate = item.gstRate ?? 12;
      const pack = item.pack || '10x10';
      const hsn = item.hsnCode || '30049099';
      const mfr = item.mfr || 'Standard';
      const batch = item.batchNumber || `BTH-${Date.now()}-${idx + 1}`;
      const exp = item.expiryDate || '2028-12-31';

      const taxable = Math.round(billed * ptr * (1 - disc / 100) * 100) / 100;
      const cgst = Math.round(taxable * (gstRate / 200) * 100) / 100;
      const sgst = Math.round(taxable * (gstRate / 200) * 100) / 100;
      const net = Math.round((taxable + cgst + sgst) * 100) / 100;

      totalBilledQty += billed;
      totalFreeQty += free;
      totalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;

      return `${sno},${item.itemDescription},${pack},${hsn},${mfr},${batch},${exp},${billed},${free},${ptr.toFixed(2)},${mrp.toFixed(2)},${disc},${taxable.toFixed(2)},${gstRate},${cgst.toFixed(2)},${sgst.toFixed(2)},${net.toFixed(2)}`;
    });

    totalTaxable = Math.round(totalTaxable * 100) / 100;
    totalCgst = Math.round(totalCgst * 100) / 100;
    totalSgst = Math.round(totalSgst * 100) / 100;
    const totalTax = Math.round((totalCgst + totalSgst) * 100) / 100;
    const totalReceived = totalBilledQty + totalFreeQty;
    const netPayable = Math.round((totalTaxable + totalTax) * 100) / 100;

    const lines: string[] = [
      `INVOICE NO: ${invNo},DATE: ${invDate},GSTIN: ${distGstin},DISTRIBUTOR: ${distName}`,
      `DL NO: ${distDl},PAN: ${distPan},FSSAI: ${distFssai},ADDRESS: ${distAddr}`,
      `BUYER: ${buyerName},BUYER GSTIN: ${buyerGstin},BUYER DL NO: ${buyerDl},ADDRESS: ${buyerAddr}`,
      `PAYMENT TERMS: ${payTerms},DUE DATE: ${dueDate}`,
      'S.No,ITEM_DESCRIPTION,PACK,HSN_CODE,MFR,BATCH_NO,EXPIRY_DATE,BILLED_QTY,FREE_QTY,PTR_RATE,MRP,DISCOUNT_PERCENT,TAXABLE_AMOUNT,GST_RATE,CGST_AMOUNT,SGST_AMOUNT,NET_AMOUNT',
      ...itemRows,
      `# GST SUMMARY: HSN 3004 | TAXABLE: ${totalTaxable.toFixed(2)} | CGST 6%: ${totalCgst.toFixed(2)} | SGST 6%: ${totalSgst.toFixed(2)} | TOTAL TAX: ${totalTax.toFixed(2)}`,
      `# TOTAL BILLED QTY: ${totalBilledQty} | TOTAL FREE QTY: ${totalFreeQty} | TOTAL UNITS RECEIVED: ${totalReceived} | NET INVOICE AMOUNT: ${netPayable.toFixed(2)}`,
      `# BANK: ${bank} | A/C NO: ${acNo} | IFSC: ${ifsc} | BRANCH: ${branch}`,
      '# STATUTORY: 1. We hereby certify that drugs specified in this invoice do not contravene section 18 of Drugs & Cosmetics Act 1940. 2. Subject to Mumbai Jurisdiction.'
    ];

    return lines.join('\n');
  }

  /**
   * Parses invoice text or CSV lines into structured wholesale line items with dynamic column detection.
   */
  parseInvoiceLines(text: string): {
    invoiceNumber: string;
    invoiceDate: string;
    distributorName: string;
    distributorGstin: string;
    items: Array<{
      itemDescription: string;
      batchNumber: string;
      expiryDate: string;
      billedQuantity: number;
      freeQuantity: number;
      unitCostPtr: number;
      mrp: number;
      gstRate: number;
    }>;
  } {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    let invoiceNumber = `INV-${Date.now()}`;
    let invoiceDate = new Date().toISOString().split('T')[0]!;
    let distributorName = 'Standard Wholesale Distributor';
    let distributorGstin = '';

    // Header metadata extraction
    for (const line of lines) {
      if (line.startsWith('#') || line.startsWith('//')) continue;

      const invMatch = line.match(/(?:INVOICE\s*(?:NO|NUMBER)\s*[:\-#]?|INV\s*NO\s*[:\-#]?)\s*([A-Za-z0-9\-_/]+)/i);
      if (invMatch && invMatch[1]) {
        const val = invMatch[1].trim();
        if (val.length >= 3 && !/^(?:do|not|and|or|the|is|are|of|in|to|for)$/i.test(val)) {
          invoiceNumber = val;
        }
      }

      const dateMatch = line.match(/(?:DATE\s*[:\-#]?)\s*(\d{4}-\d{2}-\d{2}|\d{2}[/-]\d{2}[/-]\d{2,4})/i);
      if (dateMatch && dateMatch[1]) invoiceDate = dateMatch[1].trim();

      const distMatch = line.match(/(?:DISTRIBUTOR\s*[:\-#]?)\s*([^,\n|#]+)/i);
      if (distMatch && distMatch[1]) distributorName = distMatch[1].trim();

      if (!line.toUpperCase().includes('BUYER')) {
        const gstinMatch = line.match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/);
        if (gstinMatch && gstinMatch[1]) distributorGstin = gstinMatch[1].trim();
      }
    }

    // Dynamic column index detection
    let colDescIdx = 0;
    let colBatchIdx = 1;
    let colExpIdx = 2;
    let colBilledIdx = 3;
    let colFreeIdx = -1;
    let colPtrIdx = -1;
    let colMrpIdx = -1;
    let colGstIdx = -1;

    for (const line of lines) {
      const upper = line.toUpperCase();
      if (
        (upper.includes('ITEM') || upper.includes('DESCRIPTION') || upper.includes('PARTICULAR') || upper.includes('PRODUCT')) &&
        (upper.includes('BATCH') || upper.includes('QTY') || upper.includes('RATE') || upper.includes('EXP') || upper.includes('PTR'))
      ) {
        const delimiter = line.includes(',') ? ',' : line.includes('|') ? '|' : '\t';
        const cols = line.split(delimiter).map((c) => c.trim().toUpperCase());

        for (let i = 0; i < cols.length; i++) {
          const c = cols[i]!;
          if (/^(?:ITEM|DESCRIPTION|ITEM_DESCRIPTION|ITEM_NAME|PRODUCT|PARTICULAR)/.test(c)) {
            colDescIdx = i;
          } else if (/^(?:BATCH|BATCH_NO|LOT|LOT_NO)/.test(c)) {
            colBatchIdx = i;
          } else if (/^(?:EXP|EXPIRY|EXPIRY_DATE|EXP_DATE)/.test(c)) {
            colExpIdx = i;
          } else if (/^(?:BILLED_QTY|BILL_QTY|QTY|QUANTITY)/.test(c) && !c.includes('FREE')) {
            colBilledIdx = i;
          } else if (/^(?:FREE|FREE_QTY|SCHEME|BONUS)/.test(c)) {
            colFreeIdx = i;
          } else if (/^(?:PTR|PTR_RATE|RATE|UNIT_COST|COST_PRICE)/.test(c) && !c.includes('MRP')) {
            colPtrIdx = i;
          } else if (/^MRP/.test(c)) {
            colMrpIdx = i;
          } else if (/^(?:GST|GST_RATE|GST%|TAX_RATE)/.test(c)) {
            colGstIdx = i;
          }
        }
        break;
      }
    }

    const items: Array<{
      itemDescription: string;
      batchNumber: string;
      expiryDate: string;
      billedQuantity: number;
      freeQuantity: number;
      unitCostPtr: number;
      mrp: number;
      gstRate: number;
    }> = [];

    // Parse line items
    for (const line of lines) {
      // Skip comment, border, and metadata lines
      if (
        line.startsWith('#') ||
        line.startsWith('=') ||
        line.startsWith('-') ||
        line.startsWith('//') ||
        line.startsWith('INVOICE NO') ||
        line.startsWith('ITEM_DESCRIPTION') ||
        line.startsWith('Item Name') ||
        line.startsWith('S.No') ||
        line.startsWith('TAX INVOICE') ||
        line.startsWith('Total Amount') ||
        line.startsWith('TOTAL') ||
        line.startsWith('GST') ||
        line.startsWith('BANK') ||
        line.startsWith('STATUTORY') ||
        line.startsWith('BUYER') ||
        line.startsWith('DL NO') ||
        line.startsWith('ADDRESS') ||
        line.startsWith('PAYMENT') ||
        line.includes('Subtotal') ||
        line.includes('Round Off')
      ) {
        continue;
      }

      // Check for comma, pipe, or tab delimiters
      const delimiter = line.includes(',') ? ',' : line.includes('|') ? '|' : '\t';
      const parts = line.split(delimiter).map((p) => p.trim());

      if (parts.length >= 4) {
        const itemDescription = parts[colDescIdx] || '';
        // Skip lines where description is numeric or empty
        if (!itemDescription || /^\d+$/.test(itemDescription) || itemDescription.length < 2) {
          continue;
        }

        const batchNumber = parts[colBatchIdx] || `BTH-${Date.now()}`;
        const expiryDate = this.normalizeExpiryDate(parts[colExpIdx] || '');
        const billedQuantity = colBilledIdx !== -1 && colBilledIdx < parts.length ? Math.max(1, parseFloat(parts[colBilledIdx] || '1') || 1) : Math.max(1, parseFloat(parts[3] || '1') || 1);
        const freeQuantity = colFreeIdx !== -1 && colFreeIdx < parts.length ? Math.max(0, parseFloat(parts[colFreeIdx] || '0') || 0) : 0;
        const unitCostPtr = colPtrIdx !== -1 && colPtrIdx < parts.length ? Math.max(0.1, parseFloat(parts[colPtrIdx] || '10.0') || 10.0) : 10.0;
        const mrp = colMrpIdx !== -1 && colMrpIdx < parts.length ? Math.max(unitCostPtr, parseFloat(parts[colMrpIdx] || String(unitCostPtr * 1.3)) || unitCostPtr * 1.3) : unitCostPtr * 1.3;
        const gstRate = colGstIdx !== -1 && colGstIdx < parts.length ? parseFloat((parts[colGstIdx] || '12').replace('%', '')) || 12 : 12;

        items.push({
          itemDescription,
          batchNumber,
          expiryDate,
          billedQuantity,
          freeQuantity,
          unitCostPtr,
          mrp,
          gstRate
        });
      }
    }

    return {
      invoiceNumber,
      invoiceDate,
      distributorName,
      distributorGstin,
      items
    };
  }

  /**
   * Loads sample Marg ERP wholesale bill from disk or dynamically generates it.
   */
  async loadSampleMargErpCsv(): Promise<string> {
    const candidates = [
      path.resolve(process.cwd(), 'apps/partner-platform/public/SAMPLE_MARG_ERP_WHOLESALE_BILL.csv'),
      path.resolve(process.cwd(), 'apps/partner-platform/dist/bundle/SAMPLE_MARG_ERP_WHOLESALE_BILL.csv')
    ];

    for (const p of candidates) {
      try {
        return await fs.promises.readFile(p, 'utf8');
      } catch {}
    }

    // Dynamic authoritative fallback
    return this.generateDynamicMargErpInvoice();
  }

  /**
   * Authoritative Backend Wholesale Pharmacy B2B Governance Guard (CAP-04).
   * Enforces:
   * 1. Cross-tenant isolation (targetTenantId / buyerTenantId must match session.tenantId)
   * 2. Partner operating model (must be PHARMACY_WHOLESALE, entitled PHARMACY, or HOSPITAL; denies PATHOLOGY, CLINIC, DIAGNOSTIC_CENTRE, RESTRICTED)
   * 3. Active commercial license + Wholesale entitlement (Retail PHARMACY_POS alone is NOT sufficient)
   * 4. Valid, non-expired Wholesale Drug License (Form 20B / Form 21B) and B2B buyer Drug License verification
   */
  async enforceWholesalePharmacyB2bGovernance(
    session: SessionContext,
    options?: {
      targetTenantId?: string | undefined;
      buyerTenantId?: string | undefined;
      buyerDlNo?: string | undefined;
      distributorDlNo?: string | undefined;
      wholesaleLicenseNumber?: string | undefined;
      wholesaleLicenseExpiry?: string | undefined;
      requireBuyerDl?: boolean | undefined;
    }
  ): Promise<void> {
    if (!session || !session.tenantId) {
      throw AppError.unauthorized('Authentication and tenant context required for Wholesale B2B operations.');
    }

    // 1. Cross-tenant buyer/transaction check
    if (options?.targetTenantId && options.targetTenantId !== session.tenantId && !session.isSuperAdmin) {
      throw new AppError({
        message: 'TENANT_ACCESS_DENIED: Cross-tenant wholesale pharmacy transaction is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    if (options?.buyerTenantId && options.buyerTenantId !== session.tenantId && !session.isSuperAdmin) {
      throw new AppError({
        message: 'TENANT_ACCESS_DENIED: Cross-tenant B2B buyer transaction across unauthorized tenant boundaries is forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    if (session.isSuperAdmin) {
      return;
    }

    // 2. Resolve partner profile & operating model
    const sessionAny = session as any;
    let rawFacilityType = String(
      sessionAny.facilityType ||
        sessionAny.organizationType ||
        sessionAny.partnerCategory ||
        sessionAny.profileType ||
        ''
    ).trim();

    let statutoryMeta: Record<string, any> = {};
    const db = getDatabase();
    if (db) {
      try {
        const [prof] = await db
          .select()
          .from(partnerProfiles)
          .where(eq(partnerProfiles.tenantId, session.tenantId))
          .limit(1);
        if (prof) {
          const meta = (prof.metadata as Record<string, any>) || {};
          statutoryMeta = (meta['statutory'] as Record<string, any>) || {};
          if (!rawFacilityType) {
            rawFacilityType = String(meta['partnerType'] || meta['facilityType'] || meta['organizationType'] || '');
          }
        }
      } catch {}
    }

    if (!rawFacilityType) {
      try {
        const queue = await partnerOnboardingRepository.getVerificationQueue();
        const actorEmail = String(session.actorEmail || sessionAny.email || '').toLowerCase().trim();
        const matched = queue.find((q: any) => {
          const qEmail = String(q.details?.['Registered Email'] || q.contactEmail || '').toLowerCase().trim();
          const qDetId = qEmail ? toDeterministicUuid(`tenant-${qEmail}`) : null;
          return q.tenantDraftId === session.tenantId || qDetId === session.tenantId || (actorEmail && qEmail === actorEmail);
        });
        if (matched) {
          const mAny = matched as any;
          rawFacilityType = String(
            mAny.type || mAny.partnerType || mAny.category || mAny.organizationType || mAny.details?.['Partner Category'] || ''
          );
        }
      } catch {}
    }

    // Check license & plan metadata
    const tenantLicenses = await licenseRepository.findByTenantId(session.tenantId);
    const activeLic =
      tenantLicenses.find(
        (l) =>
          l.status === 'ACTIVE' ||
          l.status === 'FREE_ACTIVE' ||
          l.status === 'EXPIRING_SOON' ||
          l.status === 'GRACE_PERIOD'
      ) || tenantLicenses[0];

    if (activeLic) {
      const licEvaluation = licenseService.evaluateLicenseStatus(activeLic);
      if (!licEvaluation.isAccessAllowed || licEvaluation.status === 'EXPIRED' || licEvaluation.status === 'SUSPENDED' || licEvaluation.status === 'REVOKED') {
        throw new AppError({
          message: `WHOLESALE_LICENSE_DENIED: Commercial license for wholesale operations is ${licEvaluation.status}. Active license required.`,
          code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
          statusCode: 403
        });
      }
      if (!rawFacilityType) {
        const licMeta = (activeLic.metadata as Record<string, any>) || {};
        rawFacilityType = String(licMeta['facilityType'] || licMeta['organizationType'] || '');
      }
    } else if (sessionAny.licenseStatus === 'EXPIRED' || sessionAny.licenseStatus === 'SUSPENDED') {
      throw new AppError({
        message: `WHOLESALE_LICENSE_DENIED: Commercial license is ${sessionAny.licenseStatus}.`,
        code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
        statusCode: 403
      });
    }

    // Validate facility profile compatibility
    const effectiveRawType = rawFacilityType || 'PHARMACY_WHOLESALE';
    const normalized = normalizeFacilityProfile(effectiveRawType);
    if (
      normalized.isRestricted ||
      (normalized.workspace !== 'PHARMACY' &&
        normalized.workspace !== 'HOSPITAL' &&
        normalized.workspace !== 'ENTERPRISE_COMMAND')
    ) {
      throw new AppError({
        message: `WHOLESALE_PROFILE_DENIED: Partner profile '${effectiveRawType}' (${normalized.workspace}) is not authorized for Wholesale Pharmacy B2B operations.`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    // 3. Enforce Wholesale B2B Entitlement Separation (Retail PHARMACY_POS alone MUST NOT satisfy Wholesale B2B)
    const upperType = effectiveRawType.toUpperCase().trim();
    const sessionFeatures: string[] = Array.isArray(sessionAny.entitledFeatures)
      ? sessionAny.entitledFeatures
      : Array.isArray(sessionAny.accessibleFeatures)
      ? sessionAny.accessibleFeatures
      : [];
    const licMeta = ((activeLic?.metadata as Record<string, any>) || {});
    const licFeatures: string[] = Array.isArray(licMeta['entitledFeatures'])
      ? licMeta['entitledFeatures']
      : Array.isArray(licMeta['features'])
      ? licMeta['features']
      : [];
    const allFeatures = [...sessionFeatures, ...licFeatures].map((f) => String(f).toUpperCase().trim());
    const planHint = `${sessionAny.planCode || ''} ${sessionAny.planTier || ''} ${activeLic?.planId || ''} ${licMeta['planCode'] || ''}`.toUpperCase();

    const isExplicitlyRetailOnly =
      (upperType === 'RETAIL_PHARMACY' ||
        upperType === 'PHARMACY_RETAIL' ||
        (upperType === 'PHARMACY' &&
          !upperType.includes('WHOLESALE') &&
          !planHint.includes('WHOLESALE') &&
          !allFeatures.includes('PHARMACY_WHOLESALE') &&
          !allFeatures.includes('WHOLESALE_DISTRIBUTION') &&
          (sessionAny.operatingModel === 'RETAIL' ||
            planHint.includes('RETAIL') ||
            planHint.includes('PLAN_PHARM_FREE_YR1') ||
            (sessionFeatures.length > 0 &&
              sessionFeatures.includes('PHARMACY_POS') &&
              !sessionFeatures.includes('PHARMACY_WHOLESALE') &&
              !sessionFeatures.includes('WHOLESALE_DISTRIBUTION')))));

    if (isExplicitlyRetailOnly) {
      throw new AppError({
        message:
          'WHOLESALE_ENTITLEMENT_DENIED: Retail Pharmacy (PHARMACY_POS) entitlement alone does not authorize Wholesale B2B operations. PHARMACY_WHOLESALE entitlement and Form 20B/21B license required.',
        code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
        statusCode: 403
      });
    }

    // 4. Enforce Wholesale Drug License (Form 20B/21B) Expiry & Compliance Hold
    const complianceHold = await documentVerificationRepository.hasExpiredMandatoryComplianceHold(session.tenantId);
    if (complianceHold.onHold) {
      throw new AppError({
        message: complianceHold.reason || 'WHOLESALE_DRUG_LICENSE_EXPIRED: Mandatory regulatory document expired.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const licenseExpiryStr =
      options?.wholesaleLicenseExpiry ||
      sessionAny.wholesaleLicenseExpiry ||
      statutoryMeta['wholesaleDrugLicenseExpiry'] ||
      statutoryMeta['drugLicenseExpiry'] ||
      licMeta['wholesaleDrugLicenseExpiry'];

    if (licenseExpiryStr) {
      const expDate = new Date(String(licenseExpiryStr));
      if (!Number.isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        throw new AppError({
          message: `WHOLESALE_DRUG_LICENSE_EXPIRED: Wholesale Drug License (Form 20B/21B) expired on ${licenseExpiryStr}.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    const sellerWholesaleDl =
      options?.wholesaleLicenseNumber ||
      sessionAny.wholesaleLicenseNumber ||
      sessionAny.wholesaleDrugLicenseNo ||
      sessionAny.wholesaleDrugLicenseNumber ||
      statutoryMeta['wholesaleDrugLicenseNo'] ||
      statutoryMeta['wholesaleDrugLicenseNumber'] ||
      statutoryMeta['wholesaleLicenseNumber'] ||
      statutoryMeta['drugLicenseNumber'] ||
      licMeta['wholesaleDrugLicenseNo'] ||
      licMeta['wholesaleDrugLicenseNumber'];

    if (options?.requireBuyerDl && (!sellerWholesaleDl || String(sellerWholesaleDl).trim().length < 4)) {
      throw new AppError({
        message:
          'WHOLESALE_DRUG_LICENSE_REQUIRED: Seller must hold a valid Wholesale Drug License (Form 20B / Form 21B) to execute B2B wholesale dispatch.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    if (options?.requireBuyerDl) {
      const buyerDl = String(options.buyerDlNo || '').trim();
      if (!buyerDl || buyerDl.length < 5) {
        throw new AppError({
          message: 'WHOLESALE_BUYER_DL_REQUIRED: B2B wholesale sale/dispatch requires a valid buyer Drug License number (Form 20/21 or Form 20B/21B).',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
    }
  }

  /**
   * Authoritative B2B Wholesale Dispatch / Credit Transaction Validation & Execution (CAP-04).
   */
  async executeWholesaleB2bDispatch(
    session: SessionContext,
    input: {
      buyerName: string;
      buyerGstin?: string;
      buyerDlNo: string;
      buyerTenantId?: string;
      targetTenantId?: string;
      wholesaleLicenseNumber?: string;
      wholesaleLicenseExpiry?: string;
      paymentTerms?: 'CASH' | 'CREDIT_15_DAYS' | 'CREDIT_30_DAYS';
      creditLimit?: number;
      challanNumber?: string;
      items: Array<{
        medicationId?: string;
        itemDescription: string;
        batchNumber: string;
        quantity: number;
        unitPricePtr: number;
      }>;
    }
  ) {
    await this.enforceWholesalePharmacyB2bGovernance(session, {
      targetTenantId: input.targetTenantId,
      buyerTenantId: input.buyerTenantId,
      buyerDlNo: input.buyerDlNo,
      wholesaleLicenseNumber: input.wholesaleLicenseNumber,
      wholesaleLicenseExpiry: input.wholesaleLicenseExpiry,
      requireBuyerDl: true
    });

    const totalAmount = (input.items || []).reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPricePtr || 0), 0);
    if (input.paymentTerms && input.paymentTerms.startsWith('CREDIT') && typeof input.creditLimit === 'number') {
      if (totalAmount > input.creditLimit) {
        throw new AppError({
          message: `WHOLESALE_CREDIT_LIMIT_EXCEEDED: B2B order value (${totalAmount}) exceeds buyer credit limit (${input.creditLimit}).`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    return {
      success: true,
      dispatchChallanNumber: input.challanNumber || `CHL-B2B-${Date.now()}`,
      tenantId: session.tenantId,
      buyerName: input.buyerName,
      buyerDlNo: input.buyerDlNo,
      paymentTerms: input.paymentTerms || 'CASH',
      totalAmount,
      itemCount: (input.items || []).length,
      authorizedAt: new Date().toISOString()
    };
  }

  /**
   * Main Dynamic Ingestion Execution:
   * 1. Enforces CAP-04 Wholesale Pharmacy B2B Governance (Operating model, wholesale entitlement, Form 20B/21B license, tenant scope)
   * 2. Validates document type & classification
   * 3. Checks GSTIN and supplier credentials
   * 4. Parses line items with batch numbers and PTR/MRP calculations
   * 5. Persists items into medicationCatalog, pharmacyBatches, and pharmacyStockMovements
   */
  async ingestWholesaleInvoice(
    session: SessionContext,
    input: {
      rawContent?: string;
      useSampleMargErp?: boolean;
      partnerId?: string;
      organizationId?: string;
      branchId?: string;
      tenantId?: string;
      buyerTenantId?: string;
      buyerDlNo?: string;
      wholesaleLicenseExpiry?: string;
    }
  ): Promise<WholesaleIngestionResult> {
    await this.enforceWholesalePharmacyB2bGovernance(session, {
      targetTenantId: input.tenantId,
      buyerTenantId: input.buyerTenantId,
      buyerDlNo: input.buyerDlNo,
      wholesaleLicenseExpiry: input.wholesaleLicenseExpiry
    });

    const rawText = input.useSampleMargErp ? await this.loadSampleMargErpCsv() : input.rawContent || '';

    const classificationResult = this.classifyDocument(rawText);
    if (!classificationResult.isValid) {
      throw new AppError({
        message: `Wholesale invoice validation failed: ${classificationResult.reason}`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const gstinData = this.extractGstin(rawText);
    const parsed = this.parseInvoiceLines(rawText);

    if (parsed.items.length === 0) {
      throw new AppError({
        message: 'No valid medication line items could be extracted from invoice.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const tenantId = session.tenantId;
    if (!tenantId) {
      throw AppError.badRequest('Tenant context is required for wholesale invoice ingestion');
    }
    if (input.partnerId && input.partnerId !== tenantId) {
      throw AppError.forbidden('Access denied: Cross-partner parameter tampering is strictly forbidden');
    }
    const partnerId = tenantId;
    const organizationId = session.organizationId || input.organizationId || tenantId;
    const branchId = session.branchId || input.branchId;
    if (!branchId) {
      throw AppError.badRequest('Branch context is required for wholesale invoice ingestion');
    }
    const userId = session.userId || 'system-pharmacist';

    return withSecurityContext(getDatabase(), session, async (tx) => {
      const createdBatchIds: string[] = [];
      const stockMovementIds: string[] = [];
      const processedItems: IngestedWholesaleItem[] = [];

      let totalUnits = 0;
      let totalAmount = 0;

      for (const item of parsed.items) {
        const totalReceived = item.billedQuantity + item.freeQuantity;
        const taxable = item.billedQuantity * item.unitCostPtr;
        const gstVal = taxable * (item.gstRate / 100);
        const netVal = taxable + gstVal;

        totalUnits += totalReceived;
        totalAmount += netVal;

        // 1. Resolve or Create Medication in Catalog
        const medCode = `MED-${item.batchNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10)}-${Date.now().toString().slice(-4)}`;
        let medicationId: `${string}-${string}-${string}-${string}-${string}` = crypto.randomUUID();

        try {
          const existingMeds = await tx
            .select()
            .from(medicationCatalog)
            .where(
              and(
                eq(medicationCatalog.tenantId, tenantId),
                eq(medicationCatalog.brandName, item.itemDescription)
              )
            );

          if (existingMeds.length > 0 && existingMeds[0]) {
            medicationId = existingMeds[0].id as `${string}-${string}-${string}-${string}-${string}`;
          } else {
            // Auto-create medication entry in catalog
            const [createdMed] = await tx
              .insert(medicationCatalog)
              .values({
                id: medicationId,
                tenantId,
                partnerId,
                organizationId,
                medicationCode: medCode,
                brandName: item.itemDescription,
                genericName: item.itemDescription,
                strength: 'Standard Dosage',
                dosageForm: item.itemDescription.toLowerCase().includes('tab')
                  ? 'TABLET'
                  : item.itemDescription.toLowerCase().includes('cap')
                  ? 'CAPSULE'
                  : item.itemDescription.toLowerCase().includes('inj')
                  ? 'INJECTION'
                  : item.itemDescription.toLowerCase().includes('drop')
                  ? 'DROPS'
                  : 'TABLET',
                category: 'GENERAL',
                manufacturer: parsed.distributorName,
                metadata: {
                  mrp: item.mrp,
                  unitPrice: item.mrp,
                  costPrice: item.unitCostPtr,
                  gstRate: item.gstRate
                }
              } as unknown as typeof medicationCatalog.$inferInsert)
              .returning();

            if (createdMed) medicationId = createdMed.id as `${string}-${string}-${string}-${string}-${string}`;
          }
        } catch (medErr) {
          logger.warn('Medication catalog lookup/insert non-fatal warning', { error: medErr });
        }

        // 2. Insert or Increment Pharmacy Batches
        const expiryDateObj = new Date(item.expiryDate);
        const now = new Date();
        const batchStatus = expiryDateObj < now ? 'EXPIRED' : 'ACTIVE';

        const existingBatches = await tx
          .select()
          .from(pharmacyBatches)
          .where(
            and(
              eq(pharmacyBatches.branchId, branchId),
              eq(pharmacyBatches.medicationId, medicationId),
              eq(pharmacyBatches.batchNumber, item.batchNumber)
            )
          );

        let batchId: `${string}-${string}-${string}-${string}-${string}`;

        if (existingBatches.length > 0 && existingBatches[0]) {
          batchId = existingBatches[0].id as `${string}-${string}-${string}-${string}-${string}`;
          const newReceived = (existingBatches[0].receivedQuantity || 0) + totalReceived;
          const newAvailable = (existingBatches[0].availableQuantity || 0) + totalReceived;

          await tx
            .update(pharmacyBatches)
            .set({
              receivedQuantity: newReceived,
              availableQuantity: newAvailable,
              updatedAt: new Date()
            } as any)
            .where(eq(pharmacyBatches.id, batchId));
        } else {
          batchId = crypto.randomUUID();
          await tx.insert(pharmacyBatches).values({
            id: batchId,
            tenantId,
            partnerId,
            organizationId,
            branchId,
            medicationId,
            batchNumber: item.batchNumber,
            manufacturer: parsed.distributorName,
            manufacturingDate: new Date('2026-01-01'),
            expiryDate: expiryDateObj,
            receivedQuantity: totalReceived,
            availableQuantity: totalReceived,
            unitCost: item.unitCostPtr.toFixed(2),
            status: batchStatus
          } as unknown as typeof pharmacyBatches.$inferInsert);
        }

        createdBatchIds.push(batchId);

        // 3. Append to Pharmacy Stock Movement Ledger
        const movementId = crypto.randomUUID();
        await tx.insert(pharmacyStockMovements).values({
          id: movementId,
          tenantId,
          partnerId,
          organizationId,
          branchId,
          medicationId,
          batchId,
          movementType: 'RECEIPT',
          quantity: totalReceived,
          beforeQuantity: 0,
          afterQuantity: totalReceived,
          actorId: userId,
          actorRole: 'PHARMACIST',
          reason: `Wholesale Ingestion: ${parsed.distributorName} (${parsed.invoiceNumber})`,
          correlationId: `corr-wholesale-${Date.now()}`,
          referenceType: 'PURCHASE_INVOICE',
          referenceId: parsed.invoiceNumber
        } as unknown as typeof pharmacyStockMovements.$inferInsert);

        stockMovementIds.push(movementId);

        processedItems.push({
          id: crypto.randomUUID(),
          itemDescription: item.itemDescription,
          matchedMedicationId: medicationId,
          medicationCode: medCode,
          brandName: item.itemDescription,
          genericName: item.itemDescription,
          dosageForm: 'TABLET',
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          billedQuantity: item.billedQuantity,
          freeQuantity: item.freeQuantity,
          totalReceivedQuantity: totalReceived,
          unitCostPtr: item.unitCostPtr,
          mrp: item.mrp,
          gstRate: item.gstRate,
          taxableAmount: Math.round(taxable * 100) / 100,
          gstAmount: Math.round(gstVal * 100) / 100,
          netAmount: Math.round(netVal * 100) / 100,
          batchId,
          stockMovementId: movementId
        });
      }

      // 4. Audit Log Entry
      await auditRepository.recordEvent(
        {
          eventType: 'WHOLESALE_INVOICE_INGESTED',
          resourceType: 'pharmacy_stock_ledger',
          resourceId: parsed.invoiceNumber,
          tenantId,
          branchId,
          metadata: {
            distributor: parsed.distributorName,
            gstin: gstinData.gstin || parsed.distributorGstin,
            state: gstinData.state,
            totalBilledAmount: Math.round(totalAmount * 100) / 100,
            totalUnitsReceived: totalUnits,
            batchCount: createdBatchIds.length
          }
        },
        session,
        tx
      );

      return {
        success: true,
        invoiceNumber: parsed.invoiceNumber,
        invoiceDate: parsed.invoiceDate,
        distributorName: parsed.distributorName,
        distributorGstin: gstinData.gstin || parsed.distributorGstin,
        distributorState: gstinData.state,
        itemCount: processedItems.length,
        totalUnitsReceived: totalUnits,
        totalBilledAmount: Math.round(totalAmount * 100) / 100,
        items: processedItems,
        createdBatchIds,
        stockMovementIds,
        persistedAt: new Date().toISOString()
      };
    });
  }

  private wholesaleCustomers = new Map<string, StoredWholesaleCustomer[]>();
  private wholesaleSalesOrders = new Map<string, StoredWholesaleSalesOrder[]>();

  async createWholesaleCustomer(
    session: SessionContext,
    input: WholesaleCustomerInput
  ): Promise<StoredWholesaleCustomer> {
    await this.enforceWholesalePharmacyB2bGovernance(session, {
      buyerDlNo: input.dlNumber,
      wholesaleLicenseExpiry: input.dlExpiryDate
    });

    if (input.gstin && !GSTIN_REGEX.test(input.gstin.trim())) {
      throw new AppError({
        message: `Invalid buyer GSTIN format: '${input.gstin}'. Must match Indian GSTIN 15-character standard.`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const customerId = crypto.randomUUID();
    const customerCode = `CUST-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const customer: StoredWholesaleCustomer = {
      id: customerId,
      tenantId: session.tenantId,
      customerCode,
      businessName: input.businessName,
      customerType: input.customerType || 'PHARMACY_RETAIL',
      contactPerson: input.contactPerson,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      billingAddress: input.billingAddress,
      shippingAddress: input.shippingAddress || input.billingAddress,
      gstin: input.gstin ? input.gstin.trim() : undefined,
      dlNumber: input.dlNumber.trim(),
      dlExpiryDate: input.dlExpiryDate,
      creditTermsDays: input.creditTermsDays ?? 30,
      creditLimit: input.creditLimit ?? 500000,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    } as any;

    const existing = this.wholesaleCustomers.get(session.tenantId) || [];
    existing.push(customer);
    this.wholesaleCustomers.set(session.tenantId, existing);

    await auditRepository.recordEvent({
      eventType: 'WHOLESALE_CUSTOMER_CREATED',
      resourceType: 'wholesale_customer',
      resourceId: customer.id,
      tenantId: session.tenantId,
      metadata: {
        customerCode,
        businessName: customer.businessName,
        dlNumber: customer.dlNumber
      }
    }, session);

    return customer;
  }

  async getWholesaleCustomers(session: SessionContext): Promise<StoredWholesaleCustomer[]> {
    await this.enforceWholesalePharmacyB2bGovernance(session);
    return this.wholesaleCustomers.get(session.tenantId) || [];
  }

  async createWholesaleSalesOrder(
    session: SessionContext,
    input: CreateWholesaleSalesOrderInput
  ): Promise<StoredWholesaleSalesOrder> {
    await this.enforceWholesalePharmacyB2bGovernance(session, {
      buyerDlNo: input.buyerDlNo
    });

    if (!input.items || input.items.length === 0) {
      throw new AppError({
        message: 'At least one item is mandatory for wholesale sales order.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `SO-WS-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    let subtotal = 0;
    let taxTotal = 0;

    const processedItems = input.items.map((it) => {
      const lineSubtotal = it.quantity * it.unitPrice;
      const gstRate = it.gstRate ?? 12; // default 12% pharma GST
      const lineTax = Math.round((lineSubtotal * (gstRate / 100)) * 100) / 100;
      subtotal += lineSubtotal;
      taxTotal += lineTax;

      return {
        id: crypto.randomUUID(),
        medicationId: it.medicationId,
        batchId: it.batchId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        gstRate,
        totalAmount: Math.round((lineSubtotal + lineTax) * 100) / 100
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    const totalAmount = Math.round((subtotal + taxTotal) * 100) / 100;

    const order: StoredWholesaleSalesOrder = {
      id: orderId,
      tenantId: session.tenantId,
      orderNumber,
      customerId: input.customerId,
      buyerName: input.buyerName || 'B2B Trade Customer',
      buyerGstin: input.buyerGstin,
      buyerDlNo: input.buyerDlNo,
      branchId: input.branchId || session.branchId || 'default-wh',
      status: 'CONFIRMED',
      subtotal,
      taxTotal,
      totalAmount,
      items: processedItems,
      createdAt: now,
      updatedAt: now
    } as any;

    const existing = this.wholesaleSalesOrders.get(session.tenantId) || [];
    existing.push(order);
    this.wholesaleSalesOrders.set(session.tenantId, existing);

    await auditRepository.recordEvent({
      eventType: 'WHOLESALE_ORDER_CREATED',
      resourceType: 'wholesale_sales_order',
      resourceId: order.id,
      tenantId: session.tenantId,
      metadata: {
        orderNumber,
        buyerName: order.buyerName,
        totalAmount,
        itemCount: processedItems.length
      }
    }, session);

    return order;
  }

  async allocateWholesaleSalesOrder(
    session: SessionContext,
    orderId: string
  ): Promise<StoredWholesaleSalesOrder> {
    await this.enforceWholesalePharmacyB2bGovernance(session);
    const orders = this.wholesaleSalesOrders.get(session.tenantId) || [];
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      throw new AppError({
        message: `Wholesale Sales Order '${orderId}' not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const db = getDatabase();
    for (const item of order.items) {
      // Find batch with FEFO
      const batches = await db
        .select()
        .from(pharmacyBatches)
        .where(
          and(
            eq(pharmacyBatches.tenantId, session.tenantId),
            eq(pharmacyBatches.medicationId, item.medicationId as any),
            eq(pharmacyBatches.status, 'ACTIVE')
          )
        )
        .orderBy(asc(pharmacyBatches.expiryDate));

      const validBatch = (batches || []).find((b: any) => Number(b.availableQuantity) >= item.quantity);

      if (!validBatch) {
        throw new AppError({
          message: `Insufficient wholesale stock available for medication '${item.medicationId}' to allocate order ${order.orderNumber}.`,
          code: ErrorCode.INSUFFICIENT_PHARMACY_STOCK,
          statusCode: 409
        });
      }

      item.batchId = validBatch.id;
      item.batchNumber = validBatch.batchNumber;
      item.allocatedQuantity = item.quantity;
    }

    order.status = 'ALLOCATED';
    order.updatedAt = new Date().toISOString();

    await auditRepository.recordEvent({
      eventType: 'WHOLESALE_ORDER_ALLOCATED',
      resourceType: 'wholesale_sales_order',
      resourceId: order.id,
      tenantId: session.tenantId,
      metadata: { orderNumber: order.orderNumber, status: 'ALLOCATED' }
    }, session);

    return order;
  }

  async dispatchWholesaleSalesOrder(
    session: SessionContext,
    orderId: string,
    transportDetails?: { transportMode?: string; vehicleNumber?: string; lrNumber?: string }
  ): Promise<StoredWholesaleSalesOrder> {
    const orders = this.wholesaleSalesOrders.get(session.tenantId) || [];
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      throw new AppError({
        message: `Wholesale Sales Order '${orderId}' not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    await this.enforceWholesalePharmacyB2bGovernance(session, {
      requireBuyerDl: true,
      buyerDlNo: order.buyerDlNo
    });

    if (order.status === 'DISPATCHED' || order.status === 'DELIVERED') {
      throw new AppError({
        message: `Order ${order.orderNumber} has already been dispatched.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    // Auto-allocate if not yet allocated
    if (order.status !== 'ALLOCATED') {
      await this.allocateWholesaleSalesOrder(session, orderId);
    }

    const challanNumber = `CHL-WS-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoiceNumber = `INV-WS-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    await withSecurityContext(getDatabase(), session, async (tx) => {
      for (const item of order.items) {
        if (!item.batchId) continue;

        let q: any = tx
          .select()
          .from(pharmacyBatches)
          .where(and(eq(pharmacyBatches.id, item.batchId as any), eq(pharmacyBatches.tenantId, session.tenantId)));
        if (typeof q.for === 'function') q = q.for('update');
        const [batch] = await q;

        if (!batch) {
          throw new AppError({
            message: `Allocated batch '${item.batchId}' missing during dispatch.`,
            code: ErrorCode.NOT_FOUND,
            statusCode: 404
          });
        }

        const availableQty = Number(batch.availableQuantity || 0);
        if (availableQty < item.quantity) {
          throw new AppError({
            message: `Stock discrepancy: batch ${batch.batchNumber} has only ${availableQty} available, requested ${item.quantity}.`,
            code: ErrorCode.INSUFFICIENT_PHARMACY_STOCK,
            statusCode: 409
          });
        }

        const newAvailable = availableQty - item.quantity;
        const newStatus = newAvailable === 0 ? 'DEPLETED' : batch.status;

        await tx
          .update(pharmacyBatches)
          .set({ availableQuantity: newAvailable, status: newStatus, updatedAt: now } as any)
          .where(eq(pharmacyBatches.id, batch.id));

        // Append to pharmacyStockMovements
        await tx.insert(pharmacyStockMovements).values({
          id: crypto.randomUUID(),
          tenantId: session.tenantId,
          partnerId: batch.partnerId,
          organizationId: batch.organizationId,
          branchId: batch.branchId,
          medicationId: batch.medicationId,
          batchId: batch.id,
          movementType: 'DISPENSE',
          quantity: -item.quantity,
          beforeQuantity: availableQty,
          afterQuantity: newAvailable,
          actorId: session.userId,
          actorRole: 'PHARMACIST',
          reason: `Wholesale B2B Dispatch: ${order.orderNumber} (${challanNumber})`,
          correlationId: `corr-ws-disp-${Date.now()}`,
          referenceType: 'WHOLESALE_DISPATCH',
          referenceId: challanNumber
        } as unknown as typeof pharmacyStockMovements.$inferInsert);
      }
    });

    order.status = 'DISPATCHED';
    order.dispatchChallanNumber = challanNumber;
    order.invoiceNumber = invoiceNumber;
    order.updatedAt = now.toISOString();

    await auditRepository.recordEvent({
      eventType: 'WHOLESALE_DISPATCH_COMPLETED',
      resourceType: 'wholesale_sales_order',
      resourceId: order.id,
      tenantId: session.tenantId,
      metadata: {
        orderNumber: order.orderNumber,
        challanNumber,
        invoiceNumber,
        totalAmount: order.totalAmount,
        transport: transportDetails
      }
    }, session);

    return order;
  }

  async getWholesaleSalesOrders(session: SessionContext): Promise<StoredWholesaleSalesOrder[]> {
    await this.enforceWholesalePharmacyB2bGovernance(session);
    return this.wholesaleSalesOrders.get(session.tenantId) || [];
  }

  async getWholesaleSalesOrderById(session: SessionContext, orderId: string): Promise<StoredWholesaleSalesOrder | null> {
    await this.enforceWholesalePharmacyB2bGovernance(session);
    const orders = this.wholesaleSalesOrders.get(session.tenantId) || [];
    return orders.find((o) => o.id === orderId) || null;
  }
}

export const wholesaleInvoiceIngestionService = new WholesaleInvoiceIngestionService();
