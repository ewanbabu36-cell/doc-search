import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface BreakGlassSession {
  id: string;
  doctorName: string;
  department: string;
  patientName: string;
  patientUhid: string;
  emergencyJustification: string;
  grantedAt: string;
  expiresIn: string;
  status: 'ACTIVE_EMERGENCY' | 'EXPIRED' | 'REVOKED';
  cisoAlertSent: boolean;
}

const INITIAL_SESSIONS: BreakGlassSession[] = [
  {
    id: 'BG-801',
    doctorName: 'Dr. Anand Joshi (Lead Trauma Surgeon)',
    department: 'Critical Care & Trauma ICU',
    patientName: 'Sunil Kumar',
    patientUhid: 'UHID-2026-9011',
    emergencyJustification: 'Severe polytrauma road accident case; unconscious patient requiring immediate neurosurgery access without consent OTP.',
    grantedAt: '2026-09-01 10:15 AM',
    expiresIn: '2h 45m remaining',
    status: 'ACTIVE_EMERGENCY',
    cisoAlertSent: true
  },
  {
    id: 'BG-800',
    doctorName: 'Dr. Priya Desai (Cardiothoracic Surgeon)',
    department: 'Emergency Coronary Care Unit',
    patientName: 'Geeta Devi',
    patientUhid: 'UHID-2026-8742',
    emergencyJustification: 'Acute STEMI cardiac arrest in ER bay; immediate stent history retrieval needed.',
    grantedAt: '2026-08-31 08:30 PM',
    expiresIn: 'Expired',
    status: 'EXPIRED',
    cisoAlertSent: true
  }
];

export const EmergencyBreakGlassProtocolView: React.FC = () => {
  const [sessions, setSessions] = useState<BreakGlassSession[]>(INITIAL_SESSIONS);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form State
  const [docName, setDocName] = useState('Dr. Rajesh Verma (On-Duty Emergency HOD)');
  const [dept, setDept] = useState('Accident & Emergency');
  const [patName, setPatName] = useState('Aakash Mehra');
  const [patUhid, setPatUhid] = useState('UHID-2026-9140');
  const [justification, setJustification] = useState('Severe respiratory distress with anaphylactic shock; prompt steroid/allergy history check.');

  const handleGrantAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const created: BreakGlassSession = {
      id: `BG-${Math.floor(800 + Math.random() * 200)}`,
      doctorName: docName,
      department: dept,
      patientName: patName,
      patientUhid: patUhid,
      emergencyJustification: justification,
      grantedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresIn: '4h 00m remaining',
      status: 'ACTIVE_EMERGENCY',
      cisoAlertSent: true
    };
    setSessions([created, ...sessions]);
    setIsGrantModalOpen(false);
    setSuccessBanner(`Emergency Break-Glass Access GRANTED for ${patName} (${patUhid}). High-priority CISO Audit Alert dispatched!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleRevoke = (id: string, patUhid: string) => {
    setSessions(sessions.map((s) => (s.id === id ? { ...s, status: 'REVOKED', expiresIn: 'Terminated by CISO' } : s)));
    setSuccessBanner(`Break-Glass Override ${id} for ${patUhid} has been immediately terminated & sealed!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🚨 Emergency Break-Glass ICU Override Protocol
            </h2>
            <Badge variant="danger">Audit Monitored</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Strict clinical emergency override bypassing OTP consent during life-threatening ICU situations with automatic 4-hour timeout
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsGrantModalOpen(true)} style={{ backgroundColor: '#EF4444', color: '#FFF', fontWeight: 800 }}>
          🚨 Authorize Emergency Break-Glass
        </Button>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.875rem', fontWeight: 700 }}>
          {successBanner}
        </div>
      )}

      {/* Protocol Summary Card */}
      <Card title="Emergency Protocol Safeguards & Regulatory Compliance" padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', fontSize: '0.8125rem' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <span style={{ color: '#F8FAFC', fontWeight: 800, display: 'block', marginBottom: '4px' }}>⏱️ 4-Hour Strict Auto-Expiry</span>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Access privileges automatically revoke 240 minutes post authorization without human intervention.</span>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <span style={{ color: '#F8FAFC', fontWeight: 800, display: 'block', marginBottom: '4px' }}>📢 Real-Time CISO & DPO Broadcast</span>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>High-severity SMS and webhook triggers fired to the Hospital Data Protection Officer.</span>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <span style={{ color: '#F8FAFC', fontWeight: 800, display: 'block', marginBottom: '4px' }}>🔒 Forensic Audit Immutability</span>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Every record viewed, prescription printed, or note edited is digitally watermarked with emergency badge.</span>
          </div>
        </div>
      </Card>

      {/* Active Sessions Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Override Ref</TableHead>
                <TableHead>Authorizing Doctor & Dept</TableHead>
                <TableHead>Patient UHID</TableHead>
                <TableHead>Clinical Justification</TableHead>
                <TableHead>Granted Time</TableHead>
                <TableHead>Status & Time Left</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <strong style={{ fontFamily: 'monospace', color: '#EF4444' }}>{s.id}</strong>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.doctorName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{s.department}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{s.patientName}</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#38BDF8' }}>{s.patientUhid}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '320px', display: 'block' }}>
                      {s.emergencyJustification}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{s.grantedAt}</span>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Badge variant={s.status === 'ACTIVE_EMERGENCY' ? 'danger' : 'neutral'}>
                        {s.status}
                      </Badge>
                      <span style={{ fontSize: '0.6875rem', color: s.status === 'ACTIVE_EMERGENCY' ? '#FCA5A5' : '#94A3B8' }}>
                        {s.expiresIn}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {s.status === 'ACTIVE_EMERGENCY' ? (
                      <Button variant="outline" size="sm" onClick={() => handleRevoke(s.id, s.patientUhid)}>
                        🛑 Terminate Access
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Closed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Grant Modal */}
      {isGrantModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            border: '2px solid #EF4444',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: '0 25px 70px rgba(239,68,68,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🚨</span>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#EF4444' }}>
                  Authorize Break-Glass Emergency EMR Access
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGrantModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.125rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#FCA5A5', marginBottom: '14px' }}>
              ⚠️ <strong>REGULATORY WARNING:</strong> Break-Glass authorization is strictly reserved for emergency medical resuscitation where patient consent cannot be obtained. Misuse is logged to the Medical Council audit trail.
            </div>

            <form onSubmit={handleGrantAccess} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PATIENT FULL NAME *</label>
                  <input
                    type="text"
                    required
                    value={patName}
                    onChange={(e) => setPatName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PATIENT UHID / MRN *</label>
                  <input
                    type="text"
                    required
                    value={patUhid}
                    onChange={(e) => setPatUhid(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>AUTHORIZING CLINICIAN *</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>EMERGENCY WARD *</label>
                  <input
                    type="text"
                    required
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>CLINICAL REASON & EMERGENCY JUSTIFICATION *</label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 900, cursor: 'pointer' }}
                >
                  🚨 Grant 4-Hour Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
