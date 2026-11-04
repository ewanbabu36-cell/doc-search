import React, { useState } from 'react';
import { Card, Button, Badge, Select } from '@docsearch/ui-kit';
import type { UsageQuotaStatus } from '../../services/monetization-godmode-service.js';

const INITIAL_QUOTA_STATES: Record<string, UsageQuotaStatus> = {
  'PARTNER-001': {
    partnerId: 'PARTNER-001',
    partnerName: 'Metropolitan Multispecialty Hospital',
    whatsappMessages: { used: 4200, limit: 10000, softAlertThreshold: 8000 },
    pacsDicomStorageGb: { used: 38.5, limit: 100, softAlertThreshold: 80 },
    aiScribeMinutes: { used: 1250, limit: 3000, softAlertThreshold: 2400 },
    isUnlimitedVip: true,
    lastUpdated: new Date().toISOString()
  },
  'PARTNER-002': {
    partnerId: 'PARTNER-002',
    partnerName: 'Dr. Amitabh Verma Cardiology Clinic',
    whatsappMessages: { used: 890, limit: 1000, softAlertThreshold: 800 },
    pacsDicomStorageGb: { used: 4.2, limit: 5, softAlertThreshold: 4 },
    aiScribeMinutes: { used: 460, limit: 500, softAlertThreshold: 400 },
    isUnlimitedVip: false,
    lastUpdated: new Date().toISOString()
  },
  'PARTNER-003': {
    partnerId: 'PARTNER-003',
    partnerName: 'Dubai Marina Polyclinic',
    whatsappMessages: { used: 1200, limit: 5000, softAlertThreshold: 4000 },
    pacsDicomStorageGb: { used: 12.0, limit: 25, softAlertThreshold: 20 },
    aiScribeMinutes: { used: 600, limit: 1500, softAlertThreshold: 1200 },
    isUnlimitedVip: false,
    lastUpdated: new Date().toISOString()
  }
};

const PARTNER_OPTIONS = [
  { value: 'PARTNER-001', label: 'Metropolitan Multispecialty Hospital (PARTNER-001)' },
  { value: 'PARTNER-002', label: 'Dr. Amitabh Verma Cardiology Clinic (PARTNER-002)' },
  { value: 'PARTNER-003', label: 'Dubai Marina Polyclinic (PARTNER-003)' }
];

