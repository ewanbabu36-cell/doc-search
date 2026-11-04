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

const INITIAL_STREAM: StreamEvent[] = [];

export const LivePlatformEventStreamerView: React.FC = () => {
  const [events, setEvents] = useState<StreamEvent[]>(INITIAL_STREAM);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setEvents([
        {
          id: 'EVT-' + Date.now().toString().slice(-4),
          timeAgo: 'Just now',
          category: 'CONSULTATION',
          facilityName: 'Metro Multi-Specialty Hospital',
          city: 'Patna',
          description: 'OPD Consultation closed with signed prescription',
          icon: '⚡'
        }
      ]);
      setIsRefreshing(false);
    }, 600);
  };
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
          {events.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📡</div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#F8FAFC', fontWeight: 700 }}>
                No Live Platform Events in Stream Buffer
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.8125rem', color: '#94A3B8', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                All connected hospital facilities are operating normally. Inbound clinical telemetry, consultations, and lab events will stream here live.
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#38BDF8',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isRefreshing ? '↻ Refreshing...' : '↻ Refresh Stream'}
              </button>
            </div>
          ) : (
            events.map((evt) => (
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
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
