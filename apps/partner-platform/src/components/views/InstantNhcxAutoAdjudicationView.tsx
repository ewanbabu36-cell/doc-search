import React, { useState, useEffect } from 'react';
import { Button } from '@docsearch/ui-kit';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface NhcxDischargeCase {
  id: string;
  patientName: string;
  ageGender: string;
  uhid: string;
  ipdNumber: string;
  admissionDate: string;
  dischargeDate: string;
  roomBed: string;
  attendingDoctor: string;
  payerName: string;
  tpaName: string;
  policyNumber: string;
  sumInsured: number;
  initialPreAuthApproved: number;
  totalHospitalBill: number;
  primaryDiagnosis: string;
  icd10Code: string;
  procedurePerformed: string;
  snomedCode: string;
  soapSummary: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  pharmacySummary: {
    totalPharmacyBill: number;
    payableDrugs: number;
    gipsaNonPayableConsumables: number;
    reconciledStatus: 'PERFECT_MATCH' | 'QUERIES_RESOLVED';
  };
  coverageAudit: {
    roomRentCappingLimit: number;
    actualRoomRentPerDay: number;
    cappingViolation: boolean;
    investigationsCovered: boolean;
    implantBarcodesVerified: boolean;
  };
}

const getDefaultDoctor = (): string => {
  const p = getUnifiedPartnerProfile();
  return p.doctorName ? `${p.doctorName}, ${p.doctorDegree || 'MS (General Surgery)'}` : 'Lead Attending Clinician';
};

