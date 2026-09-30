import React, { useEffect, useState } from 'react';
import { Dialog, Button } from '@docsearch/ui-kit';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';
import { ProfileUpdateRequiredAlertModal } from '../common/ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';

export interface UnifiedInvoiceItem {
  id?: string;
  name: string;
  genericName?: string | undefined;
  hsnCode?: string | undefined;
  batchNumber?: string | undefined;
  expiryDate?: string | undefined;
  quantity: number;
  unit?: string | undefined;
  mrp?: number | undefined;
  rate: number;
  discount?: number | undefined;
  gstRate?: number | undefined; // e.g. 0, 5, 12, 18
  isSubstituted?: boolean | undefined;
  total?: number | undefined;
}

export interface UnifiedInvoiceData {
  invoiceNumber?: string | undefined;
  invoiceDate?: string | undefined;
  tenantName?: string | undefined;
  entityLegalName?: string | undefined;
  tagline?: string | undefined;
  facilityTagline?: string | undefined;
  officialAddress?: string | undefined;
  contactPhone?: string | undefined;
  supportEmail?: string | undefined;
  website?: string | undefined;
  gstin?: string | undefined;
  drugLicenseNo?: string | undefined;
  licenseNo?: string | undefined;
  pharmacistName?: string | undefined;
  pharmacistRegNo?: string | undefined;
  patientName?: string | undefined;
  patientPhone?: string | undefined;
  patientMrn?: string | undefined;
  patientAddress?: string | undefined;
  doctorName?: string | undefined;
  doctorOrRefName?: string | undefined;
  doctorNmcReg?: string | undefined;
  paymentMode?: string | undefined;
  paymentStatus?: ('PAID' | 'PENDING' | 'PARTIAL') | undefined;
  transactionReference?: string | undefined;
  items?: UnifiedInvoiceItem[] | undefined;
  subtotal?: number | undefined;
  discountPercent?: number | undefined;
  discountAmount?: number | undefined;
  taxableAmount?: number | undefined;
  cgstAmount?: number | undefined;
  sgstAmount?: number | undefined;
  igstAmount?: number | undefined;
  grandTotal?: number | undefined;
  containsScheduleH?: boolean | undefined;
  isOffline?: boolean | undefined;
  bankDetails?: {
    bankName?: string | undefined;
    accountHolder?: string | undefined;
    accountNumber?: string | undefined;
    ifscCode?: string | undefined;
    upiId?: string | undefined;
  } | undefined;
}

export type PrintLayoutMode = 'THERMAL_80MM' | 'LASER_A4';

export interface UnifiedDocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: UnifiedInvoiceData | null;
  defaultLayout?: PrintLayoutMode | undefined;
  onNewSale?: (() => void) | undefined;
  autoPrint?: boolean | undefined;
}

