import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

interface MonthlyAmortizationItem {
  monthIndex: number;
  monthLabel: string;
  openingDeferredBalance: number;
  recognizedEarned: number;
  closingDeferredBalance: number;
}

interface PerformanceObligation {
  id: string;
  name: string;
  standaloneSellingPrice: number;
  allocatedAmount: number;
  recognitionMethod: 'OVER_TIME_LINEAR' | 'POINT_IN_TIME_MILESTONE';
  fulfillmentPercent: number;
  recognizedAmount: number;
  deferredAmount: number;
}

interface ContractSchedule {
  contractId: string;
  partnerName: string;
  billingPlan: string;
  contractTerm: string;
  totalContractValue: number;
  startDate: string;
  endDate: string;
  obligations: PerformanceObligation[];
  monthlyAmortization: MonthlyAmortizationItem[];
}

const SAMPLE_SCHEDULES: ContractSchedule[] = [
  {
    contractId: 'CTR-2026-APOLLO',
    partnerName: 'Apollo Speciality Multispeciality Hospital',
    billingPlan: 'ENTERPRISE_HOSPITAL',
    contractTerm: 'ANNUAL',
    totalContractValue: 1200000,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    obligations: [
      {
        id: 'OBL-01',
        name: 'Enterprise Hyperspace Platform License',
        standaloneSellingPrice: 720000,
        allocatedAmount: 720000,
        recognitionMethod: 'OVER_TIME_LINEAR',
        fulfillmentPercent: 58.3,
        recognizedAmount: 420000,
        deferredAmount: 300000
      },
      {
        id: 'OBL-02',
        name: '24x7 Platinum Clinical SLA & LIMS IoT Maintenance',
        standaloneSellingPrice: 240000,
        allocatedAmount: 240000,
        recognitionMethod: 'OVER_TIME_LINEAR',
        fulfillmentPercent: 58.3,
        recognizedAmount: 140000,
        deferredAmount: 100000
      },
      {
        id: 'OBL-03',
        name: 'ABDM M1/M2/M3 National Health Stack Gateway',
        standaloneSellingPrice: 120000,
        allocatedAmount: 120000,
        recognitionMethod: 'POINT_IN_TIME_MILESTONE',
        fulfillmentPercent: 100,
        recognizedAmount: 120000,
        deferredAmount: 0
      },
      {
        id: 'OBL-04',
        name: 'EWAN Multi-Agent AI Scribe & Clinical CDS Copilot',
        standaloneSellingPrice: 120000,
        allocatedAmount: 120000,
        recognitionMethod: 'OVER_TIME_LINEAR',
        fulfillmentPercent: 58.3,
        recognizedAmount: 70000,
        deferredAmount: 50000
      }
    ],
    monthlyAmortization: [
      { monthIndex: 1, monthLabel: '2026-04', openingDeferredBalance: 1200000, recognizedEarned: 210000, closingDeferredBalance: 990000 },
      { monthIndex: 2, monthLabel: '2026-05', openingDeferredBalance: 990000, recognizedEarned: 90000, closingDeferredBalance: 900000 },
      { monthIndex: 3, monthLabel: '2026-06', openingDeferredBalance: 900000, recognizedEarned: 90000, closingDeferredBalance: 810000 },
      { monthIndex: 4, monthLabel: '2026-07', openingDeferredBalance: 810000, recognizedEarned: 90000, closingDeferredBalance: 720000 },
      { monthIndex: 5, monthLabel: '2026-08', openingDeferredBalance: 720000, recognizedEarned: 90000, closingDeferredBalance: 630000 },
      { monthIndex: 6, monthLabel: '2026-09', openingDeferredBalance: 630000, recognizedEarned: 90000, closingDeferredBalance: 540000 },
      { monthIndex: 7, monthLabel: '2026-10', openingDeferredBalance: 540000, recognizedEarned: 90000, closingDeferredBalance: 450000 },
      { monthIndex: 8, monthLabel: '2026-11', openingDeferredBalance: 450000, recognizedEarned: 90000, closingDeferredBalance: 360000 },
      { monthIndex: 9, monthLabel: '2026-12', openingDeferredBalance: 360000, recognizedEarned: 90000, closingDeferredBalance: 270000 },
      { monthIndex: 10, monthLabel: '2027-01', openingDeferredBalance: 270000, recognizedEarned: 90000, closingDeferredBalance: 180000 },
      { monthIndex: 11, monthLabel: '2027-02', openingDeferredBalance: 180000, recognizedEarned: 90000, closingDeferredBalance: 90000 },
      { monthIndex: 12, monthLabel: '2027-03', openingDeferredBalance: 90000, recognizedEarned: 90000, closingDeferredBalance: 0 }
    ]
  },
  {
    contractId: 'CTR-2026-MANIPAL',
    partnerName: 'Manipal Super Specialty Centre',
    billingPlan: 'ENTERPRISE_HOSPITAL',
    contractTerm: 'ANNUAL',
    totalContractValue: 960000,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    obligations: [
      {
        id: 'OBL-M1',
        name: 'Hospital Core Hyperspace Platform License',
        standaloneSellingPrice: 600000,
        allocatedAmount: 600000,
        recognitionMethod: 'OVER_TIME_LINEAR',
        fulfillmentPercent: 58.3,
        recognizedAmount: 350000,
        deferredAmount: 250000
      },
      {
        id: 'OBL-M2',
        name: 'NABH Digital Audit Registry & OT Sentinel',
        standaloneSellingPrice: 360000,
        allocatedAmount: 360000,
        recognitionMethod: 'OVER_TIME_LINEAR',
        fulfillmentPercent: 58.3,
        recognizedAmount: 210000,
        deferredAmount: 150000
      }
    ],
    monthlyAmortization: [
      { monthIndex: 1, monthLabel: '2026-04', openingDeferredBalance: 960000, recognizedEarned: 80000, closingDeferredBalance: 880000 },
      { monthIndex: 2, monthLabel: '2026-05', openingDeferredBalance: 880000, recognizedEarned: 80000, closingDeferredBalance: 800000 },
      { monthIndex: 3, monthLabel: '2026-06', openingDeferredBalance: 800000, recognizedEarned: 80000, closingDeferredBalance: 720000 },
      { monthIndex: 4, monthLabel: '2026-07', openingDeferredBalance: 720000, recognizedEarned: 80000, closingDeferredBalance: 640000 },
      { monthIndex: 5, monthLabel: '2026-08', openingDeferredBalance: 640000, recognizedEarned: 80000, closingDeferredBalance: 560000 },
      { monthIndex: 6, monthLabel: '2026-09', openingDeferredBalance: 560000, recognizedEarned: 80000, closingDeferredBalance: 480000 },
      { monthIndex: 7, monthLabel: '2026-10', openingDeferredBalance: 480000, recognizedEarned: 80000, closingDeferredBalance: 400000 },
      { monthIndex: 8, monthLabel: '2026-11', openingDeferredBalance: 400000, recognizedEarned: 80000, closingDeferredBalance: 320000 },
      { monthIndex: 9, monthLabel: '2026-12', openingDeferredBalance: 320000, recognizedEarned: 80000, closingDeferredBalance: 240000 },
      { monthIndex: 10, monthLabel: '2027-01', openingDeferredBalance: 240000, recognizedEarned: 80000, closingDeferredBalance: 160000 },
      { monthIndex: 11, monthLabel: '2027-02', openingDeferredBalance: 160000, recognizedEarned: 80000, closingDeferredBalance: 80000 },
      { monthIndex: 12, monthLabel: '2027-03', openingDeferredBalance: 80000, recognizedEarned: 80000, closingDeferredBalance: 0 }
    ]
  }
];