const SAMPLE_DISCHARGE_CASES: NhcxDischargeCase[] = [
  {
    id: 'CASE-APPENDICITIS-01',
    patientName: 'Rahul Verma',
    ageGender: '38y / Male',
    uhid: 'UHID-2026-9041',
    ipdNumber: 'IPD-2026-8812',
    admissionDate: '25 Aug 2026, 11:30 PM',
    dischargeDate: 'Today (30 mins ago)',
    roomBed: 'Post-Op Ward 204 (Bed 02)',
    attendingDoctor: getDefaultDoctor(),
    payerName: 'Star Health & Allied Insurance Co Ltd',
    tpaName: 'In-House TPA Star Health',
    policyNumber: 'SH-POL-8492019',
    sumInsured: 500000,
    initialPreAuthApproved: 75000,
    totalHospitalBill: 79000,
    primaryDiagnosis: 'Acute Gangrenous Appendicitis with Localized Peritonitis',
    icd10Code: 'K35.80',
    procedurePerformed: 'Emergency Laparoscopic Appendectomy under GA',
    snomedCode: '47562',
    soapSummary: {
      subjective: '38M presented to ER with acute right iliac fossa pain, severe guarding and fever. Day 4 post-op: Pain score 1/10, flatus passed, soft diet tolerated.',
      objective: 'Afebrile, BP 122/78, PR 76/min. Surgical port sites clean & healthy, no erythema or discharge. Post-op TLC 8,200/cu mm (normalized from 16,800).',
      assessment: 'Acute gangrenous appendicitis, post-laparoscopic appendectomy day 4, clinically stable for safe discharge.',
      plan: 'Discharge with oral Cefuroxime 500mg BD x 5 days + Metronidazole 400mg TDS. OPD review on Day 7 for suture removal.'
    },
    pharmacySummary: {
      totalPharmacyBill: 12500,
      payableDrugs: 11300,
      gipsaNonPayableConsumables: 1200,
      reconciledStatus: 'PERFECT_MATCH'
    },
    coverageAudit: {
      roomRentCappingLimit: 5000,
      actualRoomRentPerDay: 3500,
      cappingViolation: false,
      investigationsCovered: true,
      implantBarcodesVerified: true
    }
  },
  {
    id: 'CASE-CARDIAC-02',
    patientName: 'Ramesh Kumar',
    ageGender: '56y / Male',
    uhid: 'UHID-2026-CARD-091',
    ipdNumber: 'IPD-2026-8815',
    admissionDate: '24 Aug 2026, 04:15 AM',
    dischargeDate: 'Today (45 mins ago)',
    roomBed: 'Cardiac Recovery Ward 301 (Bed 01)',
    attendingDoctor: 'Dr. Sarah Jenkins, MD, DM (Cardiology)',
    payerName: 'HDFC ERGO General Insurance Co',
    tpaName: 'Medi Assist Insurance TPA Pvt Ltd',
    policyNumber: 'HDFC-MED-88412',
    sumInsured: 1000000,
    initialPreAuthApproved: 160000,
    totalHospitalBill: 185000,
    primaryDiagnosis: 'Acute Coronary Syndrome - Anterior Wall STEMI',
    icd10Code: 'I21.0',
    procedurePerformed: 'Primary PTCA with Drug-Eluting Stent (DES) to Mid LAD',
    snomedCode: '02703ZZ',
    soapSummary: {
      subjective: '56M presented in ER with central retrosternal crushing chest pain and diaphoresis. Post-PTCA Day 3: Asymptomatic, ambulating comfortably.',
      objective: 'BP 124/80 mmHg, PR 72/min regular, SpO2 99% on room air. Right femoral puncture site soft, no hematoma, distal pulses palpable.',
      assessment: 'AWMI post-primary PTCA with DES to LAD, TIMI-3 flow achieved, hemodynamically stable.',
      plan: 'Discharge on Dual Antiplatelet Therapy (DAPT): Ticagrelor 90mg BD + Aspirin 75mg OD + Atorvastatin 40mg + Metoprolol 25mg.'
    },
    pharmacySummary: {
      totalPharmacyBill: 42000,
      payableDrugs: 39800,
      gipsaNonPayableConsumables: 2200,
      reconciledStatus: 'PERFECT_MATCH'
    },
    coverageAudit: {
      roomRentCappingLimit: 10000,
      actualRoomRentPerDay: 7000,
      cappingViolation: false,
      investigationsCovered: true,
      implantBarcodesVerified: true
    }
  },
  {
    id: 'CASE-PMJAY-03',
    patientName: 'Mukesh Yadav',
    ageGender: '45y / Male',
    uhid: 'UHID-2026-AYUSH-104',
    ipdNumber: 'IPD-2026-8819',
    admissionDate: '26 Aug 2026, 08:30 AM',
    dischargeDate: 'Today (15 mins ago)',
    roomBed: 'General Surgical Ward 102 (Bed 05)',
    attendingDoctor: getDefaultDoctor(),
    payerName: 'Ayushman Bharat - PM-JAY (State Health Agency)',
    tpaName: 'TMS 2.0 National Health Authority',
    policyNumber: 'AB-PMJAY-DEL-99201',
    sumInsured: 500000,
    initialPreAuthApproved: 42000,
    totalHospitalBill: 42000,
    primaryDiagnosis: 'Symptomatic Cholelithiasis with Chronic Cholecystitis',
    icd10Code: 'K80.10',
    procedurePerformed: 'Laparoscopic Cholecystectomy (HBP 2.2 Package)',
    snomedCode: '47562-CHOL',
    soapSummary: {
      subjective: '45M admitted for elective laparoscopic cholecystectomy for multiple gallstones. Day 2 post-op: Normal oral intake, no abdominal distension.',
      objective: 'Stable vitals, soft abdomen, subcostal port clean. Pre-op ultrasound showing thick-walled GB with stones verified.',
      assessment: 'Chronic cholecystitis post-lap cholecystectomy, fully recovered under PM-JAY cashless package.',
      plan: 'PM-JAY 100% cashless discharge. Discharge medication kit handed over to patient with 14-day supply.'
    },
    pharmacySummary: {
      totalPharmacyBill: 6800,
      payableDrugs: 6800,
      gipsaNonPayableConsumables: 0,
      reconciledStatus: 'PERFECT_MATCH'
    },
    coverageAudit: {
      roomRentCappingLimit: 3000,
      actualRoomRentPerDay: 1500,
      cappingViolation: false,
      investigationsCovered: true,
      implantBarcodesVerified: true
    }
  }
];

