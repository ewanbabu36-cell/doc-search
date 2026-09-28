import React, { useMemo } from 'react';
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
import { calculateStockValuation } from '../../services/pharmacy-stock-valuation.js';

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

  // 📦 Consolidated Stock Valuation (Purchase PTR vs Sale MRP)
  const stockValuation = useMemo(() => {
    return calculateStockValuation(batches, inventory);
  }, [batches, inventory]);

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

      {/* UNIFIED INVENTORY STOCK VALUATION SHOWCASE (PURCHASE VALUE & SALE VALUE IN ONE PLACE) */}
      <Card
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(6, 78, 59, 0.45) 50%, rgba(15, 23, 42, 0.98) 100%)',
          border: '2px solid #10B981',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.18)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.22)',
                border: '1.5px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}
            >
              📦
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                  Live Inventory Stock Valuation (इन्वेंट्री कुल खरीद एवं बिक्री मूल्य)
                </h3>
                <Badge variant="success" style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#059669', color: '#FFF' }}>
                  ● एक ही जगह (Consolidated View)
                </Badge>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '3px' }}>
                Total Purchase Cost (PTR) vs. Counter Retail Value (MRP) across all active batches & formulations
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenTab('inventory')}
              style={{ border: '1.5px solid #10B981', color: '#34D399', fontWeight: 800, fontSize: '0.8125rem' }}
            >
              📋 Open Stock Register ➔
            </Button>
          </div>
        </div>

        {/* 4 Unified Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>📥</span>
              <span>Purchase Value (खरीद मूल्य)</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace', marginTop: '6px' }}>
              ₹{stockValuation.totalPurchaseValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#7DD3FC', marginTop: '4px', fontWeight: 600 }}>
              Wholesale Taxable PTR Cost
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>🏷️</span>
              <span>Sale Value (बिक्री मूल्य)</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#F8FAFC', fontFamily: 'monospace', marginTop: '6px' }}>
              ₹{stockValuation.totalSaleValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '4px', fontWeight: 600 }}>
              Maximum Retail Counter Value (MRP)
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>📈</span>
              <span>Gross Margin (अपेक्षित मुनाफ़ा)</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#34D399', fontFamily: 'monospace', marginTop: '6px' }}>
              +₹{stockValuation.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '0.95rem', color: '#6EE7B7', fontWeight: 800 }}>
                ({stockValuation.profitMarginPercent.toFixed(1)}%)
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#A7F3D0', marginTop: '4px', fontWeight: 600 }}>
              Gross Profit Potential on Full Dispense
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>💊</span>
              <span>Physical In-Stock</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FBBF24', fontFamily: 'monospace', marginTop: '6px' }}>
              {stockValuation.totalUnits.toLocaleString()}{' '}
              <span style={{ fontSize: '0.85rem', color: '#FCD34D', fontWeight: 700 }}>Packs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#FDE68A', marginTop: '4px', fontWeight: 600 }}>
              Across {stockValuation.totalBatches} Batches • {stockValuation.totalSkus} Distinct SKUs
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card
          padding="md"
          style={{ cursor: 'pointer', border: '1.5px solid rgba(56, 189, 248, 0.4)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)' }}
          onClick={() => onOpenTab('inventory')}
        >
          <div style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
            📦 Stock Purchase vs Sale
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px', fontFamily: 'monospace' }}>
            <span style={{ color: '#38BDF8' }} title="Purchase Cost PTR">₹{stockValuation.totalPurchaseValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span style={{ color: '#64748B', margin: '0 4px' }}>/</span>
            <span style={{ color: '#34D399' }} title="Retail MRP Sale Value">₹{stockValuation.totalSaleValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#34D399', marginTop: '4px', fontWeight: 700 }}>
            Margin: +₹{stockValuation.grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({stockValuation.profitMarginPercent.toFixed(1)}%) ➔
          </div>
        </Card>
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
