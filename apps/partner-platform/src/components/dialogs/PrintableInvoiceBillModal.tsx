import React from 'react';
import {
  UnifiedDocumentPrintModal,
  type UnifiedInvoiceData
} from '../common/UnifiedDocumentPrintModal.js';

export interface PrintableInvoiceBillItem {
  id: string;
  description: string;
  sacHsnCode: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRatePercent: number;
}

export interface CustomInvoiceSettings {
  entityLegalName: string;
  facilityTagline: string;
  officialAddress: string;
  contactPhone: string;
  supportEmail: string;
  website: string;
  gstin: string;
  licenseNo: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  jurisdictionCity: string;
  headerThemeColor: string;
}

export interface PrintableInvoiceBillProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData?: {
    invoiceNumber?: string | undefined;
    invoiceDate?: string | undefined;
    patientName?: string | undefined;
    patientMrn?: string | undefined;
    patientPhone?: string | undefined;
    doctorOrRefName?: string | undefined;
    items?: PrintableInvoiceBillItem[] | undefined;
    paymentMode?: string | undefined;
    paymentStatus?: ('PAID' | 'PENDING' | 'PARTIAL') | undefined;
    transactionReference?: string | undefined;
  } | undefined;
}

/**
 * Unified Laser & Thermal Invoice Bill Modal
 * Re-routes bill printing through the unified print engine with live Laser (A4) / Thermal (80mm) toggle.
 */
export const PrintableInvoiceBillModal: React.FC<PrintableInvoiceBillProps> = ({
  isOpen,
  onClose,
  invoiceData
}) => {
  if (!isOpen) return null;

  const unifiedData: UnifiedInvoiceData = {
    invoiceNumber: invoiceData?.invoiceNumber,
    invoiceDate: invoiceData?.invoiceDate,
    patientName: invoiceData?.patientName,
    patientMrn: invoiceData?.patientMrn,
    patientPhone: invoiceData?.patientPhone,
    doctorOrRefName: invoiceData?.doctorOrRefName,
    paymentMode: invoiceData?.paymentMode,
    paymentStatus: invoiceData?.paymentStatus,
    transactionReference: invoiceData?.transactionReference,
    items: invoiceData?.items?.map((it) => ({
      id: it.id,
      name: it.description,
      hsnCode: it.sacHsnCode,
      quantity: it.quantity,
      rate: it.rate,
      discount: it.discount,
      gstRate: it.taxRatePercent
    }))
  };

  return (
    <UnifiedDocumentPrintModal
      isOpen={isOpen}
      onClose={onClose}
      invoiceData={unifiedData}
      defaultLayout="LASER_A4"
    />
  );
};
