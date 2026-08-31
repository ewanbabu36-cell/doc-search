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
  PharmacyStockMovementDto,
  StockMovementType
} from '@docsearch/api-contracts';

export interface StockMovementLedgerViewProps {
  movements: PharmacyStockMovementDto[];
}

export const StockMovementLedgerView: React.FC<StockMovementLedgerViewProps> = ({
  movements
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = movements.filter((m) => {
    const matchesType = typeFilter === 'ALL' || m.movementType === typeFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      m.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.actorId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getMovementBadgeVariant = (type: StockMovementType) => {
    switch (type) {
      case 'RECEIPT':
      case 'TRANSFER_IN':
        return 'success';
      case 'DISPENSE':
      case 'TRANSFER_OUT':
        return 'primary';
      case 'RETURN':
      case 'REVERSAL':
        return 'warning';
      case 'DAMAGE':
      case 'EXPIRY':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
          📑 Immutable Stock Movement Ledger
        </h2>
        <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
          Append-only financial and physical inventory journal capturing receipts, dispensing, adjustments, and returns.
        </p>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Ledger
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by medication, batch, reason, actor..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Movement Type
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Movement Types' },
                { value: 'RECEIPT', label: 'Stock Receipt Intake (+)' },
                { value: 'DISPENSE', label: 'Dispense Fulfillment (-)' },
                { value: 'RETURN', label: 'Restocked Return (+)' },
                { value: 'ADJUSTMENT', label: 'Inventory Adjustment (±)' },
                { value: 'TRANSFER_IN', label: 'Inter-Facility Transfer In (+)' },
                { value: 'TRANSFER_OUT', label: 'Inter-Facility Transfer Out (-)' },
                { value: 'REVERSAL', label: 'Dispensing Reversal (+)' }
              ]}
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Movement Type</TableHead>
                <TableHead>Medication & Batch</TableHead>
                <TableHead>Quantity Delta</TableHead>
                <TableHead>Before → After</TableHead>
                <TableHead>Reason & Context</TableHead>
                <TableHead>Authorized Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell style={{ fontSize: '0.85rem' }}>
                    {new Date(mov.occurredAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getMovementBadgeVariant(mov.movementType)}>
                      {mov.movementType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 600 }}>{mov.medicationName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Batch: {mov.batchNumber}</div>
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontWeight: 700,
                        color: mov.quantity > 0 ? '#16a34a' : mov.quantity < 0 ? '#dc2626' : '#64748b'
                      }}
                    >
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>
                    {mov.beforeQuantity} → <strong>{mov.afterQuantity}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>
                    <div>{mov.reason}</div>
                    {mov.referenceId && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Ref: {mov.referenceType} ({mov.referenceId})
                      </div>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>
                    <div>{mov.actorId}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Role: {mov.actorRole}</div>
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
