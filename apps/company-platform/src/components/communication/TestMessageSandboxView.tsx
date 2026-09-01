import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export const TestMessageSandboxView: React.FC = () => {
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [recipient, setRecipient] = useState('+91 98765 43210');
  const [templateType, setTemplateType] = useState('NABL_REPORT_READY');
  const [sampleName, setSampleName] = useState('Rahul Verma');
  const [sampleParam, setSampleParam] = useState('HbA1c & Fasting Glucose Report');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'DELIVERED' | 'FAILED';
    messageId: string;
    gatewayLatencyMs: number;
    provider: string;
    deliveredAt: string;
    renderedPayload: string;
  } | null>(null);

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTestResult(null);

    setTimeout(() => {
      setIsSending(false);
      let payload = '';
      if (templateType === 'NABL_REPORT_READY') {
        payload = `[DOCSEARCH META VERIFIED] Namaste ${sampleName}, Aapka ${sampleParam} test report ready hai. Download karne ke liye click karein: https://docsearch.in/r/94821`;
      } else if (templateType === 'OPD_CONFIRM') {
        payload = `[DOCSEARCH SMS] Dear ${sampleName}, Your OPD appointment with Dr. Vikram Seth is CONFIRMED for Today at 04:30 PM. Token #14.`;
      } else {
        payload = `[DOCSEARCH SECURITY] Your OTP for ABHA Health Card verification is 849201. Valid for 10 minutes. Do not share.`;
      }

      setTestResult({
        status: 'DELIVERED',
        messageId: `msg-${channel.toLowerCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        gatewayLatencyMs: Math.floor(85 + Math.random() * 65),
        provider: channel === 'WHATSAPP' ? 'Meta WhatsApp Cloud API' : channel === 'SMS' ? 'Airtel Enterprise DLT Gateway' : 'SendGrid SMTP',
        deliveredAt: new Date().toLocaleTimeString(),
        renderedPayload: payload
      });
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📱 Live Test Message Sandbox Simulator
          </h2>
          <Badge variant="primary">Sandbox Environment Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Safely test send dynamic SMS, WhatsApp, and Email templates to personal tester numbers before production rollout
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Test Dispatch Form */}
        <Card title="⚡ Dispatch Instant Test Message" padding="lg">
          <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>DELIVERY CHANNEL *</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                >
                  <option value="WHATSAPP">💬 WhatsApp Business API</option>
                  <option value="SMS">📱 SMS (DLT Approved)</option>
                  <option value="EMAIL">✉️ Transactional Email</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>TEST RECIPIENT PHONE / EMAIL *</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>NOTIFICATION TEMPLATE PRESET *</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="NABL_REPORT_READY">🧪 NABL Lab Diagnostic Report Ready</option>
                <option value="OPD_CONFIRM">🩺 OPD Doctor Appointment Confirmation</option>
                <option value="OTP_AUTH">🔐 Security 2FA / ABHA Verification OTP</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>SAMPLE VARIABLE: PATIENT NAME</label>
                <input
                  type="text"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>SAMPLE VARIABLE: TEST / DETAILS</label>
                <input
                  type="text"
                  value={sampleParam}
                  onChange={(e) => setSampleParam(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSending}
              style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 900, marginTop: '6px' }}
            >
              {isSending ? '⚡ Dispatching Test...' : '🚀 Send Live Test Message'}
            </Button>
          </form>
        </Card>

        {/* Live Delivery Telemetry Console */}
        <Card title="📡 Carrier Gateway Telemetry & Receipt" padding="lg">
          {testResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px' }}>
                <span style={{ color: '#10B981', fontWeight: 800 }}>● DELIVERED TO HANDSET</span>
                <span style={{ color: '#A7F3D0', fontFamily: 'monospace' }}>Latency: {testResult.gatewayLatencyMs}ms</span>
              </div>

              <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Message ID:</span>
                  <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{testResult.messageId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Carrier Provider:</span>
                  <span style={{ color: '#F8FAFC' }}>{testResult.provider}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Delivered Time:</span>
                  <span style={{ color: '#F8FAFC' }}>{testResult.deliveredAt}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                  Handset Rendered Content:
                </span>
                <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '12px', color: '#A5F3FC', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.45' }}>
                  {testResult.renderedPayload}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94A3B8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📡</div>
              <span style={{ fontSize: '0.8125rem' }}>
                Click <strong>"Send Live Test Message"</strong> to inspect real-time gateway delivery latency and rendered payload receipt.
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
