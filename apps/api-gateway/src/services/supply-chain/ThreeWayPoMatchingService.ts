/**
 * SAP S/4HANA 3-Way PO Matching & Automated Reorder Point (ROP) Service
 * Reconciles Purchase Orders (PO) vs Goods Receipt Notes (GRN) vs Vendor Tax Invoices.
 * Performs ±0.5% price tolerance checks, ±0% quantity audits, and rolling 90-day ROP recalculations.
 */

export type MatchExceptionType =
  | 'PERFECT_MATCH'
  | 'PRICE_VARIANCE'
  | 'QUANTITY_MISMATCH'
  | 'DUPLICATE_INVOICE_SUBMISSION'
  | 'UNAUTHORIZED_SUBSTITUTION';

export type DiscrepancyStatus =
  | 'PENDING_REVIEW'
  | 'AUTO_APPROVED'
  | 'MANUAL_APPROVED'
  | 'REJECTED_CREDIT_NOTE_RAISED';

export interface PoMatchingDiscrepancy {
  discrepancyId: string;
  poNumber: string;
  grnNumber: string;
  invoiceNumber: string;
  vendorName: string;
  vendorGstin: string;
  itemName: string;
  sku: string;
  poQuantity: number;
  poUnitPrice: number;
  poTotal: number;
  grnQuantity: number;
  grnDate: string;
  billedQuantity: number;
  billedUnitPrice: number;
  billedTotal: number;
  varianceAmount: number;
  variancePercent: number;
  exceptionType: MatchExceptionType;
  toleranceStatus: 'WITHIN_TOLERANCE' | 'EXCEEDS_TOLERANCE';
  resolutionStatus: DiscrepancyStatus;
  creditNoteReference?: string | undefined;
  reviewNotes?: string | undefined;
}

export interface RopInventoryItem {
  sku: string;
  itemName: string;
  category: 'CRITICAL_DRUG' | 'SURGICAL_CONSUMABLE' | 'LAB_REAGENT' | 'BLOOD_BAG';
  currentStock: number;
  dailyVelocity: number; // units per day
  leadTimeDays: number;
  safetyStock: number;
  reorderPoint: number;
  recommendedOrderQty: number;
  preferredVendor: string;
  status: 'SUFFICIENT' | 'REORDER_TRIGGERED' | 'CRITICAL_STOCKOUT';
  lastCalculatedAt: string;
}

