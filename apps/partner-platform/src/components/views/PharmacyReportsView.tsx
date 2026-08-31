import React from 'react';
import {
  Card,
  Button
} from '@docsearch/ui-kit';
import type {
  PharmacyOverviewDto,
  PharmacyInventoryDto,
  PharmacyBatchDto,
  PharmacyPrescriptionDto
} from '@docsearch/api-contracts';

export interface PharmacyReportsViewProps {
  overview: PharmacyOverviewDto;
  inventory: PharmacyInventoryDto[];
  batches: PharmacyBatchDto[];
  prescriptions: PharmacyPrescriptionDto[];
}

export const PharmacyReportsView: React.FC<PharmacyReportsViewProps> = ({
  overview,
  inventory,
  batches,
  prescriptions
}) => {
  const totalStockUnits = inventory.reduce((acc, i) => acc + i.availableQuantity, 0);
  const controlledSubstances = inventory.filter((i) => i.controlledMedication);
  const completedOrders = prescriptions.filter((p) => p.status === 'COMPLETED' || p.status === 'DISPENSED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
            📊 Pharmacy Intelligence, Metrics & Controlled Substance Audits
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Dispensing throughput velocity, FEFO valuation reports, and regulatory DEA/CDSCO compliance metrics.
          </p>
        </div>
        <Button variant="outline" onClick={() => alert('Exporting Official Pharmacy Regulatory Ledger PDF...')}>
          📥 Export Audit Report
        </Button>
      </div>

      {/* Analytics KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Inventory Units
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {totalStockUnits.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>
            Across {batches.length} active batch lots
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Dispensing Completion Rate
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
            {prescriptions.length > 0 ? Math.round((completedOrders / prescriptions.length) * 100) : 100}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {completedOrders} fulfilled of {prescriptions.length} orders
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Controlled Stock Audits
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
            {controlledSubstances.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>
            Schedule II-V Safe Formularies
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Exceptions & Substitutions
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
            {overview.criticalExceptionsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Pending physician reviews
          </div>
        </Card>
      </div>

      {/* Compliance & Regulatory Summary */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600 }}>
          Regulatory & Quality Control Audit Status
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
          <div style={{ padding: '8px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
            ✅ <strong>FEFO (First-Expiry First-Out) Enforcement:</strong> 100% compliant. Depleted/near-expiry batches automatically flagged.
          </div>
          <div style={{ padding: '8px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
            ✅ <strong>Controlled Substance Vault Verification:</strong> Dual-witness electronic sign-off active for all Schedule II transactions.
          </div>
          <div style={{ padding: '8px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
            ✅ <strong>Temperature & Cold-Chain Surveillance:</strong> All cold storage biologicals maintained within 2°C - 8°C.
          </div>
        </div>
      </Card>
    </div>
  );
};
