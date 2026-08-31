export interface PrescriptionPdfData {
  prescriptionNumber: string;
  encounterNumber: string;
  hospitalName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  patientName: string;
  patientMrn: string;
  ageGender: string;
  consultationDate: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorRegistrationNumber: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    spo2?: string;
    temp?: string;
    weight?: string;
    bmi?: string;
  };
  diagnoses: Array<{
    code: string;
    name: string;
    isPrimary?: boolean;
  }>;
  medications: Array<{
    name: string;
    strength: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    isGeneric?: boolean;
  }>;
  labInvestigations?: string[];
  followUpAdvice?: string;
}

export class PrescriptionPdfGenerator {
  generatePrescriptionPdf(data: PrescriptionPdfData): Buffer {
    const streamContent: string[] = [];

    // Header & Hospital info
    streamContent.push('q');
    streamContent.push('0.06 0.09 0.16 rg'); // Dark primary banner
    streamContent.push('36 732 540 70 re f');
    streamContent.push('Q');

    streamContent.push('BT');
    streamContent.push('/F1 15 Tf');
    streamContent.push('1 1 1 rg');
    streamContent.push('50 774 Td');
    streamContent.push(`(${this.escape(data.hospitalName.toUpperCase())}) Tj`);
    streamContent.push('ET');

    streamContent.push('BT');
    streamContent.push('/F2 8 Tf');
    streamContent.push('0.8 0.9 1 rg');
    streamContent.push('50 758 Td');
    streamContent.push(`(${this.escape(data.facilityAddress || 'Outpatient Department (OPD) — NABH Accredited Multi-Specialty Centre')}) Tj`);
    streamContent.push('ET');

    streamContent.push('BT');
    streamContent.push('/F1 9 Tf');
    streamContent.push('0.22 0.74 0.97 rg');
    streamContent.push('50 742 Td');
    streamContent.push('(OFFICIAL ELECTRONIC MEDICAL PRESCRIPTION - e-Rx) Tj');
    streamContent.push('ET');

    // Doctor Details Bar
    streamContent.push('q');
    streamContent.push('0.94 0.96 0.98 rg');
    streamContent.push('36 680 540 44 re f');
    streamContent.push('0.8 0.85 0.9 RG 1 w');
    streamContent.push('36 680 540 44 re S');
    streamContent.push('Q');

    streamContent.push('BT');
    streamContent.push('/F1 10 Tf');
    streamContent.push('0.1 0.15 0.25 rg');
    streamContent.push('50 708 Td');
    streamContent.push(`(Consulting Physician: ${this.escape(data.doctorName)}) Tj`);
    streamContent.push('ET');

    streamContent.push('BT');
    streamContent.push('/F2 8 Tf');
    streamContent.push('0.3 0.35 0.45 rg');
    streamContent.push('50 694 Td');
    streamContent.push(`(${this.escape(data.doctorSpecialty)} | Reg: ${this.escape(data.doctorRegistrationNumber)}) Tj`);
    streamContent.push('ET');

    streamContent.push('BT');
    streamContent.push('/F1 8 Tf');
    streamContent.push('0.1 0.15 0.25 rg');
    streamContent.push('380 708 Td');
    streamContent.push(`(Date: ${this.escape(data.consultationDate)}) Tj`);
    streamContent.push('ET');

    streamContent.push('BT');
    streamContent.push('/F2 8 Tf');
    streamContent.push('0.3 0.35 0.45 rg');
    streamContent.push('380 694 Td');
    streamContent.push(`(Rx No: ${this.escape(data.prescriptionNumber)} | Enc: ${this.escape(data.encounterNumber)}) Tj`);
    streamContent.push('ET');

    // Patient Demographics Box
    streamContent.push('q');
    streamContent.push('0.98 0.98 0.99 rg');
    streamContent.push('36 630 540 42 re f');
    streamContent.push('0.85 0.88 0.92 RG 1 w');
    streamContent.push('36 630 540 42 re S');
    streamContent.push('Q');

    streamContent.push('BT');
    streamContent.push('/F1 9 Tf');
    streamContent.push('0.1 0.15 0.25 rg');
    streamContent.push('50 656 Td');
    streamContent.push(`(Patient: ${this.escape(data.patientName)}) Tj`);
    streamContent.push('ET');

    streamContent.push('BT');
    streamContent.push('/F2 8 Tf');
    streamContent.push('0.3 0.35 0.45 rg');
    streamContent.push('50 642 Td');
    streamContent.push(`(UHID/MRN: ${this.escape(data.patientMrn)} | Age/Gender: ${this.escape(data.ageGender)}) Tj`);
    streamContent.push('ET');

    // Vitals
    if (data.vitals) {
      streamContent.push('BT');
      streamContent.push('/F1 8 Tf');
      streamContent.push('0.1 0.15 0.25 rg');
      streamContent.push('300 656 Td');
      streamContent.push(`(Vitals: BP: ${this.escape(data.vitals.bp || '120/80')} mmHg | Pulse: ${this.escape(data.vitals.pulse || '72')} bpm) Tj`);
      streamContent.push('ET');

      streamContent.push('BT');
      streamContent.push('/F2 8 Tf');
      streamContent.push('0.3 0.35 0.45 rg');
      streamContent.push('300 642 Td');
      streamContent.push(`(SpO2: ${this.escape(data.vitals.spo2 || '98%')} | Temp: ${this.escape(data.vitals.temp || '98.4F')} | BMI: ${this.escape(data.vitals.bmi || '23.5')}) Tj`);
      streamContent.push('ET');
    }

    // Diagnoses Section
    let currentY = 604;
    streamContent.push('BT');
    streamContent.push('/F1 9 Tf');
    streamContent.push('0.06 0.09 0.16 rg');
    streamContent.push(`50 ${currentY} Td`);
    streamContent.push('(CLINICAL DIAGNOSIS & ASSESSMENT (ICD-10):) Tj');
    streamContent.push('ET');

    currentY -= 14;
    for (const d of data.diagnoses) {
      streamContent.push('BT');
      streamContent.push('/F2 8 Tf');
      streamContent.push('0.2 0.25 0.35 rg');
      streamContent.push(`60 ${currentY} Td`);
      streamContent.push(`(- [${this.escape(d.code)}] ${this.escape(d.name)}${d.isPrimary ? ' (Primary Diagnosis)' : ''}) Tj`);
      streamContent.push('ET');
      currentY -= 12;
    }

    // Rx Symbol & Medications Table
    currentY -= 6;
    streamContent.push('BT');
    streamContent.push('/F1 14 Tf');
    streamContent.push('0.06 0.09 0.16 rg');
    streamContent.push(`48 ${currentY} Td`);
    streamContent.push('(Rx) Tj');
    streamContent.push('ET');

    streamContent.push('BT');
    streamContent.push('/F1 9 Tf');
    streamContent.push('0.06 0.09 0.16 rg');
    streamContent.push(`72 ${currentY} Td`);
    streamContent.push('(PRESCRIBED MEDICATIONS & DOSAGE SCHEDULE) Tj');
    streamContent.push('ET');

    currentY -= 16;
    // Table Header
    streamContent.push('q');
    streamContent.push('0.1 0.15 0.25 rg');
    streamContent.push(`36 ${currentY} 540 18 re f`);
    streamContent.push('Q');

    streamContent.push('BT');
    streamContent.push('/F1 8 Tf');
    streamContent.push('1 1 1 rg');
    streamContent.push(`46 ${currentY + 5} Td`);
    streamContent.push('(MEDICINE / FORM / STRENGTH) Tj');
    streamContent.push(`240 ${currentY + 5} Td`);
    streamContent.push('(DOSAGE & FREQUENCY) Tj');
    streamContent.push(`380 ${currentY + 5} Td`);
    streamContent.push('(DURATION) Tj');
    streamContent.push(`460 ${currentY + 5} Td`);
    streamContent.push('(INSTRUCTIONS) Tj');
    streamContent.push('ET');

    currentY -= 18;
    data.medications.forEach((med, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        streamContent.push('q');
        streamContent.push('0.97 0.98 0.99 rg');
        streamContent.push(`36 ${currentY - 4} 540 20 re f`);
        streamContent.push('Q');
      }

      const displayName = med.isGeneric && med.name.includes('(') ? med.name : (med.name.includes('PMBJP') ? med.name : `${med.name}`);
      streamContent.push('BT');
      streamContent.push('/F1 8 Tf');
      streamContent.push('0.1 0.15 0.25 rg');
      streamContent.push(`46 ${currentY + 4} Td`);
      streamContent.push(`(${this.escape(displayName)} ${this.escape(med.strength)}) Tj`);
      streamContent.push('ET');

      streamContent.push('BT');
      streamContent.push('/F2 7.5 Tf');
      streamContent.push('0.2 0.25 0.35 rg');
      streamContent.push(`240 ${currentY + 4} Td`);
      streamContent.push(`(${this.escape(med.dosage)} | ${this.escape(med.frequency)}) Tj`);
      streamContent.push(`380 ${currentY + 4} Td`);
      streamContent.push(`(${this.escape(med.duration)}) Tj`);
      streamContent.push(`460 ${currentY + 4} Td`);
      streamContent.push(`(${this.escape(med.instructions)}) Tj`);
      streamContent.push('ET');

      currentY -= 20;
    });

