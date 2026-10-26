import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Badge } from '@docsearch/ui-kit';
import type { InpatientAdmissionDto, InpatientWardDto, InpatientAdmissionRequestDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface NurseCallAlert {
  id: string;
  bedId: string;
  bedCode: string;
  wardName: string;
  patientName: string;
  patientMrn: string;
  reason: string;
  calledAt: string;
}

export interface NursingStationViewProps {
  admissions: InpatientAdmissionDto[];
  wards: InpatientWardDto[];
  onOpenNursingAssessment: (adm: InpatientAdmissionDto) => void;
  onOpenNursingNote: (adm: InpatientAdmissionDto) => void;
  onOpenCarePlan: (adm: InpatientAdmissionDto) => void;
  onOpenRecordVital: (adm: InpatientAdmissionDto) => void;
  onSelectAdmission: (id: string) => void;
  requests?: InpatientAdmissionRequestDto[];
  admissionRequests?: InpatientAdmissionRequestDto[];
  onAllocateBedRequest?: (req: InpatientAdmissionRequestDto) => void;
}

export const NursingStationView: React.FC<NursingStationViewProps> = ({
  admissions = [],
  wards = [],
  onOpenNursingAssessment,
  onOpenNursingNote,
  onOpenCarePlan,
  onOpenRecordVital,
  onSelectAdmission,
  requests = [],
  admissionRequests = [],
  onAllocateBedRequest
}) => {
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [activeNurseCalls, setActiveNurseCalls] = useState<NurseCallAlert[]>([]);

  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('NURSE_CALL_REQUESTED', (event) => {
      const p = ((event as any).data || (event as any).payload) as any;
      if (!p) return;
      const newAlert: NurseCallAlert = {
        id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bedId: String(p.bedId || ''),
        bedCode: String(p.bedCode || 'BED'),
        wardName: String(p.wardName || 'Inpatient Ward'),
        patientName: String(p.patientName || 'Inpatient'),
        patientMrn: String(p.patientMrn || 'MRN-IPD'),
        reason: String(p.reason || 'Assistance Requested'),
        calledAt: String(p.calledAt || new Date().toLocaleTimeString('en-IN'))
      };
      setActiveNurseCalls((prev) => [newAlert, ...prev]);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleDismissNurseCall = (id: string) => {
    setActiveNurseCalls((prev) => prev.filter((c) => c.id !== id));
  };

  const safeAdmissions = Array.isArray(admissions) ? admissions : [];
  const safeWards = Array.isArray(wards) ? wards : [];
  const rawRequests = (admissionRequests && admissionRequests.length > 0) ? admissionRequests : requests;
  const safeRequests = Array.isArray(rawRequests) ? rawRequests : [];
  const pendingRequests = safeRequests.filter(
    (r) => r && (String(r.status) === 'PENDING' || r.status === 'SUBMITTED' || r.status === 'BED_PENDING' || r.status === 'UNDER_REVIEW' || !r.status)
  );

  const filtered = safeAdmissions.filter((a) => a && (selectedWard === 'ALL' || a.wardId === selectedWard));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>Nursing Station Operational Workbench</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Shift handover, bedside vitals recording, and nursing care plan execution.</p>
        </div>
        <div style={{ width: '220px' }}>
          <Select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            options={[{ value: 'ALL', label: 'All Nursing Stations' }, ...safeWards.map((w) => ({ value: w?.id || '', label: w?.nursingStationName || 'Station' }))]}
          />
        </div>
      </div>

      {/* Active Bedside Nurse Call Bells */}
      {activeNurseCalls.length > 0 && (
        <div
          data-testid="nursing-active-call-bells-banner"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '2px solid rgba(245, 158, 11, 0.6)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🔔</span>
              <div>
                <strong style={{ fontSize: '1rem', color: '#F59E0B' }}>
                  Bedside Nurse Call Bells ({activeNurseCalls.length} Pending Attention)
                </strong>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                  Patients or bedside attendants triggered call bells via Bedside QR Concierge.
                </p>
              </div>
            </div>
            <span style={{ backgroundColor: '#F59E0B', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px' }}>
              BEDSIDE ASSISTANCE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {activeNurseCalls.map((call) => (
              <Card
                key={call.id}
                data-testid={`nurse-call-card-${call.id}`}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#FDE047', fontSize: '1rem' }}>Bed {call.bedCode}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>({call.wardName})</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>⏱️ {call.calledAt}</span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#E2E8F0' }}>
                  <strong>{call.patientName}</strong> <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>({call.patientMrn})</span>
                </div>

                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#FDE047' }}>
                  📢 <strong>Reason:</strong> {call.reason}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDismissNurseCall(call.id)}
                    style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFF' }}
                  >
                    ✓ Attended & Clear
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Stat Admission Orders from Doctor OPD Cockpit */}
      {pendingRequests.length > 0 && (
        <div
          data-testid="nursing-admission-requisitions-banner"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🚨</span>
              <div>
                <strong style={{ fontSize: '1rem', color: '#F87171' }}>
                  Active Inpatient Admission Orders ({pendingRequests.length} Pending Allocation)
                </strong>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                  Doctor OPD Cockpit has ordered admission. Allocate available ward beds in 1-click.
                </p>
              </div>
            </div>
            <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px' }}>
              STAT REQUISITION
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {pendingRequests.map((req) => (
              <Card
                key={req.id}
                data-testid={`nursing-admission-card-${req.id}`}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#F8FAFC' }}>
                    👤 {req.patientName || 'Emergency Patient'}
                  </strong>
                  <Badge variant={req.priority === 'EMERGENCY' ? 'danger' : 'warning'}>
                    {req.priority || 'EMERGENCY'}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  MRN/Token: <span style={{ color: '#38BDF8', fontWeight: 700 }}>{req.patientMrn || (req as any).tokenNumber || 'STAT'}</span>
                  {' • '}Target Ward: <strong style={{ color: '#E2E8F0' }}>{(req as any).targetWard || req.requestedWardType || 'ICU'}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '6px' }}>
                  <strong>Dx:</strong> {req.provisionalDiagnosis || 'Acute clinical indication requiring bed'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    data-testid={`nursing-allocate-btn-${req.id}`}
                    onClick={() => onAllocateBedRequest && onAllocateBedRequest(req)}
                    style={{
                      backgroundColor: '#10B981',
                      borderColor: '#10B981',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🛏️</span>
                    <span>Allocate Bed</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {filtered.map((adm) => (
          <Card key={adm.id} style={{ padding: '1rem', borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--ds-color-text-primary, #f8fafc)' }}>{adm.patientName}</strong>
              <Badge variant="neutral">Bed: {adm.bedCode}</Badge>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-muted, #94a3b8)' }}>{adm.patientMrn} • {adm.wardName}</div>
            <div style={{ fontSize: '0.85rem', margin: '0.5rem 0', color: 'var(--ds-color-text-secondary, #cbd5e1)' }}>
              <strong>Diagnosis:</strong> {adm.primaryDiagnosis}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <Button variant="primary" size="sm" onClick={() => onOpenRecordVital(adm)}>Chart Vitals</Button>
              <Button variant="outline" size="sm" onClick={() => onOpenNursingAssessment(adm)}>Assessment</Button>
              <Button variant="outline" size="sm" onClick={() => onOpenNursingNote(adm)}>Add Note</Button>
              <Button variant="outline" size="sm" onClick={() => onOpenCarePlan(adm)}>Care Plan</Button>
              <Button variant="outline" size="sm" onClick={() => onSelectAdmission(adm.id)}>Full Chart</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};