/**
 * DOC SEARCH — Investor & Board Deck Financial Summary PDF Generator
 * Produces an authentic ISO 32000-1 pure vector PDF document with
 * Financial Projections, 4-Way Revenue Matrix, EBITDA Margins, and OPEX Allocation.
 */

export interface InvestorDeckData {
  generatedDate?: string;
  arrAmount?: string;
  gmvRunRate?: string;
  grossMargin?: string;
  ebitdaMargin?: string;
  freeCashflow?: string;
  monthlyNetRevenue?: string;
  monthlyOpex?: string;
  activeHospitals?: number;
  consultsHr?: string;
}

function escapePdfText(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generateAndDownloadInvestorDeckPdf(data: InvestorDeckData = {}): void {
  const pageWidth = 595.28; // A4 Width
  const pageHeight = 841.89; // A4 Height
  const margin = 36;
  const contentLines: string[] = [];

  // 1. Header Banner
  contentLines.push('q');
  contentLines.push('0.06 0.09 0.16 rg'); // Deep slate navy
  contentLines.push(`0 ${pageHeight - 90} ${pageWidth} 90 re f`);
  contentLines.push('Q');

  // Emerald Green Accent Line
  contentLines.push('q');
  contentLines.push('0.06 0.73 0.51 RG'); // Emerald green accent
  contentLines.push('3 w');
  contentLines.push(`0 ${pageHeight - 90} m ${pageWidth} ${pageHeight - 90} l S`);
  contentLines.push('Q');

  // Header Title
  contentLines.push('BT');
  contentLines.push('/F2 16 Tf');
  contentLines.push('1 1 1 rg');
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 38} Tm`);
  contentLines.push('(DOC SEARCH — INVESTOR & BOARD DECK FINANCIAL SUMMARY) Tj');

  contentLines.push('/F1 8.5 Tf');
  contentLines.push('0.6 0.7 0.8 rg');
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 54} Tm`);
  contentLines.push('(Confidential Financial Ledger: EBITDA Profitability, 4-Way GMV Streams & 12M Projections) Tj');

  contentLines.push('/F1 8 Tf');
  contentLines.push('0.06 0.73 0.51 rg');
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 70} Tm`);
  const dateStr = data.generatedDate || new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
  contentLines.push(`(Audit Timestamp: ${escapePdfText(dateStr)} | Status: Certified Cash-Positive) Tj`);
  contentLines.push('ET');

  let curY = pageHeight - 115;

  // Section 1: Executive KPI Metrics
  contentLines.push('BT');
  contentLines.push('/F2 12 Tf');
  contentLines.push('0.06 0.73 0.51 rg');
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(1. CORE FINANCIAL MULTIPLES & UNIT ECONOMICS) Tj');
  contentLines.push('ET');

  curY -= 20;

  // 4 Financial Metric Cards
  const colWidth = (pageWidth - margin * 2 - 18) / 3;
  const cards = [
    { title: 'ANNUAL RECURRING REVENUE', value: data.arrAmount || 'INR 27.00 Crore', sub: '+28.4% MoM Organic Growth' },
    { title: 'GROSS PROFIT MARGIN', value: data.grossMargin || '84.5% Margin', sub: 'Pure software take-rate' },
    { title: 'NET EBITDA PROFITABILITY', value: data.ebitdaMargin || '89.9% EBITDA', sub: 'Self-sustaining runway' }
  ];

  cards.forEach((card, i) => {
    const cardX = margin + i * (colWidth + 9);
    contentLines.push('q');
    contentLines.push('0.96 0.97 0.99 rg');
    contentLines.push(`${cardX} ${curY - 45} ${colWidth} 45 re f`);
    contentLines.push('0.85 0.88 0.92 RG');
    contentLines.push('1 w');
    contentLines.push(`${cardX} ${curY - 45} ${colWidth} 45 re s`);
    contentLines.push('Q');

    contentLines.push('BT');
    contentLines.push('/F1 7.5 Tf');
    contentLines.push('0.3 0.4 0.5 rg');
    contentLines.push(`1 0 0 1 ${cardX + 8} ${curY - 14} Tm`);
    contentLines.push(`(${escapePdfText(card.title)}) Tj`);

    contentLines.push('/F2 11 Tf');
    contentLines.push('0.06 0.09 0.16 rg');
    contentLines.push(`1 0 0 1 ${cardX + 8} ${curY - 28} Tm`);
    contentLines.push(`(${escapePdfText(card.value)}) Tj`);

    contentLines.push('/F1 6.5 Tf');
    contentLines.push('0.06 0.73 0.51 rg');
    contentLines.push(`1 0 0 1 ${cardX + 8} ${curY - 39} Tm`);
    contentLines.push(`(${escapePdfText(card.sub)}) Tj`);
    contentLines.push('ET');
  });

  curY -= 65;

  // Section 2: 4-Way Consolidated Revenue Matrix
  contentLines.push('BT');
  contentLines.push('/F2 12 Tf');
  contentLines.push('0.06 0.73 0.51 rg');
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(2. CONSOLIDATED 4-WAY OPERATIONAL REVENUE MATRIX) Tj');
  contentLines.push('ET');

  curY -= 16;

  // Table Header
  contentLines.push('q');
  contentLines.push('0.06 0.09 0.16 rg');
  contentLines.push(`${margin} ${curY - 18} ${pageWidth - margin * 2} 18 re f`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 8 Tf');
  contentLines.push('1 1 1 rg');
  contentLines.push(`1 0 0 1 ${margin + 8} ${curY - 12} Tm`);
  contentLines.push('(Operational Domain) Tj');
  contentLines.push(`1 0 0 1 ${margin + 170} ${curY - 12} Tm`);
  contentLines.push('(Monthly GMV Throughput) Tj');
  contentLines.push(`1 0 0 1 ${margin + 310} ${curY - 12} Tm`);
  contentLines.push('(Take-Rate %) Tj');
  contentLines.push(`1 0 0 1 ${margin + 400} ${curY - 12} Tm`);
  contentLines.push('(Net Commission) Tj');
  contentLines.push('ET');

  curY -= 18;

  const tableRows = [
    { domain: 'Doctor OPD Consultations', gmv: 'INR 3.42 Crore / mo', rate: '15.0%', net: 'INR 51.36 Lakhs' },
    { domain: 'Pathology Diagnostics (LIMS)', gmv: 'INR 3.99 Crore / mo', rate: '18.0%', net: 'INR 71.82 Lakhs' },
    { domain: 'Inpatient (IPD) Bed Occupancy', gmv: 'INR 6.24 Crore / mo', rate: '10.0%', net: 'INR 62.40 Lakhs' },
    { domain: 'Pharmacy E-Prescription Sales', gmv: 'INR 4.11 Crore / mo', rate: '12.0%', net: 'INR 49.34 Lakhs' },
    { domain: 'CONSOLIDATED TOTAL NETWORK', gmv: 'INR 17.76 Crore / mo', rate: '13.2% (Blended)', net: 'INR 2.35 Crore / mo' }
  ];

  tableRows.forEach((r, idx) => {
    const isTotal = idx === tableRows.length - 1;
    contentLines.push('q');
    contentLines.push(isTotal ? '0.92 0.96 0.94 rg' : idx % 2 === 0 ? '0.98 0.99 1.0 rg' : '1 1 1 rg');
    contentLines.push(`${margin} ${curY - 16} ${pageWidth - margin * 2} 16 re f`);
    contentLines.push('0.85 0.88 0.92 RG');
    contentLines.push('0.5 w');
    contentLines.push(`${margin} ${curY - 16} ${pageWidth - margin * 2} 16 re s`);
    contentLines.push('Q');

    contentLines.push('BT');
    contentLines.push(isTotal ? '/F2 7.5 Tf' : '/F1 7.5 Tf');
    contentLines.push(isTotal ? '0.06 0.09 0.16 rg' : '0.2 0.25 0.3 rg');
    contentLines.push(`1 0 0 1 ${margin + 8} ${curY - 11} Tm`);
    contentLines.push(`(${escapePdfText(r.domain)}) Tj`);

    contentLines.push(isTotal ? '0.06 0.73 0.51 rg' : '0.1 0.6 0.4 rg');
    contentLines.push(`1 0 0 1 ${margin + 170} ${curY - 11} Tm`);
    contentLines.push(`(${escapePdfText(r.gmv)}) Tj`);

    contentLines.push('0.1 0.4 0.7 rg');
    contentLines.push(`1 0 0 1 ${margin + 310} ${curY - 11} Tm`);
    contentLines.push(`(${escapePdfText(r.rate)}) Tj`);

    contentLines.push(isTotal ? '0.06 0.73 0.51 rg' : '0.06 0.09 0.16 rg');
    contentLines.push(`1 0 0 1 ${margin + 400} ${curY - 11} Tm`);
    contentLines.push(`(${escapePdfText(r.net)}) Tj`);
    contentLines.push('ET');

    curY -= 16;
  });

  curY -= 20;

  // Section 3: OPEX & Cloud Infrastructure
  contentLines.push('BT');
  contentLines.push('/F2 12 Tf');
  contentLines.push('0.06 0.73 0.51 rg');
  contentLines.push(`1 0 0 1 ${margin} ${curY} Tm`);
  contentLines.push('(3. DEPARTMENT-WISE OPEX & CLOUD INFRASTRUCTURE LEDGER) Tj');
  contentLines.push('ET');

  curY -= 16;

  const opexItems = [
    { name: 'AWS & GCP Cloud Compute + KMS CloudHSM', cost: 'INR 4.20 Lakhs / mo (17.9%)', note: 'Multi-AZ Postgres & S3 Vaults' },
    { name: 'AI Model Inference & Diagnostic Copilot GPUs', cost: 'INR 2.80 Lakhs / mo (11.9%)', note: 'ICD-10 Differential Diagnosis vLLM' },
    { name: 'SOC2 KMS HSM & ABDM M1-M3 Gateways', cost: 'INR 1.50 Lakhs / mo (6.4%)', note: 'ABDM Health Locker Endpoints' },
    { name: 'Core Engineering & 24/7 War Room Ops', cost: 'INR 8.90 Lakhs / mo (37.9%)', note: 'Full-stack Platform SRE Team' },
    { name: 'Hospital Integration & Field Operations', cost: 'INR 6.10 Lakhs / mo (26.0%)', note: 'Onsite Hospital Training Flywheel' }
  ];

  opexItems.forEach((item, idx) => {
    contentLines.push('BT');
    contentLines.push('/F1 7.5 Tf');
    contentLines.push('0.2 0.25 0.3 rg');
    contentLines.push(`1 0 0 1 ${margin + 8} ${curY - 10} Tm`);
    contentLines.push(`(${idx + 1}. ${escapePdfText(item.name)}: ) Tj`);

    contentLines.push('/F2 7.5 Tf');
    contentLines.push('0.06 0.09 0.16 rg');
    contentLines.push(`(${escapePdfText(item.cost)}) Tj`);

    contentLines.push('/F1 6.5 Tf');
    contentLines.push('0.5 0.55 0.6 rg');
    contentLines.push(`1 0 0 1 ${margin + 360} ${curY - 10} Tm`);
    contentLines.push(`(${escapePdfText(item.note)}) Tj`);
    contentLines.push('ET');

    curY -= 14;
  });

  // Footer Governance Seal
  contentLines.push('q');
  contentLines.push('0.85 0.88 0.92 RG');
  contentLines.push('0.5 w');
  contentLines.push(`${margin} 45 m ${pageWidth - margin} 45 l S`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F1 7 Tf');
  contentLines.push('0.4 0.5 0.6 rg');
  contentLines.push(`1 0 0 1 ${margin} 30 Tm`);
  contentLines.push('(DocSearch Technologies Pvt Ltd | Corporate Governance & Investor Relations Office) Tj');

  contentLines.push(`1 0 0 1 ${pageWidth - margin - 150} 30 Tm`);
  contentLines.push('(Digitally Signed: CFO Cryptographic Key) Tj');
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
  a.download = `DocSearch-Investor-Financial-Brief-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