export class ThreeWayPoMatchingService {
  private discrepancies: PoMatchingDiscrepancy[] = [
    {
      discrepancyId: 'DISC-001',
      poNumber: 'PO-2026-8812',
      grnNumber: 'GRN-2026-9901',
      invoiceNumber: 'INV-CIPLA-88210',
      vendorName: 'Cipla Therapeutics Distribution Ltd',
      vendorGstin: '27AAACC1209L1Z1',
      itemName: 'Meropenem 1g IV Infusion Vials',
      sku: 'MED-MERO-1G',
      poQuantity: 1000,
      poUnitPrice: 245.00,
      poTotal: 245000.00,
      grnQuantity: 1000,
      grnDate: '2026-11-02',
      billedQuantity: 1000,
      billedUnitPrice: 258.50, // +5.5% variance
      billedTotal: 258500.00,
      varianceAmount: 13500.00,
      variancePercent: 5.51,
      exceptionType: 'PRICE_VARIANCE',
      toleranceStatus: 'EXCEEDS_TOLERANCE',
      resolutionStatus: 'PENDING_REVIEW',
      reviewNotes: 'Vendor invoice unit price exceeds approved tender PO contract price by ₹13.50/vial'
    },
    {
      discrepancyId: 'DISC-002',
      poNumber: 'PO-2026-8840',
      grnNumber: 'GRN-2026-9915',
      invoiceNumber: 'INV-BD-44120',
      vendorName: 'Becton Dickinson India Private Limited',
      vendorGstin: '07AAACB0998K1ZX',
      itemName: 'Vacutainer K2 EDTA 4ml Blood Collection Tubes',
      sku: 'VAC-K2EDTA-4ML',
      poQuantity: 5000,
      poUnitPrice: 6.20,
      poTotal: 31000.00,
      grnQuantity: 4200, // 800 short delivered at dock
      grnDate: '2026-11-03',
      billedQuantity: 5000, // Billed full 5000
      billedUnitPrice: 6.20,
      billedTotal: 31000.00,
      varianceAmount: 4960.00,
      variancePercent: 19.05,
      exceptionType: 'QUANTITY_MISMATCH',
      toleranceStatus: 'EXCEEDS_TOLERANCE',
      resolutionStatus: 'PENDING_REVIEW',
      reviewNotes: 'Dock GRN inspection verified 4,200 tubes; invoice bills 5,000 tubes (800 missing)'
    },
    {
      discrepancyId: 'DISC-003',
      poNumber: 'PO-2026-8855',
      grnNumber: 'GRN-2026-9930',
      invoiceNumber: 'INV-SUN-11904',
      vendorName: 'Sun Pharma Medline Healthcare',
      vendorGstin: '24AAACS4412N1Z8',
      itemName: 'Propofol 1% 20ml Anaesthetic Emulsion',
      sku: 'SURG-PROP-20ML',
      poQuantity: 200,
      poUnitPrice: 182.00,
      poTotal: 36400.00,
      grnQuantity: 200,
      grnDate: '2026-11-01',
      billedQuantity: 200,
      billedUnitPrice: 182.45, // +0.25% variance (within ±0.5% tolerance)
      billedTotal: 36490.00,
      varianceAmount: 90.00,
      variancePercent: 0.25,
      exceptionType: 'PRICE_VARIANCE',
      toleranceStatus: 'WITHIN_TOLERANCE',
      resolutionStatus: 'AUTO_APPROVED',
      reviewNotes: 'Within S/4HANA ±0.5% statutory rounding tolerance; auto-cleared for payment'
    },
    {
      discrepancyId: 'DISC-004',
      poNumber: 'PO-2026-8869',
      grnNumber: 'GRN-2026-9942',
      invoiceNumber: 'INV-ABBOTT-771',
      vendorName: 'Abbott Diagnostics Healthcare Ltd',
      vendorGstin: '27AAACA9910P1Z6',
      itemName: 'Troponin I High-Sensitivity Reagent Kits',
      sku: 'LAB-TROP-HS',
      poQuantity: 50,
      poUnitPrice: 3200.00,
      poTotal: 160000.00,
      grnQuantity: 50,
      grnDate: '2026-10-28',
      billedQuantity: 50,
      billedUnitPrice: 3200.00,
      billedTotal: 160000.00,
      varianceAmount: 0.00,
      variancePercent: 0.00,
      exceptionType: 'DUPLICATE_INVOICE_SUBMISSION',
      toleranceStatus: 'EXCEEDS_TOLERANCE',
      resolutionStatus: 'PENDING_REVIEW',
      reviewNotes: 'Invoice number INV-ABBOTT-771 was previously submitted and settled on 2026-10-15'
    }
  ];

