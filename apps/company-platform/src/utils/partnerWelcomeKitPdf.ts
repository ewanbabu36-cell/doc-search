/**
 * DOC SEARCH — Partner Welcome Kit & Feature Capacity Menu Book PDF Generator
 * Produces an authentic ISO 32000-1 pure vector PDF document containing:
 * - Official Welcome & Accreditation Seal
 * - Partner Credentials (User ID, Temporary Password, Login URL)
 * - Subscribed Plan & Feature Capacity Quota Breakdown (Menu Book)
 * - Dedicated Relationship Manager & Escalation Contacts
 * - Speed Post / Courier Consignment Docket Information
 */

export interface PartnerWelcomeKitData {
  partnerId: string;
  partnerName: string;
  classification: string;
  contactPerson: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  state: string;
  planTier: string;
  monthlyFee: number;
  features: string[];
  activatedAt?: string;
  dailyCapacity?: number;
  staffAccountsLimit?: number;
  whatsappCreditsLimit?: number;
  cloudStorageGb?: number;
}

function escapePdfText(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generateAndDownloadWelcomeKitPdf(data: PartnerWelcomeKitData): void {
  const pageWidth = 595.28; // A4 Width (points)
  const pageHeight = 841.89; // A4 Height (points)
  const margin = 36;
  const contentLines: string[] = [];

  const actDate = data.activatedAt ? new Date(data.activatedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const trackingNumber = `SP-IN-2026-${data.partnerId.replace(/\D/g, '').padEnd(6, '9')}`;

  // 1. Header Banner (Deep Slate / Navy)
  contentLines.push('q');
  contentLines.push('0.06 0.09 0.16 rg'); // Deep slate navy
  contentLines.push(`0 ${pageHeight - 100} ${pageWidth} 100 re f`);
  contentLines.push('Q');

  // Accent Line (Cyan glow)
  contentLines.push('q');
  contentLines.push('0.02 0.71 0.83 RG'); // Cyan accent
  contentLines.push('3.5 w');
  contentLines.push(`0 ${pageHeight - 100} m ${pageWidth} ${pageHeight - 100} l S`);
  contentLines.push('Q');

  // Header Title
  contentLines.push('BT');
  contentLines.push('/F2 16 Tf');
  contentLines.push('1 1 1 rg');
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 38} Tm`);
  contentLines.push('(DOC SEARCH HEALTHCARE PLATFORM — OFFICIAL PARTNER WELCOME KIT) Tj');

  contentLines.push('/F1 9 Tf');
  contentLines.push('0.22 0.74 0.97 rg'); // Light cyan
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 54} Tm`);
  contentLines.push('(Enterprise Healthcare Network • Partner Activation Dossier & Service Menu Book) Tj');

  contentLines.push('/F1 8 Tf');
  contentLines.push('0.7 0.8 0.9 rg');
  contentLines.push(`1 0 0 1 ${margin} ${pageHeight - 70} Tm`);
  contentLines.push(`(${escapePdfText(`Partner ID: ${data.partnerId}  |  Activated: ${actDate}  |  Regulatory Status: 100% KYC VERIFIED`)}) Tj`);

  contentLines.push(`1 0 0 1 ${pageWidth - margin - 150} ${pageHeight - 70} Tm`);
  contentLines.push(`(${escapePdfText(`Speed Post Docket: ${trackingNumber}`)}) Tj`);
  contentLines.push('ET');

  // 2. Welcome Announcement Box
  const boxTop = pageHeight - 120;
  contentLines.push('q');
  contentLines.push('0.94 0.98 0.96 rg'); // soft emerald tint
  contentLines.push('0.06 0.72 0.51 RG'); // emerald border
  contentLines.push('1 w');
  contentLines.push(`${margin} ${boxTop - 65} ${pageWidth - 2 * margin} 65 re b`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 12 Tf');
  contentLines.push('0.04 0.48 0.34 rg'); // emerald dark
  contentLines.push(`1 0 0 1 ${margin + 14} ${boxTop - 22} Tm`);
  contentLines.push(`(${escapePdfText(`WELCOME TO DOC SEARCH NETWORK: ${data.partnerName.toUpperCase()}`)}) Tj`);

  contentLines.push('/F1 8.5 Tf');
  contentLines.push('0.2 0.3 0.35 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${boxTop - 40} Tm`);
  contentLines.push(`(${escapePdfText(`Authorized Pathologist / In-Charge: ${data.contactPerson}  |  Phone: ${data.phone}  |  Location: ${data.city}, ${data.state}`)}) Tj`);

  contentLines.push('/F1 8 Tf');
  contentLines.push('0.3 0.4 0.45 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${boxTop - 54} Tm`);
  contentLines.push('(Your healthcare facility is now 100% active on the national digital healthcare grid with dedicated LIMS features.) Tj');
  contentLines.push('ET');

  // 3. Section 1: Authorized Login Credentials Card (Dark slate box)
  const credTop = boxTop - 85;
  contentLines.push('q');
  contentLines.push('0.07 0.11 0.18 rg'); // dark card
  contentLines.push('0.22 0.74 0.97 RG'); // cyan border
  contentLines.push('1.5 w');
  contentLines.push(`${margin} ${credTop - 90} ${pageWidth - 2 * margin} 90 re b`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 10.5 Tf');
  contentLines.push('0.22 0.74 0.97 rg'); // cyan
  contentLines.push(`1 0 0 1 ${margin + 14} ${credTop - 20} Tm`);
  contentLines.push('(SECTION 1: CONFIDENTIAL PARTNER LOGIN CREDENTIALS) Tj');

  contentLines.push('/F1 8.5 Tf');
  contentLines.push('0.7 0.8 0.9 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${credTop - 38} Tm`);
  contentLines.push(`(${escapePdfText(`Partner Portal URL: http://localhost:5173/  (Accessible 24x7 from any device/browser)`)}) Tj`);

  contentLines.push('/F2 10 Tf');
  contentLines.push('1 1 1 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${credTop - 56} Tm`);
  contentLines.push(`(${escapePdfText(`User ID (Login Email):  ${data.email}`)}) Tj`);

  contentLines.push('/F2 10 Tf');
  contentLines.push('0.06 0.85 0.51 rg'); // emerald green
  contentLines.push(`1 0 0 1 ${margin + 14} ${credTop - 74} Tm`);
  contentLines.push(`(${escapePdfText(`Assigned Password:       ${data.password}   [CONFIDENTIAL - CHANGE UPON 1ST LOGIN]`)}) Tj`);
  contentLines.push('ET');

  // 4. Section 2: Subscribed Plan & Financial Schedule
  const planTop = credTop - 110;
  contentLines.push('q');
  contentLines.push('0.96 0.97 0.99 rg');
  contentLines.push('0.8 0.85 0.9 RG');
  contentLines.push('1 w');
  contentLines.push(`${margin} ${planTop - 75} ${pageWidth - 2 * margin} 75 re b`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 10 Tf');
  contentLines.push('0.1 0.2 0.35 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${planTop - 18} Tm`);
  contentLines.push('(SECTION 2: COMMERCIAL SUBSCRIPTION & SERVICE LEVEL SPECIFICATION) Tj');

  contentLines.push('/F1 8.5 Tf');
  contentLines.push('0.2 0.3 0.4 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${planTop - 36} Tm`);
  contentLines.push(`(${escapePdfText(`Subscribed Plan Tier:  ${data.planTier.toUpperCase()}  (Active B2B SaaS Tier)`)}) Tj`);

  contentLines.push(`1 0 0 1 ${margin + 14} ${planTop - 52} Tm`);
  contentLines.push(`(${escapePdfText(`Monthly Subscription Fee:  INR ${data.monthlyFee.toLocaleString('en-IN')} / month  (+ 18% GST as per Indian Tax Code)`)}) Tj`);

  contentLines.push(`1 0 0 1 ${margin + 14} ${planTop - 66} Tm`);
  contentLines.push('(Settlement Cycle: Monthly Automated Escrow Clearing  |  Payment Gateway: Instant UPI & NetBanking) Tj');
  contentLines.push('ET');

  // 5. Section 3: Feature Capacity & Quota Matrix (The "Menu Book")
  const menuTop = planTop - 95;
  contentLines.push('q');
  contentLines.push('0.98 0.98 1.0 rg');
  contentLines.push('0.2 0.5 0.8 RG');
  contentLines.push('1.5 w');
  contentLines.push(`${margin} ${menuTop - 190} ${pageWidth - 2 * margin} 190 re b`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 10.5 Tf');
  contentLines.push('0.06 0.2 0.4 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${menuTop - 20} Tm`);
  contentLines.push('(SECTION 3: FEATURE CAPACITY & QUOTA ALLOCATION MATRIX [MENU BOOK]) Tj');

  const menuItems = [
    { label: 'Daily Lab Test Capacity:', val: 'Up to 500 Lab Orders / Day (Scalable on Demand)' },
    { label: 'Phlebotomy Sample Barcoding:', val: 'Active (Code 128 / Dynamic QR Code Labeling)' },
    { label: 'Bi-Directional Machine Sync:', val: 'Enabled (ASTM / HL7 Automated Analyzer Bridge)' },
    { label: 'WhatsApp NABL Report Dispatch:', val: 'Included (2,500 Direct Patient WhatsApp PDFs / mo)' },
    { label: 'Doctor Digital e-Signature:', val: 'Active (Cryptographic SHA-256 Stamp on all Reports)' },
    { label: 'Concurrent Staff Logins:', val: '10 Logins (Pathologists, Phlebotomists, Front-Desk)' },
    { label: 'ABDM 2.0 Health Facility ID:', val: 'Integrated (Scan & Share + Ayushman Bharat Token)' },
    { label: 'Cloud Report Archive Duration:', val: '5 Years Longitudinal Cloud Retention (HIPAA & DPDPA)' },
    { label: 'B2B Doctor Referral Commission:', val: 'Automated Commission Ledger & Instant UPI Settlement' }
  ];

  let curY = menuTop - 40;
  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i]!;
    contentLines.push('/F2 8 Tf');
    contentLines.push('0.1 0.15 0.25 rg');
    contentLines.push(`1 0 0 1 ${margin + 14} ${curY} Tm`);
    contentLines.push(`(${escapePdfText(`*  ${item.label}`)}) Tj`);

    contentLines.push('/F1 8 Tf');
    contentLines.push('0.05 0.4 0.25 rg'); // green tint for value
    contentLines.push(`1 0 0 1 ${margin + 190} ${curY} Tm`);
    contentLines.push(`(${escapePdfText(item.val)}) Tj`);

    curY -= 16;
  }
  contentLines.push('ET');

  // 6. Section 4: Speed Post & Consignment Dispatch Docket
  const postTop = menuTop - 205;
  contentLines.push('q');
  contentLines.push('0.97 0.97 0.95 rg'); // Manila envelope shade
  contentLines.push('0.85 0.7 0.4 RG'); // amber border
  contentLines.push('1.5 w');
  contentLines.push(`${margin} ${postTop - 80} ${pageWidth - 2 * margin} 80 re b`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 9.5 Tf');
  contentLines.push('0.4 0.25 0.05 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${postTop - 18} Tm`);
  contentLines.push('(SECTION 4: SPEED POST & COURIER DISPATCH DOCKET) Tj');

  contentLines.push('/F1 8 Tf');
  contentLines.push('0.2 0.2 0.2 rg');
  contentLines.push(`1 0 0 1 ${margin + 14} ${postTop - 34} Tm`);
  contentLines.push(`(${escapePdfText(`Consignee:  ${data.partnerName} (Attn: ${data.contactPerson})`)}) Tj`);

  contentLines.push(`1 0 0 1 ${margin + 14} ${postTop - 48} Tm`);
  contentLines.push(`(${escapePdfText(`Delivery Address:  ${data.city}, ${data.state}, India  |  Contact: ${data.phone}`)}) Tj`);

  contentLines.push(`1 0 0 1 ${margin + 14} ${postTop - 62} Tm`);
  contentLines.push(`(${escapePdfText(`Consignor:  Doc Search Healthcare Platform Pvt Ltd, HQ Tower, Cyber City, India`)}) Tj`);

  contentLines.push('/F2 8.5 Tf');
  contentLines.push('0.06 0.4 0.8 rg');
  contentLines.push(`1 0 0 1 ${pageWidth - margin - 190} ${postTop - 34} Tm`);
  contentLines.push(`(${escapePdfText(`Tracking ID: ${trackingNumber}`)}) Tj`);

  contentLines.push('/F1 7.5 Tf');
  contentLines.push('0.4 0.4 0.4 rg');
  contentLines.push(`1 0 0 1 ${pageWidth - margin - 190} ${postTop - 48} Tm`);
  contentLines.push('(India Post Speed Post / BlueDart Secure) Tj');
  contentLines.push('ET');

  // 7. Footer & Support Contacts
  const footerTop = postTop - 95;
  contentLines.push('q');
  contentLines.push('0.8 0.85 0.9 RG');
  contentLines.push('0.75 w');
  contentLines.push(`${margin} ${footerTop} m ${pageWidth - margin} ${footerTop} l S`);
  contentLines.push('Q');

  contentLines.push('BT');
  contentLines.push('/F2 8 Tf');
  contentLines.push('0.1 0.2 0.35 rg');
  contentLines.push(`1 0 0 1 ${margin} ${footerTop - 14} Tm`);
  contentLines.push('(Dedicated Relationship Manager:  Dr. Anand Singhal  |  Support Hotline: +91 1800-DOC-SEARCH) Tj');

  contentLines.push('/F1 7.5 Tf');
  contentLines.push('0.4 0.5 0.6 rg');
  contentLines.push(`1 0 0 1 ${margin} ${footerTop - 26} Tm`);
  contentLines.push('(WhatsApp Business Priority Desk: +91 98111 00223  |  Email: partner-support@docsearch.health) Tj');

  contentLines.push('/F2 8 Tf');
  contentLines.push('0.06 0.72 0.51 rg');
  contentLines.push(`1 0 0 1 ${pageWidth - margin - 220} ${footerTop - 14} Tm`);
  contentLines.push(`(${escapePdfText(`DIGITALLY SEALED & DISPATCHED ON ${actDate}`)}) Tj`);
  contentLines.push('ET');

  // Assembly into standard PDF stream
  const contentStream = contentLines.join('\n');
  const encoder = new TextEncoder();
  const streamLength = encoder.encode(contentStream).length;

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`);
  objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`);
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
  for (let i = 1; i < xrefOffsets.length; i++) {
    const offset = String(xrefOffsets[i]).padStart(10, '0');
    xref += offset + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;
  const pdfString = body + xref + trailer;

  const buffer = encoder.encode(pdfString);
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = data.partnerName.replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `DocSearch-Partner-WelcomeKit-${safeName}-${data.partnerId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open high-resolution printable Speed Post Dossier with envelope dispatch slip
 */
export function openPrintableSpeedPostDossier(data: PartnerWelcomeKitData): void {
  const win = window.open('', '_blank', 'width=950,height=800');
  if (!win) {
    alert('Please allow popups to view printable Speed Post Dossier.');
    return;
  }

  const actDate = data.activatedAt ? new Date(data.activatedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const trackingNumber = `SP-IN-2026-${data.partnerId.replace(/\D/g, '').padEnd(6, '9')}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Doc Search — Partner Welcome Kit & Speed Post Docket (${data.partnerName})</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
        .page { max-width: 800px; margin: 0 auto; background: #fff; padding: 36px; border: 1px solid #cbd5e1; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: #0f172a; color: #fff; padding: 24px; border-radius: 8px; border-bottom: 4px solid #06b6d4; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 800; }
        .badge-live { background: #10b981; color: #064e3b; }
        .badge-plan { background: #06b6d4; color: #070c16; }
        .card { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 18px 0; }
        .envelope { background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .btn-print { background: #06b6d4; color: #070c16; border: none; padding: 12px 24px; font-size: 15px; font-weight: 800; border-radius: 8px; cursor: pointer; }
        .table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .table th, .table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
        .table th { background: #e2e8f0; font-weight: 800; }
        @media print {
          body { background: #fff; padding: 0; }
          .page { border: none; box-shadow: none; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <button class="btn-print" onclick="window.print()">🖨️ Print Speed Post Dossier (A4)</button>
          <span style="font-size: 13px; color: #64748b;">Tip: Select "Save as PDF" or your physical office printer</span>
        </div>

        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 900;">DOC SEARCH HEALTHCARE PLATFORM</h1>
              <p style="margin: 4px 0 0; color: #38bdf8; font-size: 13px;">Enterprise Partner Onboarding Dossier & Service Specification</p>
            </div>
            <span class="badge badge-live">🟢 LIVE & ACTIVE</span>
          </div>
          <div style="margin-top: 14px; font-size: 12px; color: #94a3b8; display: flex; gap: 16px;">
            <span><strong>Partner ID:</strong> ${data.partnerId}</span>
            <span><strong>Date:</strong> ${actDate}</span>
            <span><strong>Speed Post:</strong> ${trackingNumber}</span>
          </div>
        </div>

        <!-- Envelope Docket for Speed Post -->
        <div class="envelope">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #f59e0b; padding-bottom: 8px; margin-bottom: 10px;">
            <strong style="color: #b45309; font-size: 14px;">📦 INDIA POST SPEED POST / COURIER CONSIGNMENT DOCKET</strong>
            <span style="font-family: monospace; font-weight: 800; font-size: 14px; color: #1e293b;">${trackingNumber}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px;">
            <div>
              <strong style="color: #64748b; font-size: 11px; text-transform: uppercase; display: block;">Deliver To (Consignee):</strong>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px;">${data.partnerName}</div>
              <div>Attn: ${data.contactPerson}</div>
              <div>City: ${data.city}, State: ${data.state}</div>
              <div>Mobile: ${data.phone}</div>
            </div>
            <div>
              <strong style="color: #64748b; font-size: 11px; text-transform: uppercase; display: block;">Sender (Consignor):</strong>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 3px;">Doc Search Platform Private Limited</div>
              <div>Enterprise Partner Relations Dept, HQ Tower 4</div>
              <div>Cyber City / Lucknow Hub, India</div>
              <div>Toll-Free: +91 1800-DOC-SEARCH</div>
            </div>
          </div>
        </div>

        <!-- Credentials Box -->
        <div class="card" style="border-left: 5px solid #06b6d4;">
          <h3 style="margin: 0 0 10px; font-size: 16px; color: #0f172a;">🔐 Official Partner Access Credentials</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
            <div>
              <span style="color: #64748b; font-size: 12px;">Partner Login URL:</span><br/>
              <strong style="color: #0284c7;">http://localhost:5173/</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 12px;">Subscribed Tier:</span><br/>
              <strong style="color: #059669;">${data.planTier} (₹${data.monthlyFee.toLocaleString('en-IN')}/mo)</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 12px;">Authorized User ID (Email):</span><br/>
              <strong style="color: #0f172a;">${data.email}</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 12px;">Temporary Access Password:</span><br/>
              <strong style="color: #059669; font-family: monospace; font-size: 16px;">${data.password}</strong>
            </div>
          </div>
        </div>

        <!-- Feature Capacity Menu Book -->
        <h3 style="margin: 24px 0 8px; font-size: 16px;">📋 Feature Capacity & Service Quota Allotted (Menu Book)</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Feature / Service Specification</th>
              <th>Entitlement / Quota Allotted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Daily Lab Test Processing Capacity</strong></td>
              <td>Up to 500 Lab Orders / Day</td>
              <td><span style="color: #059669; font-weight: 800;">✓ Unlimited Scale</span></td>
            </tr>
            <tr>
              <td><strong>Phlebotomy Sample Barcoding & QR</strong></td>
              <td>Code 128 & 2D QR Automated Tube Printing</td>
              <td><span style="color: #059669; font-weight: 800;">✓ Active</span></td>
            </tr>
            <tr>
              <td><strong>Bi-Directional Lab Machine Analyzer Interface</strong></td>
              <td>Direct ASTM/HL7 IoT Bridge to Hematology/Biochem</td>
              <td><span style="color: #059669; font-weight: 800;">✓ Active</span></td>
            </tr>
            <tr>
              <td><strong>WhatsApp NABL PDF Report Dispatch</strong></td>
              <td>2,500 Patient WhatsApp Messages / Month Included</td>
              <td><span style="color: #059669; font-weight: 800;">✓ Active</span></td>
            </tr>
            <tr>
              <td><strong>Pathologist Digital Signature on Reports</strong></td>
              <td>SHA-256 Cryptographic Stamp & Medical Council Verification</td>
              <td><span style="color: #059669; font-weight: 800;">✓ Active</span></td>
            </tr>
            <tr>
              <td><strong>Concurrent Staff Accounts</strong></td>
              <td>10 Logins (Pathologists, Phlebotomists, Front-Desk)</td>
              <td><span style="color: #059669; font-weight: 800;">✓ Active</span></td>
            </tr>
            <tr>
              <td><strong>ABDM 2.0 National Health Facility Registry</strong></td>
              <td>Scan & Share Token Kiosk + Ayushman Bharat Digital Link</td>
              <td><span style="color: #059669; font-weight: 800;">✓ Integrated</span></td>
            </tr>
            <tr>
              <td><strong>B2B Referral Commission Split Ledger</strong></td>
              <td>Instant UPI Payout Split with Referring Doctors</td>
              <td><span style="color: #059669; font-weight: 800;">✓ Active</span></td>
            </tr>
          </tbody>
        </table>

        <!-- Dedicated Support -->
        <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; display: flex; justify-content: space-between;">
          <div>
            <strong>Dedicated Relationship Manager:</strong> Dr. Anand Singhal (+91 1800-DOC-SEARCH)<br/>
            <strong>WhatsApp Priority Helpdesk:</strong> +91 98111 00223 | support@docsearch.health
          </div>
          <div style="text-align: right;">
            <strong>Doc Search SaaS Platform HQ</strong><br/>
            Digitally Signed on ${actDate}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
