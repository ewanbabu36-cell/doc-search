import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

interface DiscrepancyItem {
  discrepancyId: string;
  poNumber: string;
  grnNumber: string;
  invoiceNumber: string;
  vendorName: string;
  itemName: string;
  sku: string;
  poQuantity: number;
  poUnitPrice: number;
  poTotal: number;
  grnQuantity: number;
  billedQuantity: number;
  billedUnitPrice: number;
  billedTotal: number;
  varianceAmount: number;
  variancePercent: number;
  exceptionType: 'PRICE_VARIANCE' | 'QUANTITY_MISMATCH' | 'DUPLICATE_INVOICE_SUBMISSION' | 'UNAUTHORIZED_SUBSTITUTION';
  toleranceStatus: 'WITHIN_TOLERANCE' | 'EXCEEDS_TOLERANCE';
  resolutionStatus: 'PENDING_REVIEW' | 'AUTO_APPROVED' | 'MANUAL_APPROVED' | 'REJECTED_CREDIT_NOTE_RAISED';
  reviewNotes: string;
  creditNoteReference?: string;
}

interface RopItem {
  sku: string;
  itemName: string;
  category: string;
  currentStock: number;
  dailyVelocity: number;
  leadTimeDays: number;
  safetyStock: number;
  reorderPoint: number;
  recommendedOrderQty: number;
  preferredVendor: string;
  status: 'SUFFICIENT' | 'REORDER_TRIGGERED' | 'CRITICAL_STOCKOUT';
}

const INITIAL_DISCREPANCIES: DiscrepancyItem[] = [
  {
    discrepancyId: 'DISC-001',
    poNumber: 'PO-2026-8812',
    grnNumber: 'GRN-2026-9901',
    invoiceNumber: 'INV-CIPLA-88210',
    vendorName: 'Cipla Therapeutics Distribution Ltd',
    itemName: 'Meropenem 1g IV Infusion Vials',
    sku: 'MED-MERO-1G',
    poQuantity: 1000,
    poUnitPrice: 245.0,
    poTotal: 245000.0,
    grnQuantity: 1000,
    billedQuantity: 1000,
    billedUnitPrice: 258.5,
    billedTotal: 258500.0,
    varianceAmount: 13500.0,
    variancePercent: 5.51,
    exceptionType: 'PRICE_VARIANCE',
    toleranceStatus: 'EXCEEDS_TOLERANCE',
    resolutionStatus: 'PENDING_REVIEW',
    reviewNotes: 'Vendor invoice unit price exceeds approved contract tender by ₹13.50/vial'
  },
  {
    discrepancyId: 'DISC-002',
    poNumber: 'PO-2026-8840',
    grnNumber: 'GRN-2026-9915',
    invoiceNumber: 'INV-BD-44120',
    vendorName: 'Becton Dickinson India Private Limited',
    itemName: 'Vacutainer K2 EDTA 4ml Blood Collection Tubes',
    sku: 'VAC-K2EDTA-4ML',
    poQuantity: 5000,
    poUnitPrice: 6.2,
    poTotal: 31000.0,
    grnQuantity: 4200,
    billedQuantity: 5000,
    billedUnitPrice: 6.2,
    billedTotal: 31000.0,
    varianceAmount: 4960.0,
    variancePercent: 19.05,
    exceptionType: 'QUANTITY_MISMATCH',
    toleranceStatus: 'EXCEEDS_TOLERANCE',
    resolutionStatus: 'PENDING_REVIEW',
    reviewNotes: 'Dock GRN inspection received 4,200 tubes; invoice bills 5,000 tubes (800 short)'
  },
  {
    discrepancyId: 'DISC-003',
    poNumber: 'PO-2026-8855',
    grnNumber: 'GRN-2026-9930',
    invoiceNumber: 'INV-SUN-11904',
    vendorName: 'Sun Pharma Medline Healthcare',
    itemName: 'Propofol 1% 20ml Anaesthetic Emulsion',
    sku: 'SURG-PROP-20ML',
    poQuantity: 200,
    poUnitPrice: 182.0,
    poTotal: 36400.0,
    grnQuantity: 200,
    billedQuantity: 200,
    billedUnitPrice: 182.45,
    billedTotal: 36490.0,
    varianceAmount: 90.0,
    variancePercent: 0.25,
    exceptionType: 'PRICE_VARIANCE',
    toleranceStatus: 'WITHIN_TOLERANCE',
    resolutionStatus: 'AUTO_APPROVED',
    reviewNotes: 'Within S/4HANA ±0.5% statutory rounding tolerance; auto-cleared'
  },
  {
    discrepancyId: 'DISC-004',
    poNumber: 'PO-2026-8869',
    grnNumber: 'GRN-2026-9942',
    invoiceNumber: 'INV-ABBOTT-771',
    vendorName: 'Abbott Diagnostics Healthcare Ltd',
    itemName: 'Troponin I High-Sensitivity Reagent Kits',
    sku: 'LAB-TROP-HS',
    poQuantity: 50,
    poUnitPrice: 3200.0,
    poTotal: 160000.0,
    grnQuantity: 50,
    billedQuantity: 50,
    billedUnitPrice: 3200.0,
    billedTotal: 160000.0,
    varianceAmount: 0.0,
    variancePercent: 0.0,
    exceptionType: 'DUPLICATE_INVOICE_SUBMISSION',
    toleranceStatus: 'EXCEEDS_TOLERANCE',
    resolutionStatus: 'PENDING_REVIEW',
    reviewNotes: 'Duplicate invoice submission detected: settled in previous payment run'
  }
];

