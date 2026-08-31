import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementVendorDto
} from '@docsearch/api-contracts';

export interface VendorDirectoryViewProps {
  vendors: ProcurementVendorDto[];
  onOpenCreateVendor: () => void;
  onSelectVendor: (vendor: ProcurementVendorDto) => void;
}

export const VendorDirectoryView: React.FC<VendorDirectoryViewProps> = ({
  vendors,
  onOpenCreateVendor,
  onSelectVendor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.contactPerson && v.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || v.vendorCategory === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Accredited Healthcare Vendors & Suppliers
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Pharmaceutical manufacturers, surgical distributors, lab reagent providers, and biomedical equipment suppliers.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateVendor}>
          + Register New Vendor
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Search Vendors
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, legal name, contact..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Vendor Category
            </label>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Vendor Categories' },
                { value: 'PHARMACEUTICALS', label: 'Pharmaceuticals' },
                { value: 'SURGICAL_DISPOSABLES', label: 'Surgical Disposables' },
                { value: 'LABORATORY_REAGENTS', label: 'Laboratory Reagents' },
                { value: 'MEDICAL_EQUIPMENT', label: 'Medical Equipment' },
                { value: 'PPE_SAFETY', label: 'PPE & Safety' }
              ]}
            />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((vendor) => (
          <Card
            key={vendor.id}
            onClick={() => onSelectVendor(vendor)}
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1px solid #e2e8f0'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
                  {vendor.vendorCode}
                </span>
                <Badge variant={vendor.status === 'ACTIVE' ? 'success' : vendor.status === 'SUSPENDED' ? 'danger' : 'neutral'}>
                  {vendor.status}
                </Badge>
              </div>

              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                {vendor.legalName}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#475569', margin: '0.5rem 0' }}>
                <div><strong>Category:</strong> {vendor.vendorCategory.replace(/_/g, ' ')}</div>
                <div><strong>Rating:</strong> ⭐ {vendor.rating.toFixed(2)} / 5.00</div>
                <div><strong>Payment SLA:</strong> {vendor.paymentTermsDays} Days ({vendor.leadTimeDays}d Lead Time)</div>
                {vendor.contactEmail && <div><strong>Email:</strong> {vendor.contactEmail}</div>}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
              <span>{vendor.activeContractCount} Contracts • {vendor.openPoCount} Open POs</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>${vendor.totalSpendYtd.toLocaleString()} YTD</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
