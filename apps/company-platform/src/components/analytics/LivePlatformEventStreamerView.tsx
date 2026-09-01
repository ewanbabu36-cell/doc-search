import React, { useState } from 'react';
import { Card, Badge } from '@docsearch/ui-kit';

interface StreamEvent {
  id: string;
  timeAgo: string;
  category: 'CONSULTATION' | 'LAB_REPORT' | 'ABHA_REG' | 'INVOICE_PAID' | 'SECURITY';
  facilityName: string;
  city: string;
  description: string;
  icon: string;
}

const INITIAL_STREAM: StreamEvent[] = [
  {
    id: 'EVT-901',
    timeAgo: 'Just now',
    category: 'CONSULTATION',
    facilityName: 'Apollo Hospital (Sarita Vihar)',
    city: 'New Delhi',
    description: 'Dr. Vikram Seth digitally signed prescription for Patient Rahul V. (Token #18)',
    icon: '🩺'
  },
  {
    id: 'EVT-902',
    timeAgo: '3 sec ago',
    category: 'LAB_REPORT',
    facilityName: 'Metropolis Healthcare Lab Hub',
    city: 'Mumbai',
    description: 'Automated CBC & Platelet NABL Report certified by Dr. Sunita K. (LIS Analyzer Sync)',
    icon: '🧪'
  },
  {
    id: 'EVT-903',
    timeAgo: '7 sec ago',
    category: 'ABHA_REG',
    facilityName: 'Max Super Specialty Hospital',
    city: 'Patparganj',
    description: 'Patient created new 14-Digit ABHA Health Card via Aadhaar OTP flow',
    icon: '🆔'
  },
  {
    id: 'EVT-904',
    timeAgo: '12 sec ago',
    category: 'INVOICE_PAID',
    facilityName: 'Fortis Escorts Heart Institute',
    city: 'Okhla, Delhi',
    description: 'OPD Billing ₹2,400 settled via Razorpay Dynamic QR POS (Invoice #INV-2026-9812)',
    icon: '💳'
  },
  {
    id: 'EVT-905',
    timeAgo: '18 sec ago',
    category: 'SECURITY',
    facilityName: 'Manipal Hospital',
    city: 'Bengaluru',
    description: 'FIDO2 YubiKey Hardware 2FA authenticated for Chief Medical Officer',
    icon: '🔐'
  }
];

export const LivePlatformEventStreamerView: React.FC = () => {
  const [events] = useState<StreamEvent[]>(INITIAL_STREAM);
  const [isStreaming, setIsStreaming] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              ⚡ Real-Time Live Platform Event Streamer
            </h2>
            <Badge variant="success">● WebSocket Stream Active (14,200 events/hr)</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time live telemetry stream of clinical consultations, NABL report verifications, and financial transactions across all connected hospitals
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsStreaming(!isStreaming)}
          style={{
            backgroundColor: isStreaming ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${isStreaming ? '#EF4444' : '#10B981'}`,
            color: isStreaming ? '#FCA5A5' : '#86EFAC',
            borderRadius: '8px',
            padding: '6px 14px',
            fontWeight: 800,
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          {isStreaming ? '⏸ Pause Live Stream' : '▶ Resume Live Stream'}
        </button>
      </div>

      {/* Live Stream List */}
      <Card padding="none">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((evt) => (
            <div
              key={evt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #1E293B',
                gap: '14px',
                fontSize: '0.8125rem',
                backgroundColor: evt.timeAgo === 'Just now' ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid #334155' }}>
                  {evt.icon}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>{evt.facilityName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>({evt.city})</span>
                    <Badge variant={evt.category === 'CONSULTATION' ? 'primary' : evt.category === 'LAB_REPORT' ? 'warning' : 'neutral'}>
                      {evt.category}
                    </Badge>
                  </div>
                  <span style={{ color: '#CBD5E1', marginTop: '2px', lineHeight: '1.4' }}>
                    {evt.description}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '90px' }}>
                <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.75rem' }}>● {evt.timeAgo}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.625rem', color: '#64748B' }}>{evt.id}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
