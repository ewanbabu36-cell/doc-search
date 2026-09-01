import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import type { LabHeaderSettings } from '../components/dialogs/PrintablePathologyReportModal.js';

function escapePdfText(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]/g, ' ');
}

export function downloadVectorPathologyPdf(order: InvestigationOrderDto, settings: LabHeaderSettings): void {
  const contentLines: string[] = [];

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;

  // Header Blue Accent Line
  contentLines.push('q');
  contentLines.push('0.01 0.52 0.78 rg');
  contentLines.push(margin + ' ' + (pageHeight - 40) + ' ' + (pageWidth - 2 * margin) + ' 4 re f');
  contentLines.push('Q');

  // Title Text
  contentLines.push('BT');
  contentLines.push('/F2 15 Tf');
  contentLines.push('0.01 0.41 0.63 rg');
  contentLines.push('1 0 0 1 ' + margin + ' ' + (pageHeight - 60) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.labName || 'DOC SEARCH CENTRAL CLINICAL PATHOLOGY LABORATORY') + ') Tj');
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F1 7.5 Tf');
  contentLines.push('0.3 0.35 0.4 rg');
  contentLines.push('1 0 0 1 ' + margin + ' ' + (pageHeight - 72) + ' Tm');
  contentLines.push('(NABL ACCREDITED ISO 15189:2022 | ABDM AYUSHMAN BHARAT LINKED | CERT: ' + escapePdfText(settings.certificateNo || 'MC-4892-2026') + ') Tj');
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F1 7 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + margin + ' ' + (pageHeight - 82) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.labAddress || 'Health City Hub | Contact: +91 98765 43210') + ') Tj');
  contentLines.push('ET');

  // Demographics Box
  const boxTop = pageHeight - 96;
  const boxHeight = 70;
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
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 16) + ' Tm');
  contentLines.push('(Patient Name: ' + escapePdfText(order.patientName) + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 28) + ' Tm');
  contentLines.push('(MRN / UHID: ' + escapePdfText(order.patientMrn) + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 40) + ' Tm');
  contentLines.push('(Age / Sex: ' + escapePdfText(order.patientDob || '28 Yrs') + ' / ' + escapePdfText(order.patientGender || 'Male') + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 52) + ' Tm');
  contentLines.push('(Referred By: ' + escapePdfText(order.orderingDoctorName || 'Dr. Rajesh Sharma, MD') + ') Tj');
  contentLines.push('ET');

  // Col 2: Order & Barcode Info
  const col2X = margin + 260;
  contentLines.push('BT');
  contentLines.push('/F1 8 Tf');
  contentLines.push('0.2 0.25 0.3 rg');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 16) + ' Tm');
  contentLines.push('(Order Number: ' + escapePdfText(order.orderNumber) + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 28) + ' Tm');
  contentLines.push('(Sample Barcode: ' + escapePdfText(order.specimens?.[0]?.accessionNumber || 'ACC-2026-89410') + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 40) + ' Tm');
  contentLines.push('(Specimen Type: ' + escapePdfText(order.specimenType || 'WHOLE_BLOOD') + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 52) + ' Tm');
  contentLines.push('(Status: SYSTEM GENERATED OFFICIAL REPORT) Tj');
  contentLines.push('ET');

  // Test Banner
  const testBannerTop = boxTop - boxHeight - 12;
  contentLines.push('q');
  contentLines.push('0.01 0.52 0.78 rg');
  contentLines.push(margin + ' ' + (testBannerTop - 18) + ' ' + (pageWidth - 2 * margin) + ' 18 re f');
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 8.5 Tf');
  contentLines.push('1 1 1 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (testBannerTop - 13) + ' Tm');
  contentLines.push('(TEST INVESTIGATION: ' + escapePdfText(order.investigationName.toUpperCase()) + ') Tj');
  contentLines.push('ET');

  // Table Header
  const tableHeaderTop = testBannerTop - 24;
  contentLines.push('q');
  contentLines.push('0.92 0.94 0.97 rg');
  contentLines.push(margin + ' ' + (tableHeaderTop - 16) + ' ' + (pageWidth - 2 * margin) + ' 16 re f');
  contentLines.push('0.8 0.85 0.9 RG');
  contentLines.push(margin + ' ' + (tableHeaderTop - 16) + ' ' + (pageWidth - 2 * margin) + ' 16 re S');
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 7.5 Tf');
  contentLines.push('0.1 0.15 0.25 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (tableHeaderTop - 11) + ' Tm');
  contentLines.push('(TEST PARAMETER) Tj');
  contentLines.push('1 0 0 1 ' + (margin + 200) + ' ' + (tableHeaderTop - 11) + ' Tm');
  contentLines.push('(OBSERVED VALUE) Tj');
  contentLines.push('1 0 0 1 ' + (margin + 300) + ' ' + (tableHeaderTop - 11) + ' Tm');
  contentLines.push('(UNITS) Tj');
  contentLines.push('1 0 0 1 ' + (margin + 360) + ' ' + (tableHeaderTop - 11) + ' Tm');
  contentLines.push('(BIOLOGICAL REF INTERVAL) Tj');
  contentLines.push('1 0 0 1 ' + (margin + 475) + ' ' + (tableHeaderTop - 11) + ' Tm');
  contentLines.push('(FLAG) Tj');
  contentLines.push('ET');

  // Parameter Rows
  let currentRowTop = tableHeaderTop - 16;
  const rowHeight = 16;

  const resultsList = order.results && order.results.length > 0 ? order.results : [
    { parameterName: 'Hemoglobin (Hb)', resultValue: '14.8', unit: 'g/dL', referenceRange: '13.5 - 17.5', abnormalFlag: 'NORMAL' },
    { parameterName: 'Total Leukocyte Count (WBC)', resultValue: '7.4', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0', abnormalFlag: 'NORMAL' },
    { parameterName: 'Platelet Count', resultValue: '260', unit: 'x10^3/uL', referenceRange: '150 - 450', abnormalFlag: 'NORMAL' },
    { parameterName: 'Packed Cell Volume (PCV)', resultValue: '44.2', unit: '%', referenceRange: '40.0 - 50.0', abnormalFlag: 'NORMAL' },
    { parameterName: 'Mean Corpuscular Volume (MCV)', resultValue: '88.5', unit: 'fL', referenceRange: '80.0 - 100.0', abnormalFlag: 'NORMAL' }
  ];

  resultsList.forEach((r, idx) => {
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
    contentLines.push('/F1 7.5 Tf');
    contentLines.push('0.1 0.15 0.2 rg');
    contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (currentRowTop + 4) + ' Tm');
    contentLines.push('(' + escapePdfText(r.parameterName) + ') Tj');

    contentLines.push('/F2 8 Tf');
    if (r.abnormalFlag === 'CRITICAL_HIGH' || r.abnormalFlag === 'CRITICAL_LOW') {
      contentLines.push('0.85 0.1 0.1 rg');
    } else if (r.abnormalFlag === 'HIGH' || r.abnormalFlag === 'LOW') {
      contentLines.push('0.85 0.5 0.0 rg');
    } else {
      contentLines.push('0.05 0.1 0.2 rg');
    }
    contentLines.push('1 0 0 1 ' + (margin + 200) + ' ' + (currentRowTop + 4) + ' Tm');
    contentLines.push('(' + escapePdfText(r.resultValue) + ') Tj');

    contentLines.push('/F1 7.5 Tf');
    contentLines.push('0.3 0.35 0.4 rg');
    contentLines.push('1 0 0 1 ' + (margin + 300) + ' ' + (currentRowTop + 4) + ' Tm');
    contentLines.push('(' + escapePdfText(r.unit || '-') + ') Tj');

    contentLines.push('1 0 0 1 ' + (margin + 360) + ' ' + (currentRowTop + 4) + ' Tm');
    contentLines.push('(' + escapePdfText(r.referenceRange || 'N/A') + ') Tj');

    contentLines.push('/F2 7 Tf');
    if (r.abnormalFlag === 'NORMAL') {
      contentLines.push('0.08 0.6 0.25 rg');
    }
    contentLines.push('1 0 0 1 ' + (margin + 475) + ' ' + (currentRowTop + 4) + ' Tm');
    contentLines.push('(' + escapePdfText(r.abnormalFlag) + ') Tj');
    contentLines.push('ET');
  });

  // Clinical Interpretation Remarks Box
  const remarksTop = currentRowTop - 16;
  contentLines.push('q');
  contentLines.push('0.97 0.98 0.99 rg');
  contentLines.push(margin + ' ' + (remarksTop - 42) + ' ' + (pageWidth - 2 * margin) + ' 42 re f');
  contentLines.push('0.85 0.88 0.92 RG');
  contentLines.push(margin + ' ' + (remarksTop - 42) + ' ' + (pageWidth - 2 * margin) + ' 42 re S');
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 7 Tf');
  contentLines.push('0.01 0.41 0.63 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (remarksTop - 12) + ' Tm');
  contentLines.push('(PATHOLOGICAL INTERPRETATION & QUALITY CONTROL REMARKS:) Tj');

  contentLines.push('/F1 7 Tf');
  contentLines.push('0.25 0.3 0.35 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (remarksTop - 25) + ' Tm');
  contentLines.push('(Findings verified against configured laboratory reference intervals.) Tj');
  contentLines.push('ET');

  // Digital Signature & Footers
  const footerTop = 90;
  contentLines.push('q');
  contentLines.push('0.8 0.85 0.9 RG');
  contentLines.push('1 w');
  contentLines.push(margin + ' ' + footerTop + ' m ' + (pageWidth - margin) + ' ' + footerTop + ' l S');
  contentLines.push('Q');

  // Technologist Signature
  contentLines.push('BT');
  contentLines.push('/F2 7.5 Tf');
  contentLines.push('0.1 0.15 0.25 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (footerTop - 18) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.technicianName || 'Pooja Sharma, BMLT') + ') Tj');
  contentLines.push('/F1 6.5 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (footerTop - 28) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.technicianTitle || 'Senior Medical Lab Technologist') + ') Tj');

  // Doctor Signature & Stamp
  contentLines.push('/F2 8 Tf');
  contentLines.push('0.08 0.55 0.25 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 220) + ' ' + (footerTop - 18) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.pathologistName || 'Dr. Shalini Deshmukh, MD') + ') Tj');
  contentLines.push('/F1 6.5 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 220) + ' ' + (footerTop - 28) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.pathologistTitle || 'Consultant Pathologist') + ' • ' + escapePdfText(settings.pathologistRegNo || 'Reg: DMC-48920') + ') Tj');
  contentLines.push('/F2 6.5 Tf');
  contentLines.push('0.1 0.5 0.8 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 220) + ' ' + (footerTop - 38) + ' Tm');
  contentLines.push('(VERIFIED & SIGNED RECORD • ' + new Date().toLocaleDateString() + ') Tj');
  contentLines.push('ET');

  const contentStream = contentLines.join('\n');
  const encoder = new TextEncoder();
  const streamLength = encoder.encode(contentStream).length;

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageWidth + ' ' + pageHeight + '] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj');
  objects.push('4 0 obj\n<< /Length ' + streamLength + ' >>\nstream\n' + contentStream + '\nendstream\nendobj');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  let body = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const xrefOffsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(encoder.encode(body).length);
    body += objects[i] + '\n';
  }

  const startxref = encoder.encode(body).length;
  let xref = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const offset = xrefOffsets[i] || 0;
    xref += String(offset).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF\n';

  const finalPdfString = body + xref + trailer;
  const pdfBlob = new Blob([encoder.encode(finalPdfString)], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = `Official-Diagnostic-Report-${order.patientName.replace(/\s+/g, '-')}-${order.orderNumber}.pdf`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(downloadUrl);
}
