import React from 'react';
import {
  Card,
  Button,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementVendorDto,
  ProcurementVendorContractDto,
  PurchaseOrderDto
} from '@docsearch/api-contracts';

export interface VendorDetailViewProps {
  vendor: ProcurementVendorDto | null;
  contracts: ProcurementVendorContractDto[];
  purchaseOrders: PurchaseOrderDto[];
  onBack: () => void;
  onOpenEditVendor: () => void;
  onOpenSuspendVendor: () => void;
  onOpenCreateContract: () => void;
  onSelectPO: (poId: string) => void;
}

export const VendorDetailView: React.FC<VendorDetailViewProps> = ({
  vendor,
  contracts,
  purchaseOrders,
  onBack,
  onOpenEditVendor,
  onOpenSuspendVendor,
  onOpenCreateContract,
  onSelectPO
}) => {
  if (!vendor) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>No vendor selected.</p>
        <Button variant="outline" onClick={onBack}>Back to Directory</Button>
      </Card>
    );
  }

  const vendorContracts = contracts.filter((c) => c.vendorId === vendor.id);
  const vendorPOs = purchaseOrders.filter((po) => po.vendorId === vendor.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
                {vendor.legalName}
              </h2>
              <Badge variant={vendor.status === 'ACTIVE' ? 'success' : 'danger'}>{vendor.status}</Badge>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Code: {vendor.vendorCode} • {vendor.vendorCategory}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="sm" onClick={onOpenEditVendor}>Edit Profile</Button>
          <Button variant="outline" size="sm" onClick={onOpenCreateContract}>+ New Contract</Button>
          {vendor.status === 'ACTIVE' && (
            <Button variant="danger" size="sm" onClick={onOpenSuspendVendor}>Suspend Vendor</Button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #94a3b8)', textTransform: 'uppercase' }}>Vendor Classification</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ds-color-text-primary, #f8fafc)', marginTop: '0.25rem' }}>{vendor.vendorType}</div>
          <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>Risk: {vendor.riskClassification}</div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #94a3b8)', textTransform: 'uppercase' }}>Performance Rating</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#16a34a', marginTop: '0.25rem' }}>⭐ {vendor.rating.toFixed(2)} / 5.00</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Lead Time: {vendor.leadTimeDays} days</div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #94a3b8)', textTransform: 'uppercase' }}>Payment Terms</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ds-color-text-primary, #f8fafc)', marginTop: '0.25rem' }}>NET {vendor.paymentTermsDays}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>SLA: {vendor.deliverySlaHours} hours</div>
        </Card>

        <Card style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #94a3b8)', textTransform: 'uppercase' }}>Total YTD Spend</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#16a34a', marginTop: '0.25rem' }}>${vendor.totalSpendYtd.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>{vendorPOs.length} Total Orders</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
            Master Contracts ({vendorContracts.length})
          </h3>
          {vendorContracts.length === 0 ? (
            <p style={{ color: 'var(--ds-color-text-secondary, #94a3b8)', fontSize: '0.875rem' }}>No active contracts on file.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {vendorContracts.map((c) => (
                <div key={c.id} style={{ padding: '0.75rem', backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)', borderRadius: '6px', border: '1px solid var(--ds-color-border, #334155)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
                    <span>{c.contractNumber}</span>
                    <Badge variant="success">{c.status}</Badge>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-secondary, #94a3b8)', marginTop: '0.2rem' }}>
                    {c.title} • Expires: {new Date(c.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
            Purchase Order History ({vendorPOs.length})
          </h3>
          {vendorPOs.length === 0 ? (
            <p style={{ color: 'var(--ds-color-text-secondary, #94a3b8)', fontSize: '0.875rem' }}>No purchase orders recorded with this vendor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {vendorPOs.map((po) => (
                <div
                  key={po.id}
                  onClick={() => onSelectPO(po.id)}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)',
                    borderRadius: '6px',
                    border: '1px solid var(--ds-color-border, #334155)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>{po.poNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
                      ${po.totalNetAmount.toFixed(2)} • {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="primary">{po.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