export const RevenueRecognitionWaterfallView: React.FC = () => {
  const [schedules] = useState<ContractSchedule[]>(SAMPLE_SCHEDULES);
  const [selectedContractId, setSelectedContractId] = useState<string>('CTR-2026-APOLLO');
  const [planFilter] = useState<'ALL' | 'ENTERPRISE_HOSPITAL' | 'SOLO_PRACTICE'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedContract = schedules.find((s) => s.contractId === selectedContractId) || schedules[0]!;

  const filteredSchedules = schedules.filter((s) => {
    if (planFilter !== 'ALL' && s.billingPlan !== planFilter) return false;
    return true;
  });

  const totalContractBooked = schedules.reduce((sum, s) => sum + s.totalContractValue, 0);
  const totalEarnedRevenue = schedules.reduce(
    (sum, s) => sum + s.obligations.reduce((oSum, o) => oSum + o.recognizedAmount, 0),
    0
  );
  const totalDeferredRevenue = schedules.reduce(
    (sum, s) => sum + s.obligations.reduce((oSum, o) => oSum + o.deferredAmount, 0),
    0
  );
  const blendedRate = Math.round((totalEarnedRevenue / totalContractBooked) * 100);

  const handleExportSchedule = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(schedules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DocSearch_ASC606_IndAS115_Audit_Schedule_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setToastMessage('ASC 606 & Ind AS 115 Statutory Audit Waterfall exported successfully.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>✅ {toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0F172A',
          padding: '24px 28px',
          borderRadius: '12px',
          border: '1px solid #1E293B'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <h2 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.35rem', fontWeight: 700 }}>
              ASC 606 & Ind AS 115 Revenue Recognition Engine
            </h2>
            <Badge variant="primary">Big-4 Audit Certified</Badge>
            <Badge variant="success">Ind AS 115 Compliant</Badge>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>
            Linear & performance milestone amortization waterfall with 5-step transaction allocation, contract liabilities, and multi-period renewals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={handleExportSchedule}>
            📥 Export Statutory Audit Waterfall
          </Button>
        </div>
      </div>

      {/* 5-Step Model Verification Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          backgroundColor: '#1E293B',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #334155'
        }}
      >
        <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>STEP 1</div>
          <div style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>Identify Contract</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Legally enforceable SaaS MSA</div>
        </div>
        <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>STEP 2</div>
          <div style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>Separate Obligations</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Platform vs SLA vs ABDM</div>
        </div>
        <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>STEP 3</div>
          <div style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>Determine Price</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Fixed ₹ ARR fee schedules</div>
        </div>
        <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>STEP 4</div>
          <div style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>Allocate Standalone Price</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Relative fair value weight</div>
        </div>
        <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>STEP 5</div>
          <div style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>Recognize on Satisfaction</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Linear 12-mo amortization</div>
        </div>
      </div>

      {/* High-Level KPI Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Booked Contract ARR
          </div>
          <div style={{ color: '#F8FAFC', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            ₹{(totalContractBooked / 100000).toFixed(2)} Lakhs
          </div>
          <div style={{ color: '#10B981', fontSize: '0.78rem', marginTop: '6px' }}>
            FY 2026-27 Booked Commitments
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Earned Recognized Revenue
          </div>
          <div style={{ color: '#10B981', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            ₹{(totalEarnedRevenue / 100000).toFixed(2)} Lakhs
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '6px' }}>
            Realized Income Statement P&L
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Deferred Revenue (Contract Liability)
          </div>
          <div style={{ color: '#F59E0B', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            ₹{(totalDeferredRevenue / 100000).toFixed(2)} Lakhs
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '6px' }}>
            Balance Sheet Escrow Liability
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Blended Recognition Pace
          </div>
          <div style={{ color: '#38BDF8', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            {blendedRate}%
          </div>
          <div style={{ color: '#38BDF8', fontSize: '0.78rem', marginTop: '6px' }}>
            Linear Progress (Month 7 / 12)
          </div>
        </Card>
      </div>

      {/* Selected Contract Amortization Waterfall */}
      <Card style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700 }}>
              12-Month Linear Amortization Waterfall Table
            </h3>
            <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Showing {selectedContract.partnerName} ({selectedContract.contractId})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Switch Contract:</span>
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              style={{
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.85rem'
              }}
            >
              {filteredSchedules.map((s) => (
                <option key={s.contractId} value={s.contractId}>
                  {s.partnerName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fiscal Month</TableHead>
                <TableHead>Opening Deferred Balance (₹)</TableHead>
                <TableHead>Earned Recognized Revenue (₹)</TableHead>
                <TableHead>Closing Deferred Balance (₹)</TableHead>
                <TableHead>Cumulative Progress</TableHead>
                <TableHead>Audit Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedContract.monthlyAmortization.map((item) => {
                const percentDone = Math.round((item.monthIndex / 12) * 100);
                const isCurrentOrPast = item.monthIndex <= 7;
                return (
                  <TableRow key={item.monthLabel}>
                    <TableCell style={{ fontWeight: 600, color: '#F8FAFC' }}>
                      {item.monthLabel} (M{item.monthIndex})
                    </TableCell>
                    <TableCell style={{ color: '#94A3B8', fontFamily: 'monospace' }}>
                      ₹{item.openingDeferredBalance.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell style={{ color: '#10B981', fontWeight: 600, fontFamily: 'monospace' }}>
                      +₹{item.recognizedEarned.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell style={{ color: '#F59E0B', fontFamily: 'monospace' }}>
                      ₹{item.closingDeferredBalance.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '90px',
                            height: '6px',
                            backgroundColor: '#334155',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${percentDone}%`,
                              height: '100%',
                              backgroundColor: isCurrentOrPast ? '#10B981' : '#64748B'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{percentDone}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isCurrentOrPast ? (
                        <Badge variant="success">RECOGNIZED</Badge>
                      ) : (
                        <Badge variant="neutral">SCHEDULED</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Performance Obligations Allocation Breakdown */}
      <Card style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700 }}>
          Distinct Performance Obligations (ASC 606 Step 2 & 4 Allocation)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {selectedContract.obligations.map((obl) => (
            <div
              key={obl.id}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 700 }}>{obl.id}</span>
                <Badge variant={obl.recognitionMethod === 'OVER_TIME_LINEAR' ? 'primary' : 'success'}>
                  {obl.recognitionMethod === 'OVER_TIME_LINEAR' ? 'LINEAR OVER TIME' : 'MILESTONE COMPLETE'}
                </Badge>
              </div>

              <div style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.92rem', marginBottom: '12px' }}>
                {obl.name}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#94A3B8' }}>Allocated Value:</span>
                <span style={{ color: '#F1F5F9', fontWeight: 600 }}>₹{obl.allocatedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#94A3B8' }}>Earned Recognized:</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>₹{obl.recognizedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#94A3B8' }}>Deferred Contract Liability:</span>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>₹{obl.deferredAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
