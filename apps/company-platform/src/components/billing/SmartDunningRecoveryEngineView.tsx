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

interface DunningItem {
  id: string;
  invoiceNumber: string;
  partnerName: string;
  amountDue: number;
  dueDate: string;
  failedAttempts: number;
  maxAttempts: number;
  lastFailedReason: string;
  paymentRail: 'UPI_AUTOPAY' | 'E_NACH_MANDATE' | 'CORPORATE_CARD' | 'NEFT_ESCROW';
  currentStage: 'STAGE_1_SOFT_REMINDER' | 'STAGE_2_GRACE_PERIOD' | 'STAGE_3_THROTTLING_WARNING' | 'STAGE_4_SUSPENSION_CHURN_MITIGATION';
  nextSmartRetry: string;
  recoveryProbability: number;
  status: 'RECOVERING' | 'RECOVERED' | 'PROMO_WAIVED';
}

const INITIAL_DUNNING_QUEUE: DunningItem[] = [
  {
    id: 'DUN-001',
    invoiceNumber: 'INV-2026-0982',
    partnerName: 'Care Plus Multispeciality Bangalore',
    amountDue: 24999,
    dueDate: '2026-11-01',
    failedAttempts: 2,
    maxAttempts: 4,
    lastFailedReason: 'BANK_SERVER_TIMEOUT (HDFC NPCI Gateway)',
    paymentRail: 'E_NACH_MANDATE',
    currentStage: 'STAGE_2_GRACE_PERIOD',
    nextSmartRetry: 'Today at 10:15 AM (Corporate Liquidity Peak)',
    recoveryProbability: 92,
    status: 'RECOVERING'
  },
  {
    id: 'DUN-002',
    invoiceNumber: 'INV-2026-1044',
    partnerName: 'Dr. Sharma Advanced Paediatric Centre',
    amountDue: 3999,
    dueDate: '2026-11-02',
    failedAttempts: 1,
    maxAttempts: 4,
    lastFailedReason: 'UPI_AUTOPAY_INSUFFICIENT_FUNDS (ICICI VPA)',
    paymentRail: 'UPI_AUTOPAY',
    currentStage: 'STAGE_1_SOFT_REMINDER',
    nextSmartRetry: 'Today at 08:30 PM (Evening Balance Recharge)',
    recoveryProbability: 85,
    status: 'RECOVERING'
  },
  {
    id: 'DUN-003',
    invoiceNumber: 'INV-2026-0811',
    partnerName: 'LifeLine Central Pathology Lab Pune',
    amountDue: 14500,
    dueDate: '2026-10-25',
    failedAttempts: 3,
    maxAttempts: 4,
    lastFailedReason: 'CARD_SECURITY_BLOCKED (Corporate Visa Limit)',
    paymentRail: 'CORPORATE_CARD',
    currentStage: 'STAGE_3_THROTTLING_WARNING',
    nextSmartRetry: 'Tomorrow at 11:00 AM',
    recoveryProbability: 71,
    status: 'RECOVERING'
  },
  {
    id: 'DUN-004',
    invoiceNumber: 'INV-2026-0722',
    partnerName: 'Sunrise Women & Child Hospital Hyderabad',
    amountDue: 35000,
    dueDate: '2026-10-18',
    failedAttempts: 4,
    maxAttempts: 4,
    lastFailedReason: 'MANDATE_REVOKED_CUSTOMER_ACCOUNT',
    paymentRail: 'E_NACH_MANDATE',
    currentStage: 'STAGE_4_SUSPENSION_CHURN_MITIGATION',
    nextSmartRetry: 'Awaiting Retention Hardship Offer',
    recoveryProbability: 64,
    status: 'RECOVERING'
  }
];

