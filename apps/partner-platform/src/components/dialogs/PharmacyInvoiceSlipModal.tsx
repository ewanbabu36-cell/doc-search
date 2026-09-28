import React from 'react';
import {
  UnifiedDocumentPrintModal,
  numberToIndianWords,
  type UnifiedInvoiceData
} from '../common/UnifiedDocumentPrintModal.js';

export interface PharmacyInvoiceItem {
  medicationName: string;
  genericName?: string | undefined;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  mrp: number;
  rate: number;
  gstRate: number;
  hsnCode?: string | undefined;
  isSubstituted?: boolean | undefined;
  total: number;
}

export interface PharmacyInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  tenantName: string;
  drugLicenseNo: string;
  gstin: string;
  pharmacistName: string;
  pharmacistRegNo?: string | undefined;
  patientName: string;
  patientPhone: string;
  patientMrn?: string | undefined;
  doctorName?: string | undefined;
  doctorNmcReg?: string | undefined;
  paymentMode: 'CASH' | 'UPI_QR' | 'CARD' | 'CREDIT_KHATA';
  items: PharmacyInvoiceItem[];
  subtotal: number;
  discountPercent?: number | undefined;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  containsScheduleH?: boolean | undefined;
  isOffline?: boolean | undefined;
}

export interface PharmacyInvoiceSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: PharmacyInvoiceData | null;
  onNewSale?: (() => void) | undefined;
  autoPrint?: boolean | undefined;
}

export { numberToIndianWords };

/**
 * Unified Pharmacy Invoice & Thermal Slip Modal
 * Re-routes dispensing slip printing through the unified print engine with live Thermal/Laser toggle.
 */
export const PharmacyInvoiceSlipModal: React.FC<PharmacyInvoiceSlipModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
  onNewSale,
  autoPrint = false
}) => {
  if (!invoiceData) return null;

  const unifiedData: UnifiedInvoiceData = {
    invoiceNumber: invoiceData.invoiceNumber,
    invoiceDate: invoiceData.invoiceDate,
    tenantName: invoiceData.tenantName,
    drugLicenseNo: invoiceData.drugLicenseNo,
    gstin: invoiceData.gstin,
    pharmacistName: invoiceData.pharmacistName,
    pharmacistRegNo: invoiceData.pharmacistRegNo,
    patientName: invoiceData.patientName,
    patientPhone: invoiceData.patientPhone,
    patientMrn: invoiceData.patientMrn,
    doctorName: invoiceData.doctorName,
    doctorNmcReg: invoiceData.doctorNmcReg,
    paymentMode: invoiceData.paymentMode,
    paymentStatus: 'PAID',
    items: invoiceData.items.map((it) => ({
      name: it.medicationName,
      genericName: it.genericName,
      batchNumber: it.batchNumber,
      expiryDate: it.expiryDate,
      quantity: it.quantity,
      unit: it.unit,
      mrp: it.mrp,
      rate: it.rate,
      gstRate: it.gstRate,
      hsnCode: it.hsnCode,
      isSubstituted: it.isSubstituted,
      total: it.total
    })),
    subtotal: invoiceData.subtotal,
    discountPercent: invoiceData.discountPercent,
    discountAmount: invoiceData.discountAmount,
    taxableAmount: invoiceData.taxableAmount,
    cgstAmount: invoiceData.cgstAmount,
    sgstAmount: invoiceData.sgstAmount,
    grandTotal: invoiceData.grandTotal,
    containsScheduleH: invoiceData.containsScheduleH,
    isOffline: invoiceData.isOffline
  };

  return (
    <UnifiedDocumentPrintModal
      isOpen={isOpen}
      onClose={onClose}
      invoiceData={unifiedData}
      defaultLayout="THERMAL_80MM"
      onNewSale={onNewSale}
      autoPrint={autoPrint}
    />
  );
};