export const UsageQuotaThrottlerPanel: React.FC = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('PARTNER-002');
  const [quotas, setQuotas] = useState<Record<string, UsageQuotaStatus>>(INITIAL_QUOTA_STATES);
  const [notice, setNotice] = useState<string | null>(null);

  const activeQuota = quotas[selectedPartnerId] || INITIAL_QUOTA_STATES['PARTNER-002']!;

  const handleUpdateLimit = (
    key: 'whatsappMessages' | 'pacsDicomStorageGb' | 'aiScribeMinutes',
    newLimit: number
  ) => {
    setQuotas((prev) => {
      const current = prev[selectedPartnerId] || activeQuota;
      return {
        ...prev,
        [selectedPartnerId]: {
          ...current,
          [key]: {
            ...current[key],
            limit: newLimit,
            softAlertThreshold: Math.round(newLimit * 0.8)
          },
          lastUpdated: new Date().toISOString()
        }
      };
    });
    setNotice(`Updated ${key} cap to ${newLimit} for ${selectedPartnerId}`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleToggleVipUnlimited = () => {
    const nextVip = !activeQuota.isUnlimitedVip;
    setQuotas((prev) => ({
      ...prev,
      [selectedPartnerId]: {
        ...activeQuota,
        isUnlimitedVip: nextVip,
        lastUpdated: new Date().toISOString()
      }
    }));
    setNotice(
      nextVip
        ? `👑 VIP Unlimited Quotas GRANTED to ${selectedPartnerId}. Zero hard throttle active.`
        : `VIP Unlimited removed for ${selectedPartnerId}. Enforcing tier caps.`
    );
    setTimeout(() => setNotice(null), 4000);
  };

  const computePercentage = (used: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const waPct = computePercentage(activeQuota.whatsappMessages.used, activeQuota.whatsappMessages.limit);
  const pacsPct = computePercentage(activeQuota.pacsDicomStorageGb.used, activeQuota.pacsDicomStorageGb.limit);
  const aiPct = computePercentage(activeQuota.aiScribeMinutes.used, activeQuota.aiScribeMinutes.limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🎛️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                Smart Usage Quota & Throttling Cockpit
              </h2>
              <Badge variant={activeQuota.isUnlimitedVip ? 'success' : 'warning'}>
                {activeQuota.isUnlimitedVip ? 'VIP UNLIMITED BYPASS ACTIVE' : 'REAL-TIME RATE LIMITING ACTIVE'}
              </Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Prevent server overload and excessive third-party API costs with progressive rate-limits and graceful fallback.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant={activeQuota.isUnlimitedVip ? 'outline' : 'primary'}
              size="sm"
              onClick={handleToggleVipUnlimited}
              style={{
                fontWeight: 800,
                backgroundColor: activeQuota.isUnlimitedVip ? undefined : '#F59E0B',
                borderColor: '#F59E0B',
                color: activeQuota.isUnlimitedVip ? '#FBBF24' : '#000'
              }}
            >
              {activeQuota.isUnlimitedVip ? '✕ Revoke VIP Unlimited Pass' : '👑 Grant VIP Unlimited Pass ⚡'}
            </Button>
          </div>
        </div>

        {/* Facility Selector */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Select Healthcare Partner Facility:
            </label>
            <Select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              options={PARTNER_OPTIONS}
            />
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Last Telemetry Heartbeat: <strong style={{ color: '#38BDF8' }}>{new Date(activeQuota.lastUpdated).toLocaleTimeString()}</strong>
          </div>
        </div>
      </div>

      {notice && (
        <div
          style={{
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid #06B6D4',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#A5F3FC',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          {notice}
        </div>
      )}

      {/* 3 Quota Sliders / Meters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* WhatsApp Quota */}
        <Card title="💬 WhatsApp Broadcast & Token Slip Quota">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: waPct > 80 ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>
                {activeQuota.whatsappMessages.used.toLocaleString()}
                <span style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 600 }}> / {activeQuota.whatsappMessages.limit.toLocaleString()} msgs</span>
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: waPct > 80 ? '#F87171' : '#34D399' }}>
                {waPct}% Used
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${waPct}%`,
                  backgroundColor: waPct > 80 ? '#EF4444' : '#10B981',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
              <span>Soft Warning: {activeQuota.whatsappMessages.softAlertThreshold} msgs (80%)</span>
              <span>Cost/SMS: ₹0.12</span>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Adjust Monthly Message Limit:
              </label>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={activeQuota.whatsappMessages.limit}
                onChange={(e) => handleUpdateLimit('whatsappMessages', parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B' }}>
                <span>500</span>
                <span>10,000</span>
                <span>25,000</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Cloud PACS DICOM Storage */}
        <Card title="🩻 Cloud PACS & Radiology Storage">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: pacsPct > 80 ? '#EF4444' : '#38BDF8', fontFamily: 'monospace' }}>
                {activeQuota.pacsDicomStorageGb.used}
                <span style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 600 }}> / {activeQuota.pacsDicomStorageGb.limit} GB</span>
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: pacsPct > 80 ? '#F87171' : '#38BDF8' }}>
                {pacsPct}% Used
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pacsPct}%`,
                  backgroundColor: pacsPct > 80 ? '#EF4444' : '#38BDF8',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
              <span>AWS S3 Encrypted Storage</span>
              <span>Soft Alert: {activeQuota.pacsDicomStorageGb.softAlertThreshold} GB</span>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Adjust PACS DICOM Limit (GB):
              </label>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={activeQuota.pacsDicomStorageGb.limit}
                onChange={(e) => handleUpdateLimit('pacsDicomStorageGb', parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B' }}>
                <span>5 GB</span>
                <span>250 GB</span>
                <span>500 GB</span>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Scribe Voice Minutes */}
        <Card title="🎙️ Clinical AI Scribe Voice Minutes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: aiPct > 80 ? '#EF4444' : '#A855F7', fontFamily: 'monospace' }}>
                {activeQuota.aiScribeMinutes.used}
                <span style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 600 }}> / {activeQuota.aiScribeMinutes.limit} mins</span>
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: aiPct > 80 ? '#F87171' : '#C084FC' }}>
                {aiPct}% Used
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${aiPct}%`,
                  backgroundColor: aiPct > 80 ? '#EF4444' : '#A855F7',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
              <span>Whisper Large-v3 / Gemini 1.5</span>
              <span>Soft Alert: {activeQuota.aiScribeMinutes.softAlertThreshold} mins</span>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Adjust AI Scribe Monthly Minutes:
              </label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={activeQuota.aiScribeMinutes.limit}
                onChange={(e) => handleUpdateLimit('aiScribeMinutes', parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#A855F7', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B' }}>
                <span>100 mins</span>
                <span>5,000 mins</span>
                <span>10,000 mins</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