export const SmartDunningRecoveryEngineView: React.FC = () => {
  const [queue, setQueue] = useState<DunningItem[]>(INITIAL_DUNNING_QUEUE);
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredQueue = queue.filter((item) => {
    if (selectedStage !== 'ALL' && item.currentStage !== selectedStage) return false;
    return true;
  });

  const activeAtRisk = queue
    .filter((q) => q.status === 'RECOVERING')
    .reduce((sum, q) => sum + q.amountDue, 0);

  const handleRetryNow = (item: DunningItem) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'RECOVERED' } : q))
    );
    setToastMessage(`⚡ Instant charge retry succeeded for ${item.partnerName} (₹${item.amountDue.toLocaleString('en-IN')}) via Secondary HDFC Mandate fallback!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApplyWaiver = (item: DunningItem) => {
    const discounted = Math.round(item.amountDue * 0.8);
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, amountDue: discounted, status: 'PROMO_WAIVED' } : q))
    );
    setToastMessage(`🎁 Applied 20% Founder Retention Waiver for ${item.partnerName}. Balance ₹${discounted.toLocaleString('en-IN')} deferred to next billing cycle.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
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
          <span>{toastMessage}</span>
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
            <span style={{ fontSize: '1.4rem' }}>🔄</span>
            <h2 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.35rem', fontWeight: 700 }}>
              AI Smart Dunning & Recurring Payment Recovery Engine
            </h2>
            <Badge variant="primary">Stripe Billing Benchmark</Badge>
            <Badge variant="success">88.4% Auto Recovery Rate</Badge>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>
            Multi-stage progressive dunning for UPI Autopay, e-NACH Mandates & Corporate Cards with liquidity-aware ML retry schedules.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Recovery Success Rate
          </div>
          <div style={{ color: '#10B981', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            88.4%
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '6px' }}>
            +14.2% vs standard static retry
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            At-Risk In Dunning
          </div>
          <div style={{ color: '#F59E0B', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            ₹{activeAtRisk.toLocaleString('en-IN')}
          </div>
          <div style={{ color: '#F59E0B', fontSize: '0.78rem', marginTop: '6px' }}>
            {queue.filter((q) => q.status === 'RECOVERING').length} partner accounts pending
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Recovered ARR (Month-to-Date)
          </div>
          <div style={{ color: '#38BDF8', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            ₹58.38 Lakhs
          </div>
          <div style={{ color: '#38BDF8', fontSize: '0.78rem', marginTop: '6px' }}>
            142 hospital accounts salvaged
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Average Recovery Cycle
          </div>
          <div style={{ color: '#A855F7', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            2.8 Days
          </div>
          <div style={{ color: '#A855F7', fontSize: '0.78rem', marginTop: '6px' }}>
            Zero clinical downtime caused
          </div>
        </Card>
      </div>

      {/* Dunning Stage Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        {[
          { id: 'ALL', label: 'All Invoices' },
          { id: 'STAGE_1_SOFT_REMINDER', label: 'Stage 1: Soft Reminder (Day 1)' },
          { id: 'STAGE_2_GRACE_PERIOD', label: 'Stage 2: Grace Period (Day 3)' },
          { id: 'STAGE_3_THROTTLING_WARNING', label: 'Stage 3: Throttling Alert (Day 7)' },
          { id: 'STAGE_4_SUSPENSION_CHURN_MITIGATION', label: 'Stage 4: Suspension & Retention (Day 14)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStage(tab.id)}
            style={{
              backgroundColor: selectedStage === tab.id ? '#38BDF8' : '#1E293B',
              color: selectedStage === tab.id ? '#0F172A' : '#94A3B8',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Dunning Queue Table */}
      <Card style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700 }}>
          Live Failed Charge Queue & Smart Retry Execution
        </h3>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice & Partner</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Rail</TableHead>
                <TableHead>Failure Reason</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead>ML Recovery Score</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.partnerName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{item.invoiceNumber} • Due: {item.dueDate}</div>
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: '#F8FAFC', fontFamily: 'monospace' }}>
                    ₹{item.amountDue.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">
                      {item.paymentRail.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.78rem', color: '#EF4444', maxWidth: '200px' }}>
                    {item.lastFailedReason}
                    <div style={{ color: '#94A3B8', fontSize: '0.74rem', marginTop: '3px' }}>
                      Next: {item.nextSmartRetry}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'RECOVERED'
                          ? 'success'
                          : item.status === 'PROMO_WAIVED'
                          ? 'primary'
                          : item.currentStage.includes('STAGE_4')
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {item.status === 'RECOVERED'
                        ? 'RECOVERED'
                        : item.status === 'PROMO_WAIVED'
                        ? 'WAIVER APPLIED'
                        : item.currentStage.split('_')[1] + ' ' + item.currentStage.split('_')[2]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '70px',
                          height: '6px',
                          backgroundColor: '#334155',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${item.recoveryProbability}%`,
                            height: '100%',
                            backgroundColor: item.recoveryProbability >= 80 ? '#10B981' : item.recoveryProbability >= 70 ? '#F59E0B' : '#EF4444'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F8FAFC' }}>
                        {item.recoveryProbability}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.status === 'RECOVERING' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="primary"
                          onClick={() => handleRetryNow(item)}
                          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                        >
                          ⚡ Retry Now
                        </Button>
                        {item.currentStage === 'STAGE_4_SUSPENSION_CHURN_MITIGATION' && (
                          <Button
                            variant="secondary"
                            onClick={() => handleApplyWaiver(item)}
                            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                          >
                            🎁 20% Hardship Waiver
                          </Button>
                        )}
                      </div>
                    ) : item.status === 'RECOVERED' ? (
                      <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>✅ Resolved</span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600 }}>🎁 Retention Active</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
