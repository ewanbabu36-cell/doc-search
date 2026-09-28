/**
 * NIC GST E-Invoicing & Signed QR Code Engine
 * National Informatics Centre (NIC) & GSTN Schema Compliant
 * 
 * Computes 64-character SHA-256 IRN (Invoice Reference Number) per formula:
 * IRN = SHA256(SupplierGSTIN + "/" + DocType + "/" + DocNumber + "/" + FinancialYear)
 * 
 * Generates B2B & B2C Tax QR Code Payload conforming to GSTN specifications.
 */

import { sha256Hex } from '../security/privacy-masking.js';

export type GstDocType = 'INV' | 'CRN' | 'DBN';

export interface GstIrnRequest {
  supplierGstin: string;
  docType: GstDocType;
  docNumber: string;
  financialYear: string; // e.g. "2024-25" or "2025-26"
}

export interface GstLineItem {
  id?: string;
  name: string;
  hsnCode: string; // e.g. "999312" for OPD Consultation, "3004" for Medicaments
  quantity: number;
  unitPrice: number;
  taxRatePercent: number; // e.g. 0, 5, 12, 18
  discountAmount?: number;
}

export interface GstInvoiceDetails {
  supplierGstin: string;
  supplierLegalName: string;
  recipientGstin?: string; // Optional: "URP" for Unregistered Person / Retail Patient
  recipientName: string;
  recipientMobile?: string;
  docType: GstDocType;
  docNumber: string;
  docDate: string; // YYYY-MM-DD or DD/MM/YYYY
  financialYear: string;
  items: GstLineItem[];
  upiVpa?: string;
}

export interface GstEInvoiceResult {
  irn: string; // Exactly 64 uppercase hex characters
  ackNumber: string;
  ackDate: string;
  financialYear: string;
  taxBreakdown: {
    subtotal: number;
    totalDiscount: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
    grandTotal: number;
  };
  signedQrCodeData: string;
  dynamicUpiPaymentUri: string;
}

/**
 * Calculates current or specified Indian Financial Year string (e.g., "2025-26")
 */
export function getIndianFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan, 2 = Mar, 3 = Apr
  const year = date.getFullYear();
  if (month >= 3) {
    // April or later
    const nextYearSuffix = String(year + 1).slice(-2);
    return `${year}-${nextYearSuffix}`;
  } else {
    // January to March belongs to previous year
    const currYearSuffix = String(year).slice(-2);
    return `${year - 1}-${currYearSuffix}`;
  }
}

/**
 * Computes deterministic 64-character SHA-256 IRN according to NIC schema:
 * IRN = SHA256(SupplierGSTIN + "/" + DocType + "/" + DocNumber + "/" + FinancialYear)
 */
export function calculateGstIrn(req: GstIrnRequest): string {
  const cleanGstin = (req.supplierGstin || '').trim().toUpperCase();
  const cleanDocType = (req.docType || 'INV').trim().toUpperCase();
  const cleanDocNo = (req.docNumber || '').trim();
  const cleanFinYear = (req.financialYear || getIndianFinancialYear()).trim();

  const rawSeed = `${cleanGstin}/${cleanDocType}/${cleanDocNo}/${cleanFinYear}`;
  return sha256Hex(rawSeed);
}

/**
 * Generates an end-to-end NIC-Compliant GST E-Invoice payload
 * with tax calculations, 64-char IRN, and GSTN QR code representation.
 */
export function generateGstEInvoice(invoice: GstInvoiceDetails): GstEInvoiceResult {
  const finYear = invoice.financialYear || getIndianFinancialYear();
  const irn = calculateGstIrn({
    supplierGstin: invoice.supplierGstin,
    docType: invoice.docType,
    docNumber: invoice.docNumber,
    financialYear: finYear
  });

  // Calculate taxes across line items
  let subtotal = 0;
  let totalDiscount = 0;
  let totalCgst = 0;
  let totalSgst = 0;

  for (const item of (invoice.items || [])) {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.unitPrice) || 0;
    const lineGross = qty * rate;
    const discount = Number(item.discountAmount) || 0;
    const lineNet = Math.max(0, lineGross - discount);

    subtotal += lineGross;
    totalDiscount += discount;

    const taxRate = Number(item.taxRatePercent) || 0;
    if (taxRate > 0) {
      const halfRate = taxRate / 2;
      const cgst = Math.round(((lineNet * halfRate) / 100) * 100) / 100;
      const sgst = Math.round(((lineNet * halfRate) / 100) * 100) / 100;
      totalCgst += cgst;
      totalSgst += sgst;
    }
  }

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const totalTax = Math.round((totalCgst + totalSgst) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

  // NIC Mock Acknowledgment Number (15-digit deterministic sequence)
  const ackSeed = parseInt(irn.slice(0, 8), 16) % 900000000000000;
  const ackNumber = String(100000000000000 + Math.abs(ackSeed));
  const ackDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Formulate standard GSTN QR Code plain representation:
  // Format: SellerGSTIN|BuyerGSTIN|DocNo|DocTyp|DocDt|TotInvVal|ItemCnt|MainHsnCode|Irn
  const buyerGstin = invoice.recipientGstin || 'URP';
  const mainHsn = invoice.items[0]?.hsnCode || '999312';
  const docDateFormatted = invoice.docDate.includes('-')
    ? invoice.docDate.split('-').reverse().join('/')
    : invoice.docDate;

  const signedQrCodeData = [
    invoice.supplierGstin,
    buyerGstin,
    invoice.docNumber,
    invoice.docType,
    docDateFormatted,
    grandTotal.toFixed(2),
    invoice.items.length,
    mainHsn,
    irn
  ].join('|');

  // Dynamic B2C UPI Payment URI
  const vpa = invoice.upiVpa || 'docsearch.billing@icici';
  const payee = encodeURIComponent(invoice.supplierLegalName);
  const dynamicUpiPaymentUri = `upi://pay?pa=${vpa}&pn=${payee}&am=${grandTotal.toFixed(2)}&tr=${invoice.docNumber}&tn=GST+Inv+${invoice.docNumber}&cu=INR`;

  return {
    irn,
    ackNumber,
    ackDate,
    financialYear: finYear,
    taxBreakdown: {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgstAmount: Math.round(totalCgst * 100) / 100,
      sgstAmount: Math.round(totalSgst * 100) / 100,
      igstAmount: 0,
      totalTax,
      grandTotal
    },
    signedQrCodeData,
    dynamicUpiPaymentUri
  };
}