/**
 * Converts numeric amount to Indian Currency Words (Lakh, Crore, Thousand, Hundred, Paise)
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    let s = '';
    if (n >= 100) {
      s += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    } else if (n > 0) {
      s += a[n];
    }
    return s.trim();
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = rem;

  let str = '';
  if (crore > 0) {
    str += convertLessThanOneThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    str += convertLessThanOneThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    str += convertLessThanOneThousand(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    str += convertLessThanOneThousand(hundred) + ' Hundred ';
  }
  if (rem > 0 && str !== '') {
    str += 'and ';
  }
  if (rupees % 100 > 0) {
    str += convertLessThanOneThousand(rupees % 100) + ' ';
  }

  str = str.trim() + ' Rupees';

  if (paise > 0) {
    str += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
  }

  return str + ' Only';
}

export const UnifiedDocumentPrintModal: React.FC<UnifiedDocumentPrintModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
  defaultLayout = 'THERMAL_80MM',
  onNewSale,
  autoPrint = false
}) => {
  const profile = getVerifiedRoleProfile();
  const [layoutMode, setLayoutMode] = useState<PrintLayoutMode>(defaultLayout);
  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    if (defaultLayout) {
      setLayoutMode(defaultLayout);
    }
  }, [defaultLayout, isOpen]);

  useEffect(() => {
    if (!isOpen || !autoPrint || !invoiceData) return;
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }
    const timer = setTimeout(() => {
      window.print();
    }, 450);
    return () => clearTimeout(timer);
  }, [isOpen, autoPrint, invoiceData]);

  if (!invoiceData) return null;

  // Normalized Fields
  const entityName =
    invoiceData.tenantName ||
    invoiceData.entityLegalName ||
    profile.entityLegalName ||
    'Healthcare Facility';
  const tagline =
    invoiceData.tagline ||
    invoiceData.facilityTagline ||
    profile.facilityTagline ||
    '';
  const address =
    invoiceData.officialAddress ||
    profile.officialAddress ||
    '';
  const phone =
    invoiceData.contactPhone ||
    profile.contactPhone ||
    '';
  const gstin = invoiceData.gstin || profile.gstin || '';
  const drugLicenseNo =
    invoiceData.drugLicenseNo ||
    invoiceData.licenseNo ||
    profile.pharmacyDrugLicense20B ||
    profile.pharmacyDrugLicense21B ||
    '';
  const invoiceNumber = invoiceData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
  const invoiceDate =
    invoiceData.invoiceDate ||
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  const patientName = invoiceData.patientName || 'Cash / Walk-in Customer';
  const patientPhone = invoiceData.patientPhone || 'N/A';
  const patientMrn = invoiceData.patientMrn || 'N/A';
  const doctorName = invoiceData.doctorName || invoiceData.doctorOrRefName;
  const paymentMode = invoiceData.paymentMode || 'CASH';
  const paymentStatus = invoiceData.paymentStatus || 'PAID';
  const transactionRef = invoiceData.transactionReference || `TXN-${invoiceNumber}`;

  // Normalized Calculation Engine
  const rawItems = invoiceData.items || [];
  const processedItems = rawItems.map((it, idx) => {
    const qty = it.quantity || 1;
    const rate = it.rate || it.mrp || 0;
    const discount = it.discount || 0;
    const taxable = Math.max(0, rate * qty - discount);
    const gstRate = it.gstRate !== undefined ? it.gstRate : 12;
    const taxAmount = (taxable * gstRate) / 100;
    const lineTotal = it.total !== undefined ? it.total : taxable + taxAmount;

    return {
      id: it.id || `item-${idx}`,
      name: it.name,
      genericName: it.genericName,
      hsnCode: it.hsnCode || '3004',
      batchNumber: it.batchNumber || 'BAT-2026',
      expiryDate: it.expiryDate || '12/28',
      quantity: qty,
      unit: it.unit || 'Units',
      mrp: it.mrp || rate,
      rate,
      discount,
      gstRate,
      cgstRate: gstRate / 2,
      sgstRate: gstRate / 2,
      cgstAmount: taxAmount / 2,
      sgstAmount: taxAmount / 2,
      taxable,
      taxAmount,
      total: lineTotal,
      isSubstituted: it.isSubstituted
    };
  });

  const calculatedSubtotal = processedItems.reduce((acc, it) => acc + it.rate * it.quantity, 0);
  const calculatedDiscount = processedItems.reduce((acc, it) => acc + it.discount, 0);
  const calculatedTaxable = processedItems.reduce((acc, it) => acc + it.taxable, 0);
  const calculatedCgst = processedItems.reduce((acc, it) => acc + it.cgstAmount, 0);
  const calculatedSgst = processedItems.reduce((acc, it) => acc + it.sgstAmount, 0);
  const calculatedGrandTotal = processedItems.reduce((acc, it) => acc + it.total, 0);

  const subtotal = invoiceData.subtotal !== undefined ? invoiceData.subtotal : calculatedSubtotal;
  const discountAmount =
    invoiceData.discountAmount !== undefined ? invoiceData.discountAmount : calculatedDiscount;
  const taxableAmount =
    invoiceData.taxableAmount !== undefined ? invoiceData.taxableAmount : calculatedTaxable;
  const cgstAmount = invoiceData.cgstAmount !== undefined ? invoiceData.cgstAmount : calculatedCgst;
  const sgstAmount = invoiceData.sgstAmount !== undefined ? invoiceData.sgstAmount : calculatedSgst;
  const grandTotal = invoiceData.grandTotal !== undefined ? invoiceData.grandTotal : calculatedGrandTotal;

  const upiId = invoiceData.bankDetails?.upiId || profile.upiId || (phone ? `${phone.replace(/\D/g, '')}@upi` : '');
  const upiQrUrl = upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=${encodeURIComponent(entityName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Inv-${invoiceNumber}`
  )}` : '';

  const checkGuard = (): boolean => {
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return false;
    }
    return true;
  };

  const handlePrint = () => {
    if (!checkGuard()) return;
    window.print();
  };



  const handleWhatsAppShare = () => {
    const itemsList = processedItems
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.name}* (${it.quantity} ${it.unit}) @ ₹${it.rate.toFixed(2)} = ₹${it.total.toFixed(2)}`
      )
      .join('\n');

    const discountLine =
      discountAmount > 0
        ? `\n🎉 *Discount / Savings: -₹${discountAmount.toFixed(2)}*\n`
        : '';

    const text = encodeURIComponent(
      `🧾 *TAX INVOICE — ${entityName}*\n` +
      `DL: ${drugLicenseNo} | GSTIN: ${gstin}\n` +
      `-----------------------------------------\n` +
      `Invoice #: *${invoiceNumber}*\n` +
      `Date: ${invoiceDate}\n` +
      `Patient: *${patientName}* (📞 +91 ${patientPhone})\n` +
      (doctorName ? `Doctor: Dr. ${doctorName}\n` : '') +
      `Payment Mode: *${paymentMode}* (${paymentStatus})\n` +
      `-----------------------------------------\n` +
      `*PARTICULARS / ITEMS:*\n` +
      `${itemsList}\n` +
      `-----------------------------------------\n` +
      `Gross Subtotal: ₹${subtotal.toFixed(2)}\n` +
      discountLine +
      `Taxable Amount: ₹${taxableAmount.toFixed(2)}\n` +
      `CGST: ₹${cgstAmount.toFixed(2)} | SGST: ₹${sgstAmount.toFixed(2)}\n` +
      `*GRAND TOTAL: ₹${grandTotal.toFixed(2)}*\n` +
      `In Words: ${numberToIndianWords(grandTotal)}\n` +
      `-----------------------------------------\n` +
      `Thank you for choosing ${entityName}!\n` +
      `Wishing you optimal health & quick recovery.`
    );
    window.open(`https://wa.me/91${patientPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const handleCopyText = async () => {
    const summary =
      `TAX INVOICE — ${entityName}\n` +
      `Invoice #: ${invoiceNumber} | Date: ${invoiceDate}\n` +
      `Patient: ${patientName} | Mode: ${paymentMode}\n` +
      `Grand Total: ₹${grandTotal.toFixed(2)} (${numberToIndianWords(grandTotal)})\n` +
      `GSTIN: ${gstin} | DL: ${drugLicenseNo}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {}
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={`🧾 Unified Tax Invoice Slip — ${invoiceNumber}`}
        isFullPage={true}
        maxWidth="full"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button variant="outline" onClick={onClose} style={{ minHeight: '34px' }}>
                ✕ Close
              </Button>
              {copiedToast && (
                <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-success)', fontWeight: 700 }}>
                  ✓ Copied to clipboard!
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="outline"
                onClick={handleCopyText}
                style={{ minHeight: '34px', fontWeight: 600 }}
                title="Copy text summary to clipboard"
              >
                📋 Copy Summary
              </Button>
              <Button
                variant="outline"
                onClick={handleWhatsAppShare}
                style={{
                  minHeight: '34px',
                  borderColor: 'var(--ds-color-success)',
                  color: 'var(--ds-color-success)',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📲 Send WhatsApp Bill
              </Button>
              <Button
                variant="primary"
                onClick={handlePrint}
                style={{
                  minHeight: '34px',
                  backgroundColor: 'var(--ds-color-primary)',
                  borderColor: 'var(--ds-color-primary)',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Print invoice directly [Ctrl+P]"
              >
                🖨️ Print Document
              </Button>
              {onNewSale && (
                <Button
                  variant="primary"
                  onClick={() => {
                    onClose();
                    onNewSale();
                  }}
                  style={{
                    minHeight: '34px',
                    fontWeight: 900,
                    backgroundColor: 'var(--ds-color-success)',
                    borderColor: 'var(--ds-color-success)'
                  }}
                >
                  ⚡ Next Patient / New Sale [F2]
                </Button>
              )}
            </div>
          </div>
        }
      >
        {/* Print Stylesheet */}
        <style>{`
          @media print {
            @page {
              size: ${layoutMode === 'THERMAL_80MM' ? '80mm auto' : 'A4 portrait'};
              margin: ${layoutMode === 'THERMAL_80MM' ? '2mm 3mm' : '8mm 10mm'};
            }
            body > div:not(.ds-backdrop) {
              display: none !important;
            }
            .ds-backdrop {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: #FFFFFF !important;
              z-index: 999999 !important;
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .ds-backdrop > div {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #FFFFFF !important;
            }
            .ds-backdrop > div > div:first-child,
            .ds-backdrop > div > div:last-child {
              display: none !important;
            }
            .no-print {
              display: none !important;
            }
            #unified-printable-document {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: ${layoutMode === 'THERMAL_80MM' ? '4px' : '12px'} !important;
              background: #FFFFFF !important;
              color: #000000 !important;
              border: none !important;
              box-shadow: none !important;
            }
          }
        `}</style>

        {/* Top Control Bar: Mode Toggle */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--ds-color-surface-subtle)',
            border: '1px solid var(--ds-color-border)',
            padding: '10px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🖨️</span>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                Print Formatting Mode
              </span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                Choose format suited for your current counter hardware
              </span>
            </div>
          </div>

          {/* Segmented Mode Switcher */}
          <div
            style={{
              display: 'inline-flex',
              borderRadius: '8px',
              border: '1.5px solid var(--ds-color-border)',
              overflow: 'hidden',
              backgroundColor: 'var(--ds-color-surface)'
            }}
          >
            <button
              type="button"
              onClick={() => setLayoutMode('THERMAL_80MM')}
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                minHeight: '34px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: layoutMode === 'THERMAL_80MM' ? 'var(--ds-color-primary)' : 'transparent',
                color: layoutMode === 'THERMAL_80MM' ? 'white' : 'var(--ds-color-text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              🧾 Thermal Receipt (80mm Roll)
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('LASER_A4')}
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                minHeight: '34px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: layoutMode === 'LASER_A4' ? 'var(--ds-color-primary)' : 'transparent',
                color: layoutMode === 'LASER_A4' ? 'white' : 'var(--ds-color-text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              📄 Standard Laser (A4 Sheet)
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div
          id="unified-printable-document"
          style={{
            backgroundColor: 'white',
            color: 'black',
            margin: '0 auto',
            padding: layoutMode === 'THERMAL_80MM' ? '16px' : '32px',
            maxWidth: layoutMode === 'THERMAL_80MM' ? '380px' : '860px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
            fontFamily:
              layoutMode === 'THERMAL_80MM'
                ? "'Courier New', Courier, monospace, sans-serif"
                : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontSize: layoutMode === 'THERMAL_80MM' ? '0.78rem' : '0.85rem',
            lineHeight: layoutMode === 'THERMAL_80MM' ? '1.3' : '1.45'
          }}
        >
          {/* ======================= THERMAL 80MM LAYOUT ======================= */}
          {layoutMode === 'THERMAL_80MM' ? (
            <div>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed black', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  *** TAX INVOICE ***
                </div>
                {invoiceData.isOffline && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#B91C1C', letterSpacing: '0.5px', marginTop: '2px' }}>
                    *** OFFLINE RECORDED BILL (TIER-2/3 RESILIENT) ***
                  </div>
                )}
                <div style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', marginTop: '2px' }}>
                  {entityName}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#333', marginTop: '2px' }}>
                  {address}
                </div>
                <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                  Tel: {phone}
                </div>
                <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                  GSTIN: {gstin} | DL: {drugLicenseNo}
                </div>
              </div>

              {/* Meta */}
              <div style={{ fontSize: '0.75rem', borderBottom: '1px dashed black', paddingBottom: '6px', marginBottom: '8px' }}>
                <div><strong>Invoice:</strong> {invoiceNumber}</div>
                <div><strong>Date:</strong> {invoiceDate}</div>
                <div><strong>Patient:</strong> {patientName}</div>
                <div><strong>Mobile:</strong> {patientPhone}</div>
                {patientMrn !== 'N/A' && <div><strong>UHID:</strong> {patientMrn}</div>}
                {doctorName && <div><strong>Doctor:</strong> Dr. {doctorName}</div>}
                <div><strong>Payment:</strong> {paymentMode} ({paymentStatus})</div>
              </div>

              {/* Schedule H Caution if applicable */}
              {invoiceData.containsScheduleH && (
                <div
                  style={{
                    border: '1px solid black',
                    padding: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    marginBottom: '8px'
                  }}
                >
                  ⚠️ SCHEDULE H / H1: Sold on prescription only.
                </div>
              )}

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid black' }}>
                    <th style={{ textAlign: 'left', padding: '2px 0' }}>Item (Batch/Exp)</th>
                    <th style={{ textAlign: 'center', padding: '2px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '2px 0' }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '2px 0' }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {processedItems.map((it, idx) => (
                    <tr key={it.id || idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '3px 0' }}>
                        <div>{it.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#555' }}>
                          B:{it.batchNumber} E:{it.expiryDate} {it.hsnCode ? `H:${it.hsnCode}` : ''}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '3px 0', verticalAlign: 'top' }}>
                        {it.quantity}
                      </td>
                      <td style={{ textAlign: 'right', padding: '3px 0', verticalAlign: 'top' }}>
                        {it.rate.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '3px 0', verticalAlign: 'top', fontWeight: 700 }}>
                        {it.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ borderTop: '1px solid black', borderBottom: '1px solid black', padding: '6px 0', fontSize: '0.76rem', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Gross Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Discount:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxable Value:</span>
                  <span>₹{taxableAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST:</span>
                  <span>₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST:</span>
                  <span>₹{sgstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 900, marginTop: '4px' }}>
                  <span>NET TOTAL:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* In Words */}
              <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
                {numberToIndianWords(grandTotal)}
              </div>

              {/* Dynamic UPI QR Code */}
              <div style={{ textAlign: 'center', margin: '10px 0', borderTop: '1px dashed black', paddingTop: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                  Scan UPI QR to Verify / Settle
                </div>
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  style={{ width: '100px', height: '100px', margin: '0 auto', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div style={{ fontSize: '0.65rem', color: '#444', marginTop: '2px' }}>
                  VPA: {upiId}
                </div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#555', borderTop: '1px dashed black', paddingTop: '6px' }}>
                <div>Medicines once sold will not be taken back without original bill & intact batch.</div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>*** Get Well Soon ***</div>
              </div>
            </div>
          ) : (
            /* ======================= LASER A4 LAYOUT ======================= */
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase' }}>
                    {entityName}
                  </h1>
                  <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                    {tagline}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '4px' }}>
                    {address}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '2px' }}>
                    Phone: {phone || 'N/A'}{(invoiceData.website || profile.website) ? ` | Web: ${invoiceData.website || profile.website}` : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-block', backgroundColor: '#0F172A', color: 'white', padding: '3px 12px', borderRadius: '4px', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                    TAX INVOICE
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>
                    №: {invoiceNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Date: {invoiceDate}
                  </div>
                  <div style={{ fontSize: '0.78rem', marginTop: '4px', color: '#334155' }}>
                    <strong>GSTIN:</strong> {gstin}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                    <strong>License No:</strong> {drugLicenseNo}
                  </div>
                </div>
              </div>

              {/* Bill-To & Doctor Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Billed To Patient:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    {patientName}
                  </div>
                  <div style={{ marginTop: '2px' }}><strong>Phone:</strong> +91 {patientPhone}</div>
                  {patientMrn !== 'N/A' && <div><strong>UHID / MRN:</strong> {patientMrn}</div>}
                  {invoiceData.patientAddress && <div><strong>Address:</strong> {invoiceData.patientAddress}</div>}
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Encounter & Payment Reference:
                  </div>
                  {doctorName && (
                    <div>
                      <strong>Consulting Doctor:</strong> Dr. {doctorName}
                      {invoiceData.doctorNmcReg && <span style={{ fontSize: '0.74rem', color: '#64748B' }}> (NMC: {invoiceData.doctorNmcReg})</span>}
                    </div>
                  )}
                  <div><strong>Payment Mode:</strong> {paymentMode}</div>
                  <div><strong>Status:</strong> <span style={{ fontWeight: 800, color: paymentStatus === 'PAID' ? '#16A34A' : '#EAB308' }}>{paymentStatus}</span></div>
                  <div><strong>Txn Ref:</strong> {transactionRef}</div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0F172A', color: 'white' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}>#</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item / Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>HSN/SAC</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Batch & Expiry</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Disc (₹)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>GST %</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {processedItems.map((it, idx) => (
                    <tr key={it.id || idx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: idx % 2 === 0 ? 'white' : '#F8FAFC' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{it.name}</div>
                        {it.genericName && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {it.genericName}
                          </div>
                        )}
                        {it.isSubstituted && (
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                            Jan Aushadhi Generic
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace' }}>{it.hsnCode}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.75rem' }}>
                        {it.batchNumber} • {it.expiryDate}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>
                        {it.quantity} {it.unit}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{it.rate.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: it.discount > 0 ? '#16A34A' : '#64748B' }}>
                        {it.discount > 0 ? `-${it.discount.toFixed(2)}` : '0.00'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{it.gstRate}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                        {it.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', borderTop: '2px solid #0F172A', paddingTop: '16px', marginBottom: '20px' }}>
                {/* Left: Bank Details & UPI QR */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img
                    src={upiQrUrl}
                    alt="UPI QR Code"
                    style={{ width: '110px', height: '110px', border: '1px solid #CBD5E1', padding: '4px', borderRadius: '4px' }}
                  />
                  <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>Bank Wire & UPI Details</div>
                    <div><strong>Bank:</strong> {invoiceData.bankDetails?.bankName || profile.bankName || 'HDFC Bank Ltd'}</div>
                    <div><strong>A/C Holder:</strong> {invoiceData.bankDetails?.accountHolder || profile.accountHolder || entityName}</div>
                    <div><strong>A/C No:</strong> {invoiceData.bankDetails?.accountNumber || profile.accountNumber || '50200088991122'}</div>
                    <div><strong>IFSC:</strong> {invoiceData.bankDetails?.ifscCode || profile.ifscCode || 'HDFC0001234'}</div>
                    <div><strong>UPI ID:</strong> {upiId}</div>
                  </div>
                </div>

                {/* Right: Calculations Table */}
                <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748B' }}>Gross Subtotal:</span>
                    <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', marginBottom: '4px' }}>
                      <span>Discount / Subsidy:</span>
                      <span style={{ fontWeight: 700 }}>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748B' }}>Taxable Amount:</span>
                    <span style={{ fontWeight: 700 }}>₹{taxableAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '4px' }}>
                    <span>CGST:</span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '8px' }}>
                    <span>SGST:</span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0F172A', paddingTop: '8px', fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: 'var(--ds-color-primary)' }}>₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', textAlign: 'right' }}>
                    {numberToIndianWords(grandTotal)}
                  </div>
                </div>
              </div>

              {/* Terms and Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '0.75rem', color: '#64748B' }}>
                <div style={{ maxWidth: '60%' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>Terms & Statutory Conditions:</div>
                  <div>1. All disputes subject to local state jurisdiction.</div>
                  <div>2. Goods once sold will not be returned unless defective or recalled.</div>
                  <div>3. Computer-generated invoice does not require physical signature under IT Act 2000.</div>
                </div>
                <div style={{ textAlign: 'center', width: '180px', borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A' }}>Authorized Signatory</div>
                  <div style={{ fontSize: '0.7rem' }}>For {entityName}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Profile Guard Warning Modal */}
      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        missingFields={profileMissingFields}
      />
    </>
  );
};