const INITIAL_ROP_ITEMS: RopItem[] = [
  {
    sku: 'MED-MERO-1G',
    itemName: 'Meropenem 1g IV Infusion Vials',
    category: 'CRITICAL_DRUG',
    currentStock: 180,
    dailyVelocity: 65,
    leadTimeDays: 4,
    safetyStock: 130,
    reorderPoint: 390,
    recommendedOrderQty: 1000,
    preferredVendor: 'Cipla Therapeutics Distribution Ltd',
    status: 'REORDER_TRIGGERED'
  },
  {
    sku: 'VAC-K2EDTA-4ML',
    itemName: 'Vacutainer K2 EDTA 4ml Blood Collection Tubes',
    category: 'LAB_REAGENT',
    currentStock: 850,
    dailyVelocity: 400,
    leadTimeDays: 3,
    safetyStock: 600,
    reorderPoint: 1800,
    recommendedOrderQty: 5000,
    preferredVendor: 'Becton Dickinson India Private Limited',
    status: 'CRITICAL_STOCKOUT'
  },
  {
    sku: 'SURG-PROP-20ML',
    itemName: 'Propofol 1% 20ml Anaesthetic Emulsion',
    category: 'SURGICAL_CONSUMABLE',
    currentStock: 450,
    dailyVelocity: 30,
    leadTimeDays: 5,
    safetyStock: 60,
    reorderPoint: 210,
    recommendedOrderQty: 500,
    preferredVendor: 'Sun Pharma Medline Healthcare',
    status: 'SUFFICIENT'
  },
  {
    sku: 'BLOOD-CPDA-SAGM',
    itemName: 'Quadruple SAGM Blood Bag with Leuko-Filter',
    category: 'BLOOD_BAG',
    currentStock: 45,
    dailyVelocity: 18,
    leadTimeDays: 4,
    safetyStock: 36,
    reorderPoint: 108,
    recommendedOrderQty: 250,
    preferredVendor: 'Terumo Penpol Blood Technologies',
    status: 'REORDER_TRIGGERED'
  }
];

