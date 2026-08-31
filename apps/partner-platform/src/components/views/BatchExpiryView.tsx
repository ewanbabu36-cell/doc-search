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
  PharmacyBatchDto,
  BatchStatus
} from '@docsearch/api-contracts';

export interface BatchExpiryViewProps {
  batches: PharmacyBatchDto[];
  onOpenBlockDialog: (batch: PharmacyBatchDto) => void;
  onOpenUnblockDialog: (batch: PharmacyBatchDto) => void;
}

export const BatchExpiryView: React.FC<BatchExpiryViewProps> = ({
  batches,
  onOpenBlockDialog,
  onOpenUnblockDialog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = batches.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeVariant = (status: BatchStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'NEAR_EXPIRY':
      case 'LOW_STOCK':
        return 'warning';
      case 'EXPIRED':
      case 'BLOCKED':
      case 'DEPLETED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
            ⏳ Batch Lot & Expiration Surveillance (FEFO)
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            First-Expiry First-Out (FEFO) tracking, automated quarantine holds, and supplier batch verification.
          </p>
        </div>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Batches
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by batch number, medication name, manufacturer..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Batch Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Batch Statuses' },
                { value: 'ACTIVE', label: 'Active (Available for Dispense)' },
                { value: 'NEAR_EXPIRY', label: 'Near Expiry (< 60 Days)' },
                { value: 'BLOCKED', label: 'Blocked / Quarantined' },
                { value: 'EXPIRED', label: 'Expired' }
              ]}
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch / Lot #</TableHead>
                <TableHead>Medication Name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Available / Received</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Quarantine Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>{batch.batchNumber}</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{batch.medicationName}</TableCell>
                  <TableCell>{batch.manufacturer}</TableCell>
                  <TableCell>
                    <strong>{batch.availableQuantity}</strong> / {batch.receivedQuantity} units
                  </TableCell>
                  <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          batch.daysToExpiry <= 0
                            ? '#dc2626'
                            : batch.daysToExpiry <= 60
                            ? '#d97706'
                            : '#16a34a'
                      }}
                    >
                      {batch.daysToExpiry <= 0 ? 'EXPIRED' : `${batch.daysToExpiry} days`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(batch.status)}>{batch.status}</Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {batch.status === 'BLOCKED' ? (
                      <Button variant="outline" onClick={() => onOpenUnblockDialog(batch)}>
                        Release
                      </Button>
                    ) : (
                      <Button variant="danger" onClick={() => onOpenBlockDialog(batch)}>
                        Quarantine
                      </Button>
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