export const InstantNhcxAutoAdjudicationView: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-APPENDICITIS-01');

  // Persistent Settled Claims Record
  const [settledClaimsHistory, setSettledClaimsHistory] = useState<Record<string, {
    nhcxClaimId: string;
    approvedAmount: number;
    copayAmount: number;
    deductionAmount: number;
    adjudicationDurationSec: number;
    approvalAuthCode: string;
    settledAt: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('nhcx_settled_claims');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('nhcx_settled_claims', JSON.stringify(settledClaimsHistory));
    } catch {}
  }, [settledClaimsHistory]);

  // Adjudication Simulation States
  const [isAdjudicating, setIsAdjudicating] = useState(false);
  const [adjudicationPhase, setAdjudicationPhase] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSettled, setIsSettled] = useState(false);
  const [settlementDetails, setSettlementDetails] = useState<{
    nhcxClaimId: string;
    approvedAmount: number;
    copayAmount: number;
    deductionAmount: number;
    adjudicationDurationSec: number;
    approvalAuthCode: string;
  } | null>(null);

  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [activeGatePassModal, setActiveGatePassModal] = useState(false);

  const activeCase = SAMPLE_DISCHARGE_CASES.find((c) => c.id === selectedCaseId) || SAMPLE_DISCHARGE_CASES[0]!;

  // Restore or reset state when case changes
  useEffect(() => {
    setIsAdjudicating(false);
    setAdjudicationPhase(0);
    setElapsedSeconds(0);
    const existing = settledClaimsHistory[selectedCaseId];
    if (existing) {
      setIsSettled(true);
      setSettlementDetails(existing);
    } else {
      setIsSettled(false);
      setSettlementDetails(null);
    }
  }, [selectedCaseId, settledClaimsHistory]);

  // Live Adjudication Runner
  const handlePushToNhcx = () => {
    setIsAdjudicating(true);
    setAdjudicationPhase(1);
    setElapsedSeconds(0);
    setIsSettled(false);

    // Timer tick
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.5).toFixed(1));
    }, 500);

    // Phase 1: Schematron & FHIR R4 Bundle Validation
    setTimeout(() => {
      setAdjudicationPhase(2);
    }, 2500);

    // Phase 2: TPA Auto-Adjudication Engine Rules Execution
    setTimeout(() => {
      setAdjudicationPhase(3);
    }, 5200);

    // Phase 3: Final Settlement Sanction Generated
    setTimeout(() => {
      clearInterval(timerInterval);
      setIsAdjudicating(false);
      setIsSettled(true);

      const copay = activeCase.pharmacySummary.gipsaNonPayableConsumables;
      const approved = activeCase.totalHospitalBill - copay;

      const details = {
        nhcxClaimId: `NHCX-${new Date().getFullYear()}-CLAIM-${Math.floor(100000 + Math.random() * 900000)}`,
        approvedAmount: approved,
        copayAmount: copay,
        deductionAmount: 0,
        adjudicationDurationSec: 8.4,
        approvalAuthCode: `AUTH-STAMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        settledAt: new Date().toLocaleTimeString()
      };
      setSettlementDetails(details);
      setSettledClaimsHistory((prev) => ({ ...prev, [activeCase.id]: details }));

      setNotificationToast(`⚡ NHCX Zero-Wait Settlement Sanctioned in 8.4s! TPA Approved: ₹${approved.toLocaleString('en-IN')}`);
      setTimeout(() => setNotificationToast(null), 8000);
    }, 8400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
          border: '1.5px solid #00F2FE',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(0, 242, 254, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00F2FE, #4FACFE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.5)'
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
                Instant TPA / NHCX Auto-Adjudication Engine (Zero-Wait Discharge)
              </h2>
              <span
                style={{
                  backgroundColor: 'rgba(0, 242, 254, 0.2)',
                  color: '#00F2FE',
                  border: '1px solid #00F2FE',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                ABDM NHCX 2.0 NATIONAL GATEWAY
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#BAE6FD', fontSize: '0.8125rem' }}>
              Solving the 4-6 hour discharge wait: Auto-reconciles Clinical SOAP notes, ICD-10 codes, and Pharmacy bills for 10-second zero-rejection TPA settlement.
            </p>
          </div>
        </div>

        {/* Case Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8125rem', color: '#BAE6FD', fontWeight: 600 }}>Active Discharge Case:</span>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #00F2FE',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '8px 14px',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {SAMPLE_DISCHARGE_CASES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.patientName} ({c.ipdNumber}) · {c.payerName.slice(0, 22)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Persistent Toast Notification */}
      {notificationToast && (
        <div
          style={{
            backgroundColor: '#064E3B',
            border: '1.5px solid #10B981',
            color: '#A7F3D0',
            padding: '12px 18px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 700,
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚡</span>
            <span>{notificationToast}</span>
          </div>
          <button
            onClick={() => setNotificationToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Patient Dossier & TPA Header */}
      <div
        style={{
          backgroundColor: '#0B132B',
          border: '1px solid #1E293B',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>PATIENT & BED</span>
          <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.9375rem' }}>
            {activeCase.patientName} ({activeCase.ageGender})
          </span>
          <span style={{ fontSize: '0.75rem', color: '#38BDF8', display: 'block', marginTop: '2px' }}>
            {activeCase.roomBed} · {activeCase.ipdNumber}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>PRIMARY DIAGNOSIS & ICD-10</span>
          <span style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.875rem' }}>
            {activeCase.primaryDiagnosis}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#A78BFA', display: 'block', marginTop: '2px', fontWeight: 700 }}>
            ICD-10: {activeCase.icd10Code} · SNOMED: {activeCase.snomedCode}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>INSURANCE / TPA PAYER</span>
          <span style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.875rem' }}>
            {activeCase.payerName}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6EE7B7', display: 'block', marginTop: '2px' }}>
            Policy: {activeCase.policyNumber} (TPA: {activeCase.tpaName})
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>FINANCIAL BILL SUMMARY</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
              ₹{activeCase.totalHospitalBill.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
              (Pre-Auth ₹{activeCase.initialPreAuthApproved.toLocaleString('en-IN')})
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
            Patient Co-pay (GIPSA Non-payables): ₹{activeCase.pharmacySummary.gipsaNonPayableConsumables}
          </span>
        </div>
      </div>

      {/* Core Grid: Left = 4-Pillar Multi-Source Auto-Reconciliation | Right = ABDM NHCX Live Push & Gate Pass */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(340px, 1fr)', gap: '20px' }}>
        {/* Left Column: 4-Pillar Reconciliation Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pillar 1: Clinical SOAP Notes */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🩺</span> Pillar 1: Clinical SOAP & Surgical Discharge Notes
              </span>
              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#7DD3FC', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 }}>
                ✓ RECONCILED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', fontWeight: 700, display: 'block' }}>Subjective Clinical Presentation:</span>
                <span style={{ color: '#CBD5E1', marginTop: '4px', display: 'block', lineHeight: '1.4' }}>
                  {activeCase.soapSummary.subjective}
                </span>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', fontWeight: 700, display: 'block' }}>Objective Post-Op Vitals & Exam:</span>
                <span style={{ color: '#CBD5E1', marginTop: '4px', display: 'block', lineHeight: '1.4' }}>
                  {activeCase.soapSummary.objective}
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <span style={{ color: '#94A3B8', fontWeight: 700 }}>Discharge Assessment & Medication Plan:</span>
              <span style={{ color: '#E2E8F0', marginTop: '2px', display: 'block', lineHeight: '1.4' }}>
                {activeCase.soapSummary.plan}
              </span>
            </div>
          </div>

          {/* Pillar 2: ICD-10 & Procedure Coding Validation */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#A78BFA', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📑</span> Pillar 2: Diagnostic & Procedure Coding Alignment
              </span>
              <span style={{ backgroundColor: 'rgba(167, 139, 250, 0.15)', color: '#C4B5FD', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 }}>
                ✓ ZERO MISMATCH
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Primary ICD-10 Diagnostic Code:</span>
                <span style={{ color: '#A78BFA', fontWeight: 800, fontSize: '0.9375rem', marginTop: '2px', display: 'block' }}>
                  {activeCase.icd10Code}
                </span>
                <span style={{ color: '#CBD5E1', fontSize: '0.6875rem' }}>{activeCase.primaryDiagnosis}</span>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Procedure SNOMED / CPT Code:</span>
                <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.9375rem', marginTop: '2px', display: 'block' }}>
                  {activeCase.snomedCode}
                </span>
                <span style={{ color: '#CBD5E1', fontSize: '0.6875rem' }}>{activeCase.procedurePerformed}</span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Pharmacy & Consumables Ledger Auto-Scrubbing */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#10B981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💊</span> Pillar 3: Pharmacy & GIPSA Non-Medical Ledger Auto-Scrubbing
              </span>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#6EE7B7', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 }}>
                ✓ GIPSA AUTO-SEGREGATED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Total Pharmacy Bill:</span>
                <span style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1rem', marginTop: '2px', display: 'block' }}>
                  ₹{activeCase.pharmacySummary.totalPharmacyBill.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Payable Drugs (100% Covered):</span>
                <span style={{ color: '#10B981', fontWeight: 800, fontSize: '1rem', marginTop: '2px', display: 'block' }}>
                  ₹{activeCase.pharmacySummary.payableDrugs.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Non-Payable (Gloves/Kit):</span>
                <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '1rem', marginTop: '2px', display: 'block' }}>
                  ₹{activeCase.pharmacySummary.gipsaNonPayableConsumables.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
              Zero-Rejection Guarantee: Non-payables automatically segregated into patient payment slip, preventing TPA claim rejection.
            </span>
          </div>

          {/* Pillar 4: TPA Coverage & Room Rent Capping */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏢</span> Pillar 4: TPA Coverage & Room Rent Capping Rules
              </span>
              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 }}>
                ✓ NO PROPORTIONATE DEDUCTION
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Room Rent Tariff Standard:</span>
                <span style={{ color: '#F8FAFC', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                  ₹{activeCase.coverageAudit.actualRoomRentPerDay}/day (Policy Cap: ₹{activeCase.coverageAudit.roomRentCappingLimit}/day)
                </span>
                <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.6875rem' }}>✓ Within 1% Sum Insured Cap</span>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                <span style={{ color: '#94A3B8', display: 'block' }}>Implant & OT Biopsy Verification:</span>
                <span style={{ color: '#10B981', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                  ✓ Barcodes & Specimen Biopsies Verified
                </span>
                <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>Matches pre-authorization schedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: ABDM NHCX Gateway Live Push & Instant Gate Pass */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Card: Push to ABDM NHCX */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: isSettled ? '2px solid #10B981' : isAdjudicating ? '2px solid #00F2FE' : '2px solid #38BDF8',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: isSettled ? '0 0 30px rgba(16, 185, 129, 0.3)' : '0 8px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>NATIONAL CLAIMS EXCHANGE</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', color: '#F8FAFC', fontWeight: 800 }}>
                  ABDM NHCX Live Auto-Adjudication
                </h3>
              </div>
              <span
                style={{
                  backgroundColor: isSettled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: isSettled ? '#6EE7B7' : '#38BDF8',
                  border: isSettled ? '1px solid #10B981' : '1px solid #38BDF8',
                  padding: '3px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                {isSettled ? 'SANCTION ISSUED' : isAdjudicating ? 'TRANSMITTING...' : 'READY FOR PUSH'}
              </span>
            </div>

            {/* Zero-Rejection Readiness Box */}
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>AI PRE-AUDIT SCORE</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981' }}>
                  100% Zero-Rejection Ready
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#6EE7B7' }}>
                  All 4 clinical & tariff pillars verified against {activeCase.tpaName}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>ESTIMATED ADJUDICATION</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00F2FE' }}>
                  &lt; 10 Seconds
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#EF4444', textDecoration: 'line-through' }}>
                  (Manual Wait: 4 - 6 Hours)
                </span>
              </div>
            </div>

            {/* Live Progress Bar during Adjudication */}
            {isAdjudicating && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 242, 254, 0.08)',
                  border: '1.5px solid #00F2FE',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700 }}>
                  <span style={{ color: '#00F2FE' }}>
                    {adjudicationPhase === 1 && 'Phase 1: Validating FHIR R4 Claim Bundle against ABDM Schematron...'}
                    {adjudicationPhase === 2 && `Phase 2: ${activeCase.tpaName} Real-Time Rule Engine Evaluation...`}
                    {adjudicationPhase === 3 && 'Phase 3: Generating Final Pre-Auth Settlement Sanction Letter...'}
                  </span>
                  <span style={{ color: '#F8FAFC' }}>{elapsedSeconds}s</span>
                </div>

                <div style={{ height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: adjudicationPhase === 1 ? '35%' : adjudicationPhase === 2 ? '75%' : '95%',
                      backgroundColor: '#00F2FE',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Final Settlement Result Box */}
            {isSettled && settlementDetails && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1.5px solid #10B981',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#34D399', fontSize: '0.875rem' }}>
                    ✓ SETTLEMENT SANCTION LETTER ISSUED
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 700 }}>
                    Clearance Time: {settlementDetails.adjudicationDurationSec}s!
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>TPA APPROVED SANCTION:</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                      ₹{settlementDetails.approvedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>PATIENT CO-PAY DUES:</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
                      ₹{settlementDetails.copayAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                  NHCX Claim ID: <strong style={{ color: '#00F2FE' }}>{settlementDetails.nhcxClaimId}</strong> · Auth Code: <strong style={{ color: '#A78BFA' }}>{settlementDetails.approvalAuthCode}</strong>
                </div>
              </div>
            )}

            {/* Action Trigger Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!isSettled ? (
                <Button
                  variant="primary"
                  onClick={handlePushToNhcx}
                  disabled={isAdjudicating}
                  style={{
                    backgroundColor: '#0284C7',
                    borderColor: '#0284C7',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    padding: '12px',
                    fontSize: '0.9375rem',
                    boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)',
                    cursor: isAdjudicating ? 'wait' : 'pointer'
                  }}
                >
                  {isAdjudicating ? `⚡ Adjudicating via NHCX (${elapsedSeconds}s)...` : '⚡ Push Claim to ABDM NHCX Gateway (Instant Auto-Adjudicate)'}
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    onClick={() => setActiveGatePassModal(true)}
                    style={{
                      flex: 1,
                      backgroundColor: '#10B981',
                      borderColor: '#059669',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      padding: '10px',
                      fontSize: '0.875rem',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    🎫 View Digital Gate Pass
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotificationToast(`📲 Official Gate Pass & Sanction Letter dispatched to ${activeCase.patientName} on WhatsApp!`);
                    }}
                    style={{
                      flex: 1,
                      borderColor: '#25D366',
                      color: '#25D366',
                      fontWeight: 800,
                      padding: '10px',
                      fontSize: '0.875rem'
                    }}
                  >
                    📲 WhatsApp to Patient
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotificationToast(`🛏️ Bed ${activeCase.roomBed} released in IPD ADT. Housekeeping notified!`);
                    }}
                    style={{
                      flex: 1,
                      borderColor: '#38BDF8',
                      color: '#38BDF8',
                      fontWeight: 800,
                      padding: '10px',
                      fontSize: '0.875rem'
                    }}
                  >
                    🛏️ Release Bed to Housekeeping
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* FHIR Bundle Live Code Preview */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.8125rem' }}>
                ABDM NHCX FHIR R4 Bundle Payload Preview
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>JSON-LD / encrypted</span>
            </div>

            <pre
              style={{
                backgroundColor: '#020617',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.6875rem',
                color: '#38BDF8',
                overflowX: 'auto',
                margin: 0,
                maxHeight: '140px'
              }}
            >
{`{
  "resourceType": "Bundle",
  "type": "collection",
  "identifier": { "system": "https://nrces.in/nhcx", "value": "NHCX-2026-CLAIM" },
  "entry": [
    { "resourceType": "Claim", "use": "claim", "status": "active", "total": ${activeCase.totalHospitalBill} },
    { "resourceType": "Condition", "code": { "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "${activeCase.icd10Code}" }] } },
    { "resourceType": "Procedure", "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "${activeCase.snomedCode}" }] } }
  ]
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Digital Discharge Gate Pass Modal */}
      {activeGatePassModal && settlementDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #10B981',
              borderRadius: '20px',
              maxWidth: '580px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Gate Pass Header */}
            <div
              style={{
                backgroundColor: '#059669',
                color: '#FFFFFF',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>🎫</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
                    ABDM NHCX DIGITAL DISCHARGE GATE PASS
                  </h3>
                  <span style={{ fontSize: '0.6875rem', opacity: 0.9 }}>
                    Zero-Wait TPA Auto-Adjudication Clearance · Verified
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveGatePassModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Gate Pass Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>PATIENT UHID & NAME</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {activeCase.patientName}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                    {activeCase.uhid} · {activeCase.ipdNumber}
                  </span>
                </div>

                {/* Simulated Visual QR Stamp */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '8px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '2px dashed #059669'
                  }}
                >
                  <div style={{ fontSize: '2rem', lineHeight: '1' }}>🏁</div>
                  <span style={{ fontSize: '0.5625rem', color: '#0F172A', fontWeight: 900, display: 'block', marginTop: '2px' }}>
                    GATE PASS OK
                  </span>
                </div>
              </div>

              {/* Settlement Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>TPA Cashless Sanction</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                    ₹{settlementDetails.approvedAmount.toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#6EE7B7' }}>100% Cashless Approved</span>
                </div>

                <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Patient Co-Pay Settled</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
                    ₹{settlementDetails.copayAmount.toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Non-medical consumables</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px', fontSize: '0.75rem', color: '#CBD5E1' }}>
                <div><strong>NHCX Tracking Reference:</strong> {settlementDetails.nhcxClaimId}</div>
                <div><strong>TPA Sanction Code:</strong> {settlementDetails.approvalAuthCode}</div>
                <div><strong>Bed Release Status:</strong> Bed {activeCase.roomBed} released to housekeeping</div>
              </div>

              <Button
                variant="primary"
                onClick={() => setActiveGatePassModal(false)}
                style={{ backgroundColor: '#059669', borderColor: '#059669', color: '#FFFFFF', fontWeight: 800, padding: '12px' }}
              >
                ✓ Close Gate Pass
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
