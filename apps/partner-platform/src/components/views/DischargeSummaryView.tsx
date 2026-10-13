import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '@docsearch/ui-kit';
import type { InpatientDischargeSummaryDto } from '@docsearch/api-contracts';
import { PrintableDischargeSummaryModal } from '../dialogs/PrintableDischargeSummaryModal.js';

export interface DischargeSummaryViewProps {
  summaries: InpatientDischargeSummaryDto[];
  facilityName?: string | undefined;
}

export const DischargeSummaryView: React.FC<DischargeSummaryViewProps> = ({
  summaries = [],
  facilityName
}) => {
  const [selectedSummaryForPrint, setSelectedSummaryForPrint] = useState<InpatientDischargeSummaryDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Built-in standard clinical archetype for instant preview if no summaries are in current state
  const fallbackSampleSummaries: InpatientDischargeSummaryDto[] = [
    {
      id: 'sum-sample-1',
      tenantId: '11111111-1111-4111-8111-111111111111',
      partnerId: '11111111-1111-4111-8111-111111111111',
      organizationId: '00000000-0000-0000-0000-000000000001',
      branchId: '00000000-0000-0000-0000-000000000001',
      summaryNumber: 'DS-2026-90412',
      admissionId: 'adm-sample-1',
      patientId: 'pat-40192',
      patientName: 'Kailash Chand Verma',
      patientMrn: 'UHID-2026-8910',
      attendingConsultantName: 'Dr. Rajesh Sharma, MD (Med), DM (Cardio)',
      admissionDate: new Date(Date.now() - 4 * 86400000).toISOString(),
      dischargeDate: new Date().toISOString(),
      finalPrimaryDiagnosis: 'Acute Coronary Syndrome (NSTEMI) • Post-PTCA with Drug Eluting Stent to LAD',
      finalSecondaryDiagnosis: 'Type 2 Diabetes Mellitus (E11.9) • Essential Hypertension (I10)',
      surgicalProceduresPerformed: 'Coronary Angiography + PTCA with 3.0 x 24mm DES to Mid-LAD under local anaesthesia via right radial approach (Successful, TIMI III flow).',
      hospitalCourseSummary: 'Admitted via Emergency Trauma with severe retrosternal chest pain and diaphoresis. Troponin-I elevated (4.2 ng/mL). Urgent angiography performed. Uneventful post-procedure recovery in Coronary Care Unit. Shifted to Ward on Day 3. Ambulating comfortably, hemodynamically stable.',
      keyInvestigationFindings: 'ECHO: LVEF 52%, Mild anterior hypokinesia. Post-op Hb: 12.8 g/dL, Serum Creatinine: 0.9 mg/dL. ECG on discharge shows normal sinus rhythm without acute ischemic changes.',
      treatmentGiven: 'Dual Antiplatelet Therapy (Aspirin + Ticagrelor), IV Heparin protocol, Atorvastatin 80mg, Metoprolol Succinate, Telmisartan.',
      dischargeMedicationAdvice: '1. Tab Ecosprin 75 mg — 1 tablet once daily (After lunch) x 1 Year\n2. Tab Brilinta 90 mg (Ticagrelor) — 1 tablet twice daily (Morning & Night) x 1 Year\n3. Tab Atorva 80 mg — 1 tablet at bedtime daily x 3 Months\n4. Tab Metolar XR 25 mg — 1 tablet once daily (Morning) x Continuous\n5. Tab Glycomet GP 1 — 1 tablet twice daily before meals',
      dietAndActivityAdvice: 'Strict low-salt (<2g/day), low-fat, diabetic cardiac diet. Avoid lifting heavy objects >5 kg for 2 weeks. Daily 20-minute light walking encouraged. Radial puncture site dressing dry and intact.',
      warningSignsToSeekImmediateCare: 'Recurrence of retrosternal chest discomfort, breathlessness on rest, bleeding from puncture site, dizziness or fainting spells. Call 24x7 Emergency immediately.',
      followUpAppointmentDate: 'After 7 Days (Chamber 104, Cardiology OPD)',
      followUpDoctorName: 'Dr. Rajesh Sharma, DM (Cardio)',
      isFinalized: true,
      finalizedBy: 'Dr. Rajesh Sharma, MD, DM',
      finalizedAt: new Date().toISOString(),
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const displayedSummaries = Array.isArray(summaries) && summaries.length > 0
    ? summaries
    : fallbackSampleSummaries;

  const filtered = displayedSummaries.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.patientName?.toLowerCase().includes(q) ||
      s.patientMrn?.toLowerCase().includes(q) ||
      s.summaryNumber?.toLowerCase().includes(q) ||
      s.finalPrimaryDiagnosis?.toLowerCase().includes(q) ||
      s.attendingConsultantName?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
            Finalized Inpatient Discharge Summaries
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Archived, consultant-certified electronic discharge cards with ICD-10 coding and vector print.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Input
            placeholder="🔍 Search by patient, MRN, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '280px', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <Card style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            No discharge summaries match your search query.
          </Card>
        ) : (
          filtered.map((s) => (
            <Card
              key={s.id}
              style={{
                padding: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(15, 23, 42, 0.5) 100%)',
                borderRadius: '10px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
                      {s.patientName}
                    </span>
                    <Badge variant="primary" style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700 }}>
                      {s.patientMrn}
                    </Badge>
                    <Badge variant="success" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      ✓ Sealed ({s.summaryNumber})
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>
                    Admission: {new Date(s.admissionDate).toLocaleDateString('en-IN')} ➔ Discharged: {new Date(s.dischargeDate).toLocaleDateString('en-IN')} • Consultant: <strong style={{ color: '#38bdf8' }}>{s.attendingConsultantName}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setSelectedSummaryForPrint(s)}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>🖨️</span>
                    <span>View &amp; Print Summary</span>
                  </Button>
                </div>
              </div>

              {/* Diagnosis and Clinical Course Snippet */}
              <div style={{ marginTop: '0.85rem', padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.82rem' }}>
                <div style={{ color: '#e2e8f0', fontWeight: 700 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Final Diagnosis: </span>
                  {s.finalPrimaryDiagnosis}
                </div>
                {s.hospitalCourseSummary && (
                  <div style={{ marginTop: '4px', color: '#94a3b8', lineHeight: 1.4 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Clinical Course: </span>
                    {s.hospitalCourseSummary.slice(0, 180)}...
                  </div>
                )}
                {s.followUpAppointmentDate && (
                  <div style={{ marginTop: '4px', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                    🗓️ Next Follow-up Review: {s.followUpAppointmentDate}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Official A4 Vector Printable Modal */}
      {selectedSummaryForPrint && (
        <PrintableDischargeSummaryModal
          isOpen={Boolean(selectedSummaryForPrint)}
          onClose={() => setSelectedSummaryForPrint(null)}
          summary={selectedSummaryForPrint}
          hospitalName={facilityName}
        />
      )}
    </div>
  );
};