import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface EscrowSettlement {
  id: string;
  partnerName: string;
  partnerType: 'DOCTOR' | 'HOSPITAL' | 'DIAGNOSTIC_LAB' | 'PHARMACY';
  bankAccountUpi: string;
  grossFulfillmentsInr: number;
  docsearchTakeRatePercent: number;
  netPayoutDueInr: number;
  utrNumber?: string;
  status: 'PENDING_DISBURSEMENT' | 'SETTLED_INSTANT';
}

const INITIAL_SETTLEMENTS: EscrowSettlement[] = [
  {
    id: 'ESC-DOC-01',
    partnerName: 'Dr. Vivek Sengupta (Chief Cardiologist)',
    partnerType: 'DOCTOR',
    bankAccountUpi: 'dr.vivek@okhdfcbank',
    grossFulfillmentsInr: 184000,
    docsearchTakeRatePercent: 15,
    netPayoutDueInr: 156400,
    status: 'PENDING_DISBURSEMENT'
  },
  {
    id: 'ESC-HOSP-02',
    partnerName: 'Apollo Hospitals Chennai (Main Campus)',
    partnerType: 'HOSPITAL',
    bankAccountUpi: 'apollo.escrow@icici',
    grossFulfillmentsInr: 1420000,
    docsearchTakeRatePercent: 10,
    netPayoutDueInr: 1278000,
    status: 'PENDING_DISBURSEMENT'
  },
  {
    id: 'ESC-LAB-03',
    partnerName: 'Care Diagnostics & Pathology Labs',
    partnerType: 'DIAGNOSTIC_LAB',
    bankAccountUpi: 'carediagnostics@hdfcbank',
    grossFulfillmentsInr: 460000,
    docsearchTakeRatePercent: 18,
    netPayoutDueInr: 377200,
    status: 'PENDING_DISBURSEMENT'
  }
];

export const PartnerEscrowRevenueSplitView: React.FC = () => {
  const [settlements, setSettlements] = useState<EscrowSettlement[]>(INITIAL_SETTLEMENTS);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  const totalPendingInr = settlements
    .filter((s) => s.status === 'PENDING_DISBURSEMENT')
    .reduce((acc, s) => acc + s.netPayoutDueInr, 0);

  const handleDisburseSingle = (id: string, name: string) => {
    const utr = `UTR-UPI-${Date.now().toString().slice(-8)}`;
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'SETTLED_INSTANT', utrNumber: utr } : s))
    );
    setPayoutNotice(`✓ Payout of ₹${settlements.find((s) => s.id === id)?.netPayoutDueInr.toLocaleString('en-IN')} transferred to "${name}" via Instant UPI (UTR: ${utr})!`);
    setTimeout(() => setPayoutNotice(null), 5000);
  };

  const handleDisburseAll = () => {
    setSettlements((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'SETTLED_INSTANT',
        utrNumber: `UTR-BATCH-${Math.floor(10000000 + Math.random() * 90000000)}`
      }))
    );
    setPayoutNotice(`✓ All ₹${totalPendingInr.toLocaleString('en-IN')} successfully settled across Doctor & Hospital bank accounts via Instant RTGS/UPI Batch!`);
    setTimeout(() => setPayoutNotice(null), 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>💸</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              Real-Time Partner Escrow Revenue Split & Instant UPI Payout Gateway
            </h2>
            <Badge variant="success">● RBI Compliant Multi-Bank Virtual Escrow</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Automated take-rate commission deduction, doctor consultation payouts, and 1-click batch UPI settlements with instant bank UTR generation.
          </p>
        </div>

        {totalPendingInr > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleDisburseAll}
            style={{
              backgroundColor: '#10B981',
              color: '#070C16',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            ⚡ Settle All ₹{(totalPendingInr / 100000).toFixed(2)}L via Instant UPI / RTGS
          </Button>
        )}
      </div>

      {payoutNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {payoutNotice}
        </div>
      )}

      {/* Top 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            TOTAL REVENUE FULFILLED (30D)
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            ₹ 2.35 Crore
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Across 486 connected healthcare nodes
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #F59E0B', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
            PENDING ESCROW DISBURSEMENT
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#F59E0B', margin: '4px 0', fontFamily: 'monospace' }}>
            ₹ {(totalPendingInr / 100000).toFixed(2)} Lakhs
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Ready for instant T+0 automated bank clearance
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            DOCSEARCH NET COMMISSION TAKEN
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
            ₹ 28.4 Lakhs
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            13.2% Blended platform commission
          </span>
        </div>
      </div>

      {/* Settlements Ledger Table */}
      <Card title="📜 Partner Revenue Escrow Payout Ledger" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Healthcare Partner</TableHead>
                <TableHead>Bank / VPA Account</TableHead>
                <TableHead>Gross Volume</TableHead>
                <TableHead>DocSearch Commission</TableHead>
                <TableHead>Net Payout Amount</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Disbursement Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <strong style={{ color: '#F8FAFC' }}>{s.partnerName}</strong>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>{s.partnerType}</span>
                    </div>
                  </TableCell>

                  <TableCell style={{ fontFamily: 'monospace', color: '#38BDF8', fontSize: '0.8125rem' }}>
                    {s.bankAccountUpi}
                  </TableCell>

                  <TableCell style={{ fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                    ₹ {s.grossFulfillmentsInr.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell style={{ fontWeight: 700, color: '#94A3B8' }}>
                    {s.docsearchTakeRatePercent}% (₹ {Math.round(s.grossFulfillmentsInr * (s.docsearchTakeRatePercent / 100)).toLocaleString('en-IN')})
                  </TableCell>

                  <TableCell style={{ fontWeight: 900, color: '#10B981', fontFamily: 'monospace', fontSize: '0.9375rem' }}>
                    ₹ {s.netPayoutDueInr.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    {s.status === 'PENDING_DISBURSEMENT' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDisburseSingle(s.id, s.partnerName)}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#070C16',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '4px 10px'
                        }}
                      >
                        ⚡ Disburse UPI
                      </Button>
                    ) : (
                      <div>
                        <Badge variant="success">✓ SETTLED</Badge>
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', fontFamily: 'monospace', marginTop: '2px' }}>
                          {s.utrNumber}
                        </span>
                      </div>
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
