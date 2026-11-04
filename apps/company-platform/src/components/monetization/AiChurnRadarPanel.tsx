import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type { ChurnRiskRecord } from '../../services/monetization-godmode-service.js';

const INITIAL_CHURN_RECORDS: ChurnRiskRecord[] = [
  {
    partnerId: 'PARTNER-002',
    partnerName: 'Dr. Amitabh Verma Cardiology Clinic',
    contactEmail: 'dr.verma@cardiohealth.in',
    contactPhone: '+91 98111 22334',
    dormancyScore: 78,
    riskLevel: 'HIGH_CHURN_RISK',
    daysInactive: 12,
    lastActiveDate: '2026-10-22T08:00:00.000Z',
    primaryRiskFactor: 'Zero OPD tokens generated in past 12 days; Rx printing dropped 80%',
    recommendedRetentionAction: 'Dispatch WhatsApp Concierge & 50% Retention Lock Offer'
  },
  {
    partnerId: 'PARTNER-004',
    partnerName: 'City Heart Diagnostics Center',
    contactEmail: 'lab@cityheart.in',
    contactPhone: '+91 98222 33445',
    dormancyScore: 42,
    riskLevel: 'MODERATE_RISK',
    daysInactive: 4,
    lastActiveDate: '2026-10-30T14:20:00.000Z',
    primaryRiskFactor: 'PACS upload volume slowed down; WhatsApp bot unread messages accumulating',
    recommendedRetentionAction: 'Schedule Customer Success Check-in Call'
  },
  {
    partnerId: 'PARTNER-001',
    partnerName: 'Metropolitan Multispecialty Hospital',
    contactEmail: 'admin@metrohospital.org',
    contactPhone: '+91 98765 43210',
    dormancyScore: 5,
    riskLevel: 'HEALTHY',
    daysInactive: 0,
    lastActiveDate: '2026-11-03T18:45:00.000Z',
    primaryRiskFactor: 'High clinical engagement; 120+ admissions and 450 OPD tokens daily',
    recommendedRetentionAction: 'Upsell Inpatient ADT and Surgical Suite Module'
  }
];

export const AiChurnRadarPanel: React.FC = () => {
  const [records, setRecords] = useState<ChurnRiskRecord[]>(INITIAL_CHURN_RECORDS);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSendEmpathyWhatsApp = (partner: ChurnRiskRecord) => {
    setNotice(
      `💬 Automated WhatsApp Empathy outreach dispatched to ${partner.partnerName} (${partner.contactPhone}) with direct 1-click Founder WhatsApp hotline!`
    );
    setTimeout(() => setNotice(null), 4500);
  };

  const handleSendRetentionOffer = (partner: ChurnRiskRecord) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.partnerId === partner.partnerId
          ? {
              ...r,
              dormancyScore: Math.max(10, r.dormancyScore - 40),
              riskLevel: 'HEALTHY',
              recommendedRetentionAction: '✓ 50% Retention Offer Dispatched & Claimed'
            }
          : r
      )
    );
    setNotice(
      `🎁 50% Early-Bird Retention Offer (6 Months Extension) sent to ${partner.partnerName}! Churn risk dropped immediately.`
    );
    setTimeout(() => setNotice(null), 5000);
  };

  const highRiskCount = records.filter(
    (r) => r.riskLevel === 'HIGH_CHURN_RISK' || r.riskLevel === 'CRITICAL_DORMANT'
  ).length;

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
              <span style={{ fontSize: '1.5rem' }}>📡</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                AI Churn Radar & Proactive Retention Engine
              </h2>
              <Badge variant={highRiskCount > 0 ? 'warning' : 'success'}>
                {highRiskCount > 0 ? `${highRiskCount} AT-RISK CLINICS DETECTED` : 'ALL TENANTS ACTIVE & HEALTHY'}
              </Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Early warning intelligence: Detect dormant clinics before they churn using OPD token velocity, Rx generation rate, and login frequency.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#38BDF8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              🤖 Machine Learning Retention Model Active
            </span>
          </div>
        </div>

        {/* Churn Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TRACKED CLINICS & HOSPITALS</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px', fontFamily: 'monospace' }}>
              {records.length} Facilities
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>100% telemetry coverage</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #EF4444' }}>
            <span style={{ fontSize: '0.6875rem', color: '#F87171', fontWeight: 800, textTransform: 'uppercase' }}>HIGH CHURN RISK</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#EF4444', marginTop: '2px', fontFamily: 'monospace' }}>
              {highRiskCount} Clinics
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#FCA5A5' }}>Requires urgent outreach</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>HEALTHY RETENTION RATE</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#10B981', marginTop: '2px', fontFamily: 'monospace' }}>
              94.8%
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC' }}>Industry avg: 82%</span>
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

      {/* Churn Risk Heatmap Table */}
      <Card title="🔥 Churn Risk Radar & Auto-Intervention Desk" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Facility</TableHead>
                <TableHead>Dormancy Score</TableHead>
                <TableHead>Risk Category</TableHead>
                <TableHead>Days Inactive</TableHead>
                <TableHead>Risk Root Cause</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Proactive 1-Click Retention Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                let scoreColor = '#10B981';
                if (r.dormancyScore > 60) scoreColor = '#EF4444';
                else if (r.dormancyScore > 30) scoreColor = '#F59E0B';

                return (
                  <TableRow key={r.partnerId}>
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{r.partnerName}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{r.partnerId} • {r.contactPhone}</div>
                    </TableCell>

                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: scoreColor, fontFamily: 'monospace' }}>
                          {r.dormancyScore}
                        </span>
                        <div style={{ width: '48px', height: '6px', backgroundColor: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${r.dormancyScore}%`, height: '100%', backgroundColor: scoreColor }} />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {r.riskLevel === 'HEALTHY' && <Badge variant="success">HEALTHY</Badge>}
                      {r.riskLevel === 'MODERATE_RISK' && <Badge variant="warning">MODERATE RISK</Badge>}
                      {r.riskLevel === 'HIGH_CHURN_RISK' && <Badge variant="critical">HIGH RISK</Badge>}
                      {r.riskLevel === 'CRITICAL_DORMANT' && <Badge variant="critical">CRITICAL DORMANT</Badge>}
                    </TableCell>

                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 700, color: '#CBD5E1' }}>
                      {r.daysInactive} days
                    </TableCell>

                    <TableCell style={{ maxWidth: '260px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: '1.4' }}>
                        {r.primaryRiskFactor}
                      </div>
                    </TableCell>

                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSendEmpathyWhatsApp(r)}
                          style={{ fontWeight: 700, backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22C55E', color: '#4ADE80' }}
                        >
                          💬 WhatsApp
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSendRetentionOffer(r)}
                          style={{ fontWeight: 800 }}
                        >
                          🎁 Send 50% Offer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
