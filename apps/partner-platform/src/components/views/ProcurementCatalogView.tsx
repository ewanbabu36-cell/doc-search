import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementItemDto
} from '@docsearch/api-contracts';

export interface ProcurementCatalogViewProps {
  items: ProcurementItemDto[];
  onOpenCreateItem: () => void;
}

export const ProcurementCatalogView: React.FC<ProcurementCatalogViewProps> = ({
  items,
  onOpenCreateItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = items.filter((i) => {
    const matchesSearch =
      i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.genericName && i.genericName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || i.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Master Procurement & Supplies Catalog
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Enterprise healthcare items, standard unit costs, reorder triggers, safety stock buffers, and preferred vendor mappings.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateItem}>
          + Add Catalog Item
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items by code, name, generic..."
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Categories' },
              { value: 'MEDICINE', label: 'Medicines' },
              { value: 'SURGICAL_CONSUMABLE', label: 'Surgical Consumables' },
              { value: 'LAB_REAGENT', label: 'Laboratory Reagents' },
              { value: 'MEDICAL_DEVICE', label: 'Medical Devices' },
              { value: 'PPE_SUPPLY', label: 'PPE & Safety' }
            ]}
          />
        </div>
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Item Code</th>
                <th style={{ padding: '0.75rem 1rem' }}>Item Description</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Standard Cost</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Stock / Reorder Level</th>
                <th style={{ padding: '0.75rem 1rem' }}>Preferred Supplier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {item.itemCode}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.itemName}</div>
                    {item.genericName && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.genericName}</div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant="primary">{item.category}</Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                    ${item.standardCost.toFixed(2)} / {item.unit}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, color: item.currentStock <= item.reorderLevel ? '#dc2626' : '#16a34a' }}>
                      {item.currentStock}
                    </span> / <span style={{ color: '#64748b' }}>{item.reorderLevel}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {item.preferredVendorName || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
