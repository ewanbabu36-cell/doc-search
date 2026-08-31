import React, { useState } from 'react';
import { Card, Button, Badge, Select } from '@docsearch/ui-kit';

export interface StreamedVitals {
  tokenNumber: string;
  patientName: string;
  bp: string;
  pulseBpm: number;
  spo2Percent: number;
  tempF: number;
  weightKg: number;
  bloodSugarMgDl: number;
  news2Score: number;
  timestamp: string;
  deviceOrigin: string;
}

export const SmartWaitingRoomVitalsGateway: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState('Token #14 - Rahul Verma');
  const [isStreaming, setIsStreaming] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [liveStreamQueue, setLiveStreamQueue] = useState<StreamedVitals[]>([
    {
      tokenNumber: 'Token #14',
      patientName: 'Rahul Verma (MRN-84920)',
      bp: '128/82 mmHg',
      pulseBpm: 76,
      spo2Percent: 99,
      tempF: 98.4,
      weightKg: 72.5,
      bloodSugarMgDl: 114,
      news2Score: 0,
      timestamp: 'Just now (10:28 AM)',
      deviceOrigin: 'Omron BP-930 + Masimo SpO2 Bluetooth Hub'
    },
    {
      tokenNumber: 'Token #12',
      patientName: 'Sunita Sharma (MRN-10293)',
      bp: '142/92 mmHg',
      pulseBpm: 88,
      spo2Percent: 97,
      tempF: 99.1,
      weightKg: 64.0,
      bloodSugarMgDl: 168,
      news2Score: 1,
      timestamp: '8 mins ago',
      deviceOrigin: 'Omron BP-930 + Accu-Chek Instant Hub'
    }
  ]);

  const handleSimulateDeviceCapture = () => {
    setIsStreaming(true);
    setTimeout(() => {
      const newVitals: StreamedVitals = {
        tokenNumber: 'Token #15',
        patientName: 'Kavita Singh (MRN-90281)',
        bp: '120/80 mmHg',
        pulseBpm: 72,
        spo2Percent: 99,
        tempF: 98.6,
        weightKg: 58.2,
        bloodSugarMgDl: 98,
        news2Score: 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deviceOrigin: 'Smart Waiting Room IoT Kiosk'
      };

      setLiveStreamQueue([newVitals, ...liveStreamQueue]);
      setIsStreaming(false);
      setSuccessMsg(`Vitals for ${newVitals.patientName} captured via Bluetooth IoT & synced to Doctor EMR Desk!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 700);
  };

  return (
    <Card padding="md" style={{ border: '2px solid #38BDF8', backgroundColor: '#0B132B', borderRadius: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.75rem' }}>📡</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                IoT Bluetooth Vitals Gateway (Smart Waiting Room)
              </h3>
              <Badge variant="success">WebBluetooth BLE 5.2</Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Waiting room devices stream BP, SpO2, Pulse, Glucose, and Weight straight to Doctor EMR with Zero Typing
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="primary">⚡ 0-Second Nurse Typing</Badge>
          <Badge variant="neutral">NEWS2 Sepsis Warning</Badge>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1.5px solid #10B981', borderRadius: '10px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Connected Bluetooth Devices Radar Bar */}
      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#CBD5E1' }}>Active IoT Devices:</span>
          <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#A7F3D0', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
            ● Omron BP-930 (BLE Connected)
          </span>
          <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#A7F3D0', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
            ● Masimo MightySat SpO2 (Active)
          </span>
          <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#A7F3D0', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
            ● Accu-Chek Instant (Paired)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Select
            options={[
              { label: 'Token #14 - Rahul Verma (OPD)', value: 'Token #14 - Rahul Verma' },
              { label: 'Token #15 - Kavita Singh (General)', value: 'Token #15 - Kavita Singh' },
              { label: 'Token #16 - Amit Patel (Cardiology)', value: 'Token #16 - Amit Patel' }
            ]}
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isStreaming}
            onClick={handleSimulateDeviceCapture}
          style={{ backgroundColor: '#38BDF8', borderColor: '#38BDF8', color: '#070C16', fontWeight: 900 }}
        >
          {isStreaming ? '📡 Streaming IoT Packets...' : '⚡ Simulate Smart Waiting Room Scan'}
          </Button>
        </div>
      </div>

      {/* Streamed Vitals Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {liveStreamQueue.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#0F172A',
              border: idx === 0 ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
              <div>
                <strong style={{ fontSize: '0.8125rem', color: '#F8FAFC' }}>{item.patientName}</strong>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>{item.tokenNumber} • {item.timestamp}</span>
              </div>
              <Badge variant={item.news2Score === 0 ? 'success' : 'warning'}>
                NEWS2: {item.news2Score}
              </Badge>
            </div>

            {/* Vitals Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: '6px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8', display: 'block' }}>BLOOD PRESSURE</span>
                <strong style={{ fontSize: '0.8125rem', color: '#38BDF8' }}>{item.bp}</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: '6px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8', display: 'block' }}>PULSE / SPO2</span>
                <strong style={{ fontSize: '0.8125rem', color: '#10B981' }}>{item.pulseBpm} bpm / {item.spo2Percent}%</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: '6px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8', display: 'block' }}>SUGAR / WT</span>
                <strong style={{ fontSize: '0.8125rem', color: '#FCD34D' }}>{item.bloodSugarMgDl} mg / {item.weightKg}kg</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.625rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <span>📡 {item.deviceOrigin}</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Auto-Synced to Doctor EMR</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
