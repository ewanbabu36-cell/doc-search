import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export interface GmvStreamItem {
  streamName: string;
  grossGmvInr: number;
  transactionCount: number;
  gatewayFeeInr: number;
  platformTakeRateInr: number;
  tdsSection194OInr: number;
  netSettlementInr: number;
}

export const GrossToNetRevenueWaterfallView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'waterfall' | 'tds_ledger'>('waterfall');

  const streams: GmvStreamItem[] = [
    {
      streamName: 'IPD Surgeries & Inpatient Admissions',
      grossGmvInr: 4850000,
      transactionCount: 312,
      gatewayFeeInr: 87300,
      platformTakeRateInr: 121250,
      tdsSection194OInr: 48500,
      netSettlementInr: 4592950
    },
    {
      streamName: 'OPD Doctor Consultations & Tele-Health',
      grossGmvInr: 1420000,
      transactionCount: 2840,
      gatewayFeeInr: 25560,
      platformTakeRateInr: 35500,
      tdsSection194OInr: 14200,
      netSettlementInr: 1344740
    },
    {
      streamName: 'In-House Pharmacy & D2D Smart Refills',
      grossGmvInr: 1980000,
      transactionCount: 3960,
      gatewayFeeInr: 35640,
      platformTakeRateInr: 49500,
      tdsSection194OInr: 19800,
      netSettlementInr: 1875060
    },
    {
      streamName: 'Laboratory & Diagnostic Pathology',
      grossGmvInr: 890000,
      transactionCount: 1780,
      gatewayFeeInr: 16020,
      platformTakeRateInr: 22250,
      tdsSection194OInr: 8900,
      netSettlementInr: 842830
    }
  ];

  const totalGrossGmv = streams.reduce((sum, s) => sum + s.grossGmvInr, 0);
  const totalGatewayFee = streams.reduce((sum, s) => sum + s.gatewayFeeInr, 0);
  const totalTakeRate = streams.reduce((sum, s) => sum + s.platformTakeRateInr, 0);
  const totalTds = streams.reduce((sum, s) => sum + s.tdsSection194OInr, 0);
  const t0FactoringFee = 32500;
  const netDisbursement = totalGrossGmv - totalGatewayFee - totalTakeRate - totalTds - t0FactoringFee;
  const platformNetRevenue = totalTakeRate + t0FactoringFee;

  const tdsLedger = [
    {
      partnerId: 'PARTNER-DELHI-001',
      legalName: 'Apex Heart & Multispeciality Institute LLP',
      gstin: '07AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      grossVal: 3840000,
      tds194O: 38400,
      challan: 'IT-CH-2026-98210',
      status: 'READY_FOR_FILING'
    },
    {
      partnerId: 'PARTNER-BLR-002',
      legalName: 'MediCare Life Sciences Healthcare Ltd',
      gstin: '29BBBBB1111B1Z2',
      pan: 'BBBBB1111B',
      grossVal: 2950000,
      tds194O: 29500,
      challan: 'IT-CH-2026-98211',
      status: 'READY_FOR_FILING'
    },
    {
      partnerId: 'PARTNER-MUM-003',
      legalName: 'Sanjeevani Clinic & Daycare Centers',
      gstin: '27CCCCC2222C1Z8',
      pan: 'CCCCC2222C',
      grossVal: 2350000,
      tds194O: 23500,
      challan: 'IT-CH-2026-98212',
      status: 'FILED_ACKNOWLEDGED'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            Gross-to-Net Revenue Take-Rate Waterfall & Section 194O Ledger
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
            Stripe Connect Architecture • Automatic Auto-Escrow Split • Income Tax Act § 194O Compliance
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant={activeTab === 'waterfall' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('waterfall')}
          >
            📊 GMV Waterfall
          </Button>
          <Button
            variant={activeTab === 'tds_ledger' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('tds_ledger')}
          >
            📋 Section 194O & GSTR-1
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #38BDF8' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 700 }}>
            GROSS NETWORK GMV
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
            ₹{(totalGrossGmv / 100000).toFixed(2)} L
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
            8,892 transactions processed
          </div>
        </Card>

        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 700 }}>
            PLATFORM NET REVENUE (TAKE RATE)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{(platformNetRevenue / 1000).toFixed(1)} K
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '2px' }}>
            2.5% Take-Rate + T-0 Factoring
          </div>
        </Card>

        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 700 }}>
            SECTION 194O TDS DEDUCTED
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            ₹{(totalTds / 1000).toFixed(1)} K
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
            1% Marketplace e-Com Operator
          </div>
        </Card>

        <Card variant="elevated" style={{ padding: '16px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 700 }}>
            NET PARTNER DISBURSEMENTS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#8B5CF6', marginTop: '4px' }}>
            ₹{(netDisbursement / 100000).toFixed(2)} L
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '2px' }}>
            Auto-Escrow Daily Sweep (T+1)
          </div>
        </Card>
      </div>

      {activeTab === 'waterfall' ? (
        <Card variant="elevated" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
            Gross-to-Net Revenue Streams & Deductions
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--ds-color-border, #334155)', color: 'var(--ds-color-text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>GMV Stream</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Gross GMV</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Gateway (1.8%)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Take-Rate (2.5%)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>TDS 194O (1%)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Net Disbursement</th>
                </tr>
              </thead>
              <tbody>
                {streams.map((s) => (
                  <tr key={s.streamName} style={{ borderBottom: '1px solid var(--ds-color-border, #1E293B)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--ds-color-text-primary)' }}>
                      {s.streamName}
                      <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                        {s.transactionCount} transactions
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#38BDF8' }}>
                      ₹{s.grossGmvInr.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#EF4444' }}>
                      -₹{s.gatewayFeeInr.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10B981', fontWeight: 600 }}>
                      +₹{s.platformTakeRateInr.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#F59E0B' }}>
                      -₹{s.tdsSection194OInr.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                      ₹{s.netSettlementInr.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
              Section 194O TDS Deductions & Form 26Q Export
            </h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => alert('📄 Form 26Q Electronic Text File Exported for NSDL e-Gov Portal')}
            >
              📥 Export Form 26Q (NSDL)
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--ds-color-border, #334155)', color: 'var(--ds-color-text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Partner Legal Name</th>
                  <th style={{ padding: '10px 12px' }}>PAN / GSTIN</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Gross E-Com Value</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>1% TDS Deducted</th>
                  <th style={{ padding: '10px 12px' }}>IT Challan Ref</th>
                  <th style={{ padding: '10px 12px' }}>GSTR-1 Status</th>
                </tr>
              </thead>
              <tbody>
                {tdsLedger.map((row) => (
                  <tr key={row.partnerId} style={{ borderBottom: '1px solid var(--ds-color-border, #1E293B)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--ds-color-text-primary)' }}>
                      {row.legalName}
                      <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>{row.partnerId}</div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--ds-color-text-secondary)', fontFamily: 'monospace' }}>
                      {row.pan} / {row.gstin}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>
                      ₹{row.grossVal.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#F59E0B', fontWeight: 700 }}>
                      ₹{row.tds194O.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {row.challan}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Badge variant={row.status === 'FILED_ACKNOWLEDGED' ? 'success' : 'warning'}>
                        {row.status === 'FILED_ACKNOWLEDGED' ? 'Filed' : 'Ready'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
