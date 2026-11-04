import React, { useState, useEffect } from 'react';
import { WaitingRoomTvDisplayView } from '../views/WaitingRoomTvDisplayView.js';

export interface EmergencyBroadcast {
  id: string;
  codeType: string;
  location: string;
  initiatedAt: string;
}

export const WaitingRoomTokenDisplayView: React.FC = () => {
  const [activeEmergency, setActiveEmergency] = useState<EmergencyBroadcast | null>(null);

  // Listen to Server-Sent Events from /api/v1/emergency/code-blue/stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/emergency/code-blue/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'EMERGENCY_BROADCAST' && payload.event) {
            if (payload.event.status === 'RESOLVED') {
              setActiveEmergency(null);
            } else {
              setActiveEmergency({
                id: payload.event.id,
                codeType: payload.event.codeType,
                location: payload.event.location,
                initiatedAt: payload.event.initiatedAt
              });
            }
          }
        } catch {}
      };
    } catch {}

    return () => {
      eventSource?.close();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Emergency Overlay Banner if CODE BLUE or Red is active */}
      {activeEmergency && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '16px 24px',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontWeight: 'bold',
            fontSize: '1.4rem',
            letterSpacing: '1px',
            animation: 'pulse 1s infinite alternate',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.8)'
          }}
        >
          <span>🚨</span>
          <span>
            HOSPITAL EMERGENCY BROADCAST: {activeEmergency.codeType.replace('_', ' ')} in{' '}
            {activeEmergency.location.toUpperCase()} — RESUSCITATION TEAM RESPOND STAT
          </span>
          <span>🚨</span>
        </div>
      )}

      {/* Main Waiting Room TV Display */}
      <WaitingRoomTvDisplayView />
    </div>
  );
};

export default WaitingRoomTokenDisplayView;
