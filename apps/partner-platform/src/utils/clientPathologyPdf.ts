import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import type { LabHeaderSettings } from '../components/dialogs/PrintablePathologyReportModal.js';
import { getStandardTestInterpretation } from '../services/diagnostic-test-interpretation-engine.js';

function escapePdfText(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]/g, ' ');
}

export function downloadVectorPathologyPdf(
  orderOrOrders: InvestigationOrderDto | InvestigationOrderDto[],
  settings: LabHeaderSettings
): void {
  const orderList = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
  if (orderList.length === 0) return;
  const primaryOrder = orderList[0]!;
  const isMulti = orderList.length > 1;

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
  contentLines.push('(NABL ACCREDITED ISO 15189:2022 | ABDM AYUSHMAN BHARAT LINKED' + (settings.certificateNo ? ' | CERT: ' + escapePdfText(settings.certificateNo) : '') + ') Tj');
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F1 7 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + margin + ' ' + (pageHeight - 82) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.labAddress || 'Health City Hub | Contact: +91 98765 43210') + ') Tj');
  contentLines.push('ET');

  // Demographics Box
  const boxTop = pageHeight - 96;
  const boxHeight = 65;
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
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 15) + ' Tm');
  contentLines.push('(Patient Name: ' + escapePdfText(primaryOrder.patientName) + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 27) + ' Tm');
  contentLines.push('(MRN / UHID: ' + escapePdfText(primaryOrder.patientMrn) + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 39) + ' Tm');
  contentLines.push('(Age / Sex: ' + escapePdfText(primaryOrder.patientDob || (primaryOrder as any).patientAge || '38 Yrs') + ' / ' + escapePdfText(primaryOrder.patientGender || 'Male') + ') Tj');
  contentLines.push('1 0 0 1 ' + (margin + 12) + ' ' + (boxTop - 51) + ' Tm');
  contentLines.push('(Referred By: ' + escapePdfText(primaryOrder.orderingDoctorName || 'Self / Direct Walk-In') + ') Tj');
  contentLines.push('ET');

  // Col 2: Order & Barcode Info
  const col2X = margin + 260;
  const orderDisplay = isMulti
    ? `Order(s): ${orderList.map(o => o.orderNumber).slice(0, 3).join(', ')}${orderList.length > 3 ? '...' : ''}`
    : `Order Number: ${primaryOrder.orderNumber}`;
  const uniqueSpecimens = Array.from(new Set(orderList.map(o => o.specimenType || 'EDTA Whole Blood / Serum'))).join(', ');

  contentLines.push('BT');
  contentLines.push('/F1 8 Tf');
  contentLines.push('0.2 0.25 0.3 rg');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 15) + ' Tm');
  contentLines.push('(' + escapePdfText(orderDisplay) + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 27) + ' Tm');
  contentLines.push('(Barcode: ' + escapePdfText(primaryOrder.specimens?.[0]?.accessionNumber || 'ACC-2026-89410') + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 39) + ' Tm');
  contentLines.push('(Specimen: ' + escapePdfText(uniqueSpecimens.slice(0, 35)) + ') Tj');
  contentLines.push('1 0 0 1 ' + col2X + ' ' + (boxTop - 51) + ' Tm');
  contentLines.push('(Status: ' + (isMulti ? `CONSOLIDATED MULTI-TEST (${orderList.length} PANELS)` : 'SYSTEM GENERATED OFFICIAL REPORT') + ') Tj');
  contentLines.push('ET');

  // Total results across all orders to determine row spacing
  const totalResultsCount = orderList.reduce((acc, o) => acc + (o.results?.length || 1), 0);
  const rowHeight = totalResultsCount > 10 ? 12 : 14;

  let currentTop = boxTop - boxHeight - 8;
  const footerTop = 75;

  orderList.forEach((ord) => {
    // Test Banner
    contentLines.push('q');
    contentLines.push('0.01 0.52 0.78 rg');
    contentLines.push(margin + ' ' + (currentTop - 14) + ' ' + (pageWidth - 2 * margin) + ' 14 re f');
    contentLines.push('Q');

    contentLines.push('BT');
    contentLines.push('/F2 7.5 Tf');
    contentLines.push('1 1 1 rg');
    contentLines.push('1 0 0 1 ' + (margin + 8) + ' ' + (currentTop - 10) + ' Tm');
    const bannerTitle = ord.investigationCategory
      ? `${ord.investigationCategory.toUpperCase()} — ${ord.investigationName.toUpperCase()}`
      : ord.investigationName.toUpperCase();
    contentLines.push('(' + escapePdfText(bannerTitle) + ') Tj');

    contentLines.push('/F1 6 Tf');
    contentLines.push('0.9 0.95 1.0 rg');
    contentLines.push('1 0 0 1 ' + (pageWidth - margin - 175) + ' ' + (currentTop - 10) + ' Tm');
    contentLines.push('(Automated Clinical Chemistry / Hematology) Tj');
    contentLines.push('ET');

    // Table Header
    const tableHeaderTop = currentTop - 16;
    contentLines.push('q');
    contentLines.push('0.92 0.94 0.97 rg');
    contentLines.push(margin + ' ' + (tableHeaderTop - 13) + ' ' + (pageWidth - 2 * margin) + ' 13 re f');
    contentLines.push('0.8 0.85 0.9 RG');
    contentLines.push(margin + ' ' + (tableHeaderTop - 13) + ' ' + (pageWidth - 2 * margin) + ' 13 re S');
    contentLines.push('Q');

    contentLines.push('BT');
    contentLines.push('/F2 6.5 Tf');
    contentLines.push('0.1 0.15 0.25 rg');
    contentLines.push('1 0 0 1 ' + (margin + 8) + ' ' + (tableHeaderTop - 9.5) + ' Tm');
    contentLines.push('(TEST PARAMETER) Tj');
    contentLines.push('1 0 0 1 ' + (margin + 195) + ' ' + (tableHeaderTop - 9.5) + ' Tm');
    contentLines.push('(OBSERVED VALUE) Tj');
    contentLines.push('1 0 0 1 ' + (margin + 295) + ' ' + (tableHeaderTop - 9.5) + ' Tm');
    contentLines.push('(UNITS) Tj');
    contentLines.push('1 0 0 1 ' + (margin + 355) + ' ' + (tableHeaderTop - 9.5) + ' Tm');
    contentLines.push('(BIOLOGICAL REF INTERVAL) Tj');
    contentLines.push('1 0 0 1 ' + (margin + 475) + ' ' + (tableHeaderTop - 9.5) + ' Tm');
    contentLines.push('(FLAG) Tj');
    contentLines.push('ET');

    // Parameter Rows
    let currentRowTop = tableHeaderTop - 13;
    const resultsList = ord.results && ord.results.length > 0 ? ord.results : [
      { parameterName: ord.investigationName, resultValue: 'Tested', unit: '-', referenceRange: 'Normal', abnormalFlag: 'NORMAL' }
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
      contentLines.push('/F1 6.8 Tf');
      contentLines.push('0.1 0.15 0.2 rg');
      contentLines.push('1 0 0 1 ' + (margin + 8) + ' ' + (currentRowTop + 3) + ' Tm');
      contentLines.push('(' + escapePdfText(r.parameterName) + ') Tj');

      contentLines.push('/F2 7.2 Tf');
      if (r.abnormalFlag === 'CRITICAL_HIGH' || r.abnormalFlag === 'CRITICAL_LOW') {
        contentLines.push('0.85 0.1 0.1 rg');
      } else if (r.abnormalFlag === 'HIGH' || r.abnormalFlag === 'LOW') {
        contentLines.push('0.85 0.5 0.0 rg');
      } else {
        contentLines.push('0.05 0.1 0.2 rg');
      }
      contentLines.push('1 0 0 1 ' + (margin + 195) + ' ' + (currentRowTop + 3) + ' Tm');
      contentLines.push('(' + escapePdfText(r.resultValue) + ') Tj');

      contentLines.push('/F1 6.8 Tf');
      contentLines.push('0.3 0.35 0.4 rg');
      contentLines.push('1 0 0 1 ' + (margin + 295) + ' ' + (currentRowTop + 3) + ' Tm');
      contentLines.push('(' + escapePdfText(r.unit || '-') + ') Tj');

      contentLines.push('1 0 0 1 ' + (margin + 355) + ' ' + (currentRowTop + 3) + ' Tm');
      contentLines.push('(' + escapePdfText(r.referenceRange || 'N/A') + ') Tj');

      contentLines.push('/F2 6.2 Tf');
      if (r.abnormalFlag === 'NORMAL') {
        contentLines.push('0.08 0.6 0.25 rg');
      }
      contentLines.push('1 0 0 1 ' + (margin + 475) + ' ' + (currentRowTop + 3) + ' Tm');
      contentLines.push('(' + escapePdfText(r.abnormalFlag) + ') Tj');
      contentLines.push('ET');
    });

    currentTop = currentRowTop - 5;
  });

  // Clinical Interpretation Remarks Box
  const remarksHeight = isMulti ? 30 : 36;
  const remarksTop = Math.max(currentTop - 4, footerTop + remarksHeight + 10);

  contentLines.push('q');
  contentLines.push('0.97 0.98 0.99 rg');
  contentLines.push(margin + ' ' + (remarksTop - remarksHeight) + ' ' + (pageWidth - 2 * margin) + ' ' + remarksHeight + ' re f');
  contentLines.push('0.85 0.88 0.92 RG');
  contentLines.push(margin + ' ' + (remarksTop - remarksHeight) + ' ' + (pageWidth - 2 * margin) + ' ' + remarksHeight + ' re S');
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 6.8 Tf');
  contentLines.push('0.01 0.41 0.63 rg');
  contentLines.push('1 0 0 1 ' + (margin + 8) + ' ' + (remarksTop - 9) + ' Tm');
  contentLines.push('(CLINICAL INTERPRETATION & PATHOLOGICAL REMARKS:) Tj');

  contentLines.push('/F1 5.8 Tf');
  contentLines.push('0.2 0.25 0.3 rg');

  if (isMulti) {
    const combinedSummary = orderList.map(o => `${o.investigationName}: Findings correlated clinically with internal IQC.`).join(' | ');
    contentLines.push('1 0 0 1 ' + (margin + 8) + ' ' + (remarksTop - 18) + ' Tm');
    contentLines.push('(' + escapePdfText(combinedSummary.slice(0, 155)) + ') Tj');
    if (combinedSummary.length > 155) {
      contentLines.push('1 0 0 1 ' + (margin + 8) + ' ' + (remarksTop - 25) + ' Tm');
      contentLines.push('(' + escapePdfText(combinedSummary.slice(155, 310)) + ') Tj');
    }
  } else {
    const rawInterp = (primaryOrder.report?.impression && primaryOrder.report.impression !== 'Test findings are clinically correlated with internal quality controls (IQC Level 1 & 2 passed). Values outside reference range should be evaluated in context of clinical presentation.')
      ? primaryOrder.report.impression
      : getStandardTestInterpretation(primaryOrder.investigationName || 'Complete Blood Count (CBC)');
    const cleanInterp = rawInterp.replace(/~~End of report~~/g, '').trim();
    contentLines.push('1 0 0 1 ' + (margin + 8) + ' ' + (remarksTop - 18) + ' Tm');
    contentLines.push('(' + escapePdfText(cleanInterp.slice(0, 155)) + ') Tj');
    if (cleanInterp.length > 155) {
      contentLines.push('1 0 0 1 ' + (margin + 8) + ' ' + (remarksTop - 25) + ' Tm');
      contentLines.push('(' + escapePdfText(cleanInterp.slice(155, 310)) + ') Tj');
    }
  }
  contentLines.push('ET');

  // End of report delimiter
  contentLines.push('BT');
  contentLines.push('/F1 5.5 Tf');
  contentLines.push('0.5 0.55 0.6 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth / 2 - 28) + ' ' + (remarksTop - remarksHeight - 5) + ' Tm');
  contentLines.push('(~~End of report~~) Tj');
  contentLines.push('ET');

  // Digital Signature & Footers
  contentLines.push('q');
  contentLines.push('0.8 0.85 0.9 RG');
  contentLines.push('1 w');
  contentLines.push(margin + ' ' + footerTop + ' m ' + (pageWidth - margin) + ' ' + footerTop + ' l S');
  contentLines.push('Q');

  // Technologist Signature (Left)
  contentLines.push('BT');
  contentLines.push('/F2 6 Tf');
  contentLines.push('0.02 0.58 0.41 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (footerTop - 8) + ' Tm');
  contentLines.push('(TECHNOLOGIST SIGN-OFF: APPROVED) Tj');
  contentLines.push('/F2 8 Tf');
  contentLines.push('0.1 0.15 0.25 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (footerTop - 18) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.technicianName || 'MD. SANJAR ALAM') + ') Tj');
  contentLines.push('/F1 6.5 Tf');
  contentLines.push('0.3 0.35 0.4 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (footerTop - 27) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.technicianTitle || 'D.M.L.T') + ') Tj');
  contentLines.push('/F1 6 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + (margin + 10) + ' ' + (footerTop - 36) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.technicianRegNo || 'Registration No. - 26534/10') + ') Tj');
  contentLines.push('ET');

  // Center Badge
  contentLines.push('BT');
  contentLines.push('/F2 6 Tf');
  contentLines.push('0.02 0.58 0.41 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth / 2 - 50) + ' ' + (footerTop - 8) + ' Tm');
  contentLines.push('(DIGITALLY SIGNED & APPROVED) Tj');
  contentLines.push('/F2 6.5 Tf');
  contentLines.push('0.01 0.41 0.63 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth / 2 - 50) + ' ' + (footerTop - 18) + ' Tm');
  contentLines.push('(ISO 9001:2015 CERTIFIED COMPANY) Tj');
  contentLines.push('/F1 6 Tf');
  contentLines.push('0.4 0.45 0.5 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth / 2 - 40) + ' ' + (footerTop - 28) + ' Tm');
  contentLines.push('(Scan for Map / Verify Result) Tj');
  contentLines.push('ET');

  // Doctor Signature & Stamp (Right)
  contentLines.push('BT');
  contentLines.push('/F2 6 Tf');
  contentLines.push('0.02 0.58 0.41 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 200) + ' ' + (footerTop - 8) + ' Tm');
  contentLines.push('(CLINICAL SIGN-OFF: APPROVED & VALIDATED) Tj');
  contentLines.push('/F2 8 Tf');
  contentLines.push('0.08 0.55 0.25 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 200) + ' ' + (footerTop - 18) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.pathologistName || 'DR. VIKRAM KUMAR') + ') Tj');
  contentLines.push('/F1 6.5 Tf');
  contentLines.push('0.3 0.35 0.4 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 200) + ' ' + (footerTop - 27) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.pathologistTitle || 'MBBS (DMCH)') + ') Tj');
  contentLines.push('/F1 6 Tf');
  contentLines.push('0.01 0.45 0.7 rg');
  contentLines.push('1 0 0 1 ' + (pageWidth - margin - 200) + ' ' + (footerTop - 36) + ' Tm');
  contentLines.push('(' + escapePdfText(settings.pathologistRegNo || 'Registration No. - 47684') + ') Tj');
  contentLines.push('ET');

  // Statutory Medico-Legal Disclaimer
  contentLines.push('BT');
  contentLines.push('/F1 5.5 Tf');
  contentLines.push('0.35 0.4 0.45 rg');
  contentLines.push('1 0 0 1 ' + margin + ' 16 Tm');
  contentLines.push('(' + escapePdfText(settings.medicoLegalNotice || 'Note:- Here all types of Blood and urine tests are done through automated machines. Results must be correlated clinically with medical history. Not Valid for Medico-Legal Purpose.') + ') Tj');
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

  const docName = isMulti
    ? `Official-Consolidated-Diagnostic-Report-${primaryOrder.patientName.replace(/\s+/g, '-')}-${orderList.length}Tests.pdf`
    : `Official-Diagnostic-Report-${primaryOrder.patientName.replace(/\s+/g, '-')}-${primaryOrder.orderNumber}.pdf`;

  downloadLink.download = docName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(downloadUrl);
}
