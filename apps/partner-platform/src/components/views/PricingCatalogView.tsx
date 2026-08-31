import React, { useState } from 'react';
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
  BillingServiceCatalogDto,
  BillingPriceListDto
} from '@docsearch/api-contracts';

export interface PricingCatalogViewProps {
  services: BillingServiceCatalogDto[];
  priceLists: BillingPriceListDto[];
  onOpenCreateService: () => void;
  onOpenCreatePriceList: () => void;
}

export const PricingCatalogView: React.FC<PricingCatalogViewProps> = ({
  services,
  priceLists,
  onOpenCreateService,
  onOpenCreatePriceList
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredServices = services.filter((s) => {
    if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchCode = s.serviceCode.toLowerCase().includes(lower);
      const matchName = s.serviceName.toLowerCase().includes(lower);
      const matchDept = s.department && s.department.toLowerCase().includes(lower);
      if (!matchCode && !matchName && !matchDept) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Pricing Master & Billable Service Catalog
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Central fee master, clinical tariff schedules, institutional price overrides, and tax classification
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onOpenCreatePriceList}>
            + New Fee Schedule
          </Button>
          <Button variant="primary" onClick={onOpenCreateService}>
            + Add Billable Service
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Billable Catalog
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, procedure name, department..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Service Category
            </label>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'CONSULTATION', label: 'Consultation' },
                { value: 'INVESTIGATION', label: 'Investigation / Lab' },
                { value: 'PHARMACY', label: 'Pharmacy' },
                { value: 'PROCEDURE', label: 'Procedure' },
                { value: 'EMERGENCY', label: 'Emergency' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Master Service Catalog Table */}
      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
          Master Service Catalog ({filteredServices.length})
        </h3>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Code</TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Tax Status</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((s) => (
                <TableRow key={s.id}>
                  <TableCell style={{ fontWeight: 600 }}>{s.serviceCode}</TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 500 }}>{s.serviceName}</div>
                    {s.description && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{s.category}</Badge>
                  </TableCell>
                  <TableCell>{s.department || 'General'}</TableCell>
                  <TableCell style={{ fontWeight: 700, color: '#0f172a' }}>
                    ${s.basePrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {s.taxable ? <Badge variant="warning">TAXABLE</Badge> : <Badge variant="neutral">EXEMPT</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.active ? 'success' : 'neutral'}>
                      {s.active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Institutional Fee Schedules */}
      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
          Configured Fee Schedules & Pricing Tiers ({priceLists.length})
        </h3>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schedule Code</TableHead>
                <TableHead>Price List Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Overridden Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceLists.map((pl) => (
                <TableRow key={pl.id}>
                  <TableCell style={{ fontWeight: 600 }}>{pl.priceListCode}</TableCell>
                  <TableCell style={{ fontWeight: 500 }}>{pl.name}</TableCell>
                  <TableCell>{pl.currency}</TableCell>
                  <TableCell>{pl.items.length} items configured</TableCell>
                  <TableCell>
                    <Badge variant={pl.status === 'ACTIVE' ? 'success' : 'neutral'}>{pl.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(pl.effectiveFrom).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
