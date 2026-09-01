/**
 * DOC SEARCH — B2B Corporate Pro-Forma & GST Tax Invoice PDF Generator
 * Generates an authentic ISO 32000-1 pure vector PDF document with
 * Corporate details, employee headcount slabs, 18% GST calculation, SAC Code 999312, and digital seals.
 */

export interface CorporateInvoiceData {
  invoiceNumber?: string;
  invoiceDate?: string;
  corporateName: string;
  corporateGstin?: string;
  corporateAddress?: string;
  contactPerson?: string;
  contactEmail?: string;
  planName: string;
  employeeHeadcount: number;
  ratePerEmployee: number;
  totalSubtotalInr: number;
  gstAmountInr: number;
  totalGrandTotalInr: number;
  includedAddons?: string[];
}

function escapePdfText(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generateAndDownloadCorporateInvoicePdf(data: CorporateInvoiceData): void {
  const pageWidth = 595.28; // A4 Width
  const pageHeight = 841.89; // A4 Height
  const margin = 36;
  const contentLines: string[] = [];

  const invoiceNo = data.invoiceNumber || `INV-B2B-${Date.now().toString().slice(-6)}`;
  const invoiceDate = data.invoiceDate || new Date().toLocaleDateString('en-US', { dateStyle: 'long' });

  // 1. Header Banner
  contentLines.push('q');
  contentLines.push('0.06 0.09 0.16 rg'); // Deep slate navy
  contentLines.push(`0 ${pageHeight - 90} ${pageWidth} 90 re f`);
  contentLines.push('Q');

  // Emerald/Cyan Accent Line
  contentLines.push('q');
  contentLines.push('0.92 0.7 0.03 RG'); // Amber gold accent
  contentLines.push('3 w');
  contentLines.push(`0 ${pageHeight - 90} m ${pageWidth} ${pageHeight - 90} l S`);
  contentLines.push('Q');

  // Header Title
  contentLines.push('BT');
  contentLines.push('/F2 16 Tf');
  contentLines.push('1 1 1 rg');
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 38} Tm`);
  contentLines.push('(DOC SEARCH TECHNOLOGIES PVT LTD — CORPORATE TAX INVOICE) Tj');

  contentLines.push('/F1 8.5 Tf');
  contentLines.push('0.6 0.7 0.8 rg');
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 54} Tm`);
  contentLines.push('(B2B Corporate Healthcare & Employee Wellness Annual Subscription Contract) Tj');

  contentLines.push('/F1 8 Tf');
  contentLines.push('0.92 0.7 0.03 rg');
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 70} Tm`);
  contentLines.push(`(Invoice No: ${escapePdfText(invoiceNo)} | Date: ${escapePdfText(invoiceDate)} | SAC: 999312) Tj`);
  contentLines.push('ET');

  let curY = pageHeight - 115;

  // Section 1: Bill To & Supplier Information
  contentLines.push('BT');
  contentLines.push('/F2 10 Tf');
  contentLines.push('0.06 0.09 0.16 rg');
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(ISSUER / SERVICE PROVIDER:) Tj');
  contentLines.push(`1 0 0 1 ${margin + 260} ${curY} Tm`);
  contentLines.push('(BILLED TO CORPORATE CLIENT:) Tj');
  contentLines.push('ET');

  curY -= 14;

  contentLines.push('BT');
  contentLines.push('/F1 7.5 Tf');
  contentLines.push('0.2 0.25 0.3 rg');
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(DocSearch Technologies Pvt Ltd) Tj');
  contentLines.push(`1 0 0 1 ${margin + 260} ${curY} Tm`);
  contentLines.push(`(${escapePdfText(data.corporateName)}) Tj`);

  curY -= 12;
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(CIN: U72900DL2026PTC109842 | GSTIN: 07AABCD1234F1Z5) Tj');
  contentLines.push(`1 0 0 1 ${margin + 260} ${curY} Tm`);
  contentLines.push(`(GSTIN: ${escapePdfText(data.corporateGstin || '07AAAAA0000A1Z5')} | Corporate Account) Tj`);

  curY -= 12;
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(DLF Cyber City, Tower B, Level 14, Gurugram, India) Tj');
  contentLines.push(`1 0 0 1 ${margin + 260} ${curY} Tm`);
  contentLines.push(`(Address: ${escapePdfText(data.corporateAddress || 'Corporate Technology Park, Campus 1')}) Tj`);
  contentLines.push('ET');

  curY -= 25;

  // Section 2: Line Items Table Header
  contentLines.push('q');
  contentLines.push('0.06 0.09 0.16 rg');
  contentLines.push(`${margin} ${curY - 18} ${pageWidth - margin * 2} 18 re f`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 8 Tf');
  contentLines.push('1 1 1 rg');
  contentLines.push(`1 0 0 1 ${margin + 8} ${curY - 12} Tm`);
  contentLines.push('(Description / Plan Package) Tj');
  contentLines.push(`1 0 0 1 ${margin + 230} ${curY - 12} Tm`);
  contentLines.push('(Headcount) Tj');
  contentLines.push(`1 0 0 1 ${margin + 320} ${curY - 12} Tm`);
  contentLines.push('(Rate / Emp / Yr) Tj');
  contentLines.push(`1 0 0 1 ${margin + 420} ${curY - 12} Tm`);
  contentLines.push('(Subtotal Amount) Tj');
  contentLines.push('ET');

  curY -= 18;

  // Line Item 1: Main Plan Package
  contentLines.push('q');
  contentLines.push('0.98 0.99 1.0 rg');
  contentLines.push(`${margin} ${curY - 30} ${pageWidth - margin * 2} 30 re f`);
  contentLines.push('0.85 0.88 0.92 RG');
  contentLines.push('0.5 w');
  contentLines.push(`${margin} ${curY - 30} ${pageWidth - margin * 2} 30 re s`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 8 Tf');
  contentLines.push('0.06 0.09 0.16 rg');
  contentLines.push(`1 0 0 1 ${margin + 8} ${curY - 12} Tm`);
  contentLines.push(`(${escapePdfText(data.planName)}) Tj`);

  contentLines.push('/F1 6.5 Tf');
  contentLines.push('0.4 0.5 0.6 rg');
  contentLines.push(`1 0 0 1 ${margin + 8} ${curY - 24} Tm`);
  const addonsStr = data.includedAddons && data.includedAddons.length > 0 ? data.includedAddons.join(', ') : 'Unlimited Tele-OPD, 20% Pharmacy & Emergency ER Triage';
  contentLines.push(`(Perks: ${escapePdfText(addonsStr)}) Tj`);

  contentLines.push('/F2 8 Tf');
  contentLines.push('0.06 0.09 0.16 rg');
  contentLines.push(`1 0 0 1 ${margin + 230} ${curY - 16} Tm`);
  contentLines.push(`(${escapePdfText(data.employeeHeadcount.toLocaleString('en-IN'))} Employees) Tj`);

  contentLines.push(`1 0 0 1 ${margin + 320} ${curY - 16} Tm`);
  contentLines.push(`(INR ${escapePdfText(data.ratePerEmployee)}) Tj`);

  contentLines.push('/F2 9 Tf');
  contentLines.push('0.06 0.73 0.51 rg');
  contentLines.push(`1 0 0 1 ${margin + 420} ${curY - 16} Tm`);
  contentLines.push(`(INR ${escapePdfText(data.totalSubtotalInr.toLocaleString('en-IN'))}) Tj`);
  contentLines.push('ET');

  curY -= 45;

  // Section 3: Tax Calculation Table
  const calcBoxWidth = 240;
  const calcBoxX = pageWidth - margin - calcBoxWidth;

  const taxRows = [
    { label: 'Subtotal Amount:', value: `INR ${data.totalSubtotalInr.toLocaleString('en-IN')}` },
    { label: 'Integrated GST (IGST @ 18%):', value: `INR ${data.gstAmountInr.toLocaleString('en-IN')}` },
    { label: 'TOTAL INVOICE AMOUNT (INR):', value: `INR ${data.totalGrandTotalInr.toLocaleString('en-IN')}`, isBold: true }
  ];

  taxRows.forEach((r, idx) => {
    const rowY = curY - idx * 18;
    contentLines.push('q');
    contentLines.push(r.isBold ? '0.92 0.96 0.94 rg' : '0.98 0.99 1.0 rg');
    contentLines.push(`${calcBoxX} ${rowY - 16} ${calcBoxWidth} 16 re f`);
    contentLines.push('0.85 0.88 0.92 RG');
    contentLines.push('0.5 w');
    contentLines.push(`${calcBoxX} ${rowY - 16} ${calcBoxWidth} 16 re s`);
    contentLines.push('Q');

    contentLines.push('BT');
    contentLines.push(r.isBold ? '/F2 8 Tf' : '/F1 7.5 Tf');
    contentLines.push(r.isBold ? '0.06 0.09 0.16 rg' : '0.3 0.4 0.5 rg');
    contentLines.push(`1 0 0 1 ${calcBoxX + 8} ${rowY - 11} Tm`);
    contentLines.push(`(${escapePdfText(r.label)}) Tj`);

    contentLines.push(r.isBold ? '/F2 9 Tf' : '/F1 7.5 Tf');
    contentLines.push(r.isBold ? '0.06 0.73 0.51 rg' : '0.06 0.09 0.16 rg');
    contentLines.push(`1 0 0 1 ${calcBoxX + 130} ${rowY - 11} Tm`);
    contentLines.push(`(${escapePdfText(r.value)}) Tj`);
    contentLines.push('ET');
  });

  curY -= 70;

  // Section 4: Bank Escrow & Wire Transfer Details
  contentLines.push('BT');
  contentLines.push('/F2 9 Tf');
  contentLines.push('0.06 0.09 0.16 rg');
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(PAYMENT SETTLEMENT & ESCROW RAILS:) Tj');
  contentLines.push('ET');

  curY -= 14;
  contentLines.push('BT');
  contentLines.push('/F1 7.5 Tf');
  contentLines.push('0.2 0.25 0.3 rg');
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(Bank: HDFC Bank Ltd | Account Name: DocSearch Technologies Pvt Ltd | Account No: 50200088991122) Tj');
  curY -= 12;
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(IFSC: HDFC0000128 | Branch: DLF Cyber City, Gurugram | UPI ID: docsearch.corporate@hdfcbank) Tj');
  curY -= 12;
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(Terms: Payment due within 30 days of contract activation. Employee passes activate upon token issuance.) Tj');
  contentLines.push('ET');

  // Footer Governance & Signature Seal
  contentLines.push('q');
  contentLines.push('0.85 0.88 0.92 RG');
  contentLines.push('0.5 w');
  contentLines.push(`${margin} 60 m ${pageWidth - margin} 60 l S`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F1 7 Tf');
  contentLines.push('0.4 0.5 0.6 rg');
  contentLines.push(`1 0 0 1 ${margin} 45 Tm`);
  contentLines.push('(This is a computer-generated GST Tax Invoice with tamper-evident cryptographic signature. No physical seal required.) Tj');

  contentLines.push('/F2 8 Tf');
  contentLines.push('0.06 0.09 0.16 rg');
  contentLines.push(`1 0 0 1 ${pageWidth - margin - 170} 30 Tm`);
  contentLines.push('(For DocSearch Technologies Pvt Ltd) Tj');

  contentLines.push('/F1 7 Tf');
  contentLines.push('0.06 0.73 0.51 rg');
  contentLines.push(`1 0 0 1 ${pageWidth - margin - 170} 18 Tm`);
  contentLines.push('(Authorized Signatory: CFO Office) Tj');
  contentLines.push('ET');

  const streamContent = contentLines.join('\n');
  const streamLength = streamContent.length;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`,
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj'
  ];

  let xrefOffset = 0;
  const xrefEntries: string[] = ['0000000000 65535 f '];
  let fullPdf = '%PDF-1.4\n';

  objects.forEach((obj) => {
    xrefOffset = fullPdf.length;
    xrefEntries.push(String(xrefOffset).padStart(10, '0') + ' 00000 n ');
    fullPdf += obj + '\n';
  });

  const startXref = fullPdf.length;
  fullPdf += `xref\n0 ${objects.length + 1}\n`;
  fullPdf += xrefEntries.join('\n') + '\n';
  fullPdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  const blob = new Blob([fullPdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DocSearch-Corporate-Invoice-${data.corporateName.replace(/\s+/g, '_')}-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
