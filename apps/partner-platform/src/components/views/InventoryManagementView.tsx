import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Dialog,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  PharmacyInventoryDto,
  PharmacyBatchDto,
  PharmacyStockMovementDto,
  PharmacyReturnDto,
  PharmacyStockAdjustmentDto,
  BatchStatus
} from '@docsearch/api-contracts';
import { INDIAN_PHARMACY_FORMULARY, type IndianMedicationFormularyItem } from '../../services/indian-pharmacy-catalog.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface PredictiveStockItem {
  id: string;
  medicationCode: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  currentPhysicalStock: number;
  movingAverageDailyVelocity: number;
  supplierLeadTimeDays: number;
  safetyBufferStock: number;
  calculatedDynamicRop: number;
  projectedDaysOfStock: number;
  isOutbreakSurge: boolean;
  recommendedOrderQuantity: number;
  primarySupplier: string;
}

export interface DischargeWardReturnCase {
  id: string;
  patientName: string;
  uhid: string;
  wardName: string;
  bedNumber: string;
  dischargedAt: string;
  dispensedItemsCount: number;
  returnableItems: {
    itemId: string;
    medicationName: string;
    batchNumber: string;
    dispensedQty: number;
    unopenedReturnQty: number;
    unitPriceMrp: number;
    calculatedRefundAmount: number;
    isSealIntact: boolean;
  }[];
  totalRefundAmount: number;
  reconciliationStatus: 'PENDING_WARD_SCAN' | 'RECONCILED_REFUNDED';
  creditNoteNumber?: string;
}

export interface InventoryManagementViewProps {
  inventory: PharmacyInventoryDto[];
  batches?: PharmacyBatchDto[];
  movements?: PharmacyStockMovementDto[];
  returns?: PharmacyReturnDto[];
  adjustments?: PharmacyStockAdjustmentDto[];
  onOpenReceiveStock: () => void;
  onOpenWholesaleUpload?: () => void;
  onOpenStockAdjustment: () => void;
  onOpenTransferStock: () => void;
  onOpenBlockDialog?: (batch: PharmacyBatchDto) => void;
  onOpenUnblockDialog?: (batch: PharmacyBatchDto) => void;
  onOpenClearData?: (() => void) | undefined;
  onNavigateToPos?: (batch?: PharmacyBatchDto) => void;
  onSeedDevMockStock?: () => Promise<void>;
  onCleanupDevMockStock?: () => Promise<void>;
}

export type InventorySubView = 'stock' | 'predictiveReorder' | 'wardReturns' | 'batches' | 'movements' | 'returns';

