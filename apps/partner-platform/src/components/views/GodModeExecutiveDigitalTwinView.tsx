import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface DigitalTwinData {
  timestamp: string;
  grossBillingToday: number;
  cashCollectionsToday: number;
  tpaInsurancePending: number;
  digitalTwin: {
    liveOccupancyRate: number;
    totalBeds: number;
    occupiedBeds: number;
    chamberQueueThroughput: {
      activeDoctors: number;
      totalConsultationsCompleted: number;
      patientsInQueue: number;
      avgWaitTimeMinutes: number;
    };
    otUtilizationRate: number;
    activeOtSuites: number;
  };
  pnlSnapshot: {
    period: string;
    grossRevenue: number;
    doctorShareAccrued: number;
    doctorShareClawedBack: number;
    pharmacyCogs: number;
    staffAndOverhead: number;
    netEbitda: number;
    ebitdaMarginPercentage: number;
  };
  statutoryCompliance: {
    gstr1FilingStatus: string;
    irdaiRecoveryRate: number;
    cctvAuditCompliance: string;
  };
}

export const GodModeExecutiveDigitalTwinView: React.FC = () => {
  const [data, setData] = useState<DigitalTwinData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clawbackMessage, setClawbackMessage] = useState<string | null>(null);
  const [isClawingBack, setIsClawingBack] = useState(false);
  const [exportingPnl, setExportingPnl] = useState(false);

  const fetchTwinData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/partner/billing/executive/live-digital-twin');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to fetch executive digital twin.');
      }
      setData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading digital twin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwinData();
    const interval = setInterval(fetchTwinData, 30000); // 30s live telemetry poll
    return () => clearInterval(interval);
  }, []);

  const handleExecuteDoctorClawback = async () => {
    setIsClawingBack(true);
    setClawbackMessage(null);
    try {
      const res = await fetch('/api/v1/partner/billing/doctor-payouts/clawback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: 'doc-ortho-007',
          doctorName: 'Dr. Vikram Malhotra (Orthopedic Surgeon)',
          originalInvoiceId: 'INV-2026-REFUND-001',
          refundAmount: 85000,
          commissionPercentage: 20.0,
          cancellationReason: 'Patient cancelled elective revision knee arthroplasty due to medical contraindication.'
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to execute commission clawback.');
      }
      setClawbackMessage(`✅ Reversal executed: Debit Note ${json.data.debitNoteReference} generated for ₹${json.data.clawbackAmount.toLocaleString('en-IN')}. Accrued payout deducted from Dr. Malhotra's cycle.`);
      fetchTwinData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Clawback failed.');
    } finally {
      setIsClawingBack(false);
    }
  };

  const handleDownloadPnlExport = async () => {
    setExportingPnl(true);
    try {
      const res = await fetch('/api/v1/partner/billing/executive/automated-pnl-export');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to generate P&L export.');
      }
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocSearch_Statutory_GSTR1_PnL_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExportingPnl(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
              God-Mode Executive Digital Twin & Real-Time P&L Wall
            </h2>
            <Badge variant="success">LIVE TELEMETRY</Badge>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Institutional financial pulse: Gross collection telemetry, real-time EBITDA margins, doctor commission clawback, and GSTR-1 export.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={fetchTwinData} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh Pulse'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownloadPnlExport} disabled={exportingPnl}>
            {exportingPnl ? 'Generating...' : '📥 GSTR-1 & P&L Export'}
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {clawbackMessage && <Alert type="success">{clawbackMessage}</Alert>}

      {data && (
        <>
          {/* Top 3 High-Impact Financial Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <Card style={{ padding: '1.25rem', borderLeft: '4px solid #10b981', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Gross Hospital Billing (Today)
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                ₹{data.grossBillingToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 600 }}>
                ↑ 14.8% vs last week average
              </div>
            </Card>

            <Card style={{ padding: '1.25rem', borderLeft: '4px solid #2563eb', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Realized Cash & UPI Collections
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                ₹{data.cashCollectionsToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.5rem', fontWeight: 600 }}>
                62.2% Liquidity Conversion Rate
              </div>
            </Card>

            <Card style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Pending TPA Insurance Receivables
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                ₹{data.tpaInsurancePending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.5rem', fontWeight: 600 }}>
                IRDAI SLA Recovery Rate: {data.statutoryCompliance.irdaiRecoveryRate}%
              </div>
            </Card>
          </div>

          {/* Operational Digital Twin Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Live Hospital Occupancy & Acuity */}
            <Card style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                  🏥 Live Bed Occupancy Heatmap
                </span>
                <Badge variant="info">{data.digitalTwin.liveOccupancyRate}% Occupied</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Occupied Inpatient Beds</span>
                  <span style={{ fontWeight: 700 }}>{data.digitalTwin.occupiedBeds} / {data.digitalTwin.totalBeds} Beds</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${data.digitalTwin.liveOccupancyRate}%`, height: '100%', backgroundColor: '#0284c7' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>OT Suite Utilization</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{data.digitalTwin.otUtilizationRate}%</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981' }}>{data.digitalTwin.activeOtSuites} Suites Active</div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>OPD Queue Pace</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                      {data.digitalTwin.chamberQueueThroughput.avgWaitTimeMinutes}m Wait
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {data.digitalTwin.chamberQueueThroughput.activeDoctors} Doctors Active
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Real-Time P&L Wall */}
            <Card style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                  📊 Real-Time Institutional P&L Statement
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{data.pnlSnapshot.period}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#475569' }}>Gross Clinical & Pharmacy Revenue</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>+₹{data.pnlSnapshot.grossRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#475569' }}>Doctor Commission Accruals</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>-₹{data.pnlSnapshot.doctorShareAccrued.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#475569' }}>Doctor Commission Clawbacks (Refunds)</span>
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>+₹{data.pnlSnapshot.doctorShareClawedBack.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#475569' }}>Pharmacy COGS (B2B Bulk Direct)</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>-₹{data.pnlSnapshot.pharmacyCogs.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#475569' }}>Nursing, Paramedical & Facility Overhead</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>-₹{data.pnlSnapshot.staffAndOverhead.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '2px solid #e2e8f0', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Net Operational EBITDA</span>
                  <span style={{ fontWeight: 800, color: '#16a34a' }}>
                    ₹{data.pnlSnapshot.netEbitda.toLocaleString('en-IN')} ({data.pnlSnapshot.ebitdaMarginPercentage}%)
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Pillar 2 Action Bench: Doctor Commission Clawback Engine */}
          <Card style={{ padding: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                  ⚖️ Event-Driven Doctor Commission Reversal & Clawback Engine
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  When patient bills are refunded or cancelled, hospital automatically claws back doctor payouts, creating GST debit notes.
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteDoctorClawback}
                disabled={isClawingBack}
              >
                {isClawingBack ? 'Processing Clawback...' : '⚡ Simulate Doctor Payout Clawback (₹17,000)'}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
