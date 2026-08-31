import React from 'react';
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
import type {
  BillingCashierSessionDto,
  BillingReconciliationDto,
  CashierSessionStatus
} from '@docsearch/api-contracts';

export interface CashierSessionViewProps {
  sessions: BillingCashierSessionDto[];
  reconciliations: BillingReconciliationDto[];
  onOpenSession: () => void;
  onCloseSession: (session: BillingCashierSessionDto) => void;
  onReconcileSession: (session: BillingCashierSessionDto) => void;
}

export const CashierSessionView: React.FC<CashierSessionViewProps> = ({
  sessions,
  reconciliations,
  onOpenSession,
  onCloseSession,
  onReconcileSession
}) => {
  const getSessionStatusBadge = (status: CashierSessionStatus) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="success">DRAWER OPEN</Badge>;
      case 'CLOSED':
        return <Badge variant="warning">CLOSED (UNRECONCILED)</Badge>;
      case 'RECONCILED':
        return <Badge variant="primary">RECONCILED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Cashier Shift & Drawer Operations
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Workstation cash floats, shift lifecycle management, cash drawer balancing, and treasury reconciliation
          </p>
        </div>
        <Button variant="primary" onClick={onOpenSession}>
          + Open Workstation Shift
        </Button>
      </div>

      {/* Cashier Sessions Table */}
      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
          Workstation Shift History
        </h3>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session #</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Opening Float</TableHead>
                <TableHead>Cash Received</TableHead>
                <TableHead>Expected Drawer</TableHead>
                <TableHead>Closing Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((sess) => (
                <TableRow key={sess.id}>
                  <TableCell style={{ fontWeight: 600 }}>{sess.sessionNumber}</TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 500 }}>{sess.cashierName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sess.cashierId}</div>
                  </TableCell>
                  <TableCell>${sess.openingBalance.toFixed(2)}</TableCell>
                  <TableCell style={{ color: '#16a34a', fontWeight: 600 }}>
                    +${sess.cashReceived.toFixed(2)}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>
                    ${sess.expectedClosingBalance.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {sess.closingBalance !== undefined && sess.closingBalance !== null ? (
                      `$${sess.closingBalance.toFixed(2)}`
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>{getSessionStatusBadge(sess.status)}</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      {sess.status === 'OPEN' && (
                        <Button variant="primary" onClick={() => onCloseSession(sess)}>
                          Close Shift
                        </Button>
                      )}
                      {sess.status === 'CLOSED' && (
                        <Button variant="outline" onClick={() => onReconcileSession(sess)}>
                          Reconcile
                        </Button>
                      )}
                      {sess.status === 'RECONCILED' && (
                        <Badge variant="success">BALANCED</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Treasury Reconciliations Log */}
      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
          Treasury End-of-Day Reconciliation Log
        </h3>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Ref</TableHead>
                <TableHead>Expected Amount</TableHead>
                <TableHead>Counted Amount</TableHead>
                <TableHead>Cash Variance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auditor</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell style={{ fontWeight: 600 }}>{rec.sessionNumber}</TableCell>
                  <TableCell>${rec.expectedAmount.toFixed(2)}</TableCell>
                  <TableCell>${rec.actualAmount.toFixed(2)}</TableCell>
                  <TableCell style={{ fontWeight: 600, color: Math.abs(rec.variance) < 0.01 ? '#16a34a' : '#dc2626' }}>
                    {rec.variance >= 0 ? `+$${rec.variance.toFixed(2)}` : `-$${Math.abs(rec.variance).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rec.status === 'MATCHED' ? 'success' : 'danger'}>
                      {rec.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{rec.reconciledBy}</TableCell>
                  <TableCell style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {rec.remarks || 'No remarks recorded'}
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
