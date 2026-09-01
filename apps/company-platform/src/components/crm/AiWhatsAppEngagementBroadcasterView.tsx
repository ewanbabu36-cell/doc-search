import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface WhatsAppBroadcast {
  campaignId: string;
  campaignTitle: string;
  targetAudience: string;
  templateType: 'APPOINTMENT_REMINDER' | 'RX_REFILL_ALERT' | 'LAB_REPORT_READY' | 'VACCINATION_DRIVE';
  messagesSent: number;
  deliveryRate: string;
  openRate: string;
  status: 'SENT_ACTIVE' | 'SCHEDULED';
  sentTime: string;
}

const INITIAL_CAMPAIGNS: WhatsAppBroadcast[] = [
  {
    campaignId: 'WA-CAMP-101',
    campaignTitle: 'Morning OPD Consultation 1-Hour Reminder & Token Alert',
    targetAudience: 'Today Booked OPD Patients (842 Patients)',
    templateType: 'APPOINTMENT_REMINDER',
    messagesSent: 842,
    deliveryRate: '99.4%',
    openRate: '96.2%',
    status: 'SENT_ACTIVE',
    sentTime: 'Today, 07:30 AM'
  },
  {
    campaignId: 'WA-CAMP-102',
    campaignTitle: 'NABL Certified Diagnostic Blood & Biochemistry Report Ready',
    targetAudience: 'Discharged / Lab Sample Done (412 Patients)',
    templateType: 'LAB_REPORT_READY',
    messagesSent: 412,
    deliveryRate: '100.0%',
    openRate: '98.5%',
    status: 'SENT_ACTIVE',
    sentTime: 'Today, 10:15 AM'
  },
  {
    campaignId: 'WA-CAMP-103',
    campaignTitle: 'Chronic Hypertension & Diabetes Monthly Medication Refill Reminder',
    targetAudience: 'Chronic Care Registry (1,290 Patients)',
    templateType: 'RX_REFILL_ALERT',
    messagesSent: 1290,
    deliveryRate: '98.8%',
    openRate: '92.4%',
    status: 'SENT_ACTIVE',
    sentTime: 'Yesterday'
  }
];

export const AiWhatsAppEngagementBroadcasterView: React.FC = () => {
  const [campaigns] = useState<WhatsAppBroadcast[]>(INITIAL_CAMPAIGNS);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  const handleTriggerBroadcast = (cId: string) => {
    setBroadcastNotice(`✓ WhatsApp Campaign "${cId}" successfully dispatched via Meta WhatsApp Business Cloud API!`);
    setTimeout(() => setBroadcastNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            💬 AI WhatsApp Omnichannel Healthcare Engagement Broadcaster
          </h2>
          <Badge variant="success">● Meta WhatsApp Business Cloud API Connected</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Automated multi-lingual patient engagement: OPD token alerts, digital Rx delivery, lab report PDFs, and chronic disease refill reminders
        </p>
      </div>

      {broadcastNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {broadcastNotice}
        </div>
      )}

      {/* Engagement Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL WHATSAPP ENGAGEMENTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>1,48,200 Msgs</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Average 98.2% Open Rate</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>OPD NO-SHOW REDUCTION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>- 34.2% Drop</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Automated token reminder alerts</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>RX REFILL CONVERSIONS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>68.4% Refills</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>1-Click WhatsApp pharmacy reorder</span>
        </div>
      </div>

      {/* Broadcast Campaigns Table */}
      <Card title="📜 Active WhatsApp Healthcare Broadcast Campaigns" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Title</TableHead>
                <TableHead>Template Type</TableHead>
                <TableHead>Target Cohort</TableHead>
                <TableHead>Sent / Delivered</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.campaignId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.campaignTitle}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{c.sentTime}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.templateType === 'APPOINTMENT_REMINDER' ? 'primary' : 'neutral'}>
                      {c.templateType.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {c.targetAudience}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>
                    {c.messagesSent} ({c.deliveryRate})
                  </TableCell>
                  <TableCell style={{ color: '#10B981', fontWeight: 800 }}>
                    {c.openRate}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleTriggerBroadcast(c.campaignId)}
                      style={{ backgroundColor: '#25D366', color: '#070C16', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      💬 Resend Broadcast
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
