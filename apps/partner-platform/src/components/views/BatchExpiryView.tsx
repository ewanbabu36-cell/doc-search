import React, { useState, useMemo, useCallback } from 'react';
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
  PharmacyBatchDto
} from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface BatchExpiryViewProps {
  batches: PharmacyBatchDto[];
  onOpenBlockDialog: (batch: PharmacyBatchDto) => void;
  onOpenUnblockDialog: (batch: PharmacyBatchDto) => void;
  onRefresh?: (() => void) | undefined;
}

export type WaterfallTier = 'ALL' | 'BUCKET_30' | 'BUCKET_60' | 'BUCKET_90' | 'HEALTHY' | 'LOW_STOCK';

export interface SupplierDebitNoteItem {
  batchId: string;
  batchNumber: string;
  medicationName: string;
  manufacturer: string;
  expiryDate: string;
  daysToExpiry: number;
  availableQuantity: number;
  unitCost: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  netDebitAmount: number;
  hsnCode: string;
}

export const BatchExpiryView: React.FC<BatchExpiryViewProps> = ({
  batches,
  onOpenBlockDialog,
  onOpenUnblockDialog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<WaterfallTier>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');

  // Supplier Debit Note State
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [isDebitNoteModalOpen, setIsDebitNoteModalOpen] = useState(false);
  const [debitNoteSuccessMessage, setDebitNoteSuccessMessage] = useState<string | null>(null);
  const [debitNoteReason, setDebitNoteReason] = useState('Near-Expiry Return (Drugs & Cosmetics Act Rule 65)');
  const [selectedSupplierName, setSelectedSupplierName] = useState('Cipla Central Depo');

  // Distributor PO Modal State
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSuccessMessage, setPoSuccessMessage] = useState<string | null>(null);

  // Doctor Liquidation Push Banner State
  const [liquidationPushed, setLiquidationPushed] = useState(false);

  // Compute 4-Tier Near-Expiry Waterfall Metrics
  const waterfall = useMemo(() => {
    let bucket30Count = 0;
    let bucket30Qty = 0;
    let bucket30Value = 0;

    let bucket60Count = 0;
    let bucket60Qty = 0;
    let bucket60Value = 0;

    let bucket90Count = 0;
    let bucket90Qty = 0;
    let bucket90Value = 0;

    let healthyCount = 0;
    let healthyQty = 0;
    let healthyValue = 0;

    let lowStockCount = 0;

    for (const b of batches) {
      const unitCost = parseFloat(b.unitCost || '0') || 50;
      const val = b.availableQuantity * unitCost;

      if (b.daysToExpiry <= 30 || b.status === 'EXPIRED') {
        bucket30Count++;
        bucket30Qty += b.availableQuantity;
        bucket30Value += val;
      } else if (b.daysToExpiry <= 60) {
        bucket60Count++;
        bucket60Qty += b.availableQuantity;
        bucket60Value += val;
      } else if (b.daysToExpiry <= 90 || b.status === 'NEAR_EXPIRY') {
        bucket90Count++;
        bucket90Qty += b.availableQuantity;
        bucket90Value += val;
      } else {
        healthyCount++;
        healthyQty += b.availableQuantity;
        healthyValue += val;
      }

      if (b.availableQuantity <= 15 || b.status === 'LOW_STOCK') {
        lowStockCount++;
      }
    }

    const totalAtRiskValue = bucket30Value + bucket60Value + bucket90Value;
    const totalInventoryValue = totalAtRiskValue + healthyValue;

    return {
      bucket30: { count: bucket30Count, qty: bucket30Qty, value: bucket30Value },
      bucket60: { count: bucket60Count, qty: bucket60Qty, value: bucket60Value },
      bucket90: { count: bucket90Count, qty: bucket90Qty, value: bucket90Value },
      healthy: { count: healthyCount, qty: healthyQty, value: healthyValue },
      lowStockCount,
      totalAtRiskValue,
      totalInventoryValue
    };
  }, [batches]);

  // Extract unique suppliers from batch manufacturers
  const availableSuppliers = useMemo(() => {
    const s = new Set<string>();
    for (const b of batches) {
      if (b.manufacturer) s.add(b.manufacturer);
    }
    return Array.from(s);
  }, [batches]);

  // Filtered batches based on Waterfall Tier, Status, Supplier, and Search
  const filtered = useMemo(() => {
    return batches.filter((b) => {
      // Waterfall Tier Filter
      if (tierFilter === 'BUCKET_30') {
        if (b.daysToExpiry > 30 && b.status !== 'EXPIRED') return false;
      } else if (tierFilter === 'BUCKET_60') {
        if (b.daysToExpiry <= 30 || b.daysToExpiry > 60) return false;
      } else if (tierFilter === 'BUCKET_90') {
        if (b.daysToExpiry <= 60 || b.daysToExpiry > 90) return false;
      } else if (tierFilter === 'HEALTHY') {
        if (b.daysToExpiry <= 90 || b.status === 'EXPIRED') return false;
      } else if (tierFilter === 'LOW_STOCK') {
        if (b.availableQuantity > 15 && b.status !== 'LOW_STOCK') return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false;
      }

      // Supplier filter
      if (supplierFilter !== 'ALL' && b.manufacturer !== supplierFilter) {
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
  }, [batches, tierFilter, statusFilter, supplierFilter, searchTerm]);

  // Low stock items for PO generation
  const reorderItems = useMemo(() => {
    return batches
      .filter((b) => b.availableQuantity <= 20 || b.daysToExpiry <= 60)
      .map((b) => {
        const suggestQty = Math.max(50, (b.receivedQuantity || 100) - b.availableQuantity);
        const unitCost = parseFloat(b.unitCost || '0') || 50;
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

  // Debit Note Line Items compilation
  const debitNoteItems = useMemo<SupplierDebitNoteItem[]>(() => {
    return batches
      .filter((b) => selectedBatchIds.has(b.id))
      .map((b) => {
        const cost = parseFloat(b.unitCost || '0') || 65;
        const taxable = b.availableQuantity * cost;
        const gstRate = 12; // Standard pharmaceutical formulations GST
        const gst = Math.round((taxable * gstRate) / 100);
        return {
          batchId: b.id,
          batchNumber: b.batchNumber,
          medicationName: b.medicationName,
          manufacturer: b.manufacturer || 'Cipla Central Depo',
          expiryDate: b.expiryDate,
          daysToExpiry: b.daysToExpiry,
          availableQuantity: b.availableQuantity,
          unitCost: cost,
          taxableAmount: taxable,
          gstRate,
          gstAmount: gst,
          netDebitAmount: taxable + gst,
          hsnCode: '300490'
        };
      });
  }, [batches, selectedBatchIds]);

  const totalDebitNoteValue = useMemo(() => {
    return debitNoteItems.reduce((acc, item) => acc + item.netDebitAmount, 0);
  }, [debitNoteItems]);



  // Toggle batch selection for Debit Note
  const toggleSelectBatch = (id: string) => {
    const next = new Set(selectedBatchIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBatchIds(next);
  };

  // Select all batches in Near-Expiry Window (< 90 Days)
  const handleSelectAllNearExpiry = () => {
    const nearExpiryIds = new Set<string>();
    for (const b of filtered) {
      if (b.daysToExpiry <= 90 || b.status === 'EXPIRED') {
        nearExpiryIds.add(b.id);
      }
    }
    setSelectedBatchIds(nearExpiryIds);
  };

  const handleClearSelection = () => {
    setSelectedBatchIds(new Set());
  };

  // 1-Click Supplier Debit Note Generation
  const handleOpenDebitNoteModal = () => {
    if (selectedBatchIds.size === 0) {
      handleSelectAllNearExpiry();
    }
    const firstSelected = batches.find((b) => selectedBatchIds.has(b.id));
    if (firstSelected?.manufacturer) {
      setSelectedSupplierName(firstSelected.manufacturer);
    }
    setIsDebitNoteModalOpen(true);
  };

  const handleConfirmDebitNote = () => {
    const noteNumber = `DN-2026-EXP-${Date.now().toString().slice(-6)}`;
    setIsDebitNoteModalOpen(false);

    // Auto-quarantine selected batches so they cannot be dispensed to patients
    for (const b of batches) {
      if (selectedBatchIds.has(b.id) && b.status !== 'BLOCKED') {
        onOpenBlockDialog(b);
      }
    }

    // Publish event on hospital event bus
    hospitalEventBus.publish('DYNAMIC_REORDER_TRIGGERED', 'BatchExpiryView', {
      debitNoteNumber: noteNumber,
      supplierName: selectedSupplierName,
      batchCount: debitNoteItems.length,
      totalAmount: totalDebitNoteValue,
      timestamp: new Date().toISOString()
    });

    setDebitNoteSuccessMessage(
      `✓ Supplier Debit Note ${noteNumber} generated for ${debitNoteItems.length} batches (₹${totalDebitNoteValue.toLocaleString('en-IN')})! Stock quarantined & ledger updated.`
    );
    setSelectedBatchIds(new Set());
    setTimeout(() => setDebitNoteSuccessMessage(null), 8000);
  };

  // Push Liquidation Alert to OPD Doctors
  const handlePushDoctorLiquidation = useCallback(() => {
    hospitalEventBus.publish('OPTIMISTIC_ACTION_DISPATCHED', 'BatchExpiryView', {
      action: 'OPD_NEAR_EXPIRY_LIQUIDATION_PUSH',
      batchesEligible: waterfall.bucket30.count + waterfall.bucket60.count,
      message: 'Prescribers alerted to prioritize 30-60 day near-expiry stock for short OPD courses.',
      timestamp: new Date().toISOString()
    });
    setLiquidationPushed(true);
    setTimeout(() => setLiquidationPushed(false), 5000);
  }, [waterfall]);

  // Share Debit Note via WhatsApp to Distributor
  const handleShareDebitNoteWhatsApp = () => {
    const noteNumber = `DN-2026-EXP-${Date.now().toString().slice(-6)}`;
    const text = encodeURIComponent(
      `📋 *DOCSEARCH HOSPITAL PHARMACY — SUPPLIER DEBIT NOTE*\n` +
      `• *Debit Note #*: ${noteNumber}\n` +
      `• *Distributor*: ${selectedSupplierName}\n` +
      `• *Total Claim*: ₹${totalDebitNoteValue.toLocaleString('en-IN')} (Incl. 12% GST)\n` +
      `• *Batches Returned*: ${debitNoteItems.length} items near expiry\n` +
      `• *Reason*: ${debitNoteReason}\n\n` +
      `_Items have been quarantined under Section 34 of CGST Act & D&C Act Rule 65. Please issue corresponding credit note to hospital account._`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Debit Note & PO Success Alerts */}
      {debitNoteSuccessMessage && (
        <div
          style={{
            backgroundColor: '#065F46',
            color: '#ECFDF5',
            padding: '12px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(6, 95, 70, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📄</span>
            <span>{debitNoteSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDebitNoteSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {poSuccessMessage && (
        <div
          style={{
            backgroundColor: '#0369A1',
            color: '#F0F9FF',
            padding: '12px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(3, 105, 161, 0.3)'
          }}
        >
          <span>{poSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setPoSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: '#BAE6FD', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header with Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#F8FAFC' }}>
              📦 Pharmacy Near-Expiry Waterfall & FIFO Liquidation Desk
            </h2>
            <Badge variant="warning">FEFO / FIFO Engine</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.8125rem' }}>
            30/60/90 Days expiry waterfall segmentation, capital-at-risk surveillance, and 1-click supplier debit note recovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Push to OPD Doctors */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePushDoctorLiquidation}
            style={{
              borderColor: liquidationPushed ? '#10B981' : '#F59E0B',
              color: liquidationPushed ? '#34D399' : '#FBBF24',
              fontWeight: 800,
              fontSize: '0.78rem'
            }}
          >
            {liquidationPushed ? '✓ OPD Prescribers Alerted' : '📢 Push Fast-Rack to OPD Rx'}
          </Button>

          {/* 1-Click Supplier Debit Note Button */}
          <Button
            variant="danger"
            size="sm"
            onClick={handleOpenDebitNoteModal}
            style={{
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡</span>
            <span>
              Generate Supplier Debit Note
              {selectedBatchIds.size > 0 && ` (${selectedBatchIds.size})`}
            </span>
          </Button>

          {/* Generate PO */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPoModalOpen(true)}
            style={{
              backgroundColor: '#0284C7',
              borderColor: '#0284C7',
              fontWeight: 800,
              fontSize: '0.78rem'
            }}
          >
            <span>📦 Reorder PO ({reorderItems.length})</span>
          </Button>
        </div>
      </div>

      {/* NEAR-EXPIRY WATERFALL CAPITAL AT RISK PROGRESS BAR */}
      <div
        style={{
          backgroundColor: '#070C18',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
              📊 Capital At Risk Waterfall Distribution
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Total Active Stock: <strong>₹{waterfall.totalInventoryValue.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem' }}>
            <span style={{ color: '#F87171', fontWeight: 700 }}>
              🔴 &lt; 30d: ₹{waterfall.bucket30.value.toLocaleString('en-IN')}
            </span>
            <span style={{ color: '#FB923C', fontWeight: 700 }}>
              🟠 31-60d: ₹{waterfall.bucket60.value.toLocaleString('en-IN')}
            </span>
            <span style={{ color: '#FBBF24', fontWeight: 700 }}>
              🟡 61-90d: ₹{waterfall.bucket90.value.toLocaleString('en-IN')}
            </span>
            <span style={{ color: '#34D399', fontWeight: 700 }}>
              🟢 &gt; 90d: ₹{waterfall.healthy.value.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Multi-segmented Visual Waterfall Progress Bar */}
        <div
          style={{
            height: '12px',
            backgroundColor: '#1E293B',
            borderRadius: '999px',
            overflow: 'hidden',
            display: 'flex',
            width: '100%'
          }}
        >
          {waterfall.totalInventoryValue > 0 && (
            <>
              <div
                style={{
                  width: `${Math.max(2, (waterfall.bucket30.value / waterfall.totalInventoryValue) * 100)}%`,
                  backgroundColor: '#EF4444',
                  transition: 'width 0.3s ease'
                }}
                title={`< 30 Days: ₹${waterfall.bucket30.value.toLocaleString('en-IN')}`}
              />
              <div
                style={{
                  width: `${Math.max(2, (waterfall.bucket60.value / waterfall.totalInventoryValue) * 100)}%`,
                  backgroundColor: '#F97316',
                  transition: 'width 0.3s ease'
                }}
                title={`31-60 Days: ₹${waterfall.bucket60.value.toLocaleString('en-IN')}`}
              />
              <div
                style={{
                  width: `${Math.max(2, (waterfall.bucket90.value / waterfall.totalInventoryValue) * 100)}%`,
                  backgroundColor: '#F59E0B',
                  transition: 'width 0.3s ease'
                }}
                title={`61-90 Days: ₹${waterfall.bucket90.value.toLocaleString('en-IN')}`}
              />
              <div
                style={{
                  width: `${Math.max(2, (waterfall.healthy.value / waterfall.totalInventoryValue) * 100)}%`,
                  backgroundColor: '#10B981',
                  transition: 'width 0.3s ease'
                }}
                title={`> 90 Days: ₹${waterfall.healthy.value.toLocaleString('en-IN')}`}
              />
            </>
          )}
        </div>
      </div>

      {/* 4-TIER WATERFALL INTERACTIVE METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {/* Tier 1: < 30 Days (Critical Liquidation / Return) */}
        <div
          onClick={() => setTierFilter(tierFilter === 'BUCKET_30' ? 'ALL' : 'BUCKET_30')}
          style={{
            backgroundColor: tierFilter === 'BUCKET_30' ? 'rgba(239, 68, 68, 0.25)' : '#0E162B',
            border: tierFilter === 'BUCKET_30' ? '2px solid #EF4444' : '1px solid #1E293B',
            borderRadius: '12px',
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: tierFilter === 'BUCKET_30' ? '0 0 20px rgba(239, 68, 68, 0.3)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#F87171', fontWeight: 800, textTransform: 'uppercase' }}>
              🔴 Critical (&lt; 30 Days)
            </span>
            <Badge variant="danger" style={{ fontSize: '0.65rem' }}>STAT RETURN</Badge>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '6px' }}>
            {waterfall.bucket30.count} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>batches</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 700, marginTop: '2px' }}>
            ₹{waterfall.bucket30.value.toLocaleString('en-IN')} at risk
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
            Immediate Debit Note or Hospital Discount
          </div>
        </div>

        {/* Tier 2: 31-60 Days (Fast-Rack Liquidation) */}
        <div
          onClick={() => setTierFilter(tierFilter === 'BUCKET_60' ? 'ALL' : 'BUCKET_60')}
          style={{
            backgroundColor: tierFilter === 'BUCKET_60' ? 'rgba(249, 115, 22, 0.25)' : '#0E162B',
            border: tierFilter === 'BUCKET_60' ? '2px solid #F97316' : '1px solid #1E293B',
            borderRadius: '12px',
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: tierFilter === 'BUCKET_60' ? '0 0 20px rgba(249, 115, 22, 0.3)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#FB923C', fontWeight: 800, textTransform: 'uppercase' }}>
              🟠 Urgent (31 - 60 Days)
            </span>
            <Badge variant="warning" style={{ fontSize: '0.65rem' }}>FAST-RACK</Badge>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '6px' }}>
            {waterfall.bucket60.count} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>batches</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FDBA74', fontWeight: 700, marginTop: '2px' }}>
            ₹{waterfall.bucket60.value.toLocaleString('en-IN')} at risk
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
            Shift to front rack • Doctor Rx priority
          </div>
        </div>

        {/* Tier 3: 61-90 Days (Supplier Return Window Open) */}
        <div
          onClick={() => setTierFilter(tierFilter === 'BUCKET_90' ? 'ALL' : 'BUCKET_90')}
          style={{
            backgroundColor: tierFilter === 'BUCKET_90' ? 'rgba(245, 158, 11, 0.25)' : '#0E162B',
            border: tierFilter === 'BUCKET_90' ? '2px solid #F59E0B' : '1px solid #1E293B',
            borderRadius: '12px',
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: tierFilter === 'BUCKET_90' ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#FBBF24', fontWeight: 800, textTransform: 'uppercase' }}>
              🟡 Window Open (61 - 90 Days)
            </span>
            <Badge variant="warning" style={{ fontSize: '0.65rem' }}>RETURN WINDOW</Badge>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '6px' }}>
            {waterfall.bucket90.count} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>batches</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 700, marginTop: '2px' }}>
            ₹{waterfall.bucket90.value.toLocaleString('en-IN')} at risk
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
            Supplier return window open • Claim debit
          </div>
        </div>

        {/* Tier 4: > 90 Days (Healthy Pipeline) */}
        <div
          onClick={() => setTierFilter(tierFilter === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
          style={{
            backgroundColor: tierFilter === 'HEALTHY' ? 'rgba(16, 185, 129, 0.25)' : '#0E162B',
            border: tierFilter === 'HEALTHY' ? '2px solid #10B981' : '1px solid #1E293B',
            borderRadius: '12px',
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: tierFilter === 'HEALTHY' ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 800, textTransform: 'uppercase' }}>
              🟢 Healthy (&gt; 90 Days)
            </span>
            <Badge variant="success" style={{ fontSize: '0.65rem' }}>BUFFER SAFE</Badge>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F8FAFC', marginTop: '6px' }}>
            {waterfall.healthy.count} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>batches</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 700, marginTop: '2px' }}>
            ₹{waterfall.healthy.value.toLocaleString('en-IN')} safe
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
            Optimal shelf life • Stable dispensary
          </div>
        </div>
      </div>

      {/* Main Batches Card & Filters */}
      <Card padding="md" style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
              Search Batches
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Batch #, medication name, manufacturer..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
              Filter by Distributor / Stockist
            </label>
            <Select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Distributors / C&F' },
                ...availableSuppliers.map((s) => ({ value: s, label: s }))
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
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

        {/* Selection Toolbar for Debit Note */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0B0F19',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
            <span style={{ color: '#94A3B8' }}>
              Selected for Debit Claim: <strong>{selectedBatchIds.size}</strong> batches
            </span>
            {selectedBatchIds.size > 0 && (
              <span style={{ color: '#34D399', fontWeight: 700 }}>
                • Total Claim: ₹{totalDebitNoteValue.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <Button variant="outline" size="sm" onClick={handleSelectAllNearExpiry} style={{ fontSize: '0.72rem' }}>
              Select All &lt; 90 Days
            </Button>
            {selectedBatchIds.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearSelection} style={{ fontSize: '0.72rem' }}>
                Clear Selection
              </Button>
            )}
          </div>
        </div>

        {/* Batches Table with Debit Note Select Checkboxes */}
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: '1.5px solid #334155' }}>
                <TableHead style={{ width: '40px' }}></TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Batch / Lot #</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Medication Name</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Distributor / C&F</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Stock Qty</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Unit Cost</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Expiry Date</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Waterfall Status</TableHead>
                <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem', textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                    No batches match the selected waterfall filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((batch) => {
                  const isSelected = selectedBatchIds.has(batch.id);
                  const cost = parseFloat(batch.unitCost || '0') || 50;
                  return (
                    <TableRow
                      key={batch.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent'
                      }}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectBatch(batch.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                        {batch.batchNumber}
                      </TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#F8FAFC' }}>
                        {batch.medicationName}
                      </TableCell>
                      <TableCell style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                        {batch.manufacturer || 'Pharma Stockist'}
                      </TableCell>
                      <TableCell style={{ color: '#F8FAFC' }}>
                        <strong style={{ color: batch.availableQuantity <= 15 ? '#F87171' : '#34D399' }}>
                          {batch.availableQuantity}
                        </strong> / {batch.receivedQuantity}
                      </TableCell>
                      <TableCell style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>
                        ₹{cost.toFixed(2)}
                      </TableCell>
                      <TableCell style={{ color: '#CBD5E1' }}>
                        {new Date(batch.expiryDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            color:
                              batch.daysToExpiry <= 30 || batch.status === 'EXPIRED'
                                ? '#EF4444'
                                : batch.daysToExpiry <= 60
                                ? '#F97316'
                                : batch.daysToExpiry <= 90
                                ? '#F59E0B'
                                : '#10B981'
                          }}
                        >
                          {batch.daysToExpiry <= 0
                            ? '🔴 EXPIRED'
                            : batch.daysToExpiry <= 30
                            ? `🔴 ${batch.daysToExpiry}d (Critical)`
                            : batch.daysToExpiry <= 60
                            ? `🟠 ${batch.daysToExpiry}d (Fast-Rack)`
                            : batch.daysToExpiry <= 90
                            ? `🟡 ${batch.daysToExpiry}d (Return Window)`
                            : `🟢 ${batch.daysToExpiry}d (Safe)`}
                        </span>
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        {batch.status === 'BLOCKED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenUnblockDialog(batch)}
                            style={{ borderColor: '#10B981', color: '#34D399', fontWeight: 700, fontSize: '0.72rem' }}
                          >
                            ✅ Release
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onOpenBlockDialog(batch)}
                            style={{ fontWeight: 700, fontSize: '0.72rem' }}
                          >
                            🚫 Quarantine
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 1-CLICK SUPPLIER DEBIT NOTE MODAL */}
      {isDebitNoteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
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
              border: '2px solid #EF4444',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              color: '#F8FAFC',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(239, 68, 68, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>📋</span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                    GST Tax Debit Note & Supplier Return Claim (Form 34)
                  </h3>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  Statutory Reverse Invoice under Drugs & Cosmetics Act 1940 (Rule 65) & CGST Act 2017 (Sec 34)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDebitNoteModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Distributor & Hospital Header Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem' }}>Distributor / Supplier:</span>
                <strong style={{ color: '#38BDF8', fontSize: '0.9rem' }}>{selectedSupplierName}</strong>
                <div style={{ color: '#CBD5E1', marginTop: '2px' }}>GSTIN: 27AABCT3518Q1ZV • DL: MH-MZ4-192841</div>
                <div style={{ color: '#94A3B8' }}>Pharma Logistics Warehouse, Industrial Estate, Mumbai</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem' }}>Debit Note Reference:</span>
                <strong style={{ color: '#F59E0B', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                  DN-2026-EXP-{Date.now().toString().slice(-6)}
                </strong>
                <div style={{ color: '#CBD5E1', marginTop: '2px' }}>Date: {new Date().toLocaleDateString('en-IN')}</div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Claim Reason: </span>
                  <select
                    value={debitNoteReason}
                    onChange={(e) => setDebitNoteReason(e.target.value)}
                    style={{
                      backgroundColor: '#0F172A',
                      color: '#A7F3D0',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Near-Expiry Return (Drugs & Cosmetics Act Rule 65)">Near-Expiry Return (Rule 65)</option>
                    <option value="Short Expiry Stock Received from Stockist">Short Expiry Received</option>
                    <option value="Damaged / Seal Broken in Transit">Damaged / Seal Broken</option>
                    <option value="Batch Recall by Drug Regulatory Authority (CDSCO)">CDSCO Batch Recall</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', textAlign: 'left', color: '#94A3B8' }}>
                    <th style={{ padding: '8px' }}>HSN</th>
                    <th style={{ padding: '8px' }}>Medicine Name</th>
                    <th style={{ padding: '8px' }}>Batch #</th>
                    <th style={{ padding: '8px' }}>Expiry</th>
                    <th style={{ padding: '8px' }}>Return Qty</th>
                    <th style={{ padding: '8px' }}>Cost (₹)</th>
                    <th style={{ padding: '8px' }}>GST (12%)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Net Debit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {debitNoteItems.map((item) => (
                    <tr key={item.batchId} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '8px', color: '#94A3B8' }}>{item.hsnCode}</td>
                      <td style={{ padding: '8px', fontWeight: 800, color: '#F8FAFC' }}>{item.medicationName}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', color: '#38BDF8' }}>{item.batchNumber}</td>
                      <td style={{ padding: '8px', color: '#F87171' }}>{new Date(item.expiryDate).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '8px', fontWeight: 800 }}>{item.availableQuantity}</td>
                      <td style={{ padding: '8px' }}>₹{item.unitCost.toFixed(2)}</td>
                      <td style={{ padding: '8px', color: '#A7F3D0' }}>₹{item.gstAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 900, color: '#34D399' }}>
                        ₹{item.netDebitAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary & Statutory Declaration */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#FCA5A5' }}>Total Debit Recovery Claim:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F87171' }}>
                  ₹{totalDebitNoteValue.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Taxable: ₹{(totalDebitNoteValue * 0.89).toFixed(0)} • GST: ₹{(totalDebitNoteValue * 0.11).toFixed(0)}
                </span>
              </div>

              <div style={{ maxWidth: '380px', fontSize: '0.6875rem', color: '#94A3B8', textAlign: 'right' }}>
                "Declared that items listed above are quarantined and barred from sale under D&C Act Rule 65. The debit amount is to be deducted against outstanding hospital pharmacy bills."
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => window.print()} style={{ fontSize: '0.75rem' }}>
                  🖨️ Print Tax Debit Note
                </Button>
                <Button variant="outline" size="sm" onClick={handleShareDebitNoteWhatsApp} style={{ fontSize: '0.75rem' }}>
                  💬 WhatsApp to Distributor Rep
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setIsDebitNoteModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmDebitNote}
                  style={{ fontWeight: 800 }}
                >
                  ⚡ Confirm & Auto-Quarantine {debitNoteItems.length} Batches
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISTRIBUTOR PURCHASE ORDER (PO) MODAL */}
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
                onClick={() => {
                  setIsPoModalOpen(false);
                  setPoSuccessMessage(`✓ PO PO-${Date.now().toString().slice(-6)} generated for ₹${totalPoValue.toLocaleString('en-IN')}`);
                  setTimeout(() => setPoSuccessMessage(null), 5000);
                }}
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
