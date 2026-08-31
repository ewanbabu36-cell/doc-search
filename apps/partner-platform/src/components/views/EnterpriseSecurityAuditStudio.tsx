import React, { useState } from 'react';
import { Card, Button, Badge, Input, Select } from '@docsearch/ui-kit';

export interface BreakGlassEvent {
  id: string;
  patientName: string;
  patientMrn: string;
  overridingDoctor: string;
  reason: 'EMERGENCY_CRASH_CART' | 'UNCONSCIOUS_TRAUMA_ER' | 'CROSS_CONSULT_CALL' | 'ANESTHESIA_PRE_OP';
  overrideTimestamp: string;
  cisoAlertSent: boolean;
  status: 'ACTIVE_OVERRIDE' | 'AUDITED_AND_CLEARED';
}

export interface ThreatIncident {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  actorEmail: string;
  ipAddress: string;
  detectedAt: string;
  description: string;
  actionTaken: string;
  quarantined: boolean;
}

export interface HashAuditBlock {
  blockNumber: number;
  eventType: string;
  actor: string;
  resource: string;
  timestamp: string;
  previousHash: string;
  currentHash: string;
  tamperVerified: boolean;
}

export const EnterpriseSecurityAuditStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BREAK_GLASS' | 'THREAT_RADAR' | 'WORM_AUDIT' | 'RBAC_MATRIX'>('BREAK_GLASS');
  const [breakGlassDoctor, setBreakGlassDoctor] = useState('Dr. Arvind Mehta (Trauma ER On-Call)');
  const [breakGlassPatient, setBreakGlassPatient] = useState('Rahul Verma (MRN-84920 - Unconscious ER)');
  const [breakGlassReason, setBreakGlassReason] = useState<'EMERGENCY_CRASH_CART' | 'UNCONSCIOUS_TRAUMA_ER' | 'CROSS_CONSULT_CALL' | 'ANESTHESIA_PRE_OP'>('UNCONSCIOUS_TRAUMA_ER');
  const [isExecutingOverride, setIsExecutingOverride] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Break Glass Overrides list
  const [breakGlassLogs, setBreakGlassLogs] = useState<BreakGlassEvent[]>([
    {
      id: 'BG-2026-081',
      patientName: 'Sunita Sharma (MRN-10293)',
      patientMrn: 'MRN-10293',
      overridingDoctor: 'Dr. Priya Nair (ICU Intensivist)',
      reason: 'EMERGENCY_CRASH_CART',
      overrideTimestamp: 'Today, 04:12 AM',
      cisoAlertSent: true,
      status: 'AUDITED_AND_CLEARED'
    }
  ]);

  // Threat Radar incidents
  const [threatIncidents, setThreatIncidents] = useState<ThreatIncident[]>([
    {
      id: 'THR-902',
      severity: 'CRITICAL',
      title: 'Bulk Longitudinal EHR Export Attempt (140 Records)',
      actorEmail: 'contract.intern@docsearch.health',
      ipAddress: '192.168.1.184 (Unregistered IP)',
      detectedAt: 'Today, 02:44 AM',
      description: 'Attempted mass export of VIP patient oncology notes outside standard OPD operating hours.',
      actionTaken: 'Automated Account Lockout & Session Terminated',
      quarantined: true
    },
    {
      id: 'THR-901',
      severity: 'HIGH',
      title: 'Concurrent Logins from Disparate Geographies (Delhi & Mumbai)',
      actorEmail: 'cashier.lead@apex.health',
      ipAddress: '49.36.12.88 / 103.22.44.19',
      detectedAt: 'Yesterday, 07:18 PM',
      description: 'Same cashier credential authenticated simultaneously from two different ISPs within 4 minutes.',
      actionTaken: 'MFA Step-Up Challenge Enforced',
      quarantined: false
    }
  ]);

  // Cryptographic WORM Hash Chain Blocks
  const hashChain: HashAuditBlock[] = [
    {
      blockNumber: 4892,
      eventType: 'AUTH_SESSION_CREATED',
      actor: 'dr.vikram@docsearch.health',
      resource: 'Session/SES-9482',
      timestamp: '2026-08-31 09:12:04 UTC',
      previousHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      currentHash: '7a9f82d1c6e4b83019284756291a0f9e8d7c6b5a43210fe987654321fedcba09',
      tamperVerified: true
    },
    {
      blockNumber: 4893,
      eventType: 'CLINICAL_PRESCRIPTION_SIGNED',
      actor: 'dr.vikram@docsearch.health',
      resource: 'Rx/RX-2026-84920',
      timestamp: '2026-08-31 09:14:22 UTC',
      previousHash: '7a9f82d1c6e4b83019284756291a0f9e8d7c6b5a43210fe987654321fedcba09',
      currentHash: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
      tamperVerified: true
    },
    {
      blockNumber: 4894,
      eventType: 'FINTECH_UPI_SPLIT_SETTLED',
      actor: 'cashier.pos@docsearch.health',
      resource: 'Payment/TXN-UPI-202608311029482',
      timestamp: '2026-08-31 09:16:45 UTC',
      previousHash: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
      currentHash: '8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
      tamperVerified: true
    }
  ];

  const handleExecuteBreakGlass = () => {
    setIsExecutingOverride(true);
    setTimeout(() => {
      const newOverride: BreakGlassEvent = {
        id: 'BG-2026-' + Math.floor(100 + Math.random() * 900),
        patientName: breakGlassPatient,
        patientMrn: 'MRN-84920',
        overridingDoctor: breakGlassDoctor,
        reason: breakGlassReason,
        overrideTimestamp: 'Just now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
        cisoAlertSent: true,
        status: 'ACTIVE_OVERRIDE'
      };

      setBreakGlassLogs([newOverride, ...breakGlassLogs]);
      setIsExecutingOverride(false);
      setSuccessBanner(`🚨 EMERGENCY BREAK-GLASS OVERRIDE ACTIVATED! Access unlocked for ${newOverride.patientName}. CISO & Medical Director alerted via high-priority SMS/Email.`);
      setTimeout(() => setSuccessBanner(null), 6000);
    }, 700);
  };

  const handleQuarantineThreat = (id: string) => {
    setThreatIncidents((prev) =>
      prev.map((t) => (t.id === id ? { ...t, quarantined: true, actionTaken: 'Quarantined & Tokens Revoked' } : t))
    );
    setSuccessBanner('Threat session instantly quarantined and token revoked from Redis/Memory session store.');
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <Card padding="md" style={{ border: '2px solid #EF4444', backgroundColor: '#0B132B', borderRadius: '16px' }}>
      
      {/* Studio Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.75rem' }}>🛡️</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                Enterprise Security, RBAC, Policy & Audit Command Vault
              </h3>
              <Badge variant="danger">Zero-Trust Clinical Core</Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Emergency Break-Glass Access, Real-Time Threat Radar, SHA-256 Immutable WORM Ledger & DPDPA 2023 Compliance
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="success">🔒 NABH & HIPAA Ready</Badge>
          <Badge variant="neutral">DPDPA 2023 Signed</Badge>
        </div>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1.5px solid #EF4444', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '16px' }}>
          {successBanner}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { id: 'BREAK_GLASS', label: '🚨 Emergency Break-Glass Override', badge: breakGlassLogs.length },
          { id: 'THREAT_RADAR', label: '🛰️ Zero-Trust Threat Radar', badge: threatIncidents.length },
          { id: 'WORM_AUDIT', label: '📜 Immutable SHA-256 WORM Ledger', badge: 'Verified' },
          { id: 'RBAC_MATRIX', label: '👥 Dynamic 12-Role RBAC Matrix', badge: '12 Roles' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            style={{
              backgroundColor: activeTab === t.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.5)',
              border: activeTab === t.id ? '1.5px solid #EF4444' : '1px solid rgba(255,255,255,0.06)',
              color: activeTab === t.id ? '#FCA5A5' : '#CBD5E1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{t.label}</span>
            <span style={{ fontSize: '0.625rem', backgroundColor: '#EF4444', color: '#FFF', padding: '1px 5px', borderRadius: '10px' }}>
              {t.badge}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: EMERGENCY BREAK-GLASS OVERRIDE */}
      {activeTab === 'BREAK_GLASS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#EF4444' }}>
                🚨 EMERGENCY CLINICAL BREAK-GLASS AUTHORIZATION (NABH / HIPAA COMPLIANT)
              </span>
              <Badge variant="danger">High-Priority Audit Logged</Badge>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.4 }}>
              Use ONLY in critical life-threatening situations where the primary treating doctor is unavailable (e.g. Unconscious Trauma ER, Cardiac Arrest in OT).
              Activating this immediately grants temporary 2-hour full record access and automatically files a permanent incident report with the CISO and Hospital Medical Superintendent.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>OVERRIDING PHYSICIAN / DOCTOR</label>
                <Input value={breakGlassDoctor} onChange={(e) => setBreakGlassDoctor(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>EMERGENCY PATIENT / MRN</label>
                <Input value={breakGlassPatient} onChange={(e) => setBreakGlassPatient(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>CRITICAL CLINICAL JUSTIFICATION</label>
                <Select
                  options={[
                    { label: 'Unconscious Patient in Trauma ER (Immediate Resuscitation)', value: 'UNCONSCIOUS_TRAUMA_ER' },
                    { label: 'Emergency Crash-Cart Resuscitation Code Blue', value: 'EMERGENCY_CRASH_CART' },
                    { label: 'Urgent Cross-Consultation during Active Surgery', value: 'CROSS_CONSULT_CALL' },
                    { label: 'Pre-Op Anesthesia Allergic History Screening', value: 'ANESTHESIA_PRE_OP' }
                  ]}
                  value={breakGlassReason}
                  onChange={(e) => setBreakGlassReason(e.target.value as any)}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isExecutingOverride}
              onClick={handleExecuteBreakGlass}
              style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFF', fontWeight: 900 }}
            >
              {isExecutingOverride ? '⚡ Authorizing Cryptographic Break-Glass Override...' : '🚨 Authorize Immediate Emergency Break-Glass Access'}
            </Button>
          </div>

          {/* Break Glass Audit History */}
          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              📜 Break-Glass Access Audit History (Permanent Non-Deletable Ledger):
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {breakGlassLogs.map((bg) => (
                <div key={bg.id} style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#EF4444' }}>{bg.id}</strong>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC' }}>{bg.patientName}</span>
                      <Badge variant="danger">{bg.reason.replace(/_/g, ' ')}</Badge>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '3px', display: 'block' }}>
                      Authorized By: <strong>{bg.overridingDoctor}</strong> • {bg.overrideTimestamp}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>✓ CISO Alert Pushed</span>
                    <Badge variant="success">{bg.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZERO-TRUST THREAT RADAR */}
      {activeTab === 'THREAT_RADAR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              🛰️ Live Suspicious Access & Exfiltration Radar:
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Zero-Trust Anomaly Detector Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {threatIncidents.map((t) => (
              <div key={t.id} style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: t.severity === 'CRITICAL' ? '1.5px solid #EF4444' : '1.5px solid #F59E0B', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant={t.severity === 'CRITICAL' ? 'danger' : 'warning'}>{t.severity}</Badge>
                    <strong style={{ fontSize: '0.8125rem', color: '#F8FAFC' }}>{t.title}</strong>
                  </div>
                  <p style={{ margin: '4px 0 2px', fontSize: '0.75rem', color: '#CBD5E1' }}>{t.description}</p>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                    Actor: <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{t.actorEmail}</span> • IP: {t.ipAddress} • {t.detectedAt}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', color: t.quarantined ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                    {t.actionTaken}
                  </span>
                  {!t.quarantined && (
                    <Button type="button" variant="primary" size="sm" onClick={() => handleQuarantineThreat(t.id)} style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFF', fontWeight: 800 }}>
                      ⚡ Quarantine Session
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: IMMUTABLE WORM HASH LEDGER */}
      {activeTab === 'WORM_AUDIT' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>
              📜 Immutable SHA-256 Chained Hash WORM Ledger:
            </span>
            <Badge variant="success">✓ Zero Tamper Verified (100% Chain Integrity)</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px' }}>Block #</th>
                  <th style={{ padding: '8px 10px' }}>Event Type</th>
                  <th style={{ padding: '8px 10px' }}>Actor</th>
                  <th style={{ padding: '8px 10px' }}>Resource Target</th>
                  <th style={{ padding: '8px 10px' }}>Cryptographic Hash (SHA-256)</th>
                  <th style={{ padding: '8px 10px' }}>Integrity</th>
                </tr>
              </thead>
              <tbody>
                {hashChain.map((b) => (
                  <tr key={b.blockNumber} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 900, color: '#38BDF8' }}>#{b.blockNumber}</td>
                    <td style={{ padding: '8px 10px', color: '#F8FAFC', fontWeight: 700 }}>{b.eventType}</td>
                    <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{b.actor}</td>
                    <td style={{ padding: '8px 10px', color: '#CBD5E1' }}>{b.resource}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#A78BFA', fontSize: '0.6875rem' }}>
                      {b.currentHash.substring(0, 18)}...{b.currentHash.substring(56)}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ color: '#10B981', fontWeight: 800 }}>✓ VALID</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RBAC MATRIX */}
      {activeTab === 'RBAC_MATRIX' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              👥 Dynamic 12-Role Healthcare RBAC & Sensitive Masking Matrix:
            </span>
            <Badge variant="primary">DPDPA 2023 Scoped</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Healthcare Role</th>
                  <th style={{ padding: '8px 10px' }}>OPD / EMR</th>
                  <th style={{ padding: '8px 10px' }}>IPD Wards</th>
                  <th style={{ padding: '8px 10px' }}>Pharmacy POS</th>
                  <th style={{ padding: '8px 10px' }}>Pathology LIMS</th>
                  <th style={{ padding: '8px 10px' }}>Radiology PACS</th>
                  <th style={{ padding: '8px 10px' }}>TPA Claims</th>
                  <th style={{ padding: '8px 10px' }}>Sensitive Masking</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { role: '🩺 CLINIC_DOCTOR', opd: 'Full', ipd: 'Read', pharm: 'Rx Write', lab: 'Order', rad: 'Order', claims: 'None', mask: 'Unmasked' },
                  { role: '🏥 HOSPITAL_DIRECTOR', opd: 'Full', ipd: 'Full', pharm: 'Audit', lab: 'Audit', rad: 'Audit', claims: 'Approve', mask: 'Unmasked' },
                  { role: '💊 PHARMACIST', opd: 'Rx Read', ipd: 'Med Read', pharm: 'Full POS', lab: 'None', rad: 'None', claims: 'Bill Link', mask: 'Psych/HIV Masked' },
                  { role: '🧪 PATHOLOGIST', opd: 'Lab View', ipd: 'Lab View', pharm: 'None', lab: 'Full LIMS', rad: 'None', claims: 'None', mask: 'Sample Scoped' },
                  { role: '🔬 RADIOLOGIST', opd: 'Rad View', ipd: 'Rad View', pharm: 'None', lab: 'None', rad: 'Full PACS', claims: 'None', mask: 'Imaging Scoped' },
                  { role: '💳 CASHIER_POS', opd: 'Token Fee', ipd: 'Discharge Bill', pharm: 'Counter POS', lab: 'Lab Fee', rad: 'Scan Fee', claims: 'Receipt', mask: 'Clinical Notes Masked' }
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 800, color: '#F8FAFC' }}>{row.role}</td>
                    <td style={{ padding: '8px 10px', color: '#10B981' }}>{row.opd}</td>
                    <td style={{ padding: '8px 10px', color: '#38BDF8' }}>{row.ipd}</td>
                    <td style={{ padding: '8px 10px', color: '#FCD34D' }}>{row.pharm}</td>
                    <td style={{ padding: '8px 10px', color: '#A78BFA' }}>{row.lab}</td>
                    <td style={{ padding: '8px 10px', color: '#F472B6' }}>{row.rad}</td>
                    <td style={{ padding: '8px 10px', color: '#6EE7B7' }}>{row.claims}</td>
                    <td style={{ padding: '8px 10px', color: '#CBD5E1', fontStyle: 'italic' }}>{row.mask}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </Card>
  );
};
