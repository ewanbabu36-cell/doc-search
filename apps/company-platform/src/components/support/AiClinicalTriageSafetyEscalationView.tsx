import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface TriageTicket {
  id: string;
  patientName: string;
  ticketSubject: string;
  detectedEmergencyKeywords: string[];
  severityLevel: 'P1_CRITICAL_EMERGENCY' | 'P2_HIGH_URGENCY' | 'P3_NORMAL';
  aiRecommendation: string;
  status: 'ESCALATED_ER_DISPATCH' | 'MONITORING';
  loggedAt: string;
}

const INITIAL_TRIAGE_TICKETS: TriageTicket[] = [
  {
    id: 'TRG-EMERG-01',
    patientName: 'Kishore Sengupta (Age 58)',
    ticketSubject: 'Doctor delayed by 40 mins, feeling severe sudden crushing chest pain and left arm numbness',
    detectedEmergencyKeywords: ['crushing chest pain', 'left arm numbness', 'acute cardiac risk'],
    severityLevel: 'P1_CRITICAL_EMERGENCY',
    aiRecommendation: 'Immediate 108 Ambulance Dispatch + Alert On-Duty Saket ER Resuscitation Bay',
    status: 'ESCALATED_ER_DISPATCH',
    loggedAt: '2 mins ago'
  },
  {
    id: 'TRG-EMERG-02',
    patientName: 'Baby Aarav (Age 2)',
    ticketSubject: 'High fever 104F after vaccination, breathing very fast and refusing liquids',
    detectedEmergencyKeywords: ['fever 104F', 'breathing fast', 'pediatric tachypnea'],
    severityLevel: 'P1_CRITICAL_EMERGENCY',
    aiRecommendation: 'Direct Pediatrician Emergency Hotline Voice Siren triggered',
    status: 'ESCALATED_ER_DISPATCH',
    loggedAt: '14 mins ago'
  },
  {
    id: 'TRG-EMERG-03',
    patientName: 'Shalini Mathur',
    ticketSubject: 'Prescription typo: Pharmacist says dosage is 10x higher than normal blood thinner',
    detectedEmergencyKeywords: ['dosage 10x', 'blood thinner overdose risk'],
    severityLevel: 'P2_HIGH_URGENCY',
    aiRecommendation: 'Pharmacy Dispense Lock Engaged; Doctor Callback Requested',
    status: 'MONITORING',
    loggedAt: '28 mins ago'
  }
];

export const AiClinicalTriageSafetyEscalationView: React.FC = () => {
  const [tickets] = useState<TriageTicket[]>(INITIAL_TRIAGE_TICKETS);
  const [escalateNotice, setEscalateNotice] = useState<string | null>(null);

  const handleDispatchErAlert = (t: TriageTicket) => {
    setEscalateNotice(`🚨 EMERGENCY ALERT BROADCAST: Hospital ER Hotline (+91 11 XXXXX) notified & Emergency Ambulance unit dispatched for "${t.patientName}"!`);
    setTimeout(() => setEscalateNotice(null), 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🚨 AI Clinical Triage & Emergency Patient Safety Escalation Bot
          </h2>
          <Badge variant="danger">● Real-Time Clinical Red-Flag Scanner Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Automated NLP clinical safety monitoring: detects cardiac, pediatric, and medication overdose emergencies in support tickets within 300ms
        </p>
      </div>

      {escalateNotice && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid #EF4444', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.875rem', fontWeight: 800 }}>
          {escalateNotice}
        </div>
      )}

      {/* Safety Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #EF4444', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>EMERGENCY DETECTION SPEED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>&lt; 0.4 Seconds</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Real-time NLP Medical Transformer</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>CLINICAL ESCALATIONS (24H)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>14 Critical Alerts</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% Doctor intervention response</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>MEDICATION SAFETY INTERCEPTIONS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>38 Prevented</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Dosage & contraindication blocks</span>
        </div>
      </div>

      {/* Triage Tickets Table */}
      <Card title="📜 Live Emergency Triage & Safety Alert Stream" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient & Reported Symptoms</TableHead>
                <TableHead>Detected Red-Flag Keywords</TableHead>
                <TableHead>Severity Level</TableHead>
                <TableHead>AI Clinical Safety Action</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Emergency Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{t.patientName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1', display: 'block', maxWidth: '320px', lineHeight: '1.4' }}>{t.ticketSubject}</span>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>{t.loggedAt}</span>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {t.detectedEmergencyKeywords.map((kw, i) => (
                        <span key={i} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', border: '1px solid #EF4444', borderRadius: '4px', padding: '2px 6px', fontSize: '0.6875rem', fontWeight: 700 }}>
                          ⚠️ {kw}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.severityLevel === 'P1_CRITICAL_EMERGENCY' ? 'danger' : 'warning'}>
                      {t.severityLevel.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#A7F3D0', maxWidth: '240px', fontWeight: 700 }}>
                    {t.aiRecommendation}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDispatchErAlert(t)}
                      style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)' }}
                    >
                      🚨 Dispatch ER Siren
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