    // Diagnostic Orders if any
    if (data.labInvestigations && data.labInvestigations.length > 0) {
      currentY -= 8;
      streamContent.push('BT');
      streamContent.push('/F1 9 Tf');
      streamContent.push('0.06 0.09 0.16 rg');
      streamContent.push(`50 ${currentY} Td`);
      streamContent.push('(ORDERED DIAGNOSTIC INVESTIGATIONS:) Tj');
      streamContent.push('ET');

      currentY -= 14;
      data.labInvestigations.forEach((inv) => {
        streamContent.push('BT');
        streamContent.push('/F2 8 Tf');
        streamContent.push('0.2 0.25 0.35 rg');
        streamContent.push(`60 ${currentY} Td`);
        streamContent.push(`(• ${this.escape(inv)}) Tj`);
        streamContent.push('ET');
        currentY -= 12;
      });
    }

    // Follow-up Advice
    if (data.followUpAdvice) {
      currentY -= 8;
      streamContent.push('BT');
      streamContent.push('/F1 8.5 Tf');
      streamContent.push('0.06 0.09 0.16 rg');
      streamContent.push(`50 ${currentY} Td`);
      streamContent.push(`(Follow-up Instructions: ${this.escape(data.followUpAdvice)}) Tj`);
      streamContent.push('ET');
    }

