import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface OutreachLogItem {
  id: string;
  partnerName: string;
  contactPerson: string;
  channel: 'EXECUTIVE_CALL' | 'WHATSAPP_DISPATCH' | 'EMAIL_BROADCAST' | 'QBR_MEETING' | 'ONBOARDING_TRAINING';
  subject: string;
  summary: string;
  timestamp: string;
  loggedBy: string;
  status: 'COMPLETED' | 'SCHEDULED' | 'FOLLOWUP_REQUIRED';
}

const loadDynamicLogs = (): OutreachLogItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('docsearch_outreach_logs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const regPartners = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
    if (Array.isArray(regPartners) && regPartners.length > 0) {
      return regPartners.map((p: any, idx: number) => ({
        id: `OUT-${100 + idx + 1}`,
        partnerName: p.facilityName || p.name || 'Healthcare Facility',
        contactPerson: p.name || 'Facility Administrator',
        channel: 'WHATSAPP_DISPATCH' as OutreachLogItem['channel'],
        subject: 'Platform Welcome & Portal Access Instructions',
        summary: 'Dispatched automated welcome credentials and platform quickstart guide to partner mobile.',
        timestamp: 'Live Active',
        loggedBy: 'DocSearch Automated Dispatcher',
        status: 'COMPLETED' as OutreachLogItem['status']
      }));
    }
    return [];
  } catch {
    return [];
  }
};

export const PartnerOutreachHubView: React.FC = () => {
  const [logs, setLogs] = useState<OutreachLogItem[]>(loadDynamicLogs);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form State
  const [partnerName, setPartnerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [channel, setChannel] = useState<OutreachLogItem['channel']>('EXECUTIVE_CALL');
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<OutreachLogItem['status']>('COMPLETED');

  const saveLogs = (updated: OutreachLogItem[]) => {
    setLogs(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_outreach_logs', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;

    const newLog: OutreachLogItem = {
      id: `OUT-${Math.floor(100 + Math.random() * 900)}`,
      partnerName: partnerName.trim(),
      contactPerson: contactPerson.trim() || 'Facility Contact',
      channel,
      subject: subject.trim() || 'Executive Discussion',
      summary: summary.trim() || 'Interaction completed successfully.',
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      loggedBy: 'Super Admin HQ Operator',
      status
    };

    saveLogs([newLog, ...logs]);
    setIsLogModalOpen(false);
    setPartnerName('');
    setContactPerson('');
    setSubject('');
    setSummary('');
    setSuccessBanner(`Outreach record logged for "${newLog.partnerName}" successfully!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const completedCount = logs.filter((l) => l.status === 'COMPLETED').length;
  const pendingCount = logs.filter((l) => l.status === 'FOLLOWUP_REQUIRED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              📞 Partner Outreach & Executive Communication Hub
            </h2>
            <Badge variant="success">Active Touchpoints</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Log hospital director interactions, dispatch WhatsApp alerts, and track Quarterly Business Reviews (QBR)
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsLogModalOpen(true)}>
          + Log New Interaction / Call
        </Button>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL TOUCHPOINTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{logs.length} Engagements</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>COMPLETED ENGAGEMENTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{completedCount} Touchpoints</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>FOLLOW-UPS PENDING</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
            {pendingCount} Action Items
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PARTNER CSAT SCORE</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>5.0 / 5.0</div>
        </div>
      </div>

      {/* Logs Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel & Ref</TableHead>
                <TableHead>Partner & Contact</TableHead>
                <TableHead>Subject & Discussion Summary</TableHead>
                <TableHead>Logged By</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--ds-color-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2rem' }}>📞</span>
                      <span style={{ fontWeight: 700, color: '#F8FAFC' }}>No Outreach Logs Recorded</span>
                      <span style={{ fontSize: '0.8125rem' }}>Click "+ Log New Interaction / Call" above to record calls, meetings or WhatsApp dispatches.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Badge variant={l.channel === 'QBR_MEETING' ? 'primary' : l.channel === 'WHATSAPP_DISPATCH' ? 'success' : 'neutral'}>
                        {l.channel.replace(/_/g, ' ')}
                      </Badge>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>{l.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{l.partnerName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{l.contactPerson}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '380px' }}>
                      <strong style={{ color: '#38BDF8', fontSize: '0.8125rem' }}>{l.subject}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', lineHeight: '1.4' }}>
                        {l.summary}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>{l.loggedBy}</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{l.timestamp}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'COMPLETED' ? 'success' : l.status === 'FOLLOWUP_REQUIRED' ? 'warning' : 'neutral'}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Log Interaction Modal */}
      {isLogModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
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
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
                📞 Log Partner Interaction & Call Notes
              </h3>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.125rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLog} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PARTNER FACILITY *</label>
                  <input
                    type="text"
                    required
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>CONTACT EXECUTIVE *</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>COMMUNICATION CHANNEL</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="EXECUTIVE_CALL">Executive Phone Call</option>
                    <option value="WHATSAPP_DISPATCH">WhatsApp Official Dispatch</option>
                    <option value="QBR_MEETING">Quarterly Business Review (QBR)</option>
                    <option value="EMAIL_BROADCAST">Executive Email</option>
                    <option value="ONBOARDING_TRAINING">Onboarding / Training Session</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>FOLLOW-UP STATUS</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="FOLLOWUP_REQUIRED">Follow-Up Required</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>MEETING / CALL SUBJECT *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>EXECUTIVE SUMMARY & ACTION ITEMS *</label>
                <textarea
                  required
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                >
                  💾 Save Communication Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
