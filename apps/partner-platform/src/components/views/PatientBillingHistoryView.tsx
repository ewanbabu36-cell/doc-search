import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  PatientBillingHistoryDto
} from '@docsearch/api-contracts';

export interface PatientBillingHistoryViewProps {
  initialHistory: PatientBillingHistoryDto | null;
  onSearchPatient: (patientId: string) => Promise<PatientBillingHistoryDto | null>;
  onSelectInvoice: (invoiceId: string) => void;
}

export const PatientBillingHistoryView: React.FC<PatientBillingHistoryViewProps> = ({
  initialHistory,
  onSearchPatient,
  onSelectInvoice
}) => {
  const [patientIdInput, setPatientIdInput] = useState(initialHistory?.patientId || '55555555-5555-4555-8555-555555555501');
  const [history, setHistory] = useState<PatientBillingHistoryDto | null>(initialHistory);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientIdInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await onSearchPatient(patientIdInput.trim());
      setHistory(res);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Longitudinal Patient Financial History
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Consolidated patient ledger, statement of accounts, historic payments, unallocated advances, and invoice tracking
        </p>
      </div>

      {/* Patient Search Bar */}
      <Card>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Patient ID / Record Reference
            </label>
            <Input
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value)}
              placeholder="e.g. 55555555-5555-4555-8555-555555555501"
            />
          </div>
          <Button variant="primary" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search Patient Ledger'}
          </Button>
        </form>
      </Card>

      {history ? (
        <>
          {/* Patient Header & Balance Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Card>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Patient Details
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                {history.patientName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>MRN: {history.patientMrn}</div>
            </Card>

            <Card style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Lifetime Billed
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', marginTop: '0.25rem' }}>
                ${history.totalBilled.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Across all visits</div>
            </Card>

            <Card style={{ borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Lifetime Paid
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>
                ${history.totalPaid.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Settled receipts</div>
            </Card>

            <Card style={{ borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Current Balance Due
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: history.currentBalanceDue > 0 ? '#dc2626' : '#16a34a', marginTop: '0.25rem' }}>
                ${history.currentBalanceDue.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Outstanding amount</div>
            </Card>

            <Card style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Available Advance
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6', marginTop: '0.25rem' }}>
                ${history.availableAdvance.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Held on deposit</div>
            </Card>
          </div>

          {/* Invoices Ledger */}
          <Card>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Invoices History ({history.invoices.length})
            </h3>
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Remaining Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        No invoices on record for this patient.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell style={{ fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                        <TableCell><Badge variant="neutral">{inv.invoiceType}</Badge></TableCell>
                        <TableCell>${inv.totalAmount.toFixed(2)}</TableCell>
                        <TableCell style={{ color: '#16a34a', fontWeight: 600 }}>${inv.paidAmount.toFixed(2)}</TableCell>
                        <TableCell style={{ color: inv.dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                          ${inv.dueAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'danger' : 'warning'}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          <Button variant="outline" onClick={() => onSelectInvoice(inv.id)}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Payments & Receipts Ledger */}
          <Card>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Payment & Settlement Receipts ({history.payments.length})
            </h3>
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Invoice Reference</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        No payments on record for this patient.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.payments.map((pmt) => (
                      <TableRow key={pmt.id}>
                        <TableCell style={{ fontWeight: 600 }}>{pmt.paymentNumber}</TableCell>
                        <TableCell><Badge variant="neutral">{pmt.paymentMethod}</Badge></TableCell>
                        <TableCell style={{ fontWeight: 700, color: '#16a34a' }}>${pmt.amount.toFixed(2)}</TableCell>
                        <TableCell>{pmt.invoiceNumber || 'Advance'}</TableCell>
                        <TableCell>{new Date(pmt.receivedAt).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="success">{pmt.status}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      ) : (
        <Card style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Select or search for a patient to view their comprehensive financial history.
        </Card>
      )}
    </div>
  );
};