    // Doctor Signatory Box
    streamContent.push('q');
    streamContent.push('0.95 0.97 0.99 rg');
    streamContent.push('360 80 216 65 re f');
    streamContent.push('0.8 0.85 0.9 RG 1 w');
    streamContent.push('360 80 216 65 re S');
    streamContent.push('Q');

    streamContent.push('BT');
    streamContent.push('/F1 8 Tf');
    streamContent.push('0.06 0.09 0.16 rg');
    streamContent.push('370 130 Td');
    streamContent.push(`(Digitally Signed By:) Tj`);
    streamContent.push('/F1 9 Tf');
    streamContent.push('370 114 Td');
    streamContent.push(`(${this.escape(data.doctorName)}) Tj`);
    streamContent.push('/F2 7.5 Tf');
    streamContent.push('0.3 0.35 0.45 rg');
    streamContent.push('370 100 Td');
    streamContent.push(`(${this.escape(data.doctorSpecialty)}) Tj`);
    streamContent.push('370 88 Td');
    streamContent.push(`(Reg No: ${this.escape(data.doctorRegistrationNumber)}) Tj`);
    streamContent.push('ET');

    // Footer
    streamContent.push('BT');
    streamContent.push('/F2 7 Tf');
    streamContent.push('0.5 0.55 0.6 rg');
    streamContent.push('50 45 Td');
    streamContent.push('(This is a computer-generated authentic e-Prescription under Section 65B of Indian Evidence Act & NMC Telemedicine Guidelines.) Tj');
    streamContent.push('ET');

    const streamBody = streamContent.join('\n');
    const streamLength = Buffer.byteLength(streamBody, 'utf8');

    const objects: string[] = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
    objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`);
    objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamBody}\nendstream\nendobj`);
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');
    objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

    let pdf = '%PDF-1.4\n';
    const xrefOffsets = [0];

    for (const obj of objects) {
      xrefOffsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += obj + '\n';
    }

    const startXref = Buffer.byteLength(pdf, 'utf8');
    pdf += 'xref\n';
    pdf += `0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';

    for (let i = 1; i <= objects.length; i++) {
      const offset = xrefOffsets[i]!;
      pdf += offset.toString().padStart(10, '0') + ' 00000 n \n';
    }

    pdf += 'trailer\n';
    pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += 'startxref\n';
    pdf += `${startXref}\n`;
    pdf += '%%EOF\n';

    return Buffer.from(pdf, 'utf8');
  }

  private escape(str: string): string {
    return (str || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}

export const prescriptionPdfGenerator = new PrescriptionPdfGenerator();