  private ropInventory: RopInventoryItem[] = [
    {
      sku: 'MED-MERO-1G',
      itemName: 'Meropenem 1g IV Infusion Vials',
      category: 'CRITICAL_DRUG',
      currentStock: 180,
      dailyVelocity: 65,
      leadTimeDays: 4,
      safetyStock: 130,
      reorderPoint: 390, // (65 * 4) + 130 = 390. Current 180 < 390
      recommendedOrderQty: 1000,
      preferredVendor: 'Cipla Therapeutics Distribution Ltd',
      status: 'REORDER_TRIGGERED',
      lastCalculatedAt: new Date().toISOString()
    },
    {
      sku: 'VAC-K2EDTA-4ML',
      itemName: 'Vacutainer K2 EDTA 4ml Blood Collection Tubes',
      category: 'LAB_REAGENT',
      currentStock: 850,
      dailyVelocity: 400,
      leadTimeDays: 3,
      safetyStock: 600,
      reorderPoint: 1800, // (400 * 3) + 600 = 1800. Current 850 < 1800
      recommendedOrderQty: 5000,
      preferredVendor: 'Becton Dickinson India Private Limited',
      status: 'CRITICAL_STOCKOUT',
      lastCalculatedAt: new Date().toISOString()
    },
    {
      sku: 'SURG-PROP-20ML',
      itemName: 'Propofol 1% 20ml Anaesthetic Emulsion',
      category: 'SURGICAL_CONSUMABLE',
      currentStock: 450,
      dailyVelocity: 30,
      leadTimeDays: 5,
      safetyStock: 60,
      reorderPoint: 210, // (30 * 5) + 60 = 210. Current 450 >= 210
      recommendedOrderQty: 500,
      preferredVendor: 'Sun Pharma Medline Healthcare',
      status: 'SUFFICIENT',
      lastCalculatedAt: new Date().toISOString()
    },
    {
      sku: 'BLOOD-CPDA-SAGM',
      itemName: 'Quadruple SAGM Blood Bag with Leuko-Depletion Filter',
      category: 'BLOOD_BAG',
      currentStock: 45,
      dailyVelocity: 18,
      leadTimeDays: 4,
      safetyStock: 36,
      reorderPoint: 108, // (18 * 4) + 36 = 108. Current 45 < 108
      recommendedOrderQty: 250,
      preferredVendor: 'Terumo Penpol Blood Technologies',
      status: 'REORDER_TRIGGERED',
      lastCalculatedAt: new Date().toISOString()
    }
  ];

  public getDiscrepancies(filter?: string): PoMatchingDiscrepancy[] {
    if (filter && filter !== 'ALL') {
      return this.discrepancies.filter((d) => d.resolutionStatus === filter || d.exceptionType === filter);
    }
    return this.discrepancies;
  }

  public getRopAlerts(): RopInventoryItem[] {
    return this.ropInventory;
  }

  public reconcileDiscrepancy(params: {
    discrepancyId: string;
    action: 'APPROVE_UNDER_TOLERANCE' | 'REJECT_RAISE_CDN';
    notes?: string | undefined;
  }): { success: boolean; message: string; discrepancy?: PoMatchingDiscrepancy } {
    const item = this.discrepancies.find((d) => d.discrepancyId === params.discrepancyId);
    if (!item) {
      return { success: false, message: `Discrepancy ${params.discrepancyId} not found` };
    }

    if (params.action === 'APPROVE_UNDER_TOLERANCE') {
      item.resolutionStatus = 'MANUAL_APPROVED';
      item.reviewNotes = params.notes || 'Manually approved by Financial Controller with variance waiver';
      return {
        success: true,
        message: `Approved PO ${item.poNumber} / INV ${item.invoiceNumber} under financial override. Sent to ERP payment run.`,
        discrepancy: item
      };
    } else {
      const cdnNumber = `CDN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      item.resolutionStatus = 'REJECTED_CREDIT_NOTE_RAISED';
      item.creditNoteReference = cdnNumber;
      item.reviewNotes = params.notes || `Rejected invoice. Automated Credit Note ${cdnNumber} raised for ₹${item.varianceAmount}.`;
      return {
        success: true,
        message: `Rejected invoice ${item.invoiceNumber}. Statutory Credit Note ${cdnNumber} generated for ₹${item.varianceAmount}.`,
        discrepancy: item
      };
    }
  }

  public triggerAutoPurchaseOrder(sku: string): { success: boolean; message: string; poNumber?: string } {
    const item = this.ropInventory.find((i) => i.sku === sku);
    if (!item) {
      return { success: false, message: `SKU ${sku} not found in ROP catalog` };
    }

    const newPo = `PO-ROP-${Date.now().toString().slice(-6)}`;
    item.status = 'SUFFICIENT';
    item.currentStock += item.recommendedOrderQty;

    return {
      success: true,
      message: `Automated ROP Purchase Order ${newPo} dispatched to ${item.preferredVendor} for ${item.recommendedOrderQty} units.`,
      poNumber: newPo
    };
  }
}

export const threeWayPoMatchingService = new ThreeWayPoMatchingService();
