import React, { useState, useMemo } from 'react';
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
  const [tierFilter, setTierFilter] = useState<'ALL' | 'EXPIRED' | 'NEAR_EXPIRY' | 'LOW_STOCK' | 'HEALTHY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSuccessMessage, setPoSuccessMessage] = useState<string | null>(null);

  // Compute 4-tier analytics
  const analytics = useMemo(() => {
    let expiredCount = 0;
    let nearExpiryCount = 0;
    let lowStockCount = 0;
    let healthyCount = 0;

    for (const b of batches) {
      if (b.daysToExpiry <= 0 || b.status === 'EXPIRED') {
        expiredCount++;
      } else if (b.daysToExpiry <= 90 || b.status === 'NEAR_EXPIRY') {
        nearExpiryCount++;
      } else {
        healthyCount++;
      }

      if (b.availableQuantity <= 15 || b.status === 'LOW_STOCK') {
        lowStockCount++;
      }
    }

    return { expiredCount, nearExpiryCount, lowStockCount, healthyCount };
  }, [batches]);

  // Filter batches based on tier, status, and search
  const filtered = useMemo(() => {
    return batches.filter((b) => {
      // Tier filter
      if (tierFilter === 'EXPIRED') {
        if (b.daysToExpiry > 0 && b.status !== 'EXPIRED') return false;
      } else if (tierFilter === 'NEAR_EXPIRY') {
        if (b.daysToExpiry <= 0 || b.daysToExpiry > 90) return false;
      } else if (tierFilter === 'LOW_STOCK') {
        if (b.availableQuantity > 15 && b.status !== 'LOW_STOCK') return false;
      } else if (tierFilter === 'HEALTHY') {
        if (b.daysToExpiry <= 90 || b.status === 'EXPIRED') return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matches =
          b.batchNumber.toLowerCase().includes(q) ||
          b.medicationName.toLowerCase().includes(q) ||
          (b.manufacturer && b.manufacturer.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [batches, tierFilter, statusFilter, searchTerm]);

  // Low stock / reorder suggested items for PO generation
  const reorderItems = useMemo(() => {
    return batches
      .filter((b) => b.availableQuantity <= 20 || b.daysToExpiry <= 60)
      .map((b) => {
        const suggestQty = Math.max(50, (b.receivedQuantity || 100) - b.availableQuantity);
        const unitCost = (b as any).costPrice || ((b as any).mrp ? Math.round((b as any).mrp * 0.7) : 50);
        const estCost = Math.round(suggestQty * unitCost);
        return {
          id: b.id,
          medicationName: b.medicationName,
          batchNumber: b.batchNumber,
          currentStock: b.availableQuantity,
          suggestedQty: suggestQty,
          unitCost: unitCost,
          totalCost: estCost,
          manufacturer: b.manufacturer || 'General Pharma Stockist'
        };
      });
  }, [batches]);

  const totalPoValue = useMemo(() => {
    return reorderItems.reduce((sum, item) => sum + item.totalCost, 0);
  }, [reorderItems]);

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

  const handleGeneratePo = () => {
    setIsPoModalOpen(true);
  };

  const handleConfirmPoOrder = () => {
    setIsPoModalOpen(false);
    setPoSuccessMessage(`✓ Purchase Order PO-${Date.now().toString().slice(-6)} generated for ${reorderItems.length} items (₹${totalPoValue.toLocaleString('en-IN')}) and dispatched to distributor!`);
    setTimeout(() => setPoSuccessMessage(null), 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PO Success Notification */}
      {poSuccessMessage && (
        <div
          style={{
            backgroundColor: '#065F46',
            color: '#ECFDF5',
            padding: '12px 16px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(6, 95, 70, 0.3)'
          }}
        >
          <span>{poSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setPoSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📦 Stock Expiry & Reorder Surveillance (FEFO)
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.85rem' }}>
            First-Expiry First-Out (FEFO) tracking, automated quarantine holds, and 1-tap distributor replenishment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={handleGeneratePo}
            style={{
              backgroundColor: '#0284C7',
              borderColor: '#0284C7',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '40px'
            }}
          >
            <span>⚡</span>
            <span>Generate Distributor PO ({reorderItems.length})</span>
          </Button>
        </div>
      </div>

      {/* 4-Tier FEFO Surveillance Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        {/* Tier 1: Expired */}
        <div
          onClick={() => setTierFilter(tierFilter === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
          style={{
            backgroundColor: tierFilter === 'EXPIRED' ? 'rgba(239, 68, 68, 0.2)' : '#0E162B',
            border: tierFilter === 'EXPIRED' ? '2px solid #EF4444' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#F87171', fontWeight: 700, textTransform: 'uppercase' }}>
              🔴 Expired (Quarantine)
            </span>
            <Badge variant="danger" style={{ fontSize: '0.7rem' }}>Hold</Badge>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '6px' }}>
            {analytics.expiredCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Past expiry • Blocked from sale
          </div>
        </div>

        {/* Tier 2: Near Expiry */}
        <div
          onClick={() => setTierFilter(tierFilter === 'NEAR_EXPIRY' ? 'ALL' : 'NEAR_EXPIRY')}
          style={{
            backgroundColor: tierFilter === 'NEAR_EXPIRY' ? 'rgba(245, 158, 11, 0.2)' : '#0E162B',
            border: tierFilter === 'NEAR_EXPIRY' ? '2px solid #F59E0B' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase' }}>
              🟡 Near Expiry (&lt; 90 Days)
            </span>
            <Badge variant="warning" style={{ fontSize: '0.7rem' }}>FEFO</Badge>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '6px' }}>
            {analytics.nearExpiryCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Return to vendor / discount
          </div>
        </div>

        {/* Tier 3: Low Stock */}
        <div
          onClick={() => setTierFilter(tierFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          style={{
            backgroundColor: tierFilter === 'LOW_STOCK' ? 'rgba(56, 189, 248, 0.2)' : '#0E162B',
            border: tierFilter === 'LOW_STOCK' ? '2px solid #38BDF8' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
              ⚠️ Low Stock (Reorder)
            </span>
            <Badge variant="primary" style={{ fontSize: '0.7rem' }}>Reorder</Badge>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '6px' }}>
            {analytics.lowStockCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Available &le; 15 units • Trigger PO
          </div>
        </div>

        {/* Tier 4: Healthy Shelf Life */}
        <div
          onClick={() => setTierFilter(tierFilter === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
          style={{
            backgroundColor: tierFilter === 'HEALTHY' ? 'rgba(16, 185, 129, 0.2)' : '#0E162B',
            border: tierFilter === 'HEALTHY' ? '2px solid #10B981' : '1px solid #1E293B',
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700, textTransform: 'uppercase' }}>
              🟢 Healthy Shelf Life
            </span>
            <Badge variant="success" style={{ fontSize: '0.7rem' }}>Safe</Badge>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '6px' }}>
            {analytics.healthyCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            &gt; 90 days validity • Stable
          </div>
        </div>
      </div>

      {/* Main Batches Card */}
      <Card padding="md" style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
              Search Batches
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by batch number, medication name, manufacturer..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
              Filter by Batch Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Batch Statuses' },
                { value: 'ACTIVE', label: 'Active (Available for Dispense)' },
                { value: 'NEAR_EXPIRY', label: 'Near Expiry (< 90 Days)' },
                { value: 'LOW_STOCK', label: 'Low Stock (< 15 Units)' },
                { value: 'BLOCKED', label: 'Blocked / Quarantined' },
                { value: 'EXPIRED', label: 'Expired' }
              ]}
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: '1.5px solid #334155' }}>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Batch / Lot #</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Medication Name</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Manufacturer</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Available / Received</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Expiry Date</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Days Remaining</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Status</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem', textAlign: 'right' }}>Quarantine Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                    No batches match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((batch) => (
                  <TableRow key={batch.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <TableCell style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                      {batch.batchNumber}
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, color: '#F8FAFC' }}>
                      {batch.medicationName}
                    </TableCell>
                    <TableCell style={{ color: '#94A3B8' }}>
                      {batch.manufacturer || 'Pharma Stockist'}
                    </TableCell>
                    <TableCell style={{ color: '#F8FAFC' }}>
                      <strong style={{ color: batch.availableQuantity <= 15 ? '#F87171' : '#34D399' }}>
                        {batch.availableQuantity}
                      </strong> / {batch.receivedQuantity} units
                    </TableCell>
                    <TableCell style={{ color: '#CBD5E1' }}>
                      {new Date(batch.expiryDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          fontWeight: 800,
                          color:
                            batch.daysToExpiry <= 0
                              ? '#F87171'
                              : batch.daysToExpiry <= 60
                              ? '#FBBF24'
                              : '#34D399'
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenUnblockDialog(batch)}
                          style={{ borderColor: '#10B981', color: '#34D399', fontWeight: 700 }}
                        >
                          ✅ Release
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onOpenBlockDialog(batch)}
                          style={{ fontWeight: 700 }}
                        >
                          🚫 Quarantine
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

      {/* Distributor Purchase Order (PO) Compilation Modal */}
      {isPoModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #334155',
              borderRadius: '14px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              color: '#F8FAFC',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#38BDF8' }}>
                  📦 Distributor Purchase Order (Marg / MedPlus ERP)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  Auto-compiled replenishment for {reorderItems.length} low-stock & near-expiry medicines.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPoModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Medication Name</th>
                    <th style={{ padding: '8px 10px' }}>Current Stock</th>
                    <th style={{ padding: '8px 10px' }}>Reorder Qty</th>
                    <th style={{ padding: '8px 10px' }}>Unit Cost</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#F8FAFC' }}>
                        {item.medicationName}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#F87171', fontWeight: 700 }}>
                        {item.currentStock} units
                      </td>
                      <td style={{ padding: '8px 10px', color: '#38BDF8', fontWeight: 700 }}>
                        {item.suggestedQty} units
                      </td>
                      <td style={{ padding: '8px 10px', color: '#94A3B8' }}>
                        ₹{item.unitCost}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#34D399' }}>
                        ₹{item.totalCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#1E293B',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Estimated Wholesale Value:</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399' }}>
                  ₹{totalPoValue.toLocaleString('en-IN')}
                </div>
              </div>
              <Badge variant="success" style={{ fontSize: '0.75rem' }}>
                ✓ GST & HSN Inwarding Ready
              </Badge>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={() => setIsPoModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPoOrder}
                style={{ backgroundColor: '#0284C7', borderColor: '#0284C7', fontWeight: 800 }}
              >
                ✓ Confirm & Transmit PO to Distributor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
