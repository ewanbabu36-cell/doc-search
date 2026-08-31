import React, { useState } from 'react';
import {
  Card,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  BillingAuditTraceDto,
  BillingFinancialTransactionDto
} from '@docsearch/api-contracts';

export interface BillingAuditVaultViewProps {
  auditTraces: BillingAuditTraceDto[];
  transactions: BillingFinancialTransactionDto[];
}

export const BillingAuditVaultView: React.FC<BillingAuditVaultViewProps> = ({
  auditTraces,
  transactions
}) => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'LEDGER'>('AUDIT');
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState<string>('ALL');

  const filteredAudits = auditTraces.filter((a) => {
    if (operationFilter !== 'ALL' && a.operation !== operationFilter) return false;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchTrace = a.traceId.toLowerCase().includes(lower);
      const matchEntity = a.entityId.toLowerCase().includes(lower);
      const matchReason = a.reason.toLowerCase().includes(lower);
      const matchActor = a.actorId.toLowerCase().includes(lower);
      if (!matchTrace && !matchEntity && !matchReason && !matchActor) return false;
    }
    return true;
  });

  const filteredTransactions = transactions.filter((t) => {
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchTx = t.transactionNumber.toLowerCase().includes(lower);
      const matchRef = t.referenceId.toLowerCase().includes(lower);
      const matchType = t.transactionType.toLowerCase().includes(lower);
      if (!matchTx && !matchRef && !matchType) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Financial Audit Vault & Append-Only Ledger
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Cryptographic tamper-evident financial audit stream and double-entry transaction journals
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('AUDIT')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'AUDIT' ? '#2563eb' : 'transparent',
            color: activeTab === 'AUDIT' ? '#ffffff' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Audit Traces ({auditTraces.length})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'LEDGER' ? '#2563eb' : 'transparent',
            color: activeTab === 'LEDGER' ? '#ffffff' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          General Financial Ledger ({transactions.length})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'AUDIT' ? '3fr 1fr' : '1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              {activeTab === 'AUDIT' ? 'Search Audit Trail' : 'Search Ledger Transactions'}
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'AUDIT'
                  ? 'Search by trace ID, actor, reason, entity...'
                  : 'Search by transaction #, reference ID, type...'
              }
            />
          </div>

          {activeTab === 'AUDIT' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
                Operation Type
              </label>
              <Select
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Operations' },
                  { value: 'CHARGE_CAPTURED', label: 'Charge Captured' },
                  { value: 'INVOICE_CREATED', label: 'Invoice Created' },
                  { value: 'INVOICE_FINALIZED', label: 'Invoice Finalized' },
                  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
                  { value: 'REFUND_REQUESTED', label: 'Refund Requested' },
                  { value: 'REFUND_COMPLETED', label: 'Refund Completed' },
                  { value: 'DISCOUNT_APPLIED', label: 'Discount Applied' },
                  { value: 'CASHIER_OPENED', label: 'Cashier Opened' },
                  { value: 'RECONCILIATION_COMPLETED', label: 'Reconciliation Completed' }
                ]}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Audit Traces Table */}
      {activeTab === 'AUDIT' ? (
        <Card>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trace ID</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Financial Impact</TableHead>
                  <TableHead>Justification</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No audit traces found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAudits.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell style={{ fontWeight: 600, fontSize: '0.8rem' }}>{a.traceId}</TableCell>
                      <TableCell>
                        <Badge variant="neutral">{a.operation}</Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.85rem' }}>
                        <div>{a.actorId}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.actorRole}</div>
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: (a.financialImpact ?? 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                        {(a.financialImpact ?? 0) >= 0 ? `+$${(a.financialImpact ?? 0).toFixed(2)}` : `-$${Math.abs(a.financialImpact ?? 0).toFixed(2)}`}
                      </TableCell>
                      <TableCell style={{ maxWidth: '250px', fontSize: '0.85rem' }}>{a.reason}</TableCell>
                      <TableCell style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(a.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">{a.operationStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* Financial Ledger Table */
        <Card>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Patient / Party</TableHead>
                  <TableHead>Debit ($)</TableHead>
                  <TableHead>Credit ($)</TableHead>
                  <TableHead>Balance Impact</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No ledger transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tx.transactionNumber}</TableCell>
                      <TableCell><Badge variant="neutral">{tx.transactionType}</Badge></TableCell>
                      <TableCell style={{ fontSize: '0.85rem' }}>{tx.referenceId}</TableCell>
                      <TableCell style={{ fontSize: '0.85rem' }}>{tx.patientName || 'General Settlement'}</TableCell>
                      <TableCell style={{ fontWeight: tx.debit > 0 ? 600 : 'normal' }}>
                        {tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell style={{ fontWeight: tx.credit > 0 ? 600 : 'normal', color: tx.credit > 0 ? '#16a34a' : 'inherit' }}>
                        {tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700, color: tx.balanceImpact >= 0 ? '#2563eb' : '#16a34a' }}>
                        {tx.balanceImpact >= 0 ? `+$${tx.balanceImpact.toFixed(2)}` : `-$${Math.abs(tx.balanceImpact).toFixed(2)}`}
                      </TableCell>
                      <TableCell style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(tx.occurredAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
