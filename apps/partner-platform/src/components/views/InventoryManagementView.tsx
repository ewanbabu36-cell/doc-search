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
  PharmacyInventoryDto
} from '@docsearch/api-contracts';

export interface InventoryManagementViewProps {
  inventory: PharmacyInventoryDto[];
  onOpenReceiveStock: () => void;
  onOpenStockAdjustment: () => void;
  onOpenTransferStock: () => void;
}

export const InventoryManagementView: React.FC<InventoryManagementViewProps> = ({
  inventory,
  onOpenReceiveStock,
  onOpenStockAdjustment,
  onOpenTransferStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStockLevel, setFilterStockLevel] = useState<string>('ALL');

  const filtered = inventory.filter((item) => {
    const isLow = item.availableQuantity <= item.reorderLevel;
    const matchesLevel =
      filterStockLevel === 'ALL' ||
      (filterStockLevel === 'LOW' && isLow) ||
      (filterStockLevel === 'NORMAL' && !isLow);
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.medicationCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
            📦 Pharmacy Branch Inventory & Stock Levels
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Aggregated available, reserved, and quarantine inventory with automated low-stock reorder indicators.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={onOpenTransferStock}>
            🚚 Inter-Facility Transfer
          </Button>
          <Button variant="outline" onClick={onOpenStockAdjustment}>
            ⚖️ Cycle Count Adjustment
          </Button>
          <Button variant="primary" onClick={onOpenReceiveStock}>
            📥 Receive Stock Intake
          </Button>
        </div>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Inventory
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by generic, brand, code..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Stock Status
            </label>
            <Select
              value={filterStockLevel}
              onChange={(e) => setFilterStockLevel(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Inventory Items' },
                { value: 'LOW', label: 'Low Stock (At or Below Reorder Level)' },
                { value: 'NORMAL', label: 'Adequate Stock Level' }
              ]}
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication Code</TableHead>
                <TableHead>Generic & Brand Name</TableHead>
                <TableHead>Strength & Form</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Available Stock</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const isLow = item.availableQuantity <= item.reorderLevel;
                return (
                  <TableRow key={item.id}>
                    <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>{item.medicationCode}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{item.genericName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Brand: {item.brandName}</div>
                    </TableCell>
                    <TableCell>
                      <div>{item.strength}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.dosageForm}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{item.category}</Badge>
                      {item.controlledMedication && (
                        <span style={{ marginLeft: '4px' }}>
                          <Badge variant="danger">Schedule II</Badge>
                        </span>
                      )}
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, fontSize: '1rem', color: isLow ? '#dc2626' : '#16a34a' }}>
                      {item.availableQuantity}
                    </TableCell>
                    <TableCell style={{ color: '#d97706', fontWeight: 600 }}>{item.reservedQuantity}</TableCell>
                    <TableCell>{item.reorderLevel} (Order {item.reorderQuantity})</TableCell>
                    <TableCell>{item.batches.length} active</TableCell>
                    <TableCell>
                      <Badge variant={isLow ? 'danger' : 'success'}>
                        {isLow ? 'Low Stock' : 'Adequate'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
