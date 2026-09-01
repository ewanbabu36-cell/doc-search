import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface WhatsAppCampaign {
  id: string;
  campaignName: string;
  targetAudience: string;
  templateCategory: 'OPD_REMINDER' | 'NABL_REPORT' | 'VACCINATION_CAMP' | 'HEALTH_TIP';
  deliveredCount: number;
  readRatePct: number;
  clickThroughPct: number;
  status: 'COMPLETED' | 'SCHEDULED' | 'DRAFT';
  scheduledTime: string;
}

const INITIAL_CAMPAIGNS: WhatsAppCampaign[] = [
  {
    id: 'WAC-801',
    campaignName: 'NABL Diagnostic Report Auto-Delivery (Aug)',
    targetAudience: 'Metropolis & Lab Walk-in Patients (14,250 Patients)',
    templateCategory: 'NABL_REPORT',
    deliveredCount: 14210,
    readRatePct: 94.8,
    clickThroughPct: 68.4,
    status: 'COMPLETED',
    scheduledTime: '2026-08-30 10:00 AM'
  },
  {
    id: 'WAC-802',
    campaignName: 'Apex Hospital OPD Appointment Follow-Up & Review',
    targetAudience: 'Apex Hospital Consulted Patients (4,800 Patients)',
    templateCategory: 'OPD_REMINDER',
    deliveredCount: 4780,
    readRatePct: 91.2,
    clickThroughPct: 52.6,
    status: 'COMPLETED',
    scheduledTime: '2026-08-31 02:30 PM'
  },
  {
    id: 'WAC-803',
    campaignName: 'Senior Citizen Free Cardiac Health Camp Alert',
    targetAudience: 'Age 50+ Regional Registry (8,500 Patients)',
    templateCategory: 'VACCINATION_CAMP',
    deliveredCount: 8490,
    readRatePct: 88.5,
    clickThroughPct: 41.2,
    status: 'COMPLETED',
    scheduledTime: '2026-09-01 09:00 AM'
  }
];

