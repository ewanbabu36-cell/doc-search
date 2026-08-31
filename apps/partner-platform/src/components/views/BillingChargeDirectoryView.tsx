import React, { useState } from 'react';
import {
  Card,
  Button,
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
  BillingChargeDto,
  ChargeStatus,
  ChargeSourceDomain
} from '@docsearch/api-contracts';

export interface BillingChargeDirectoryViewProps {
  charges: BillingChargeDto[];
  onOpenCaptureCharge: () => void;
  onCreateInvoiceFromCharge: (charge: BillingChargeDto) => void;
}

export const BillingChargeDirectoryView: React.FC<BillingChargeDirectoryViewProps> = ({
  charges,
  onOpenCaptureCharge,
  onCreateInvoiceFromCharge
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  const filteredCharges = charges.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (domainFilter !== 'ALL' && c.sourceDomain !== domainFilter) return false;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchNumber = c.chargeNumber.toLowerCase().includes(lower);
      const matchPatient = c.patientName.toLowerCase().includes(lower) || c.patientMrn.toLowerCase().includes(lower);
      const matchItem = c.items.some((it) => it.description.toLowerCase().includes(lower));
      if (!matchNumber && !matchPatient && !matchItem) return false;
    }
    return true;
  });

  const getSourceDomainBadge = (domain: ChargeSourceDomain) => {
    switch (domain) {
      case 'CLINICAL_CONSULTATION':
        return <Badge variant="primary">CONSULTATION</Badge>;
      case 'CLINICAL_INVESTIGATION':
        return <Badge variant="warning">INVESTIGATION</Badge>;
      case 'PHARMACY':
        return <Badge variant="success">PHARMACY</Badge>;
      case 'PROCEDURE':
        return <Badge variant="neutral">PROCEDURE</Badge>;
      case 'EMERGENCY':
        return <Badge variant="danger">EMERGENCY</Badge>;
      default:
        return <Badge variant="neutral">{domain}</Badge>;
    }
  };

  const getStatusBadge = (status: ChargeStatus) => {
    switch (status) {
      case 'CAPTURED':
        return <Badge variant="primary">CAPTURED</Badge>;
      case 'INVOICED':
        return <Badge variant="success">INVOICED</Badge>;
      case 'CANCELLED':
      case 'REVERSED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Point-of-Care Charge Directory
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Canonical charge stream capturing billable events across Consultation (2.6), Diagnostics (2.7), Pharmacy (2.8), and Procedures
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCaptureCharge}>
          + Capture Clinical Charge
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Charges
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by charge #, patient name, MRN, or service description..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Domain
            </label>
            <Select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Source Domains' },
                { value: 'CLINICAL_CONSULTATION', label: 'Consultation' },
                { value: 'CLINICAL_INVESTIGATION', label: 'Investigation / Lab' },
                { value: 'PHARMACY', label: 'Pharmacy & Dispensing' },
                { value: 'PROCEDURE', label: 'Procedures' },
                { value: 'EMERGENCY', label: 'Emergency Room' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Charge Statuses' },
                { value: 'CAPTURED', label: 'Captured (Unbilled)' },
                { value: 'INVOICED', label: 'Invoiced' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Charges Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Charge #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Source Domain</TableHead>
                <TableHead>Billed Line Items</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Captured By</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No charge records match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCharges.map((ch) => (
                  <TableRow key={ch.id}>
                    <TableCell style={{ fontWeight: 600 }}>{ch.chargeNumber}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{ch.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ch.patientMrn}</div>
                    </TableCell>
                    <TableCell>{getSourceDomainBadge(ch.sourceDomain)}</TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.85rem' }}>
                        {ch.items.map((it) => `${it.description} (x${it.quantity})`).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${ch.grandTotal.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(ch.status)}</TableCell>
                    <TableCell style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <div>{ch.capturedBy}</div>
                      <div>{new Date(ch.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {ch.status === 'CAPTURED' ? (
                        <Button variant="primary" onClick={() => onCreateInvoiceFromCharge(ch)}>
                          Invoice Charge
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          Invoiced
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
