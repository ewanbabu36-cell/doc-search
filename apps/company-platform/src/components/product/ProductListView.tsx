import React, { useState } from 'react';
import type { ProductDto, ProductCategory } from '@docsearch/api-contracts';
import {
  Card,
  Input,
  Select,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface ProductListViewProps {
  products: ProductDto[];
  onSelectProduct: (productId: string) => void;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  onSelectProduct
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'ALL'>('ALL');
  const [localProducts, setLocalProducts] = useState<ProductDto[]>(products);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('CORE_PLATFORM');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = (localProducts.length > 0 ? localProducts : products).filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    return true;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ProductDto = {
      id: 'prod-' + Date.now(),
      name: newProdName || 'New Clinical Suite Line',
      code: newProdCode || 'DOCSEARCH_PROD_' + Date.now(),
      category: newProdCategory,
      description: newProdDesc || 'Enterprise healthcare SaaS product module.',
      status: 'ACTIVE',
      version: '1.0.0',
      metadata: {},
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalProducts((prev) => [created, ...(prev.length > 0 ? prev : products)]);
    setIsModalOpen(false);
    setNewProdName('');
    setNewProdCode('');
    setSuccessMsg(`Product "${created.name}" created successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>Healthcare Product Catalog</h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{filtered.length} core product lines available for subscription packaging</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
          ➕ Add New Product Line
        </Button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700 }}>
          ✓ {successMsg}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '2px solid #06B6D4', borderRadius: '20px', maxWidth: '600px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#FFF' }}>➕ Add Healthcare Product Line</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PRODUCT NAME *</label>
                <Input required placeholder="e.g. DocSearch Oncology Care Suite" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PRODUCT CODE *</label>
                  <Input required placeholder="e.g. DOCSEARCH_ONCO" value={newProdCode} onChange={(e) => setNewProdCode(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>CATEGORY</label>
                  <Select
                    options={[
                      { label: 'Core Platform', value: 'CORE_PLATFORM' },
                      { label: 'AI Governance Suite', value: 'AI_GOVERNANCE' },
                      { label: 'Interoperability Hub', value: 'INTEROPERABILITY_HUB' },
                      { label: 'Specialty Add-on', value: 'SPECIALTY_ADDON' }
                    ]}
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>DESCRIPTION</label>
                <Input placeholder="Short summary of capabilities..." value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <Button type="button" variant="outline" size="md" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="md" style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>🚀 Create Product</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Search Products</label>
            <Input placeholder="Search by code, name, or capability..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Product Category</label>
            <Select
              options={[
                { label: 'All Categories', value: 'ALL' },
                { label: 'Core Platform', value: 'CORE_PLATFORM' },
                { label: 'AI Governance', value: 'AI_GOVERNANCE' },
                { label: 'Interoperability Hub', value: 'INTEROPERABILITY_HUB' },
                { label: 'Specialty Add-on', value: 'SPECIALTY_ADDON' }
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
            />
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name & Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No products found matching the search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.name}</strong>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          {p.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{p.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span>v{p.version}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectProduct(p.id)}>
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
