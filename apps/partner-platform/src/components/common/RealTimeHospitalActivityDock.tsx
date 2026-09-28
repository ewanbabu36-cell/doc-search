import React, { useState, useEffect } from 'react';
import {
  hospitalEventBus,
  type HospitalEventPayload
} from '../../services/hospital-event-bus.js';

export const RealTimeHospitalActivityDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<HospitalEventPayload[]>([
    {
      type: 'SYSTEM_TELEMETRY_PULSE',
      timestamp: new Date().toLocaleTimeString(),
      sourceModule: 'GatewayBridge',
      data: { latencyMs: 14, status: 'HEALTHY' },
      summaryText: 'Connected to Fastify API Gateway (:4000) • Zero-Loss Event Bridge Active'
    },
    {
      type: 'BED_STATUS_CHANGED',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      sourceModule: 'InpatientBedBoard',
      data: { bed: 'ICU-04', status: 'OCCUPIED' },
      summaryText: 'Bed ICU-04 occupied by Rahul Verma (Cardiology)'
    },
    {
      type: 'BILL_SETTLED',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      sourceModule: 'BillingPOS',
      data: { amount: 3200, mode: 'UPI' },
      summaryText: 'OPD Bill #INV-1092 settled ₹3,200 via UPI QR • Escrow Split Completed'
    }
  ]);

  const [gatewayPing, setGatewayPing] = useState<{ status: 'CONNECTED' | 'CHECKING' | 'OFFLINE'; ms: number }>({
    status: 'CONNECTED',
    ms: 12
  });

  useEffect(() => {
    const unsubscribe = hospitalEventBus.subscribe('*', (payload: HospitalEventPayload) => {
      setEvents((prev) => [payload, ...prev.slice(0, 49)]); // Keep last 50 events
    });

    // Heartbeat ping check
    const checkGateway = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/api/health').catch(() => null);
        const elapsed = Math.round(performance.now() - start);
        if (res && res.ok) {
          setGatewayPing({ status: 'CONNECTED', ms: elapsed });
        } else {
          setGatewayPing({ status: 'OFFLINE', ms: 0 });
        }
      } catch {
        setGatewayPing({ status: 'OFFLINE', ms: 0 });
      }
    };

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void checkGateway();
    }, 15000);
    checkGateway();

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'EMERGENCY_TRIAGE_ALERT':
        return { label: 'EMERGENCY', bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', color: '#F87171' };
      case 'PRESCRIPTION_ISSUED':
      case 'PRESCRIPTION_DISPENSED':
        return { label: 'PHARMACY', bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981', color: '#34D399' };
      case 'BED_STATUS_CHANGED':
        return { label: 'INPATIENT', bg: 'rgba(56, 189, 248, 0.2)', border: '#0284C7', color: '#38BDF8' };
      case 'BILL_SETTLED':
        return { label: 'FINANCE', bg: 'rgba(245, 158, 11, 0.2)', border: '#F59E0B', color: '#FCD34D' };
      default:
        return { label: 'SYSTEM', bg: 'rgba(139, 92, 246, 0.2)', border: '#8B5CF6', color: '#C4B5FD' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {!isOpen ? (
        /* Floating Pill Button */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #06B6D4',
            color: '#F8FAFC',
            padding: '8px 16px',
            borderRadius: '24px',
            fontSize: '0.8125rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#38BDF8';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#06B6D4';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: gatewayPing.status === 'CONNECTED' ? '#10B981' : '#EF4444',
              boxShadow: gatewayPing.status === 'CONNECTED' ? '0 0 8px #10B981' : 'none'
            }}
          />
          <span>⚡ Live Pulse ({events.length})</span>
          <span
            style={{
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              color: '#38BDF8',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '0.6875rem'
            }}
          >
            {gatewayPing.ms}ms
          </span>
        </button>
      ) : (
        /* Expanded Live Activity Drawer */
        <div
          style={{
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '520px',
            backgroundColor: '#0B1120',
            border: '1.5px solid #0284C7',
            borderRadius: '14px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.75)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#0F172A',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>⚡</span>
              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>
                  Real-Time Hospital Pulse
                </strong>
                <div style={{ fontSize: '0.6875rem', color: gatewayPing.status === 'CONNECTED' ? '#34D399' : '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>●</span>
                  <span>{gatewayPing.status === 'CONNECTED' ? `Fastify Gateway :4000 Connected (${gatewayPing.ms}ms)` : 'Gateway Offline / Fallback Active'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '2px 6px'
              }}
            >
              ✕
            </button>
          </div>



          {/* Event Stream List */}
          <div
            style={{
              padding: '8px 12px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            {events.map((ev, idx) => {
              const badge = getEventBadge(ev.type);
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '0.625rem',
                        fontWeight: 800
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>{ev.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                    {ev.summaryText}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#0F172A',
              borderTop: '1px solid #1E293B',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
              Total events recorded: {events.length}
            </span>
            <button
              type="button"
              onClick={() => setEvents([])}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#EF4444',
                fontSize: '0.6875rem',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Clear Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