export const ThreeWayPoMatchingEngineView: React.FC = () => {
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>(INITIAL_DISCREPANCIES);
  const [ropItems, setRopItems] = useState<RopItem[]>(INITIAL_ROP_ITEMS);
  const [subTab, setSubTab] = useState<'MATCHING' | 'ROP_INVENTORY'>('MATCHING');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingCount = discrepancies.filter((d) => d.resolutionStatus === 'PENDING_REVIEW').length;
  const totalVarianceAtRisk = discrepancies
    .filter((d) => d.resolutionStatus === 'PENDING_REVIEW')
    .reduce((sum, d) => sum + d.varianceAmount, 0);

  const handleApproveUnderTolerance = (item: DiscrepancyItem) => {
    setDiscrepancies((prev) =>
      prev.map((d) =>
        d.discrepancyId === item.discrepancyId
          ? {
              ...d,
              resolutionStatus: 'MANUAL_APPROVED',
              reviewNotes: 'Manually approved under CFO tolerance override'
            }
          : d
      )
    );
    setToastMessage(`✅ Approved PO ${item.poNumber} / INV ${item.invoiceNumber} under financial tolerance override.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRejectAndRaiseCdn = (item: DiscrepancyItem) => {
    const cdnRef = `CDN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setDiscrepancies((prev) =>
      prev.map((d) =>
        d.discrepancyId === item.discrepancyId
          ? {
              ...d,
              resolutionStatus: 'REJECTED_CREDIT_NOTE_RAISED',
              creditNoteReference: cdnRef,
              reviewNotes: `Invoice rejected. Statutory Credit Note ${cdnRef} raised for ₹${item.varianceAmount.toLocaleString('en-IN')}`
            }
          : d
      )
    );
    setToastMessage(`🛑 Invoice rejected. Statutory Credit Note ${cdnRef} raised against ${item.vendorName}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTriggerAutoPo = (item: RopItem) => {
    const poNum = `PO-ROP-${Date.now().toString().slice(-6)}`;
    setRopItems((prev) =>
      prev.map((i) =>
        i.sku === item.sku
          ? {
              ...i,
              status: 'SUFFICIENT',
              currentStock: i.currentStock + i.recommendedOrderQty
            }
          : i
      )
    );
    setToastMessage(`🚀 Auto-PO ${poNum} dispatched to ${item.preferredVendor} for ${item.recommendedOrderQty} units of ${item.itemName}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0F172A',
          padding: '24px 28px',
          borderRadius: '12px',
          border: '1px solid #1E293B'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚖️</span>
            <h2 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.35rem', fontWeight: 700 }}>
              SAP S/4HANA 3-Way PO Matching & Automated Reorder Point (ROP) Engine
            </h2>
            <Badge variant="primary">SAP S/4HANA Benchmark</Badge>
            <Badge variant="success">±0.5% Tolerance Audit</Badge>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>
            Automated line-item reconciliation (PO vs GRN vs Vendor Invoice) and rolling 90-day Lead Time Demand ROP replenishment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSubTab('MATCHING')}
            style={{
              backgroundColor: subTab === 'MATCHING' ? '#0284C7' : '#1E293B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            ⚖️ 3-Way Matching ({pendingCount})
          </button>
          <button
            onClick={() => setSubTab('ROP_INVENTORY')}
            style={{
              backgroundColor: subTab === 'ROP_INVENTORY' ? '#0284C7' : '#1E293B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            📦 Automated ROP Inventory
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Matching Exceptions
          </div>
          <div style={{ color: '#F59E0B', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            {pendingCount} Discrepancies
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '6px' }}>
            Awaiting Accounts Payable approval
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Variance Value At Risk
          </div>
          <div style={{ color: '#EF4444', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            ₹{totalVarianceAtRisk.toLocaleString('en-IN')}
          </div>
          <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '6px' }}>
            Overbilled across pending invoices
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Auto-Cleared Rate
          </div>
          <div style={{ color: '#10B981', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            94.8%
          </div>
          <div style={{ color: '#10B981', fontSize: '0.78rem', marginTop: '6px' }}>
            Within ±0.5% S/4HANA tolerance
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            ROP Stockout Prevention
          </div>
          <div style={{ color: '#38BDF8', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            99.2%
          </div>
          <div style={{ color: '#38BDF8', fontSize: '0.78rem', marginTop: '6px' }}>
            Zero stockouts on life-saving items
          </div>
        </Card>
      </div>

      {/* Main Table Content */}
      {subTab === 'MATCHING' ? (
        <Card style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700 }}>
            3-Way Purchase Order Line-Item Audit Desk
          </h3>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO / GRN / Invoice</TableHead>
                  <TableHead>Vendor & Item</TableHead>
                  <TableHead>PO (Qty × Rate)</TableHead>
                  <TableHead>GRN Received</TableHead>
                  <TableHead>Billed (Qty × Rate)</TableHead>
                  <TableHead>Variance %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discrepancies.map((item) => (
                  <TableRow key={item.discrepancyId}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: '#38BDF8' }}>{item.poNumber}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>GRN: {item.grnNumber}</div>
                      <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>INV: {item.invoiceNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.itemName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{item.vendorName}</div>
                      <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>
                        {item.reviewNotes}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>
                      {item.poQuantity} × ₹{item.poUnitPrice.toFixed(2)}
                      <div style={{ fontWeight: 600, color: '#F1F5F9' }}>= ₹{item.poTotal.toLocaleString('en-IN')}</div>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: item.grnQuantity < item.poQuantity ? '#EF4444' : '#10B981'
                        }}
                      >
                        {item.grnQuantity} units
                      </span>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>
                      {item.billedQuantity} × ₹{item.billedUnitPrice.toFixed(2)}
                      <div style={{ fontWeight: 600, color: '#F1F5F9' }}>= ₹{item.billedTotal.toLocaleString('en-IN')}</div>
                    </TableCell>
                    <TableCell>
                      {item.variancePercent === 0 ? (
                        <span style={{ color: '#10B981', fontWeight: 600 }}>0.0%</span>
                      ) : (
                        <span
                          style={{
                            fontWeight: 700,
                            color: item.toleranceStatus === 'WITHIN_TOLERANCE' ? '#10B981' : '#EF4444'
                          }}
                        >
                          +{item.variancePercent}% (₹{item.varianceAmount.toLocaleString('en-IN')})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.resolutionStatus === 'AUTO_APPROVED' || item.resolutionStatus === 'MANUAL_APPROVED'
                            ? 'success'
                            : item.resolutionStatus === 'REJECTED_CREDIT_NOTE_RAISED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {item.resolutionStatus.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.resolutionStatus === 'PENDING_REVIEW' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <Button
                            variant="primary"
                            onClick={() => handleApproveUnderTolerance(item)}
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleRejectAndRaiseCdn(item)}
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            ✕ Reject & CDN
                          </Button>
                        </div>
                      ) : item.creditNoteReference ? (
                        <span style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 600 }}>
                          CDN: {item.creditNoteReference}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>
                          ✓ Approved for Run
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Card style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700 }}>
            Automated Reorder Point (ROP) Stockout Sentinel
          </h3>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formulary Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Daily Velocity</TableHead>
                  <TableHead>Lead Time & Safety Stock</TableHead>
                  <TableHead>ROP Threshold</TableHead>
                  <TableHead>Preferred Vendor</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ropItems.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.itemName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{item.sku}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{item.category.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      <span
                        style={{
                          color:
                            item.status === 'CRITICAL_STOCKOUT'
                              ? '#EF4444'
                              : item.status === 'REORDER_TRIGGERED'
                              ? '#F59E0B'
                              : '#10B981'
                        }}
                      >
                        {item.currentStock} units
                      </span>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>
                      {item.dailyVelocity} units/day
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      <div>Lead Time: {item.leadTimeDays} days</div>
                      <div>Safety Stock: {item.safetyStock} units</div>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8' }}>
                      {item.reorderPoint} units
                    </TableCell>
                    <TableCell style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>
                      {item.preferredVendor}
                    </TableCell>
                    <TableCell>
                      {item.status !== 'SUFFICIENT' ? (
                        <Button
                          variant="primary"
                          onClick={() => handleTriggerAutoPo(item)}
                          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                        >
                          🚀 Auto-PO ({item.recommendedOrderQty})
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                          ✓ Stock Healthy
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