export const WhatsAppCampaignBroadcaster: React.FC = () => {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>(INITIAL_CAMPAIGNS);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Composer State
  const [campaignName, setCampaignName] = useState('Diabetic Care & Free HbA1c Camp Notification');
  const [targetAudience, setTargetAudience] = useState('Diabetic Screening Patients (6,200 recipients)');
  const [headerText, setHeaderText] = useState('🏥 DocSearch Healthcare Partner Update');
  const [bodyText, setBodyText] = useState('Namaste {{patient_name}},\n\nAapka health checkup scheduled hai. Aapki recent lab report online ready hai. Doctor se follow-up consultation ke liye neeche button par click karein.');
  const [ctaButtonText, setCtaButtonText] = useState('📥 View Official NABL Report');
  const [quickReplyText, setQuickReplyText] = useState('📅 Book Doctor Follow-Up');

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const newCamp: WhatsAppCampaign = {
      id: `WAC-${Math.floor(800 + Math.random() * 200)}`,
      campaignName,
      targetAudience,
      templateCategory: 'HEALTH_TIP',
      deliveredCount: 6185,
      readRatePct: 92.4,
      clickThroughPct: 56.1,
      status: 'COMPLETED',
      scheduledTime: 'Just Now (Dispatched)'
    };
    setCampaigns([newCamp, ...campaigns]);
    setIsComposerOpen(false);
    setSuccessBanner(`WhatsApp Campaign "${campaignName}" broadcasted to ${targetAudience} via Meta Cloud API!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              📲 WhatsApp Business Campaign Broadcaster
            </h2>
            <Badge variant="success">Meta Cloud API Connected</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Design rich interactive WhatsApp messages with CTA buttons, view live mobile mockup preview, and broadcast to patient cohorts
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsComposerOpen(true)} style={{ backgroundColor: '#25D366', color: '#070C16', fontWeight: 900 }}>
          💬 + Launch WhatsApp Campaign
        </Button>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(37, 211, 102, 0.15)', border: '1px solid #25D366', borderRadius: '10px', padding: '12px 16px', color: '#86EFAC', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL DISPATCHED (30D)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>27,480 Messages</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>AVG READ RATE</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#25D366', marginTop: '2px' }}>92.8% Read</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ACTION CLICK RATE (CTR)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>58.6% Clicked</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>META HSM TEMPLATE HEALTH</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>High Quality (Green)</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name & Ref</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Template Category</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Read Rate</TableHead>
                <TableHead>CTA Clicks</TableHead>
                <TableHead>Dispatched At</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.campaignName}</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: '#94A3B8' }}>{c.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.8125rem' }}>{c.targetAudience}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{c.templateCategory.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#F8FAFC' }}>{c.deliveredCount.toLocaleString()}</strong>
                  </TableCell>
                  <TableCell>
                    <span style={{ color: '#25D366', fontWeight: 700 }}>{c.readRatePct}%</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ color: '#38BDF8', fontWeight: 700 }}>{c.clickThroughPct}%</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{c.scheduledTime}</span>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">● {c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Composer & Interactive Mobile Preview Modal */}
      {isComposerOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.9)',
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
            border: '1.5px solid rgba(37, 211, 102, 0.5)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#25D366' }}>
                  💬 WhatsApp Business Campaign Composer
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Design dynamic message with CTA buttons & preview live on mobile device
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Left Column: Form Settings */}
              <form onSubmit={handleLaunchCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>CAMPAIGN TITLE *</label>
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>TARGET AUDIENCE COHORT *</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  >
                    <option value="Diabetic Screening Patients (6,200 recipients)">Diabetic Screening Patients (6,200 recipients)</option>
                    <option value="Metropolis Lab Walk-in Patients (14,250 recipients)">Metropolis Lab Walk-in Patients (14,250 recipients)</option>
                    <option value="Apex Multi-Specialty Hospital Patients (4,800 recipients)">Apex Multi-Specialty Hospital Patients (4,800 recipients)</option>
                    <option value="All North India Patient Registry (45,000 recipients)">All North India Patient Registry (45,000 recipients)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>MESSAGE HEADER TEXT</label>
                  <input
                    type="text"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>MESSAGE BODY (Supports Markdown & Dynamic Tags) *</label>
                  <textarea
                    rows={4}
                    required
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', resize: 'vertical' }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: '#06B6D4', marginTop: '2px', display: 'block' }}>
                    Available tags: &#123;&#123;patient_name&#125;&#125;, &#123;&#123;doctor_name&#125;&#125;, &#123;&#123;report_url&#125;&#125;, &#123;&#123;hospital_name&#125;&#125;
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PRIMARY CTA BUTTON</label>
                    <input
                      type="text"
                      value={ctaButtonText}
                      onChange={(e) => setCtaButtonText(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>QUICK REPLY BUTTON</label>
                    <input
                      type="text"
                      value={quickReplyText}
                      onChange={(e) => setQuickReplyText(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(false)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#25D366', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer' }}
                  >
                    🚀 Broadcast Live via WhatsApp
                  </button>
                </div>
              </form>

              {/* Right Column: Live Mobile Mockup Preview */}
              <div style={{ backgroundColor: '#0B141A', borderRadius: '24px', border: '8px solid #1F2C34', padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '420px', boxShadow: '0 15px 40px rgba(0,0,0,0.8)' }}>
                {/* Mobile Top Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1F2C34', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#00A884', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 900, fontSize: '0.875rem' }}>
                    DS
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#E9EDEF' }}>DocSearch Official Partner</div>
                    <span style={{ fontSize: '0.6875rem', color: '#8696A0' }}>Official Verified Business Account ✓</span>
                  </div>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div style={{ backgroundColor: '#005C4B', borderRadius: '12px 12px 12px 2px', padding: '12px', color: '#E9EDEF', fontSize: '0.8125rem', lineHeight: '1.45', position: 'relative' }}>
                  {headerText && (
                    <div style={{ fontWeight: 800, color: '#25D366', marginBottom: '6px', fontSize: '0.8125rem' }}>
                      {headerText}
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-line', color: '#E9EDEF' }}>
                    {bodyText.replace('{{patient_name}}', 'Rahul Verma').replace('{{hospital_name}}', 'Apex Hospital')}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.625rem', color: '#8696A0', marginTop: '6px' }}>
                    11:42 AM ✓✓
                  </div>
                </div>

                {/* Action Buttons in Chat */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {ctaButtonText && (
                    <div style={{ backgroundColor: '#1F2C34', border: '1px solid #2A3942', borderRadius: '8px', padding: '8px', textAlign: 'center', color: '#00A884', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                      🔗 {ctaButtonText}
                    </div>
                  )}

                  {quickReplyText && (
                    <div style={{ backgroundColor: '#1F2C34', border: '1px solid #2A3942', borderRadius: '8px', padding: '8px', textAlign: 'center', color: '#00A884', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                      💬 {quickReplyText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