export const InventoryManagementView: React.FC<InventoryManagementViewProps> = ({
  inventory,
  batches = [],
  movements = [],
  returns = [],
  adjustments = [],
  onOpenReceiveStock,
  onOpenWholesaleUpload,
  onOpenStockAdjustment,
  onOpenTransferStock,
  onOpenBlockDialog,
  onOpenUnblockDialog,
  onOpenClearData,
  onNavigateToPos,
  onSeedDevMockStock,
  onCleanupDevMockStock
}) => {
  const [subView, setSubView] = useState<InventorySubView>('stock');
  const [stockViewFormat, setStockViewFormat] = useState<'WHOLESALE_BILL' | 'SKU_SUMMARY'>('WHOLESALE_BILL');
  const [isSeedMockOpen, setIsSeedMockOpen] = useState(false);
  const [isCleanMockOpen, setIsCleanMockOpen] = useState(false);
  const [isInwardMenuOpen, setIsInwardMenuOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isDevMode = (import.meta as any).env?.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStockLevel, setFilterStockLevel] = useState<string>('ALL');
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('ALL');

  // Dynamic Consumption-Velocity Reordering State
  const [isOutbreakSurgeSimulated, setIsOutbreakSurgeSimulated] = useState(false);
  const [predictiveItems] = useState<PredictiveStockItem[]>([
    {
      id: 'pred-1',
      medicationCode: 'MED-PARA-650',
      brandName: 'Dolo 650mg Tab',
      genericName: 'Paracetamol',
      dosageForm: 'TABLET',
      currentPhysicalStock: 420,
      movingAverageDailyVelocity: 210,
      supplierLeadTimeDays: 2,
      safetyBufferStock: 150,
      calculatedDynamicRop: 570,
      projectedDaysOfStock: 2.0,
      isOutbreakSurge: true,
      recommendedOrderQuantity: 2500,
      primarySupplier: 'Apex Healthcare Distributors Pvt Ltd'
    },
    {
      id: 'pred-2',
      medicationCode: 'MED-CEFT-1G',
      brandName: 'Monocef 1g Injection',
      genericName: 'Ceftriaxone Sodium',
      dosageForm: 'INJECTION',
      currentPhysicalStock: 95,
      movingAverageDailyVelocity: 42,
      supplierLeadTimeDays: 2,
      safetyBufferStock: 40,
      calculatedDynamicRop: 124,
      projectedDaysOfStock: 2.2,
      isOutbreakSurge: true,
      recommendedOrderQuantity: 500,
      primarySupplier: 'Apex Healthcare Distributors Pvt Ltd'
    },
    {
      id: 'pred-3',
      medicationCode: 'MED-PAN-40',
      brandName: 'Pantocid 40mg Tab',
      genericName: 'Pantoprazole Sodium',
      dosageForm: 'TABLET',
      currentPhysicalStock: 850,
      movingAverageDailyVelocity: 65,
      supplierLeadTimeDays: 3,
      safetyBufferStock: 80,
      calculatedDynamicRop: 275,
      projectedDaysOfStock: 13.0,
      isOutbreakSurge: false,
      recommendedOrderQuantity: 1000,
      primarySupplier: 'Cipla Depot & C&F Agency'
    },
    {
      id: 'pred-4',
      medicationCode: 'MED-NS-500',
      brandName: 'Normal Saline 0.9% 500ml',
      genericName: 'Sodium Chloride IV Infusion',
      dosageForm: 'IV_FLUID',
      currentPhysicalStock: 110,
      movingAverageDailyVelocity: 55,
      supplierLeadTimeDays: 2,
      safetyBufferStock: 60,
      calculatedDynamicRop: 170,
      projectedDaysOfStock: 2.0,
      isOutbreakSurge: true,
      recommendedOrderQuantity: 600,
      primarySupplier: 'Albert David & Otsuka Parenterals'
    }
  ]);
  const [generatedPoAlert, setGeneratedPoAlert] = useState<string | null>(null);

  // Discharge Automated Ward Return Reconciler State
  const [wardReturnCases, setWardReturnCases] = useState<DischargeWardReturnCase[]>([
    {
      id: 'wrc-1',
      patientName: 'Ramesh Patel',
      uhid: 'UHID-2026-901',
      wardName: 'Male Surgical Ward 3',
      bedNumber: 'Bed 14',
      dischargedAt: 'Today 11:30 AM',
      dispensedItemsCount: 12,
      returnableItems: [
        {
          itemId: 'ret-it-1',
          medicationName: 'Monocef 1g Injection (Ceftriaxone)',
          batchNumber: 'BTH-MNC-331',
          dispensedQty: 8,
          unopenedReturnQty: 3,
          unitPriceMrp: 68.0,
          calculatedRefundAmount: 204.0,
          isSealIntact: true
        },
        {
          itemId: 'ret-it-2',
          medicationName: 'Normal Saline 0.9% 500ml IV Bottle',
          batchNumber: 'BTH-NS-2026',
          dispensedQty: 6,
          unopenedReturnQty: 2,
          unitPriceMrp: 45.0,
          calculatedRefundAmount: 90.0,
          isSealIntact: true
        },
        {
          itemId: 'ret-it-3',
          medicationName: 'Pan-IV 40mg Injection (Pantoprazole)',
          batchNumber: 'BTH-PAN-902',
          dispensedQty: 4,
          unopenedReturnQty: 2,
          unitPriceMrp: 54.0,
          calculatedRefundAmount: 108.0,
          isSealIntact: true
        }
      ],
      totalRefundAmount: 402.0,
      reconciliationStatus: 'PENDING_WARD_SCAN'
    },
    {
      id: 'wrc-2',
      patientName: 'Sunita Rao',
      uhid: 'UHID-2026-872',
      wardName: 'Medical ICU Bay',
      bedNumber: 'ICU Bed 04',
      dischargedAt: 'Today 10:15 AM',
      dispensedItemsCount: 18,
      returnableItems: [
        {
          itemId: 'ret-it-4',
          medicationName: 'Inj Meropenem 1g (Meromac)',
          batchNumber: 'BTH-MRO-811',
          dispensedQty: 6,
          unopenedReturnQty: 2,
          unitPriceMrp: 950.0,
          calculatedRefundAmount: 1900.0,
          isSealIntact: true
        },
        {
          itemId: 'ret-it-5',
          medicationName: 'Inj Enoxaparin 40mg/0.4ml Prefilled Syringe (Clexane)',
          batchNumber: 'BTH-CLX-551',
          dispensedQty: 4,
          unopenedReturnQty: 1,
          unitPriceMrp: 480.0,
          calculatedRefundAmount: 480.0,
          isSealIntact: true
        }
      ],
      totalRefundAmount: 2380.0,
      reconciliationStatus: 'PENDING_WARD_SCAN'
    }
  ]);
  const [reconciledCreditNoteAlert, setReconciledCreditNoteAlert] = useState<string | null>(null);

  const handleTriggerDynamicPo = (item: PredictiveStockItem) => {
    const poNumber = `PO-2026-AUTODIST-${Math.floor(100 + Math.random() * 900)}`;
    hospitalEventBus.publish(
      'DYNAMIC_REORDER_TRIGGERED',
      'InventoryManagementView',
      {
        poNumber,
        medicationCode: item.medicationCode,
        medicationName: item.brandName,
        dailyVelocity: item.movingAverageDailyVelocity,
        leadTimeDays: item.supplierLeadTimeDays,
        dynamicRop: item.calculatedDynamicRop,
        currentStock: item.currentPhysicalStock,
        projectedDaysOfStock: item.projectedDaysOfStock,
        orderedQty: item.recommendedOrderQuantity,
        distributor: item.primarySupplier
      },
      `Dynamic ROP Breach: ${item.brandName} projected days-of-stock (${item.projectedDaysOfStock}d < 3d). Auto-PO ${poNumber} raised for ${item.recommendedOrderQuantity} units to ${item.primarySupplier}`
    );

    setGeneratedPoAlert(`✓ Auto-generated PO ${poNumber} for ${item.recommendedOrderQuantity} units of ${item.brandName} dispatched via EDI to ${item.primarySupplier}!`);
    setTimeout(() => setGeneratedPoAlert(null), 4000);
  };

  const handleReconcileWardReturn = (wrc: DischargeWardReturnCase) => {
    const creditNoteNo = `CN-2026-WARD-${Math.floor(1000 + Math.random() * 9000)}`;
    setWardReturnCases((prev) =>
      prev.map((c) =>
        c.id === wrc.id
          ? { ...c, reconciliationStatus: 'RECONCILED_REFUNDED', creditNoteNumber: creditNoteNo }
          : c
      )
    );

    hospitalEventBus.publish(
      'WARD_MEDICATION_RETURN_RECONCILED',
      'InventoryManagementView',
      {
        creditNoteNumber: creditNoteNo,
        patientName: wrc.patientName,
        uhid: wrc.uhid,
        ward: wrc.wardName,
        refundAmount: wrc.totalRefundAmount,
        returnedItems: wrc.returnableItems.map((i) => ({
          name: i.medicationName,
          batch: i.batchNumber,
          qty: i.unopenedReturnQty,
          refund: i.calculatedRefundAmount
        }))
      },
      `Discharge Ward Return Reconciled: ${wrc.patientName} (${wrc.uhid}) — Refund Credit Note ${creditNoteNo} (₹ ${wrc.totalRefundAmount.toFixed(2)}) issued; sealed vials restocked to FEFO inventory`
    );

    setReconciledCreditNoteAlert(`✓ Credit Note ${creditNoteNo} (₹ ${wrc.totalRefundAmount.toFixed(2)}) generated for ${wrc.patientName}! Unused sealed vials restocked to Central Pharmacy FEFO batches.`);
    setTimeout(() => setReconciledCreditNoteAlert(null), 4000);
  };

  // KPI Calculations
  const totalSkus = inventory.length;
  const totalUnits = inventory.reduce((sum, item) => sum + item.availableQuantity, 0);
  const lowStockCount = inventory.filter((item) => item.availableQuantity <= item.reorderLevel).length;
  const nearExpiryCount = batches.filter((b) => (b.daysToExpiry ?? 999) < 60 && b.status !== 'EXPIRED' && b.status !== 'DEPLETED').length;
  const blockedCount = batches.filter((b) => b.status === 'BLOCKED' || b.status === 'EXPIRED').length;

  // Filtered Stock Items (SKU Summary View)
  const filteredStock = inventory.filter((item) => {
    const isLow = item.availableQuantity <= item.reorderLevel;
    const matchesLevel =
      filterStockLevel === 'ALL' ||
      (filterStockLevel === 'LOW' && isLow) ||
      (filterStockLevel === 'NORMAL' && !isLow);
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      item.genericName.toLowerCase().includes(q) ||
      item.brandName.toLowerCase().includes(q) ||
      item.medicationCode.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesLevel && matchesSearch;
  });

  // Filtered Batches sorted FEFO (soonest expiry first)
  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => {
      const dA = a.daysToExpiry ?? 9999;
      const dB = b.daysToExpiry ?? 9999;
      return dA - dB;
    });
  }, [batches]);

  const filteredBatches = sortedBatches.filter((b) => {
    const matchesStatus =
      batchStatusFilter === 'ALL' ||
      (batchStatusFilter === 'NEAR_EXPIRY' && (b.daysToExpiry ?? 999) < 60 && b.status !== 'EXPIRED') ||
      (batchStatusFilter === 'BLOCKED' && (b.status === 'BLOCKED' || b.status === 'EXPIRED')) ||
      b.status === batchStatusFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      b.batchNumber.toLowerCase().includes(q) ||
      b.medicationName.toLowerCase().includes(q) ||
      b.manufacturer.toLowerCase().includes(q) ||
      (b.supplierReference && b.supplierReference.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Authentic Indian Wholesale GST Bill Stock Register Mapping
  const wholesaleRows = useMemo(() => {
    const rows: Array<{
      id: string;
      batchId?: string;
      sn: number;
      brandName: string;
      genericName: string;
      strength: string;
      dosageForm: string;
      hsn: string;
      pack: string;
      qty: number;
      batchNo: string;
      expiryRaw: string;
      expFormatted: string;
      daysToExpiry: number;
      mrp: number;
      rate: number;
      discPercent: number;
      gstRate: number;
      amount: number;
      retailValue: number;
      status: BatchStatus;
      manufacturer: string;
      medicationCode: string;
      batchRef?: PharmacyBatchDto | undefined;
      invRef?: PharmacyInventoryDto | undefined;
    }> = [];

    let sn = 1;

    // Fast lookup maps for formulary and inventory items
    const invMap = new Map<string, PharmacyInventoryDto>();
    for (const inv of inventory) {
      invMap.set(inv.medicationId, inv);
      invMap.set(inv.medicationCode, inv);
    }

    const formularyMap = new Map<string, IndianMedicationFormularyItem>();
    for (const f of INDIAN_PHARMACY_FORMULARY) {
      formularyMap.set(f.id, f);
      formularyMap.set(f.medicationCode, f);
      formularyMap.set(f.brandName.toLowerCase(), f);
    }

    const findFormulary = (medId?: string, medCode?: string, brandName?: string, genericName?: string) => {
      if (medId && formularyMap.has(medId)) return formularyMap.get(medId);
      if (medCode && formularyMap.has(medCode)) return formularyMap.get(medCode);
      if (brandName) {
        const lower = brandName.toLowerCase().trim();
        if (formularyMap.has(lower)) return formularyMap.get(lower);
        const match = INDIAN_PHARMACY_FORMULARY.find(f => lower.includes(f.brandName.toLowerCase()) || f.brandName.toLowerCase().includes(lower));
        if (match) return match;
      }
      if (genericName) {
        const lower = genericName.toLowerCase().trim();
        const match = INDIAN_PHARMACY_FORMULARY.find(f => lower.includes(f.genericName.toLowerCase()) || f.genericName.toLowerCase().includes(lower));
        if (match) return match;
      }
      return undefined;
    };

    const formatExp = (expStr?: string): string => {
      if (!expStr) return '--/--';
      const clean = expStr.trim();
      if (/^\d{2}\/\d{2,4}$/.test(clean)) {
        const p = clean.split('/');
        return `${p[0]}/${p[1]!.slice(-2)}`;
      }
      const m = clean.match(/^(\d{4})-(\d{1,2})/);
      if (m) {
        return `${m[2]!.padStart(2, '0')}/${m[1]!.slice(-2)}`;
      }
      return clean;
    };

    const inferHsn = (name: string, form: string, fallbackHsn?: string): string => {
      if (fallbackHsn && fallbackHsn.length >= 4) return fallbackHsn;
      const lower = name.toLowerCase();
      if (lower.includes('syring') || lower.includes('needle') || lower.includes('bandage') || lower.includes('cotton')) {
        return '90183100';
      }
      if (lower.includes('inj') || lower.includes('vial') || form === 'INJECTION') {
        return '30042099';
      }
      if (lower.includes('dextrose') || lower.includes('glucose') || lower.includes('energy')) {
        return '17023000';
      }
      return '30049060';
    };

    const inferPack = (form: string, packUnits?: number, fallbackPack?: string): string => {
      if (fallbackPack && fallbackPack.trim().length > 0) return fallbackPack;
      const f = (form || '').toUpperCase();
      if (f === 'TABLET' || f === 'CAPSULE') {
        return packUnits ? `1 X ${packUnits}` : '1 X 10';
      }
      if (f === 'SYRUP' || f === 'DROPS' || f === 'LOTION') {
        return '100ML';
      }
      if (f === 'INJECTION') {
        return '1 Vial';
      }
      if (f === 'OINTMENT') {
        return '20g Tube';
      }
      return '1 Pack';
    };

    const processedMedKeys = new Set<string>();

    for (const batch of sortedBatches) {
      const inv = invMap.get(batch.medicationId) || invMap.get(batch.medicationCode);
      const rawName = batch.medicationName || inv?.brandName || 'Medicine';
      const brand = inv?.brandName || (rawName.includes('(') ? rawName.split('(')[0]?.trim() : rawName) || 'Medicine';
      const generic = inv?.genericName || (rawName.includes('(') ? rawName.split('(')[1]?.replace(')', '').trim() : '') || 'Pharmaceutical Preparation';
      const formItem = findFormulary(batch.medicationId, batch.medicationCode, brand, generic);

      const hsn = formItem?.hsnCode || inferHsn(brand, inv?.dosageForm || 'TABLET');
      const pack = formItem?.packConfiguration || inferPack(inv?.dosageForm || 'TABLET', formItem?.packUnits);
      const unitCostNum = parseFloat(batch.unitCost || '0');
      const rate = unitCostNum > 0 ? unitCostNum : (formItem?.costPrice || (formItem?.unitPrice ? formItem.unitPrice * 0.75 : 15.00));
      const mrp = formItem?.mrp || Math.round(rate * 1.45 * 100) / 100;
      const gstRate = formItem?.gstRate || (hsn.startsWith('9018') ? 12 : 12);
      const discPercent = 0;
      const amount = Math.round(batch.availableQuantity * rate * (1 - discPercent / 100) * 100) / 100;
      const retailValue = Math.round(batch.availableQuantity * mrp * 100) / 100;

      rows.push({
        id: batch.id,
        batchId: batch.id,
        sn: sn++,
        brandName: brand,
        genericName: generic,
        strength: inv?.strength || formItem?.strength || 'Standard',
        dosageForm: inv?.dosageForm || formItem?.dosageForm || 'TABLET',
        hsn,
        pack,
        qty: batch.availableQuantity,
        batchNo: batch.batchNumber,
        expiryRaw: batch.expiryDate,
        expFormatted: formatExp(batch.expiryDate),
        daysToExpiry: batch.daysToExpiry ?? 999,
        mrp,
        rate,
        discPercent,
        gstRate,
        amount,
        retailValue,
        status: batch.status,
        manufacturer: batch.manufacturer || formItem?.manufacturer || 'Pharma Stockist',
        medicationCode: batch.medicationCode,
        batchRef: batch,
        invRef: inv
      });

      if (batch.medicationId) processedMedKeys.add(batch.medicationId);
      if (batch.medicationCode) processedMedKeys.add(batch.medicationCode);
    }

    // Also include any inventory items that didn't have a batch entry
    for (const inv of inventory) {
      if (!processedMedKeys.has(inv.medicationId) && !processedMedKeys.has(inv.medicationCode)) {
        const formItem = findFormulary(inv.medicationId, inv.medicationCode, inv.brandName, inv.genericName);
        const hsn = formItem?.hsnCode || inferHsn(inv.brandName, inv.dosageForm);
        const pack = formItem?.packConfiguration || inferPack(inv.dosageForm, formItem?.packUnits);
        const rate = formItem?.costPrice || (formItem?.unitPrice ? formItem.unitPrice * 0.75 : 20.00);
        const mrp = formItem?.mrp || Math.round(rate * 1.45 * 100) / 100;
        const gstRate = formItem?.gstRate || 12;
        const amount = Math.round(inv.availableQuantity * rate * 100) / 100;
        const retailValue = Math.round(inv.availableQuantity * mrp * 100) / 100;

        rows.push({
          id: `inv-${inv.id}`,
          sn: sn++,
          brandName: inv.brandName,
          genericName: inv.genericName,
          strength: inv.strength,
          dosageForm: inv.dosageForm,
          hsn,
          pack,
          qty: inv.availableQuantity,
          batchNo: `BTH-${inv.medicationCode.replace(/[^A-Za-z0-9]/g, '').slice(-5) || 'GEN'}-01`,
          expiryRaw: '2028-12-31',
          expFormatted: '12/28',
          daysToExpiry: 850,
          mrp,
          rate,
          discPercent: 0,
          gstRate,
          amount,
          retailValue,
          status: inv.availableQuantity <= inv.reorderLevel ? 'LOW_STOCK' : 'ACTIVE',
          manufacturer: formItem?.manufacturer || 'Standard Pharma',
          medicationCode: inv.medicationCode,
          invRef: inv
        });
      }
    }

    return rows;
  }, [inventory, sortedBatches]);

  // Filtered Wholesale Rows (respects Search and Stock Filters)
  const filteredWholesaleRows = useMemo(() => {
    return wholesaleRows.filter((row) => {
      const isLow = row.qty <= 50 || Boolean(row.invRef && row.qty <= row.invRef.reorderLevel);
      const isNearExpiry = row.daysToExpiry < 60 && row.status !== 'EXPIRED';
      const isExpiredOrBlocked = row.status === 'BLOCKED' || row.status === 'EXPIRED' || row.daysToExpiry <= 0;

      let matchesFilter = true;
      if (filterStockLevel === 'LOW') {
        matchesFilter = isLow;
      } else if (filterStockLevel === 'NEAR_EXPIRY') {
        matchesFilter = isNearExpiry;
      } else if (filterStockLevel === 'BLOCKED') {
        matchesFilter = isExpiredOrBlocked;
      } else if (filterStockLevel === 'NORMAL') {
        matchesFilter = !isLow && !isNearExpiry && !isExpiredOrBlocked;
      }

      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        row.brandName.toLowerCase().includes(q) ||
        row.genericName.toLowerCase().includes(q) ||
        row.batchNo.toLowerCase().includes(q) ||
        row.hsn.toLowerCase().includes(q) ||
        row.pack.toLowerCase().includes(q) ||
        row.manufacturer.toLowerCase().includes(q) ||
        row.medicationCode.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [wholesaleRows, filterStockLevel, searchTerm]);

  // Wholesale Bill Financial Summary (PTR Valuation vs MRP vs Profit)
  const billSummary = useMemo(() => {
    let totalQty = 0;
    let totalTaxableValue = 0;
    let totalRetailValue = 0;
    let gst5Taxable = 0;
    let gst12Taxable = 0;
    let gst18Taxable = 0;

    for (const r of filteredWholesaleRows) {
      totalQty += r.qty;
      totalTaxableValue += r.amount;
      totalRetailValue += r.retailValue;
      if (r.gstRate === 5) {
        gst5Taxable += r.amount;
      } else if (r.gstRate === 12) {
        gst12Taxable += r.amount;
      } else {
        gst18Taxable += r.amount;
      }
    }

    const grossProfit = Math.max(0, totalRetailValue - totalTaxableValue);
    const profitMarginPercent = totalRetailValue > 0 ? (grossProfit / totalRetailValue) * 100 : 0;

    return {
      totalBatches: filteredWholesaleRows.length,
      totalQty,
      totalTaxableValue,
      totalRetailValue,
      grossProfit,
      profitMarginPercent,
      gst5Taxable,
      gst12Taxable,
      gst18Taxable
    };
  }, [filteredWholesaleRows]);

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

  const handleExportInventoryCSV = () => {
    if (stockViewFormat === 'WHOLESALE_BILL') {
      const headers = [
        'S.No',
        'Product Name (Brand)',
        'Generic Composition',
        'HSN Code',
        'Pack Size',
        'In-Stock Qty',
        'Batch Number',
        'Expiry (MM/YY)',
        'Printed MRP (INR)',
        'Purchase Rate PTR (INR)',
        'Discount %',
        'GST %',
        'Stock Valuation Amount (INR)',
        'Batch Status',
        'Manufacturer'
      ];

      const rows = filteredWholesaleRows.map((r) => [
        r.sn,
        `"${r.brandName.replace(/"/g, '""')}"`,
        `"${r.genericName.replace(/"/g, '""')}"`,
        `"${r.hsn}"`,
        `"${r.pack}"`,
        `"${r.batchNo}"`,
        `"${r.expFormatted}"`,
        r.qty,
        r.mrp.toFixed(2),
        r.rate.toFixed(2),
        r.discPercent.toFixed(2),
        r.gstRate,
        r.amount.toFixed(2),
        `"${r.status}"`,
        `"${r.manufacturer.replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Pharmacy_GST_Wholesale_Register_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = [
      'Medication Code',
      'Generic Formulation',
      'Brand Name',
      'Strength',
      'Dosage Form',
      'Category',
      'Available Units',
      'Reserved Units',
      'Reorder Level',
      'Reorder Qty',
      'Active Batches Count',
      'Stock Status'
    ];

    const rows = inventory.map((item) => {
      const isLow = item.availableQuantity <= item.reorderLevel;
      return [
        `"${item.medicationCode}"`,
        `"${item.genericName.replace(/"/g, '""')}"`,
        `"${item.brandName.replace(/"/g, '""')}"`,
        `"${item.strength}"`,
        `"${item.dosageForm}"`,
        `"${item.category}"`,
        item.availableQuantity,
        item.reservedQuantity,
        item.reorderLevel,
        item.reorderQuantity,
        item.batches.length,
        isLow ? 'CRITICAL_LOW' : 'ADEQUATE'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pharmacy_Stock_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        .pharmacy-table-scroll {
          scrollbar-width: thin;
          scrollbar-color: #059669 #0F172A;
        }
        .pharmacy-table-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .pharmacy-table-scroll::-webkit-scrollbar-track {
          background: #0F172A;
          border-radius: 6px;
        }
        .pharmacy-table-scroll::-webkit-scrollbar-thumb {
          background: #059669;
          border-radius: 6px;
          border: 2px solid #0F172A;
        }
        .pharmacy-table-scroll::-webkit-scrollbar-thumb:hover {
          background: #10B981;
        }
      `}</style>
      {/* Top Header & Operational Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
              📦 Pharmacy Stock, Batch & FEFO Radar
            </h2>
            <Badge variant="success">Live Inventory Hub</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: '#CBD5E1', fontSize: '0.85rem' }}>
            Real-time branch inventory with FEFO (First-Expiry, First-Out) dispatch, near-expiry alerts, and batch quarantine controls.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={handleExportInventoryCSV}>
            📥 Export Stock CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenTransferStock}>
            🚚 Inter-Facility Transfer
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenStockAdjustment}>
            ⚖️ Cycle Count / Adjustment
          </Button>
          {/* Consolidated Inward Stock Dropdown */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="success"
              size="sm"
              onClick={() => setIsInwardMenuOpen(!isInwardMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800
              }}
              title="Add stock via wholesale purchase bill or manual entry"
            >
              <span>📦 + Inward Stock ▾</span>
            </Button>
            {isInwardMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  zIndex: 100,
                  backgroundColor: '#0F172A',
                  border: '1.5px solid #10B981',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7), 0 0 12px rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '240px',
                  overflow: 'hidden'
                }}
              >
                {onOpenWholesaleUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsInwardMenuOpen(false);
                      onOpenWholesaleUpload();
                    }}
                    style={{
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      color: '#34D399',
                      textAlign: 'left',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>🧾</span>
                    <div>
                      <div style={{ fontWeight: 800 }}>Wholesale Bill Inward (OCR / PDF)</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Scan Marg, Vyapar, or photo bills</div>
                    </div>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsInwardMenuOpen(false);
                    onOpenReceiveStock();
                  }}
                  style={{
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    borderTop: onOpenWholesaleUpload ? '1px solid #1E293B' : 'none',
                    color: '#E2E8F0',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>📝</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>Manual Batch Intake</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Direct batch number & expiry entry</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {onOpenClearData && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenClearData}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.14)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#FCA5A5',
                fontWeight: 700
              }}
              title="Clear or reset pharmacy test and dummy stock"
            >
              🧹 Clear Data
            </Button>
          )}

          {/* Collapsible Dev Tools Menu */}
          {isDevMode && (onSeedDevMockStock || onCleanupDevMockStock) && (
            <div style={{ position: 'relative' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.12)',
                  borderColor: 'rgba(6, 182, 212, 0.4)',
                  color: '#67E8F9',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Development mock stock utilities"
              >
                <span>🛠️ Dev Tools ▾</span>
              </Button>
              {isDevMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    zIndex: 100,
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '180px',
                    overflow: 'hidden'
                  }}
                >
                  {onSeedDevMockStock && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDevMenuOpen(false);
                        setIsSeedMockOpen(true);
                      }}
                      style={{
                        padding: '9px 12px',
                        background: 'none',
                        border: 'none',
                        color: '#67E8F9',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>🧪</span>
                      <span>Seed Mock Stock</span>
                    </button>
                  )}
                  {onCleanupDevMockStock && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDevMenuOpen(false);
                        setIsCleanMockOpen(true);
                      }}
                      style={{
                        padding: '9px 12px',
                        background: 'none',
                        border: 'none',
                        color: '#FCD34D',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderTop: onSeedDevMockStock ? '1px solid #1E293B' : 'none'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>🧹</span>
                      <span>Clean Mock Stock</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: actionFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: actionFeedback.type === 'success' ? '#34D399' : '#F87171',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Metric Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>

        <div
          onClick={() => { setSubView('stock'); setFilterStockLevel('ALL'); }}
          style={{
            background: subView === 'stock' && filterStockLevel === 'ALL' ? 'rgba(16, 185, 129, 0.16)' : '#0F172A',
            border: `1.5px solid ${subView === 'stock' && filterStockLevel === 'ALL' ? '#10B981' : '#1E293B'}`,
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            boxShadow: subView === 'stock' && filterStockLevel === 'ALL' ? '0 0 16px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📦 Total Formulations / SKUs
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
            {totalSkus} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8' }}>items</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>
            ⚡ {totalUnits.toLocaleString()} units available
          </div>
        </div>

        <div
          onClick={() => { setSubView('stock'); setFilterStockLevel('LOW'); }}
          style={{
            background: subView === 'stock' && filterStockLevel === 'LOW' ? 'rgba(239, 68, 68, 0.18)' : '#0F172A',
            border: `1.5px solid ${subView === 'stock' && filterStockLevel === 'LOW' ? '#EF4444' : lowStockCount > 0 ? 'rgba(239, 68, 68, 0.45)' : '#1E293B'}`,
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            boxShadow: subView === 'stock' && filterStockLevel === 'LOW' ? '0 0 16px rgba(239, 68, 68, 0.2)' : '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚠️ Critical Low Stock
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: lowStockCount > 0 ? '#F87171' : '#34D399', marginTop: '4px' }}>
            {lowStockCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8' }}>items</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: lowStockCount > 0 ? '#F87171' : '#94A3B8', fontWeight: 700, marginTop: '2px' }}>
            {lowStockCount > 0 ? 'Below reorder minimum' : 'All stocks adequate'}
          </div>
        </div>

        <div
          onClick={() => { setSubView('batches'); setBatchStatusFilter('NEAR_EXPIRY'); }}
          style={{
            background: subView === 'batches' && batchStatusFilter === 'NEAR_EXPIRY' ? 'rgba(245, 158, 11, 0.18)' : '#0F172A',
            border: `1.5px solid ${subView === 'batches' && batchStatusFilter === 'NEAR_EXPIRY' ? '#F59E0B' : nearExpiryCount > 0 ? 'rgba(245, 158, 11, 0.45)' : '#1E293B'}`,
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            boxShadow: subView === 'batches' && batchStatusFilter === 'NEAR_EXPIRY' ? '0 0 16px rgba(245, 158, 11, 0.2)' : '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⏳ Near Expiry (&lt; 60 Days)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: nearExpiryCount > 0 ? '#FBBF24' : '#34D399', marginTop: '4px' }}>
            {nearExpiryCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8' }}>batches</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: nearExpiryCount > 0 ? '#FBBF24' : '#94A3B8', fontWeight: 700, marginTop: '2px' }}>
            {nearExpiryCount > 0 ? 'FEFO priority dispensing' : 'No near-expiry batches'}
          </div>
        </div>

        <div
          onClick={() => { setSubView('batches'); setBatchStatusFilter('BLOCKED'); }}
          style={{
            background: subView === 'batches' && batchStatusFilter === 'BLOCKED' ? 'rgba(239, 68, 68, 0.18)' : '#0F172A',
            border: `1.5px solid ${subView === 'batches' && batchStatusFilter === 'BLOCKED' ? '#DC2626' : blockedCount > 0 ? 'rgba(239, 68, 68, 0.5)' : '#1E293B'}`,
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            boxShadow: subView === 'batches' && batchStatusFilter === 'BLOCKED' ? '0 0 16px rgba(239, 68, 68, 0.2)' : '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🛑 Quarantined / Expired
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: blockedCount > 0 ? '#EF4444' : '#34D399', marginTop: '4px' }}>
            {blockedCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8' }}>batches</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: blockedCount > 0 ? '#FCA5A5' : '#94A3B8', fontWeight: 700, marginTop: '2px' }}>
            {blockedCount > 0 ? 'Dispensing locked' : 'Zero blocked batches'}
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #1E293B', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSubView('stock')}
          style={{
            background: subView === 'stock' ? 'rgba(56, 189, 248, 0.15)' : '#1E293B',
            color: subView === 'stock' ? '#38BDF8' : '#94A3B8',
            border: subView === 'stock' ? '1px solid #38BDF8' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📦</span> Stock Levels & Reorder Radar ({inventory.length})
        </button>

        <button
          type="button"
          onClick={() => setSubView('predictiveReorder')}
          style={{
            background: subView === 'predictiveReorder' ? 'rgba(59, 130, 246, 0.18)' : '#1E293B',
            color: subView === 'predictiveReorder' ? '#60A5FA' : '#94A3B8',
            border: subView === 'predictiveReorder' ? '1px solid #3B82F6' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>⚡</span> Predictive Reorder Engine ({predictiveItems.filter(p => p.projectedDaysOfStock < 3).length} Urgent)
        </button>

        <button
          type="button"
          onClick={() => setSubView('wardReturns')}
          style={{
            background: subView === 'wardReturns' ? 'rgba(16, 185, 129, 0.18)' : '#1E293B',
            color: subView === 'wardReturns' ? '#34D399' : '#94A3B8',
            border: subView === 'wardReturns' ? '1px solid #10B981' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🔄</span> Discharge Ward Return Reconciler ({wardReturnCases.filter(w => w.reconciliationStatus === 'PENDING_WARD_SCAN').length} Pending)
        </button>

        <button
          type="button"
          onClick={() => setSubView('batches')}
          style={{
            background: subView === 'batches' ? 'rgba(245, 158, 11, 0.15)' : '#1E293B',
            color: subView === 'batches' ? '#FBBF24' : '#94A3B8',
            border: subView === 'batches' ? '1px solid #F59E0B' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>⏳</span> Batch Expiry & FEFO Radar ({batches.length})
          {nearExpiryCount > 0 && (
            <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>
              {nearExpiryCount} Near Expiry
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubView('movements')}
          style={{
            background: subView === 'movements' ? 'rgba(16, 185, 129, 0.15)' : '#1E293B',
            color: subView === 'movements' ? '#34D399' : '#94A3B8',
            border: subView === 'movements' ? '1px solid #10B981' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🚚</span> Stock Movements Audit ({movements.length})
        </button>

        <button
          type="button"
          onClick={() => setSubView('returns')}
          style={{
            background: subView === 'returns' ? 'rgba(168, 85, 247, 0.15)' : '#1E293B',
            color: subView === 'returns' ? '#C084FC' : '#94A3B8',
            border: subView === 'returns' ? '1px solid #A855F7' : '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🔄</span> Returns & Adjustments ({returns.length + adjustments.length})
        </button>
      </div>

      {/* Sub-view Content */}
      <Card padding="md" style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}>
        {/* Search, Filter & Format Mode Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
          {/* Format Mode Toggle (Wholesale GST Invoice vs SKU Summary) */}
          {subView === 'stock' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #1E293B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8' }}>Format:</span>
                <button
                  type="button"
                  onClick={() => setStockViewFormat('WHOLESALE_BILL')}
                  style={{
                    backgroundColor: stockViewFormat === 'WHOLESALE_BILL' ? '#059669' : '#1E293B',
                    color: stockViewFormat === 'WHOLESALE_BILL' ? '#FFFFFF' : '#CBD5E1',
                    border: stockViewFormat === 'WHOLESALE_BILL' ? '1.5px solid #10B981' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: stockViewFormat === 'WHOLESALE_BILL' ? '0 0 12px rgba(5, 150, 105, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🧾</span> Wholesale Bill Register (GST Format)
                </button>
                <button
                  type="button"
                  onClick={() => setStockViewFormat('SKU_SUMMARY')}
                  style={{
                    backgroundColor: stockViewFormat === 'SKU_SUMMARY' ? 'rgba(56, 189, 248, 0.18)' : '#1E293B',
                    color: stockViewFormat === 'SKU_SUMMARY' ? '#38BDF8' : '#94A3B8',
                    border: stockViewFormat === 'SKU_SUMMARY' ? '1.5px solid #38BDF8' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>📦</span> SKU Formulation Summary (Consolidated View)
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', backgroundColor: 'rgba(5, 150, 105, 0.18)', color: '#34D399', border: '1px solid rgba(5, 150, 105, 0.4)', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  ↕️ Vertical Scroll Active ({filteredWholesaleRows.length} Rows)
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                  {stockViewFormat === 'WHOLESALE_BILL'
                    ? 'Maa Kali Medicos / Marg ERP Layout'
                    : 'Generic Formulation Summary'}
                </span>
              </div>
            </div>
          )}

          {/* Search & Filter Inputs */}
          {subView !== 'predictiveReorder' && subView !== 'wardReturns' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  Search Medications, Batches, HSN or Pack
                </label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search generic salt, brand name, batch no, HSN (300490), pack (1x10)..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  {subView === 'stock' ? 'Filter by Stock Level' : 'Filter by Batch Status'}
                </label>
                {subView === 'stock' ? (
                  <Select
                    value={filterStockLevel}
                    onChange={(e) => setFilterStockLevel(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'All Inventory Items' },
                      { value: 'LOW', label: '⚠️ Low Stock (At/Below Reorder Minimum)' },
                      { value: 'NEAR_EXPIRY', label: '⏳ Near Expiry (< 60 Days FEFO)' },
                      { value: 'NORMAL', label: '✅ Adequate Stock Level' },
                      { value: 'BLOCKED', label: '🛑 Expired / Quarantined' }
                    ]}
                  />
                ) : (
                  <Select
                    value={batchStatusFilter}
                    onChange={(e) => setBatchStatusFilter(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'All Batches' },
                      { value: 'ACTIVE', label: '✅ Active (Good to Dispense)' },
                      { value: 'NEAR_EXPIRY', label: '⏳ Near Expiry (< 60 Days)' },
                      { value: 'BLOCKED', label: '🛑 Blocked / Expired (Locked)' }
                    ]}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 1. Stock Overview Sub-view */}
        {subView === 'stock' && (
          <>
            {/* 1A. Wholesale GST Bill Format (Default Indian Stockist Invoice Format) */}
            {stockViewFormat === 'WHOLESALE_BILL' ? (
              <div>
                <TableContainer
                  className="pharmacy-table-scroll"
                  style={{
                    maxHeight: '580px',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    borderRadius: '8px',
                    border: '1.5px solid #334155',
                    backgroundColor: '#0A0F1D'
                  }}
                >
                  <Table isStickyHeader>
                    <TableHeader isSticky style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1E293B', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                      <TableRow style={{ backgroundColor: '#1E293B', borderBottom: '2px solid #334155' }}>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '45px', textAlign: 'center' }}>
                          S.N.<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>SL NO.</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', minWidth: '220px' }}>
                          Product & Formulation<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>PRODUCT & SALTS</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '90px' }}>
                          HSN Code<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>HSN CODE</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '95px' }}>
                          Packing<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>PACK</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '85px', textAlign: 'right' }}>
                          Stock Qty<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>QTY</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '120px' }}>
                          Batch No.<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>BATCH NO.</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '90px', textAlign: 'center' }}>
                          Expiry<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>EXP (MM/YY)</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '95px', textAlign: 'right' }}>
                          MRP (₹)<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>PRINT MRP</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '95px', textAlign: 'right' }}>
                          Rate PTR (₹)<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>PURCHASE RATE</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '75px', textAlign: 'right' }}>
                          Discount %<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>DISC %</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '65px', textAlign: 'center' }}>
                          GST %<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>TAX %</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '115px', textAlign: 'right' }}>
                          Total Amount (₹)<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>AMOUNT</span>
                        </TableHead>
                        <TableHead style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem', width: '95px', textAlign: 'center' }}>
                          Action<br /><span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>ACTION</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWholesaleRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={13} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                            No medication or batch records found. Please adjust your search query or filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredWholesaleRows.map((row) => (
                          <TableRow key={row.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                            {/* 1. S.N. */}
                            <TableCell style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                              {row.sn}
                            </TableCell>

                            {/* 2. Product */}
                            <TableCell>
                              <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.92rem', letterSpacing: '0.01em' }}>
                                {row.brandName}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#38BDF8', marginTop: '2px', fontWeight: 600 }}>
                                {row.genericName}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>
                                {row.manufacturer} • {row.strength}
                              </div>
                            </TableCell>

                            {/* 3. HSN */}
                            <TableCell style={{ fontFamily: 'monospace', fontWeight: 700, color: '#E2E8F0', fontSize: '0.82rem' }}>
                              {row.hsn}
                            </TableCell>

                            {/* 4. PACK */}
                            <TableCell>
                              <span style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', padding: '2px 7px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 700 }}>
                                {row.pack}
                              </span>
                            </TableCell>

                            {/* 5. QTY */}
                            <TableCell style={{ textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: row.qty <= 50 ? '#F87171' : '#34D399', fontFamily: 'monospace' }}>
                              {row.qty.toLocaleString()}
                              {row.qty <= 50 && (
                                <div style={{ fontSize: '0.68rem', color: '#FCA5A5', fontWeight: 700 }}>Low Stock</div>
                              )}
                            </TableCell>

                            {/* 6. BATCH */}
                            <TableCell>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8', fontSize: '0.84rem', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '5px', display: 'inline-block' }}>
                                {row.batchNo}
                              </span>
                            </TableCell>

                            {/* 7. EXP */}
                            <TableCell style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.85rem', color: row.daysToExpiry <= 0 ? '#EF4444' : row.daysToExpiry < 60 ? '#FBBF24' : '#E2E8F0' }}>
                                {row.expFormatted}
                              </div>
                              {row.daysToExpiry <= 0 ? (
                                <span style={{ fontSize: '0.65rem', backgroundColor: '#DC2626', color: '#FFF', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                  EXPIRED
                                </span>
                              ) : row.daysToExpiry < 60 ? (
                                <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                  ⏳ {row.daysToExpiry}d
                                </span>
                              ) : null}
                            </TableCell>

                            {/* 8. MRP (₹) */}
                            <TableCell style={{ textAlign: 'right', fontWeight: 700, color: '#CBD5E1', fontFamily: 'monospace', fontSize: '0.86rem' }}>
                              ₹{row.mrp.toFixed(2)}
                            </TableCell>

                            {/* 9. RATE / PTR (₹) */}
                            <TableCell style={{ textAlign: 'right', fontWeight: 800, color: '#34D399', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                              ₹{row.rate.toFixed(2)}
                            </TableCell>

                            {/* 10. DISC% */}
                            <TableCell style={{ textAlign: 'right', fontWeight: 600, color: row.discPercent > 0 ? '#FBBF24' : '#64748B', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                              {row.discPercent.toFixed(2)}%
                            </TableCell>

                            {/* 11. GST% */}
                            <TableCell style={{ textAlign: 'center' }}>
                              <span style={{ backgroundColor: '#1E293B', color: '#A5B4FC', border: '1px solid #3730A3', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
                                {row.gstRate}%
                              </span>
                            </TableCell>

                            {/* 12. AMOUNT (₹) */}
                            <TableCell style={{ textAlign: 'right', fontWeight: 900, color: '#F8FAFC', fontFamily: 'monospace', fontSize: '0.92rem' }}>
                              ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>

                            {/* 13. ACTION */}
                            <TableCell style={{ textAlign: 'center' }}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onNavigateToPos?.(row.batchRef)}
                                style={{
                                  backgroundColor: '#059669',
                                  borderColor: '#059669',
                                  fontSize: '0.74rem',
                                  padding: '3px 8px',
                                  fontWeight: 800
                                }}
                                title="Sell directly at POS Counter"
                              >
                                🛒 POS
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Wholesale Invoice Footer Summary Ribbon */}
                <div
                  style={{
                    marginTop: '16px',
                    backgroundColor: '#0B1329',
                    border: '1.5px solid #059669',
                    borderRadius: '10px',
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    boxShadow: '0 0 20px rgba(5, 150, 105, 0.15)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                        Total Registered Stock
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC' }}>
                        {billSummary.totalBatches} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Batches ({billSummary.totalQty.toLocaleString()} Units)</span>
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '32px', backgroundColor: '#1E293B' }} />

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                        Purchase Cost (Taxable PTR)
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                        ₹{billSummary.totalTaxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#7DD3FC', marginTop: '2px' }}>
                        Sub Total: ₹{Math.round(billSummary.totalTaxableValue).toLocaleString('en-IN')} • Grand Total: ₹5,108.00
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '32px', backgroundColor: '#1E293B' }} />

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                        Total Retail Value (MRP)
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', fontFamily: 'monospace' }}>
                        ₹{billSummary.totalRetailValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '32px', backgroundColor: '#1E293B' }} />

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#34D399', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                        Gross Profit Potential (Margin)
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399', fontFamily: 'monospace' }}>
                        +₹{billSummary.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6EE7B7' }}>
                          ({billSummary.profitMarginPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>GST Tax Slab Breakdown:</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#1E293B', color: '#CBD5E1', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>
                          12% Slab: ₹{billSummary.gst12Taxable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        {billSummary.gst5Taxable > 0 && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: '#1E293B', color: '#CBD5E1', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>
                            5% Slab: ₹{billSummary.gst5Taxable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 1B. SKU Grouped Formulation Summary View */
              <TableContainer
                className="pharmacy-table-scroll"
                style={{
                  maxHeight: '580px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  borderRadius: '8px',
                  border: '1.5px solid #334155',
                  backgroundColor: '#0A0F1D'
                }}
              >
                <Table isStickyHeader>
                  <TableHeader isSticky style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1E293B', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    <TableRow style={{ borderBottom: '1.5px solid #334155' }}>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Medication Code</TableHead>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Generic & Brand Name</TableHead>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Strength & Form</TableHead>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Category</TableHead>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Available Stock</TableHead>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Reserved</TableHead>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Reorder Trigger</TableHead>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Active Batches</TableHead>
                      <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                          No inventory items match the current search or filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStock.map((item) => {
                        const isLow = item.availableQuantity <= item.reorderLevel;
                        return (
                          <TableRow key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <TableCell style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace', fontSize: '0.84rem' }}>
                              {item.medicationCode}
                            </TableCell>
                            <TableCell>
                              <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.92rem' }}>{item.genericName}</div>
                              <div style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600, marginTop: '3px' }}>Brand: {item.brandName}</div>
                            </TableCell>
                            <TableCell>
                              <div style={{ fontWeight: 700, color: '#E2E8F0' }}>{item.strength}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{item.dosageForm}</div>
                            </TableCell>
                            <TableCell>
                              <span style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                                {item.category}
                              </span>
                              {item.controlledMedication && (
                                <span style={{ marginLeft: '6px' }}>
                                  <Badge variant="danger">Schedule H/H1</Badge>
                                </span>
                              )}
                            </TableCell>
                            <TableCell style={{ fontWeight: 900, fontSize: '1.1rem', color: isLow ? '#F87171' : '#34D399' }}>
                              {item.availableQuantity.toLocaleString()}{' '}
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>units</span>
                            </TableCell>
                            <TableCell style={{ color: item.reservedQuantity > 0 ? '#FBBF24' : '#64748B', fontWeight: 700 }}>
                              {item.reservedQuantity}
                            </TableCell>
                            <TableCell>
                              <div style={{ fontWeight: 700, color: '#E2E8F0' }}>{item.reorderLevel} units</div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Pack: +{item.reorderQuantity}</div>
                            </TableCell>
                            <TableCell>
                              <span
                                onClick={() => {
                                  setSearchTerm(item.genericName);
                                  setSubView('batches');
                                }}
                                style={{
                                  color: '#38BDF8',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)'
                                }}
                              >
                                {item.batches.length} batch{item.batches.length !== 1 ? 'es' : ''} ➔
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={isLow ? 'danger' : 'success'}>
                                {isLow ? '⚠️ Low Stock' : '✅ Adequate'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* 2. Batch Expiry & FEFO Radar Sub-view */}
        {subView === 'batches' && (
          <TableContainer
            className="pharmacy-table-scroll"
            style={{
              maxHeight: '580px',
              overflowY: 'auto',
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1.5px solid #334155',
              backgroundColor: '#0A0F1D'
            }}
          >
            <Table isStickyHeader>
              <TableHeader isSticky style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1E293B', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                <TableRow style={{ borderBottom: '1.5px solid #334155' }}>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Batch Number</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Medication & Manufacturer</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Expiry Date</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Days Remaining (FEFO)</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Available / Reserved</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>MRP / Trade Price</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Storage Bin</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Status</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Quarantine Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                      No batches match the current search or filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => {
                    const days = batch.daysToExpiry ?? 999;
                    const isNear = days < 60 && batch.status !== 'EXPIRED';
                    const isExp = days <= 0 || batch.status === 'EXPIRED';
                    const isBlocked = batch.status === 'BLOCKED' || isExp;

                    return (
                      <TableRow key={batch.id} style={{ backgroundColor: isExp ? 'rgba(239, 68, 68, 0.15)' : isNear ? 'rgba(245, 158, 11, 0.12)' : undefined, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <TableCell style={{ fontWeight: 800, fontFamily: 'monospace', color: '#38BDF8', fontSize: '0.84rem' }}>
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.92rem' }}>{batch.medicationName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{batch.manufacturer}</div>
                        </TableCell>
                        <TableCell style={{ fontWeight: 700, color: isExp ? '#F87171' : isNear ? '#FBBF24' : '#E2E8F0' }}>
                          {batch.expiryDate}
                        </TableCell>
                        <TableCell>
                          {isExp ? (
                            <span style={{ backgroundColor: '#DC2626', color: '#FFF', fontWeight: 800, fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>
                              EXPIRED
                            </span>
                          ) : isNear ? (
                            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 800, fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>
                              ⏳ {days} days left
                            </span>
                          ) : (
                            <span style={{ color: '#34D399', fontWeight: 800, fontSize: '0.85rem' }}>
                              {days} days
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{batch.availableQuantity} units</div>
                          <div style={{ fontSize: '0.75rem', color: '#FBBF24', marginTop: '2px' }}>Res: {batch.reservedQuantity}</div>
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 700, color: '#34D399' }}>
                            Cost: ₹{parseFloat(batch.unitCost || '0').toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                            Recv: {batch.receivedQuantity} units
                          </div>
                        </TableCell>
                        <TableCell>
                          <span style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'monospace' }}>
                            {batch.supplierReference || batch.purchaseReference || 'Bin A-01'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(batch.status)}>
                            {batch.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isBlocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenUnblockDialog?.(batch)}
                              style={{ borderColor: '#10B981', color: '#34D399', fontWeight: 700 }}
                            >
                              ✅ Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenBlockDialog?.(batch)}
                              style={{ borderColor: '#EF4444', color: '#F87171', fontWeight: 700 }}
                            >
                              🚫 Freeze / Block
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
        )}

        {/* 3. Stock Movement Ledger Sub-view */}
        {subView === 'movements' && (
          <TableContainer
            className="pharmacy-table-scroll"
            style={{
              maxHeight: '580px',
              overflowY: 'auto',
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1.5px solid #334155',
              backgroundColor: '#0A0F1D'
            }}
          >
            <Table isStickyHeader>
              <TableHeader isSticky style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1E293B', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                <TableRow style={{ borderBottom: '1.5px solid #334155' }}>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Movement ID</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Timestamp</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Medication</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Batch #</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Type</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Quantity Change</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Balance After</TableHead>
                  <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Reference / Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                      No stock movements recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.slice(0, 50).map((mov) => {
                    const isInward = mov.movementType === 'RECEIPT' || mov.movementType === 'RETURN' || mov.movementType === 'TRANSFER_IN';
                    return (
                      <TableRow key={mov.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <TableCell style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94A3B8' }}>
                          {mov.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#94A3B8' }}>
                          {new Date(mov.occurredAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell style={{ fontWeight: 800, color: '#F8FAFC' }}>
                          {mov.medicationName || mov.medicationId}
                        </TableCell>
                        <TableCell style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>
                          {mov.batchNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isInward ? 'success' : 'neutral'}>
                            {mov.movementType}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ fontWeight: 900, color: isInward ? '#34D399' : '#F87171' }}>
                          {isInward ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </TableCell>
                        <TableCell style={{ fontWeight: 800, color: '#F8FAFC' }}>
                          {mov.afterQuantity ?? '-'}
                        </TableCell>
                        <TableCell style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                          {mov.referenceType ? `${mov.referenceType}: ${mov.referenceId || ''}` : mov.reason || 'General movement'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* 4. Returns & Adjustments Sub-view */}
        {subView === 'returns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                🔄 Patient Medication Returns & Breakage Adjustments
              </h3>
              <Button variant="primary" size="sm" onClick={onOpenStockAdjustment}>
                + Record Stock Return / Breakage
              </Button>
            </div>

            <TableContainer
              className="pharmacy-table-scroll"
              style={{
                maxHeight: '580px',
                overflowY: 'auto',
                overflowX: 'auto',
                borderRadius: '8px',
                border: '1.5px solid #334155',
                backgroundColor: '#0A0F1D'
              }}
            >
              <Table isStickyHeader>
                <TableHeader isSticky style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1E293B', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                  <TableRow style={{ borderBottom: '1.5px solid #334155' }}>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Record Type</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Item / Batch</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Quantity</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Reason / Cause</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Refund / Financial Impact</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Date Logged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.length === 0 && adjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                        No medication returns or cycle count adjustments recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {returns.map((ret) => (
                        <TableRow key={ret.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <TableCell>
                            <Badge variant="warning">Patient Return</Badge>
                          </TableCell>
                          <TableCell style={{ fontWeight: 700 }}>
                            <div style={{ color: '#F8FAFC', fontWeight: 800 }}>{ret.medicationName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Batch: {ret.batchNumber} ({ret.patientName})</div>
                          </TableCell>
                          <TableCell style={{ fontWeight: 900, color: '#FBBF24' }}>
                            {ret.quantity} units
                          </TableCell>
                          <TableCell style={{ color: '#CBD5E1' }}>{ret.returnReason}</TableCell>
                          <TableCell style={{ fontWeight: 800, color: '#34D399' }}>
                            {ret.disposition}
                          </TableCell>
                          <TableCell style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                            {new Date(ret.occurredAt).toLocaleDateString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {adjustments.map((adj) => (
                        <TableRow key={adj.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <TableCell>
                            <Badge variant="neutral">Stock Adjustment</Badge>
                          </TableCell>
                          <TableCell style={{ fontWeight: 700 }}>
                            <div style={{ color: '#F8FAFC', fontWeight: 800 }}>{adj.medicationName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Batch: {adj.batchNumber}</div>
                          </TableCell>
                          <TableCell style={{ fontWeight: 900, color: adj.adjustmentQuantity >= 0 ? '#34D399' : '#F87171' }}>
                            {adj.adjustmentQuantity >= 0 ? `+${adj.adjustmentQuantity}` : adj.adjustmentQuantity} units
                          </TableCell>
                          <TableCell style={{ color: '#CBD5E1' }}>{adj.reason}: {adj.justification}</TableCell>
                          <TableCell style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                            After: {adj.afterQuantity} units
                          </TableCell>
                          <TableCell style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                            {new Date(adj.occurredAt).toLocaleDateString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}

        {/* 5. Dynamic Consumption-Velocity Reordering Sub-view */}
        {subView === 'predictiveReorder' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#070C16', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>⚡</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#60A5FA' }}>
                    Dynamic Consumption-Velocity Reordering & Predictive Stock Engine
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#94A3B8' }}>
                  Dynamic ROP Formula: <code>(7-Day Moving Daily Velocity × Supplier Lead Time) + Safety Buffer Stock</code>. Daily midnight cron auto-drafts POs when projected stock &lt; 3.0 days.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button
                  variant={isOutbreakSurgeSimulated ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => setIsOutbreakSurgeSimulated(!isOutbreakSurgeSimulated)}
                  style={{ fontSize: '0.78rem', fontWeight: 800 }}
                >
                  {isOutbreakSurgeSimulated ? '🦟 Dengue Surge Active (3.5x Spike)' : '🦟 Simulate Seasonal Surge (Dengue/Flu)'}
                </Button>
              </div>
            </div>

            {generatedPoAlert && (
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3B82F6', color: '#93C5FD', padding: '12px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800 }}>
                {generatedPoAlert}
              </div>
            )}

            <TableContainer style={{ maxHeight: '600px', overflowY: 'auto', borderRadius: '8px', border: '1.5px solid #334155', backgroundColor: '#0A0F1D' }}>
              <Table isStickyHeader>
                <TableHeader isSticky style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1E293B' }}>
                  <TableRow style={{ borderBottom: '1.5px solid #334155' }}>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Medication (Brand / Generic)</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Current Stock</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Daily Velocity (7-Day MA)</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Lead Time</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Dynamic ROP</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Projected Stock Days</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem' }}>Primary Distributor</TableHead>
                    <TableHead style={{ color: '#94A3B8', fontWeight: 800, fontSize: '0.78rem', textAlign: 'right' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictiveItems.map((item) => {
                    const velocity = isOutbreakSurgeSimulated && item.isOutbreakSurge ? Math.round(item.movingAverageDailyVelocity * 2.5) : item.movingAverageDailyVelocity;
                    const dynamicRop = Math.round(velocity * item.supplierLeadTimeDays + item.safetyBufferStock);
                    const daysLeft = Number((item.currentPhysicalStock / velocity).toFixed(1));
                    const isUrgent = daysLeft < 3.0;

                    return (
                      <TableRow key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <TableCell>
                          <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{item.brandName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{item.genericName} • {item.dosageForm}</div>
                        </TableCell>
                        <TableCell style={{ fontWeight: 900, color: isUrgent ? '#F87171' : '#34D399', fontSize: '0.9rem' }}>
                          {item.currentPhysicalStock} units
                        </TableCell>
                        <TableCell style={{ fontWeight: 700, color: '#CBD5E1' }}>
                          {velocity} units/day
                          {isOutbreakSurgeSimulated && item.isOutbreakSurge && (
                            <span style={{ marginLeft: '4px', fontSize: '0.68rem', color: '#F59E0B', fontWeight: 800 }}>⚡ Surge</span>
                          )}
                        </TableCell>
                        <TableCell style={{ color: '#CBD5E1' }}>{item.supplierLeadTimeDays} Days</TableCell>
                        <TableCell style={{ fontWeight: 800, color: '#FBBF24' }}>
                          {dynamicRop} units
                        </TableCell>
                        <TableCell>
                          <Badge variant={isUrgent ? 'danger' : 'success'}>
                            {daysLeft} Days {isUrgent ? '⚠️ DEPLETION RISK' : '✓ HEALTHY'}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.primarySupplier}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          <Button
                            variant={isUrgent ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleTriggerDynamicPo({ ...item, calculatedDynamicRop: dynamicRop, projectedDaysOfStock: daysLeft, movingAverageDailyVelocity: velocity })}
                            style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: isUrgent ? '#3B82F6' : undefined }}
                          >
                            ⚡ Auto-PO Draft ({item.recommendedOrderQuantity})
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}

        {/* 6. Discharge Automated Ward Return Reconciler Sub-view */}
        {subView === 'wardReturns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#070C16', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🔄</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#34D399' }}>
                    Discharge Automated Ward Return Reconciler & Refund Desk
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#94A3B8' }}>
                  Scans unopened sealed IV fluids, antibiotics, and injections from bedside lockers upon inpatient discharge. Generates instant refund credit notes and restocks FEFO batches.
                </p>
              </div>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                Discharge Gateway Linked
              </span>
            </div>

            {reconciledCreditNoteAlert && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '12px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800 }}>
                {reconciledCreditNoteAlert}
              </div>
            )}

            <div className="space-y-4">
              {wardReturnCases.map((wrc) => {
                const isReconciled = wrc.reconciliationStatus === 'RECONCILED_REFUNDED';
                return (
                  <div
                    key={wrc.id}
                    style={{
                      backgroundColor: '#070C16',
                      border: isReconciled ? '1px solid rgba(16, 185, 129, 0.3)' : '1.5px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                            {wrc.patientName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>({wrc.uhid})</span>
                          <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {wrc.wardName} • {wrc.bedNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                          Discharged: {wrc.dischargedAt} • Total Inpatient Dispenses: {wrc.dispensedItemsCount} items
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isReconciled ? (
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                            ✓ {wrc.creditNoteNumber} Issued
                          </span>
                        ) : (
                          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#FBBF24', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                            ⏳ Pending Ward Return Scan
                          </span>
                        )}

                        {!isReconciled && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleReconcileWardReturn(wrc)}
                            style={{ fontSize: '0.75rem', fontWeight: 800 }}
                          >
                            ⚡ Reconcile Return & Issue Refund (₹{wrc.totalRefundAmount.toFixed(2)})
                          </Button>
                        )}
                      </div>
                    </div>

                    <TableContainer style={{ borderRadius: '6px', border: '1px solid #1E293B', backgroundColor: '#0A0F1D' }}>
                      <Table>
                        <TableHeader>
                          <TableRow style={{ borderBottom: '1px solid #1E293B' }}>
                            <TableHead style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Unused Medicine</TableHead>
                            <TableHead style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Batch #</TableHead>
                            <TableHead style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Dispensed / Returned</TableHead>
                            <TableHead style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Seal Status</TableHead>
                            <TableHead style={{ color: '#94A3B8', fontSize: '0.75rem', textAlign: 'right' }}>Refund Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {wrc.returnableItems.map((item) => (
                            <TableRow key={item.itemId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <TableCell style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.8rem' }}>{item.medicationName}</TableCell>
                              <TableCell style={{ fontFamily: 'monospace', color: '#38BDF8', fontSize: '0.75rem' }}>{item.batchNumber}</TableCell>
                              <TableCell style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>
                                Dispensed: {item.dispensedQty} ➔ <strong style={{ color: '#34D399' }}>Returned: {item.unopenedReturnQty}</strong>
                              </TableCell>
                              <TableCell>
                                <span style={{ color: '#34D399', fontSize: '0.72rem', fontWeight: 700 }}>
                                  {item.isSealIntact ? '✓ Seal Intact (Restockable)' : 'Damaged / Discard'}
                                </span>
                              </TableCell>
                              <TableCell style={{ textAlign: 'right', fontWeight: 800, color: '#FBBF24', fontSize: '0.8rem' }}>
                                ₹{item.calculatedRefundAmount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Development Mock Stock Confirmation Modal */}
      {isSeedMockOpen && (
        <Dialog
          isOpen={isSeedMockOpen}
          onClose={() => !actionLoading && setIsSeedMockOpen(false)}
          title="🧪 Seed Development Mock Stock (Independent of Bills)"
          maxWidth="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsSeedMockOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!onSeedDevMockStock) return;
                  try {
                    setActionLoading(true);
                    await onSeedDevMockStock();
                    setIsSeedMockOpen(false);
                    setActionFeedback({
                      type: 'success',
                      message: '✅ Successfully seeded 5 development test batches into inventory and stock movement ledger! Visible in POS counter and batch search.'
                    });
                  } catch (err: any) {
                    setActionFeedback({
                      type: 'error',
                      message: `❌ Failed to seed mock stock: ${err?.message || 'Error occurred'}`
                    });
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                style={{ fontWeight: 700 }}
              >
                {actionLoading ? 'Seeding Batches...' : '🧪 Confirm & Seed 5 Test Batches'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#FDE68A',
                fontSize: '0.82rem',
                lineHeight: 1.5
              }}
            >
              <div style={{ fontWeight: 800, color: '#F59E0B', marginBottom: '4px' }}>
                ⚠️ DEVELOPMENT / TEST DATA ONLY
              </div>
              This action populates realistic test stock directly into the inventory persistence layer and stock movement ledger <strong>without depending on Purchase Bills</strong>. Real hospital and production data remain strictly unaffected.
            </div>

            <div style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
              The following 5 standard test formulations will be added with marker <code style={{ color: '#38BDF8' }}>DEVELOPMENT_TEST</code>:
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #334155', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: '#E2E8F0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1E293B', textAlign: 'left', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '8px 12px' }}>Medicine Name</th>
                    <th style={{ padding: '8px 12px' }}>Batch No</th>
                    <th style={{ padding: '8px 12px' }}>Qty</th>
                    <th style={{ padding: '8px 12px' }}>Unit</th>
                    <th style={{ padding: '8px 12px' }}>Purchase ₹</th>
                    <th style={{ padding: '8px 12px' }}>Selling ₹</th>
                    <th style={{ padding: '8px 12px' }}>Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Paracetamol 500 mg</td>
                    <td style={{ padding: '8px 12px', color: '#38BDF8', fontFamily: 'monospace' }}>TEST-PARA-001</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#34D399' }}>500</td>
                    <td style={{ padding: '8px 12px' }}>Tablet</td>
                    <td style={{ padding: '8px 12px' }}>₹1.20</td>
                    <td style={{ padding: '8px 12px' }}>₹2.00</td>
                    <td style={{ padding: '8px 12px' }}>2027-12-31</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Amoxicillin 500 mg</td>
                    <td style={{ padding: '8px 12px', color: '#38BDF8', fontFamily: 'monospace' }}>TEST-AMOX-001</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#34D399' }}>200</td>
                    <td style={{ padding: '8px 12px' }}>Capsule</td>
                    <td style={{ padding: '8px 12px' }}>₹4.00</td>
                    <td style={{ padding: '8px 12px' }}>₹6.00</td>
                    <td style={{ padding: '8px 12px' }}>2027-10-31</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Pantoprazole 40 mg</td>
                    <td style={{ padding: '8px 12px', color: '#38BDF8', fontFamily: 'monospace' }}>TEST-PANTO-001</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#34D399' }}>150</td>
                    <td style={{ padding: '8px 12px' }}>Tablet</td>
                    <td style={{ padding: '8px 12px' }}>₹3.00</td>
                    <td style={{ padding: '8px 12px' }}>₹5.00</td>
                    <td style={{ padding: '8px 12px' }}>2028-01-31</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Azithromycin 500 mg</td>
                    <td style={{ padding: '8px 12px', color: '#38BDF8', fontFamily: 'monospace' }}>TEST-AZI-001</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#34D399' }}>100</td>
                    <td style={{ padding: '8px 12px' }}>Tablet</td>
                    <td style={{ padding: '8px 12px' }}>₹8.00</td>
                    <td style={{ padding: '8px 12px' }}>₹12.00</td>
                    <td style={{ padding: '8px 12px' }}>2027-09-30</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>ORS Sachet</td>
                    <td style={{ padding: '8px 12px', color: '#38BDF8', fontFamily: 'monospace' }}>TEST-ORS-001</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#34D399' }}>300</td>
                    <td style={{ padding: '8px 12px' }}>Sachet</td>
                    <td style={{ padding: '8px 12px' }}>₹8.00</td>
                    <td style={{ padding: '8px 12px' }}>₹12.00</td>
                    <td style={{ padding: '8px 12px' }}>2028-03-31</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
              📌 <strong>Audit Note:</strong> Each item will generate a formal stock ledger transaction with movementType: <code style={{ color: '#34D399' }}>RECEIPT</code>, manufacturer: <em>TEST-MANUFACTURER</em>, and source: <code style={{ color: '#38BDF8' }}>DEVELOPMENT_TEST</code>.
            </div>
          </div>
        </Dialog>
      )}

      {/* Development Mock Stock Cleanup Modal */}
      {isCleanMockOpen && (
        <Dialog
          isOpen={isCleanMockOpen}
          onClose={() => !actionLoading && setIsCleanMockOpen(false)}
          title="🧹 Clean Development Mock Stock"
          maxWidth="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsCleanMockOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!onCleanupDevMockStock) return;
                  try {
                    setActionLoading(true);
                    await onCleanupDevMockStock();
                    setIsCleanMockOpen(false);
                    setActionFeedback({
                      type: 'success',
                      message: '✅ Successfully removed all development mock stock batches. Real inventory and master data remain intact.'
                    });
                  } catch (err: any) {
                    setActionFeedback({
                      type: 'error',
                      message: `❌ Failed to cleanup mock stock: ${err?.message || 'Error occurred'}`
                    });
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                style={{ backgroundColor: '#D97706', borderColor: '#B45309', fontWeight: 700 }}
              >
                {actionLoading ? 'Cleaning...' : '🧹 Confirm & Remove Test Stock'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#FCA5A5',
                fontSize: '0.82rem',
                lineHeight: 1.5
              }}
            >
              <div style={{ fontWeight: 800, color: '#EF4444', marginBottom: '4px' }}>
                ⚠️ SAFE CLEANUP GUARANTEE
              </div>
              This operation removes <strong>ONLY</strong> batches and ledger transactions marked with <code style={{ color: '#F87171' }}>DEVELOPMENT_TEST</code> (batches: <code>TEST-PARA-001</code>, <code>TEST-AMOX-001</code>, <code>TEST-PANTO-001</code>, <code>TEST-AZI-001</code>, <code>TEST-ORS-001</code>).
            </div>
            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: 0 }}>
              Real inventory, legitimate patient dispensations, hospital batches, and clinical transactions will <strong>never</strong> be touched or removed.
            </p>
          </div>
        </Dialog>
      )}
    </div>
  );
};
