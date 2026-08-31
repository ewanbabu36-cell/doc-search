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
  PharmacyOverviewDto,
  PharmacyPrescriptionDto,
  PharmacyInventoryDto,
  PharmacyBatchDto
} from '@docsearch/api-contracts';

export interface PharmacyOverviewViewProps {
  overview: PharmacyOverviewDto;
  prescriptions: PharmacyPrescriptionDto[];
  inventory: PharmacyInventoryDto[];
  batches: PharmacyBatchDto[];
  onOpenNewPrescription?: () => void;
  onOpenReceiveStock: () => void;
  onSelectPrescription: (id: string) => void;
  onOpenTab: (tabKey: string) => void;
}

export const PharmacyOverviewView: React.FC<PharmacyOverviewViewProps> = ({
  overview,
  prescriptions,
  inventory,
  batches,
  onOpenReceiveStock,
  onSelectPrescription,
  onOpenTab
}) => {
  const recentPrescriptions = prescriptions.slice(0, 5);
  const lowStockItems = inventory.filter((i) => i.availableQuantity <= i.reorderLevel);
  const expiringBatches = batches.filter((b) => b.daysToExpiry >= 0 && b.daysToExpiry <= 60);

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'STAT':
      case 'EMERGENCY':
        return 'danger';
      case 'URGENT':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DISPENSED':
        return 'success';
      case 'READY_FOR_DISPENSING':
      case 'VERIFIED':
      case 'STOCK_RESERVED':
        return 'primary';
      case 'UNDER_REVIEW':
      case 'PARTIALLY_DISPENSED':
        return 'warning';
      case 'CANCELLED':
      case 'REJECTED':
      case 'EXPIRED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
            💊 Outpatient & Inpatient Pharmacy Workbench
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Prescription verification, FEFO batch-managed dispensing, low-stock surveillance, and controlled substance custody.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={() => onOpenTab('catalog')}>
            📚 Catalog & Formularies
          </Button>
          <Button variant="primary" onClick={onOpenReceiveStock}>
            📥 Receive Stock Batch
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Prescriptions Today
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {overview.prescriptionsToday}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
            Outpatient & Inpatient Combined
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Verification
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
            {overview.pendingVerificationCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Pharmacist clinical review required
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Ready for Dispensing
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
            {overview.readyForDispensingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Verified & stock reserved
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Low Stock Alerts
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
            {overview.lowStockAlertsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
            Below reorder threshold
          </div>
        </Card>
      </div>

      {/* Main Grid: Active Prescriptions & Inventory Warnings */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Active Prescription Stream */}
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              Active Prescription Orders
            </h3>
            <Button variant="subtle" onClick={() => onOpenTab('prescriptions')}>
              View Full Queue →
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prescription #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPrescriptions.map((rx) => (
                  <TableRow key={rx.id}>
                    <TableCell style={{ fontWeight: 600 }}>{rx.prescriptionNumber}</TableCell>
                    <TableCell>
                      <div>{rx.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rx.patientMrn}</div>
                    </TableCell>
                    <TableCell>
                      {rx.items.length} {rx.items.length === 1 ? 'medication' : 'medications'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(rx.priority)}>{rx.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(rx.status)}>{rx.status.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Button variant="outline" onClick={() => onSelectPrescription(rx.id)}>
                        Process
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Stock & Expiry Surveillance Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Low Stock Alerts */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#b91c1c' }}>
                ⚠️ Low Stock Surveillance
              </h4>
              <Button variant="subtle" onClick={() => onOpenTab('inventory')}>
                Manage →
              </Button>
            </div>
            {lowStockItems.length === 0 ? (
              <div style={{ fontSize: '0.825rem', color: '#64748b' }}>All items above minimum safety levels.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStockItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#fef2f2', borderRadius: '4px', fontSize: '0.825rem' }}>
                    <div>
                      <strong>{item.genericName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.strength}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#b91c1c', fontWeight: 700 }}>{item.availableQuantity}</span> / {item.reorderLevel}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Near Expiry Batches */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#d97706' }}>
                ⏳ Expiry Warning (&lt; 60 Days)
              </h4>
              <Button variant="subtle" onClick={() => onOpenTab('expiry')}>
                View Batches →
              </Button>
            </div>
            {expiringBatches.length === 0 ? (
              <div style={{ fontSize: '0.825rem', color: '#64748b' }}>No batches near immediate expiry.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {expiringBatches.map((batch) => (
                  <div key={batch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#fffbeb', borderRadius: '4px', fontSize: '0.825rem' }}>
                    <div>
                      <strong>{batch.batchNumber}</strong> ({batch.medicationName})
                    </div>
                    <div style={{ color: '#b45309', fontWeight: 600 }}>
                      {batch.daysToExpiry}d left
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
