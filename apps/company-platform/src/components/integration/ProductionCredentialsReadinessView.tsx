import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';
import { getAuthToken } from '../../services/api-client.js';

interface ChannelReport {
  id: string;
  title: string;
  icon: string;
  category: 'COMMUNICATION' | 'PAYMENTS' | 'GOVERNMENT';
  configured: boolean;
  status: string;
  requiredVars: string[];
  hint?: string | null;
}

export const ProductionCredentialsReadinessView: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [editingChannel, setEditingChannel] = useState<ChannelReport | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const fetchReadiness = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v1/company/integrations/production-readiness', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json?.success && json?.report) {
        setReport(json.report);
      }
    } catch (err) {
      console.warn('Readiness load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReadiness();
  }, [fetchReadiness]);

  const handleTestHandshake = async (channelId: string) => {
    setTestingChannel(channelId);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v1/company/integrations/production-readiness/test-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ channel: channelId })
      });
      const json = await res.json();
      if (json?.data) {
        setTestResult((prev) => ({
          ...prev,
          [channelId]: {
            ok: Boolean(json.data.liveReachable),
            message: `${json.data.message} (${json.data.latencyMs}ms)`
          }
        }));
      }
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [channelId]: { ok: false, message: err?.message || 'Handshake failed' }
      }));
    } finally {
      setTestingChannel(null);
    }
  };

  const handleOpenConfigure = (ch: ChannelReport) => {
    const initial: Record<string, string> = {};
    ch.requiredVars.forEach((v) => {
      initial[v] = '';
    });
    setFormValues(initial);
    setEditingChannel(ch);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    setIsSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v1/company/integrations/production-readiness/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          credentials: formValues,
          persistToEnvFile: true
        })
      });
      const json = await res.json();
      if (json?.success) {
        setReport(json.report);
        setBanner(`✓ Updated ${json.appliedKeys?.join(', ') || 'credentials'} and reloaded live services!`);
        setEditingChannel(null);
        setTimeout(() => setBanner(null), 5000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const channels: ChannelReport[] = report
    ? [
        {
          id: 'gmail',
          title: 'Gmail & Google Workspace SMTP',
          icon: '📧',
          category: 'COMMUNICATION',
          configured: Boolean(report.gmail?.configured),
          status: report.gmail?.status || 'SIMULATION',
          requiredVars: report.gmail?.requiredVars || ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'GMAIL_FROM'],
          hint: report.gmail?.userHint
        },
        {
          id: 'firebase',
          title: 'Firebase Cloud Messaging (FCM)',
          icon: '🔥',
          category: 'COMMUNICATION',
          configured: Boolean(report.firebase?.configured),
          status: report.firebase?.status || 'SIMULATION',
          requiredVars: report.firebase?.requiredVars || ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVER_KEY'],
          hint: report.firebase?.projectId
        },
        {
          id: 'telegram',
          title: 'Telegram Healthcare Alert Bot',
          icon: '✈️',
          category: 'COMMUNICATION',
          configured: Boolean(report.telegram?.configured),
          status: report.telegram?.status || 'SIMULATION',
          requiredVars: report.telegram?.requiredVars || ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID'],
          hint: report.telegram?.hasAdminChatId ? 'Admin Chat Linked' : null
        },
        {
          id: 'razorpay',
          title: 'Razorpay Split Escrow & UPI',
          icon: '💳',
          category: 'PAYMENTS',
          configured: Boolean(report.razorpay?.configured),
          status: report.razorpay?.status || 'SIMULATION',
          requiredVars: report.razorpay?.requiredVars || ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'],
          hint: report.razorpay?.keyIdHint
        },
        {
          id: 'stripe',
          title: 'Stripe Global Subscriptions',
          icon: '🌐',
          category: 'PAYMENTS',
          configured: Boolean(report.stripe?.configured),
          status: report.stripe?.status || 'SIMULATION',
          requiredVars: report.stripe?.requiredVars || ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
        },
        {
          id: 'abdm',
          title: 'ABDM NHA Production Gateway',
          icon: '🏥',
          category: 'GOVERNMENT',
          configured: Boolean(report.abdm?.configured),
          status: report.abdm?.status || 'BLOCKED_MISSING_CREDENTIALS',
          requiredVars: report.abdm?.requiredVars || ['ABDM_BASE_URL', 'ABDM_CLIENT_ID', 'ABDM_CLIENT_SECRET', 'ABDM_HIP_ID'],
          hint: report.abdm?.hipId
        },
        {
          id: 'dltSms',
          title: 'TRAI DLT SMS (MSG91 / Gupshup)',
          icon: '📱',
          category: 'COMMUNICATION',
          configured: Boolean(report.dltSms?.configured),
          status: report.dltSms?.status || 'SIMULATION',
          requiredVars: report.dltSms?.requiredVars || ['MSG91_AUTH_KEY', 'MSG91_SENDER_ID', 'GUPSHUP_API_KEY']
        },
        {
          id: 'whatsapp',
          title: 'Meta WhatsApp Cloud API v19',
          icon: '💬',
          category: 'COMMUNICATION',
          configured: Boolean(report.whatsapp?.configured),
          status: report.whatsapp?.status || 'SIMULATION',
          requiredVars: report.whatsapp?.requiredVars || ['META_WA_ACCESS_TOKEN', 'META_WA_PHONE_NUMBER_ID']
        }
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {banner && <Alert type="success" title="Live Environment Reloaded">{banner}</Alert>}

      <Card
        title="Production Credentials & External API Go-Live Center"
        subtitle="Inspect simulation vs live status across Gmail, Firebase, Telegram, Razorpay, Stripe, ABDM & DLT SMS"
        actions={
          <Button variant="outline" size="sm" onClick={() => void fetchReadiness()} disabled={isLoading}>
            🔄 Refresh Matrix
          </Button>
        }
      >
        {report?.summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>GO-LIVE READINESS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8' }}>{report.summary.readinessPercent}%</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>LIVE CHANNELS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34D399' }}>{report.summary.configuredCount}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>SIMULATION FALLBACK ACTIVE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FBBF24' }}>{report.summary.simulationCount}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          {channels.map((ch) => {
            const tr = testResult[ch.id];
            return (
              <div
                key={ch.id}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: ch.configured ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(245, 158, 11, 0.35)',
                  backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{ch.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#F8FAFC' }}>{ch.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {ch.hint ? `Configured: ${ch.hint}` : `Keys: ${ch.requiredVars.slice(0, 2).join(', ')}`}
                      </div>
                    </div>
                  </div>
                  <Badge variant={ch.configured ? 'success' : 'warning'}>
                    {ch.configured ? 'LIVE READY' : 'SIMULATED'}
                  </Badge>
                </div>

                {tr && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      backgroundColor: tr.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                      color: tr.ok ? '#34D399' : '#FCD34D'
                    }}
                  >
                    {tr.ok ? '✅' : 'ℹ️'} {tr.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleTestHandshake(ch.id)}
                    disabled={testingChannel === ch.id}
                  >
                    {testingChannel === ch.id ? 'Testing...' : '⚡ Test Handshake'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenConfigure(ch)}
                  >
                    🔑 Configure Keys
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {editingChannel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 10060,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setEditingChannel(null)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #38BDF8',
              borderRadius: '14px',
              padding: '22px',
              width: '100%',
              maxWidth: '520px',
              color: '#F8FAFC',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#38BDF8' }}>
                {editingChannel.icon} Configure {editingChannel.title}
              </h3>
              <button
                type="button"
                onClick={() => setEditingChannel(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Alert type="info" title="Immediate Runtime Hot-Reload">
                Entered credentials are written to local environment storage and hot-reloaded immediately across API Gateway services. Empty fields are left unchanged.
              </Alert>
              {editingChannel.requiredVars.map((varName) => (
                <div key={varName} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', fontFamily: 'monospace' }}>
                    {varName}
                  </label>
                  <input
                    type={varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY') || varName.includes('TOKEN') ? 'password' : 'text'}
                    value={formValues[varName] || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [varName]: e.target.value }))}
                    placeholder={`Enter production ${varName}...`}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #475569',
                      backgroundColor: '#020617',
                      color: '#F8FAFC',
                      fontFamily: 'monospace',
                      fontSize: '0.8125rem'
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button type="button" variant="outline" onClick={() => setEditingChannel(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : '💾 Save & Activate Live'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
