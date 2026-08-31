export interface PdfReportData {
  orderNumber: string;
  reportNumber: string;
  patientName: string;
  patientMrn: string;
  patientAge: string | number;
  patientGender: string;
  orderingDoctor: string;
  accessionNumber: string;
  specimenType: string;
  facilityName: string;
  organizationName: string;
  orderedAt: string;
  finalizedAt: string;
  investigationName: string;
  category: string;
  impression: string;
  verifyingPathologist: string;
  results: Array<{
    parameterName: string;
    resultValue: string;
    unit?: string;
    referenceRange?: string;
    abnormalFlag: string;
  }>;
}

function escapePdfText(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]/g, ' ');
}

export function generatePathologyPdf(data: PdfReportData): Buffer {
  const contentLines: string[] = [];

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;

  // Header Blue Accent Line
  contentLines.push('q');
  contentLines.push('0.01 0.52 0.78 rg');
  contentLines.push(margin + ' ' + (pageHeight - 50) + ' ' + (pageWidth - 2 * margin) + ' 4 re f');
  contentLines.push('Q');

  // Title Text
  contentLines.push('BT');
  contentLines.push('/F2 16 Tf');
  contentLines.push('0.01 0.41 0.63 rg');
  contentLines.push('1 0 0 1 ' + margin + ' ' + (pageHeight - 72) + ' Tm');
  contentLines.push('(' + escapePdfText(data.organizationName || 'DOC SEARCH DEMO HOSPITAL - CENTRAL LABORATORY') + ') Tj');
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F1 8 Tf');
  contentLines.push('0.3 0.35 0.4 rg');
  contentLines.push('1 0 0 1 ' + margin + ' ' + (pageHeight - 84) + ' Tm');
  contentLines.push('(NABL ACCREDITED LABORATORY ISO 15189:2022 | ICMR APPROVED | NABL CERT: MC-4892-2026) Tj');
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F1 7.5 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + margin + ' ' + (pageHeight - 95) + ' Tm');
  contentLines.push('(' + escapePdfText(data.facilityName || 'Main Laboratory, Health City, New Delhi') + ') Tj');
  contentLines.push('ET');

  // Demographics Box
  const boxTop = pageHeight - 115;
  const boxHeight = 75;
  contentLines.push('q');
  contentLines.push('0.96 0.97 0.99 rg');
  contentLines.push(margin + ' ' + (boxTop - boxHeight) + ' ' + (pageWidth - 2 * margin) + ' ' + boxHeight + ' re f');
  contentLines.push('0.8 0.85 0.9 RG');
  contentLines.push(margin + ' ' + (boxTop - boxHeight) + ' ' + (pageWidth - 2 * margin) + ' ' + boxHeight + ' re S');
  contentLines.push('Q');

  // Col 1: Patient
  contentLines.push('BT');
  contentLines.push('/F1 8 Tf');
  contentLines.push('0.2 0.25 0.3 rg');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 18) + ' Tm');
  contentLines.push('(Patient Name: ' + escapePdfText(data.patientName) + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 32) + ' Tm');
  contentLines.push('(MRN / UHID: ' + escapePdfText(data.patientMrn) + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 46) + ' Tm');
  contentLines.push('(Age / Sex: ' + escapePdfText(String(data.patientAge)) + ' Yrs / ' + escapePdfText(data.patientGender) + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 60) + ' Tm');
  contentLines.push('(Referred By: ' + escapePdfText(data.orderingDoctor) + ') Tj');
  contentLines.push('ET');

  // Col 2: Order
  const col2X = margin + 260;
  contentLines.push('BT');
  contentLines.push('/F1 8 Tf');
  contentLines.push('0.2 0.25 0.3 rg');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 18) + ' Tm');
  contentLines.push('(Order #: ' + escapePdfText(data.orderNumber) + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 32) + ' Tm');
  contentLines.push('(Accession #: ' + escapePdfText(data.accessionNumber) + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 46) + ' Tm');
  contentLines.push('(Specimen: ' + escapePdfText(data.specimenType) + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 60) + ' Tm');
  contentLines.push('(Report Status: FINAL NABL APPROVED) Tj');
  contentLines.push('ET');

  // Test Banner
  const testBannerTop = boxTop - boxHeight - 16;
  contentLines.push('q');
  contentLines.push('0.01 0.52 0.78 rg');
  contentLines.push(margin + ' ' + (testBannerTop - 20) + ' ' + (pageWidth - 2 * margin) + ' 20 re f');
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 9 Tf');
  contentLines.push('1 1 1 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (testBannerTop - 14) + ' Tm');
  contentLines.push('(TEST INVESTIGATION: ' + escapePdfText(data.investigationName.toUpperCase()) + ') Tj');
  contentLines.push('ET');

  // Table Header
  const tableHeaderTop = testBannerTop - 26;
  contentLines.push('q');
  contentLines.push('0.92 0.94 0.97 rg');
  contentLines.push(margin + ' ' + (tableHeaderTop - 18) + ' ' + (pageWidth - 2 * margin) + ' 18 re f');
  contentLines.push('0.8 0.85 0.9 RG');
  contentLines.push(margin + ' ' + (tableHeaderTop - 18) + ' ' + (pageWidth - 2 * margin) + ' 18 re S');
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 8 Tf');
  contentLines.push('0.1 0.15 0.25 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (tableHeaderTop - 12) + ' Tm');
  contentLines.push('(TEST PARAMETER) Tj');
  contentLines.push('1 0 0 1 ' + (margin + 200) + ' ' + (tableHeaderTop - 12) + ' Tm');
  contentLines.push('(OBSERVED VALUE) Tj');
  contentLines.push('1 0 0 1 ' + (margin + 300) + ' ' + (tableHeaderTop - 12) + ' Tm');
  contentLines.push('(UNITS) Tj');
  contentLines.push('1 0 0 1 ' + (margin + 360) + ' ' + (tableHeaderTop - 12) + ' Tm');
  contentLines.push('(BIOLOGICAL REF INTERVAL) Tj');
  contentLines.push('1 0 0 1 ' + (margin + 475) + ' ' + (tableHeaderTop - 12) + ' Tm');
  contentLines.push('(FLAG) Tj');
  contentLines.push('ET');

  // Parameter Rows
  let currentRowTop = tableHeaderTop - 18;
  const rowHeight = 18;

  data.results.forEach((r, idx) => {
    currentRowTop -= rowHeight;

    if (idx % 2 === 1) {
      contentLines.push('q');
      contentLines.push('0.98 0.99 1.0 rg');
      contentLines.push(margin + ' ' + currentRowTop + ' ' + (pageWidth - 2 * margin) + ' ' + rowHeight + ' re f');
      contentLines.push('Q');
    }

    contentLines.push('q');
    contentLines.push('0.9 0.92 0.95 RG');
    contentLines.push('0.5 w');
    contentLines.push(margin + ' ' + currentRowTop + ' m ' + (pageWidth - margin) + ' ' + currentRowTop + ' l S');
    contentLines.push('Q');

    contentLines.push('BT');
    contentLines.push('/F1 8 Tf');
    contentLines.push('0.1 0.15 0.2 rg');
    contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (currentRowTop + 5) + ' Tm');
    contentLines.push('(' + escapePdfText(r.parameterName) + ') Tj');

    contentLines.push('/F2 8.5 Tf');
    if (r.abnormalFlag === 'CRITICAL_HIGH' || r.abnormalFlag === 'CRITICAL_LOW') {
      contentLines.push('0.85 0.1 0.1 rg');
    } else if (r.abnormalFlag === 'HIGH' || r.abnormalFlag === 'LOW') {
      contentLines.push('0.85 0.5 0.0 rg');
    } else {
      contentLines.push('0.05 0.1 0.2 rg');
    }
    contentLines.push('1 0 0 1 ' + (margin + 200) + ' ' + (currentRowTop + 5) + ' Tm');
    contentLines.push('(' + escapePdfText(r.resultValue) + ') Tj');

    contentLines.push('/F1 8 Tf');
    contentLines.push('0.3 0.35 0.4 rg');
    contentLines.push('1 0 0 1 ' + (margin + 300) + ' ' + (currentRowTop + 5) + ' Tm');
    contentLines.push('(' + escapePdfText(r.unit || '-') + ') Tj');

    contentLines.push('1 0 0 1 ' + (margin + 360) + ' ' + (currentRowTop + 5) + ' Tm');
    contentLines.push('(' + escapePdfText(r.referenceRange || 'N/A') + ') Tj');

    contentLines.push('/F2 7.5 Tf');
    if (r.abnormalFlag === 'NORMAL') {
      contentLines.push('0.08 0.6 0.25 rg');
    }
    contentLines.push('1 0 0 1 ' + (margin + 475) + ' ' + (currentRowTop + 5) + ' Tm');
    contentLines.push('(' + escapePdfText(r.abnormalFlag) + ') Tj');
    contentLines.push('ET');
  });

  // Clinical Remarks Box
  const remarksTop = currentRowTop - 18;
  contentLines.push('q');
  contentLines.push('0.97 0.98 0.99 rg');
  contentLines.push(margin + ' ' + (remarksTop - 45) + ' ' + (pageWidth - 2 * margin) + ' 45 re f');
  contentLines.push('0.85 0.88 0.92 RG');
  contentLines.push(margin + ' ' + (remarksTop - 45) + ' ' + (pageWidth - 2 * margin) + ' 45 re S');
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 7.5 Tf');
  contentLines.push('0.01 0.41 0.63 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (remarksTop - 14) + ' Tm');
  contentLines.push('(PATHOLOGICAL INTERPRETATION & QUALITY CONTROL REMARKS:) Tj');

  contentLines.push('/F1 7.5 Tf');
  contentLines.push('0.25 0.3 0.35 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (remarksTop - 28) + ' Tm');
  contentLines.push('(' + escapePdfText(data.impression || 'Test findings clinically correlated with IQC Level 1 and Level 2 control verification.') + ') Tj');
  contentLines.push('ET');

  // Signatures
  const footerTop = 95;
  contentLines.push('q');
  contentLines.push('0.8 0.85 0.9 RG');
  contentLines.push('1 w');
  contentLines.push(margin + ' ' + footerTop + ' m ' + (pageWidth - margin) + ' ' + footerTop + ' l S');
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 8 Tf');
  contentLines.push('0.1 0.15 0.25 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (footerTop - 20) + ' Tm');
  contentLines.push('(Pooja Sharma, BMLT) Tj');
  contentLines.push('/F1 7 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (footerTop - 32) + ' Tm');
  contentLines.push('(Senior Medical Lab Technologist) Tj');

  contentLines.push('/F2 8.5 Tf');
  contentLines.push('0.08 0.55 0.25 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 220) + ' ' + (footerTop - 20) + ' Tm');
  contentLines.push('(' + escapePdfText(data.verifyingPathologist || 'Dr. Shalini Deshmukh, MD (Pathology)') + ') Tj');
  contentLines.push('/F1 7 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 220) + ' ' + (footerTop - 32) + ' Tm');
  contentLines.push('(Consultant Pathologist & Lab Director - DMC Reg: 48920-A) Tj');
  contentLines.push('ET');

  const contentStream = contentLines.join('\n');
  const streamLength = Buffer.byteLength(contentStream, 'utf8');

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageWidth + ' ' + pageHeight + '] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj');
  objects.push('4 0 obj\n<< /Length ' + streamLength + ' >>\nstream\n' + contentStream + '\nendstream\nendobj');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  let body = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const xrefOffsets = [0];

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(Buffer.byteLength(body, 'utf8'));
    body += objects[i] + '\n';
  }

  const startxref = Buffer.byteLength(body, 'utf8');
  let xref = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const offset = xrefOffsets[i] || 0;
    xref += String(offset).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF\n';

  return Buffer.from(body + xref + trailer, 'utf8');
}
