import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export const AiDischargeSummaryClaimView: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<'APPENDICITIS' | 'CHF' | 'PEDIATRIC'>('APPENDICITIS');
  const [activeSubTab, setActiveSubTab] = useState<'DISCHARGE_SUMMARY' | 'INSURANCE_CLAIM'>('DISCHARGE_SUMMARY');
  const [isSigned, setIsSigned] = useState(false);
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  const casesData = {
    APPENDICITIS: {
      patientName: 'Rahul Verma',
      ageGender: '38y / Male',
      ipdNumber: 'IPD-2026-8812',
      uhid: 'UHID-2026-9041',
      admissionDate: '25 Aug 2026, 11:30 PM',
      dischargeDate: '30 Aug 2026, 04:00 PM',
      attendingDoctor: 'Dr. Rajesh Sharma, MS (General & Laparoscopic Surgeon)',
      department: 'Department of General & Laparoscopic Surgery',
      wardBed: 'Post-Op Ward 204 (Bed 02)',
      tpaPayer: 'Star Health & Allied Insurance (Policy: SH-2026-99214)',
      finalDiagnosis: 'Acute Gangrenous Appendicitis with Localized Peritonitis (ICD-10: K35.80)',
      surgeryPerformed: 'Emergency Laparoscopic Appendectomy under General Anesthesia on 26 Aug 2026',
      clinicalCourse: '38-year-old male admitted through ER with severe right iliac fossa pain, guarding, high fever (102°F), and leukocytosis (TLC 16,800). Ultrasound confirmed acute inflamed appendix (9.4mm). Underwent emergency laparoscopic appendectomy under GA. Intraoperatively, gangrenous retrocecal appendix with localized turbid exudate noted. Post-operatively, patient kept NPO for 12 hours, then transitioned to liquids and soft diet by Day 3. Bowel sounds present, flatus passed. Surgical ports healthy, no erythema or discharge. Afebrile at discharge with normal blood count (TLC 8,200).',
      investigations: 'Pre-Op TLC: 16,800/cu mm, Hb: 13.8 g/dL, CRP: 48 mg/L. Post-Op (Day 4) TLC: 8,200/cu mm, CRP: 8 mg/L. Histopathology: Gangrenous acute appendicitis (Specimen Biopsy #HP-2026-441).',
      dischargeMeds: [
        { name: 'Tab. Cefuroxime Axetil 500mg', dose: '1 Tab BD after food x 5 Days', notes: 'Antibiotic' },
        { name: 'Tab. Metronidazole 400mg', dose: '1 Tab TDS after food x 5 Days', notes: 'Anaerobic coverage' },
        { name: 'Tab. Aceclofenac 100mg + Paracetamol 325mg', dose: '1 Tab BD x 3 Days', notes: 'Analgesic' },
        { name: 'Tab. Pantoprazole 40mg', dose: '1 Tab OD before breakfast x 7 Days', notes: 'Gastroprotection' }
      ],
      dischargeAdvice: '1. Keep port sites clean and dry. Normal sponge bath allowed.\n2. High protein, soft fiber diet with 2.5L water intake.\n3. Avoid heavy lifting (>5 kg) or strenuous exercise for 3 weeks.\n4. Follow-up on 06 Sep 2026 (Day 7) in OPD Chamber 1 for suture removal & Histopathology review.',
      redFlags: 'Immediate ER visit if: Fever > 100.5°F, persistent vomiting, severe abdominal distension, or bleeding/purulent discharge from port sites.',
      claimBreakdown: {
        roomRent: 15000,
        otSurgeonFee: 45000,
        pharmacyConsumables: 12500,
        diagnosticsLab: 6500,
        totalClaim: 79000,
        preAuthApproved: 75000,
        copayPatient: 4000,
        approvalProbability: 98.6
      }
    },
    CHF: {
      patientName: 'Shanti Devi',
      ageGender: '68y / Female',
      ipdNumber: 'IPD-2026-8814',
      uhid: 'UHID-2026-9042',
      admissionDate: '23 Aug 2026, 02:15 AM',
      dischargeDate: '30 Aug 2026, 02:30 PM',
      attendingDoctor: 'Dr. Sarah Jenkins, MD, DM (Cardiology)',
      department: 'Department of Cardiology & CCU',
      wardBed: 'Cardiac Care Unit (CCU Bed 03) -> Step-down 302',
      tpaPayer: 'HDFC ERGO Health Insurance (Policy: HDFC-MED-88412)',
      finalDiagnosis: 'Acute Decompensated Congestive Heart Failure (NYHA Class III) with Essential Hypertension (ICD-10: I50.9, I10)',
      surgeryPerformed: 'Medical Stabilization, IV Diuresis & Non-Invasive Positive Pressure Ventilation (CPAP)',
      clinicalCourse: '68-year-old female admitted in acute orthopnea, bilateral lower limb anasarca, elevated JVP, and pulmonary rales. Baseline NT-proBNP 4,800 pg/mL, 2D Echo revealed LVEF 38% with Grade II diastolic dysfunction. Treated with IV Furosemide infusion, low-dose ACEi, and SGLT2 inhibitor. Over 7 days, diuresis achieved with net negative 4.2L fluid balance. Weight reduced by 3.8 kg. Dyspnea resolved (NYHA Class I). Vital stability achieved with BP 124/78 mmHg.',
      investigations: 'NT-proBNP pre: 4,800 -> discharge: 950 pg/mL. Serum Creatinine: 1.1 mg/dL, K+: 4.3 mEq/L. Echo: LVEF 40%.',
      dischargeMeds: [
        { name: 'Tab. Sacubitril 24mg + Valsartan 26mg (ARNI)', dose: '1 Tab BD x 30 Days', notes: 'Heart Failure Step-up' },
        { name: 'Tab. Empagliflozin 10mg', dose: '1 Tab OD morning x 30 Days', notes: 'SGLT2i' },
        { name: 'Tab. Torsemide 10mg + Spironolactone 25mg', dose: '1 Tab OD morning x 30 Days', notes: 'Diuretic' }
      ],
      dischargeAdvice: '1. Strict fluid restriction (<1.5 L/day) and low salt diet (<2g sodium/day).\n2. Maintain daily morning weight chart before breakfast.\n3. Cardiology OPD follow-up in 14 days with Serum Electrolytes & Renal Function Test.',
      redFlags: 'Report immediately if: Sudden weight gain >1.5 kg in 2 days, nocturnal orthopnea, or ankle swelling.',
      claimBreakdown: {
        roomRent: 28000,
        otSurgeonFee: 18000,
        pharmacyConsumables: 24500,
        diagnosticsLab: 14500,
        totalClaim: 85000,
        preAuthApproved: 85000,
        copayPatient: 0,
        approvalProbability: 99.2
      }
    },
    PEDIATRIC: {
      patientName: 'Master Aarav Patel',
      ageGender: '6y / Male',
      ipdNumber: 'IPD-2026-8818',
      uhid: 'UHID-2026-9045',
      admissionDate: '26 Aug 2026, 09:00 AM',
      dischargeDate: '30 Aug 2026, 12:00 PM',
      attendingDoctor: 'Dr. Marcus Vance, MD (Pediatrics)',
      department: 'Department of Pediatric Medicine',
      wardBed: 'Pediatric Ward 108 (Bed 04)',
      tpaPayer: 'ICICI Lombard GIC (Policy: ICICI-FAM-99120)',
      finalDiagnosis: 'Right Lobar Bronchopneumonia with Moderate Dehydration (ICD-10: J18.0, E86.0)',
      surgeryPerformed: 'Pediatric IV Antibiotic Therapy & Nebulization Support',
      clinicalCourse: '6-year-old child admitted with high-grade spiking fever, tachypnea (RR 44/min), subcostal retractions, and poor oral intake. Chest X-Ray confirmed right mid-zone consolidation. Treated with IV Ceftriaxone, Salbutamol/Ipratropium nebulization, and IV Isolyte-P. Respiratory distress resolved by Day 3. Child active, afebrile for 48 hours, taking full oral feeds.',
      investigations: 'X-Ray Chest: Right mid-zone consolidation improving. Blood Culture: Sterile after 48h. TLC: 14,200 -> 7,400.',
      dischargeMeds: [
        { name: 'Syp. Amoxicillin + Clavulanic Acid (228.5mg/5ml)', dose: '5ml BD x 5 Days', notes: 'Oral antibiotic' },
        { name: 'Syp. Paracetamol 250mg/5ml', dose: '5ml SOS for fever > 100°F', notes: 'Antipyretic' }
      ],
      dischargeAdvice: '1. Complete full 5-day course of antibiotic suspension.\n2. Adequate oral hydration, warm soups, and fruit juices.\n3. Pediatric OPD follow-up in 5 days for clinical review.',
      redFlags: 'Immediate visit if: Rapid breathing, chest indrawing, lethargy, or refusing feeds.',
      claimBreakdown: {
        roomRent: 12000,
        otSurgeonFee: 8000,
        pharmacyConsumables: 9500,
        diagnosticsLab: 5500,
        totalClaim: 35000,
        preAuthApproved: 35000,
        copayPatient: 0,
        approvalProbability: 99.5
      }
    }
  };

  const current = casesData[selectedCase];

  const handleCaseChange = (c: typeof selectedCase) => {
    setSelectedCase(c);
    setIsSigned(false);
  };

  const handleWhatsApp = () => {
    setWhatsAppSent(true);
    setTimeout(() => setWhatsAppSent(false), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              AI Discharge Summary & TPA Insurance Claim Generator
            </h2>
            <Badge variant="primary">NABH 5th Ed & IRDAI Compliant</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Automatically synthesizes 5-day IPD surgical/nursing notes, lab trajectories & generates formal discharge summaries & TPA claim packets.
          </p>
        </div>

        {/* Global Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            style={{ fontWeight: 700 }}
          >
            🖨️ Print Summary (PDF)
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleWhatsApp}
            style={{ fontWeight: 800 }}
          >
            {whatsAppSent ? '✓ Summary Sent on WhatsApp!' : '📲 Send to WhatsApp'}
          </Button>
        </div>
      </div>

      {/* Case Selector & Sub-Tab Bar */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Cases */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Select Inpatient Case:
          </span>
          <button
            onClick={() => handleCaseChange('APPENDICITIS')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'APPENDICITIS' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'APPENDICITIS' ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'APPENDICITIS' ? '#E9D5FF' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🔪 1. Lap Appendectomy (Day 1-5 Stay)
          </button>
          <button
            onClick={() => handleCaseChange('CHF')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'CHF' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'CHF' ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'CHF' ? '#BAE6FD' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🫀 2. Heart Failure (Day 1-7 CCU/Ward)
          </button>
          <button
            onClick={() => handleCaseChange('PEDIATRIC')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'PEDIATRIC' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'PEDIATRIC' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'PEDIATRIC' ? '#A7F3D0' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            👶 3. Pediatric Pneumonia (Day 1-4)
          </button>
        </div>

        {/* View Switcher: Discharge Summary vs Insurance Claim */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveSubTab('DISCHARGE_SUMMARY')}
            style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: activeSubTab === 'DISCHARGE_SUMMARY' ? '#8B5CF6' : 'rgba(30, 41, 59, 0.6)', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
          >
            📋 Official Discharge Summary
          </button>
          <button
            onClick={() => setActiveSubTab('INSURANCE_CLAIM')}
            style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: activeSubTab === 'INSURANCE_CLAIM' ? '#06B6D4' : 'rgba(30, 41, 59, 0.6)', color: activeSubTab === 'INSURANCE_CLAIM' ? '#070C16' : '#E2E8F0', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
          >
            🛡️ TPA Insurance Pre-Auth & Claim Package
          </button>
        </div>
      </div>

      {activeSubTab === 'DISCHARGE_SUMMARY' ? (
        /* Document: Official NABH Inpatient Discharge Summary */
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          {/* Document Header */}
          <div style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>APEX MULTI-SPECIALTY HOSPITAL & RESEARCH INSTITUTE</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>NABH 5th Edition Accredited • ROHINI ID: 89124401 • GSTIN: 07AAAAA0000A1Z5</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#8B5CF6', marginTop: '4px' }}>CLINICAL INPATIENT DISCHARGE SUMMARY</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>{current.ipdNumber}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>UHID: {current.uhid}</div>
              <Badge variant="success">Discharge Status: Normalized & Stable</Badge>
            </div>
          </div>

          {/* Patient & Admission Demographics Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px', fontSize: '0.8125rem' }}>
            <div><span style={{ color: '#94A3B8' }}>Patient:</span> <strong style={{ color: '#F8FAFC' }}>{current.patientName} ({current.ageGender})</strong></div>
            <div><span style={{ color: '#94A3B8' }}>Admitted:</span> <strong style={{ color: '#CBD5E1' }}>{current.admissionDate}</strong></div>
            <div><span style={{ color: '#94A3B8' }}>Discharged:</span> <strong style={{ color: '#CBD5E1' }}>{current.dischargeDate}</strong></div>
            <div><span style={{ color: '#94A3B8' }}>Ward / Bed:</span> <strong style={{ color: '#38BDF8' }}>{current.wardBed}</strong></div>
            <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#94A3B8' }}>Attending Consultant:</span> <strong style={{ color: '#A7F3D0' }}>{current.attendingDoctor}</strong></div>
            <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#94A3B8' }}>Insurance Payer:</span> <strong style={{ color: '#FDE68A' }}>{current.tpaPayer}</strong></div>
          </div>

          {/* Final Diagnosis & Surgery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
            <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '12px 16px', borderRadius: '8px' }}>
              <strong style={{ color: '#E9D5FF', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>Final Clinical Diagnosis:</strong>
              <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.9375rem' }}>{current.finalDiagnosis}</div>
            </div>

            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.4)', padding: '12px 16px', borderRadius: '8px' }}>
              <strong style={{ color: '#BAE6FD', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>Procedure / Surgery Performed:</strong>
              <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.9375rem' }}>{current.surgeryPerformed}</div>
            </div>
          </div>

          {/* Clinical Course in Hospital */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '14px', borderRadius: '10px', fontSize: '0.8125rem' }}>
            <strong style={{ color: '#38BDF8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Brief Clinical Course in Hospital:</strong>
            <p style={{ color: '#CBD5E1', lineHeight: '1.6', margin: 0 }}>{current.clinicalCourse}</p>
          </div>

          {/* Investigations Trajectory */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '14px', borderRadius: '10px', fontSize: '0.8125rem' }}>
            <strong style={{ color: '#10B981', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Significant Lab & Imaging Trajectory:</strong>
            <p style={{ color: '#CBD5E1', lineHeight: '1.6', margin: 0 }}>{current.investigations}</p>
          </div>

          {/* Take-Home Discharge Prescription */}
          <div>
            <strong style={{ color: '#10B981', display: 'block', fontSize: '0.8125rem', textTransform: 'uppercase', marginBottom: '8px' }}>Discharge Medications (Take-Home Rx):</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {current.dischargeMeds.map((med, idx) => (
                <div key={idx} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <div>
                    <strong style={{ color: '#10B981' }}>{med.name}</strong>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{med.notes}</div>
                  </div>
                  <Badge variant="neutral">{med.dose}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Advice & Red Flags */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', fontSize: '0.8125rem' }}>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px' }}>
              <strong style={{ color: '#FCD34D', display: 'block', marginBottom: '4px' }}>Follow-Up & Care Advice:</strong>
              <div style={{ color: '#CBD5E1', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{current.dischargeAdvice}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px' }}>
              <strong style={{ color: '#FCA5A5', display: 'block', marginBottom: '4px' }}>🚨 Danger Signs (Emergency SOS):</strong>
              <div style={{ color: '#FECDD3', lineHeight: '1.5' }}>{current.redFlags}</div>
            </div>
          </div>

          {/* Electronic Signature */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Electronically Generated & Certified under IT Act 2000</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>SHA-256 Hash: 9f8a8412e08bca91... • Immutable Record</div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsSigned(true)}
              style={{ fontWeight: 800, backgroundColor: isSigned ? '#10B981' : '#8B5CF6', borderColor: isSigned ? '#10B981' : '#8B5CF6' }}
            >
              {isSigned ? '✓ Senior Consultant Digitally Signed & Locked' : '✍️ Attending Consultant Digital Signature'}
            </Button>
          </div>
        </div>
      ) : (
        /* TPA Insurance Claim Package View */
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          {/* Claim Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                TPA Pre-Authorization & Final Claim Dossier
              </span>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Payer: <strong>{current.tpaPayer}</strong> • IPD: {current.ipdNumber}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6875rem', color: '#A7F3D0', fontWeight: 700 }}>AI CLAIM APPROVAL PROBABILITY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>{current.claimBreakdown.approvalProbability}% (Low Rejection Risk)</div>
            </div>
          </div>

          {/* Medical Necessity Justification Letter */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '10px', fontSize: '0.8125rem', lineHeight: '1.6' }}>
            <strong style={{ color: '#38BDF8', display: 'block', fontSize: '0.8125rem', textTransform: 'uppercase', marginBottom: '6px' }}>
              IRDAI Medical Necessity Justification Certificate:
            </strong>
            <p style={{ color: '#CBD5E1', margin: 0 }}>
              This is to certify that patient <strong>{current.patientName}</strong> ({current.ageGender}) required continuous inpatient medical care & surgical intervention from {current.admissionDate} to {current.dischargeDate}. Outpatient / Daycare management was contraindicated due to severity of clinical presentation, risk of perforation/septic shock, and requirement for parenteral antibiotics and post-operative hemodynamic monitoring. The hospitalization was medically necessary under standard clinical practice guidelines.
            </p>
          </div>

          {/* Itemized Claim Financial Breakdown */}
          <div>
            <strong style={{ color: '#06B6D4', display: 'block', fontSize: '0.8125rem', textTransform: 'uppercase', marginBottom: '8px' }}>
              Itemized Claim Expense Audit:
            </strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Room & Nursing:</span>
                <strong style={{ color: '#F8FAFC', fontSize: '1.125rem' }}>₹{current.claimBreakdown.roomRent.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>OT & Surgeon Charges:</span>
                <strong style={{ color: '#F8FAFC', fontSize: '1.125rem' }}>₹{current.claimBreakdown.otSurgeonFee.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Pharmacy & Implants:</span>
                <strong style={{ color: '#F8FAFC', fontSize: '1.125rem' }}>₹{current.claimBreakdown.pharmacyConsumables.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Diagnostic Tests:</span>
                <strong style={{ color: '#F8FAFC', fontSize: '1.125rem' }}>₹{current.claimBreakdown.diagnosticsLab.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Total Claim Bar */}
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '10px', padding: '14px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>Total Claim Amount Submitted:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                  ₹{current.claimBreakdown.totalClaim.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8125rem', color: '#A7F3D0' }}>Pre-Auth Approved Limit:</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
                  ₹{current.claimBreakdown.preAuthApproved.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Action to Submit Claim */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
            <Button variant="outline" size="md">
              📁 Download Complete Claim ZIP Dossier
            </Button>
            <Button variant="primary" size="md" style={{ fontWeight: 800 }}>
              🚀 Transmit Claim Package to TPA Gateway
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
