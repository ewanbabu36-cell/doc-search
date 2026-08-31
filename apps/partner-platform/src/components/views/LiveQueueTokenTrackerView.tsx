import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { LiveQueueTokenDto } from '@docsearch/api-contracts';

interface Props {
  tokens: LiveQueueTokenDto[];
}

export const LiveQueueTokenTrackerView: React.FC<Props> = ({ tokens }) => {
  const [currentServingNum, setCurrentServingNum] = useState(8);
  const [searchToken] = useState('TKN-012');
  const [alertSent, setAlertSent] = useState(false);

  const activeToken = {
    tokenNumber: searchToken,
    patientName: 'Kavita Joshi',
    doctorName: 'Dr. Rajesh Sharma, MD',
    department: 'General Outpatient OPD',
    chamber: 'Chamber 1',
    tokenIndex: 12,
    currentTokenServing: `TKN-00${currentServingNum}`,
    patientsAhead: Math.max(0, 12 - currentServingNum),
    estimatedWaitMins: Math.max(0, (12 - currentServingNum) * 4)
  };

  const handleNextToken = () => {
    setCurrentServingNum((prev) => (prev < 15 ? prev + 1 : prev));
  };

  const handleSendWhatsAppAlert = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.25rem' }}>📲</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              WhatsApp Live Queue Token Tracker & Patient HUD
            </h2>
            <Badge variant="primary">Real-Time Sync</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Live queue progress automatically streamed to patient WhatsApp and in-clinic waiting room monitors.
          </p>
        </div>

        {/* Doctor Chamber Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextToken}
            style={{ fontWeight: 700, borderColor: '#06B6D4', color: '#38BDF8' }}
          >
            📢 Call Next Patient (Token #{currentServingNum + 1})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendWhatsAppAlert}
          >
            {alertSent ? '✓ WhatsApp Ping Dispatched!' : '📲 Send WhatsApp Turn Alert'}
          </Button>
        </div>
      </div>

      {/* Main Patient Live Queue Card (What Patient Sees on Phone) */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7), 0 0 25px rgba(6, 182, 212, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Aarogya 360 Live Queue Radar</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
              Patient: {activeToken.patientName}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Doctor</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38BDF8' }}>
              {activeToken.doctorName} ({activeToken.chamber})
            </div>
          </div>
        </div>

        {/* 3-Column Token Status Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          {/* Currently In Room */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase' }}>Currently Inside Chamber</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', margin: '6px 0' }}>
              {activeToken.currentTokenServing}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Consultation In Progress</div>
          </div>

          {/* Your Token */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>Your Token Number</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8', margin: '6px 0' }}>
              {activeToken.tokenNumber}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Booked via WhatsApp Bot</div>
          </div>

          {/* Estimated Wait */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Wait Time</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B', margin: '6px 0' }}>
              ~{activeToken.estimatedWaitMins} mins
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#FCD34D' }}>
              {activeToken.patientsAhead === 0 ? '🔔 It is your turn! Please enter.' : `${activeToken.patientsAhead} patients ahead in queue`}
            </div>
          </div>
        </div>

        {/* Dynamic Queue Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#CBD5E1', marginBottom: '8px' }}>
            <span>Queue Progression:</span>
            <span style={{ fontWeight: 700, color: '#38BDF8' }}>
              {Math.min(100, Math.round((currentServingNum / 12) * 100))}% Completed
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (currentServingNum / 12) * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10B981 0%, #06B6D4 100%)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Grid of Other Active Tokens */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px' }}>
          All Active Lobby Queue Tokens
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {tokens.map((t) => (
            <Card key={t.id} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                  {t.tokenNumber}
                </span>
                <Badge variant={t.queueStatus === 'CALLED_TO_ROOM' ? 'success' : 'primary'}>
                  {t.queueStatus}
                </Badge>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 700 }}>
                {t.patientName} (MRN: {t.patientMrn})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Doctor: <strong>{t.doctorName}</strong> ({t.roomNumber})
              </div>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', justifyContent: 'space-between' }}>
                <span>In Room: <strong style={{ color: '#10B981' }}>{t.currentTokenServing}</strong></span>
                <span>Wait: <strong style={{ color: '#F59E0B' }}>~{t.estimatedWaitMinutes} mins</strong></span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
