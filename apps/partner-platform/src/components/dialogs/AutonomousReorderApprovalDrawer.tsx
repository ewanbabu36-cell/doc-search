import React, { useState, useEffect } from 'react';
import { Dialog, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface BreachedStockItem {
  itemCode: string;
  itemName: string;
  currentStock: number;
  reorderThreshold: number;
  suggestedReorderQuantity: number;
  preferredVendor: string;
  unitCostInr: number;
  totalEstimatedCostInr: number;
  urgencyTier: string;
}

export interface AutonomousReorderApprovalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPoReleased?: (poData: any) => void;
}

export const AutonomousReorderApprovalDrawer: React.FC<AutonomousReorderApprovalDrawerProps> = ({
  isOpen,
  onClose,
  onPoReleased
}) => {
  const [loading, setLoading] = useState(false);
  const [breachedItems, setBreachedItems] = useState<BreachedStockItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isReleasing, setIsReleasing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholdEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/partner/procurement/auto-reorder/evaluate-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceEvaluation: true })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to evaluate inventory thresholds.');
      }
      setBreachedItems(json.data.items || []);
      setTotalValue(json.data.totalEstimatedPoValueInr || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchThresholdEvaluation();
      setSuccessInfo(null);
    }
  }, [isOpen]);

  const handleReleaseAutonomousPo = async () => {
    setIsReleasing(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/partner/procurement/auto-reorder/release-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemCodes: breachedItems.map(i => i.itemCode),
          supplierName: 'Sun Pharma Distribution Hub Ltd',
          authorizedBy: 'Hospital Pharmacy Director'
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to release auto PO.');
      }
      setSuccessInfo(json.data);
      if (onPoReleased) onPoReleased(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'PO release failed.');
    } finally {
      setIsReleasing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Autonomous B2B Bulk Pharma Replenishment Drawer"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            EDI Standard • CDSCO Schedule H1 Compliant Procurement
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={onClose} disabled={isReleasing}>
              Close
            </Button>
            {!successInfo && breachedItems.length > 0 && (
              <Button
                variant="primary"
                onClick={handleReleaseAutonomousPo}
                disabled={isReleasing || loading}
              >
                {isReleasing ? 'Dispatching EDI...' : `⚡ 1-Click Release POs (₹${totalValue.toLocaleString('en-IN')})`}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        {successInfo ? (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>📦</span>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#166534', marginTop: '4px' }}>
              ELECTRONIC PURCHASE ORDER DISPATCHED
            </div>
            <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '2px' }}>
              PO Number: <strong>{successInfo.poNumber}</strong> • Supplier: <strong>{successInfo.supplierName}</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '8px' }}>
              Goods Receipt Note Pre-Staged: <code>{successInfo.grnPreStageNumber}</code> • Expected Delivery: within 48 hours
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Scanning active pharmacy batch safety stock against consumption velocity...
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#991b1b' }}>
                  🚨 Safety Buffer Breached: {breachedItems.length} Critical Items Below Threshold
                </div>
                <div style={{ fontSize: '0.78rem', color: '#b91c1c' }}>
                  Auto-calculated replenishment order prepared to prevent stock-outs.
                </div>
              </div>
              <Badge variant="danger">REORDER TRIGGERED</Badge>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '6px 8px' }}>Item Details</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Current Stock</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Reorder Point</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Suggested Qty</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Est. Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                {breachedItems.map((item) => (
                  <tr key={item.itemCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.itemName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Supplier: {item.preferredVendor} • Code: {item.itemCode}
                      </div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>
                      {item.currentStock}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>
                      {item.reorderThreshold}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                      +{item.suggestedReorderQuantity}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      ₹{item.totalEstimatedCostInr.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </Dialog>
  );
};
