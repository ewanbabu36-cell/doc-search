import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface InsurancePayerMasterItem {
  id: string;
  payerCode: string;
  payerName: string;
  payerType: string;
  tpaName?: string;
  electronicPayerId?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: string;
  metadata?: {
    nhcxCode?: string;
    portalUrl?: string;
    ayushmanPackages?: Array<{
      code: string;
      name: string;
      specialty: string;
      standardRate: number;
      implantCovered: boolean;
    }>;
  };
}

export const InsurancePayerMasterView: React.FC = () => {
  const [payers, setPayers] = useState<InsurancePayerMasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [selectedPayerForPackages, setSelectedPayerForPackages] = useState<InsurancePayerMasterItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    payerCode: '',
    payerName: '',
    payerType: 'COMMERCIAL_INSURANCE',
    tpaName: '',
    electronicPayerId: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    nhcxCode: '',
    portalUrl: ''
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const fetchPayers = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/company/masters/insurance-payers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setPayers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load insurance payers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const payload = {
        payerCode: formData.payerCode || `PAY-${Date.now().toString().slice(-4)}`,
        payerName: formData.payerName,
        payerType: formData.payerType,
        tpaName: formData.tpaName,
        electronicPayerId: formData.electronicPayerId || formData.nhcxCode,
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        metadata: {
          nhcxCode: formData.nhcxCode,
          portalUrl: formData.portalUrl
        }
      };

      const url = editingId
        ? `/api/v1/company/masters/insurance-payers/${editingId}`
        : '/api/v1/company/masters/insurance-payers';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMsg({
          type: 'SUCCESS',
          text: `Insurance payer "${formData.payerName}" saved successfully!`
        });
        setIsModalOpen(false);
        setEditingId(null);
        void fetchPayers();
      } else {
        setStatusMsg({ type: 'ERROR', text: 'Failed to save insurance payer.' });
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Network communication error.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove payer "${name}"?`)) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch(`/api/v1/company/masters/insurance-payers/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: `Payer "${name}" removed.` });
        void fetchPayers();
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Delete failed.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      payerCode: `PAY-${Date.now().toString().slice(-4)}`,
      payerName: '',
      payerType: 'COMMERCIAL_INSURANCE',
      tpaName: '',
      electronicPayerId: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      nhcxCode: '',
      portalUrl: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InsurancePayerMasterItem) => {
    setEditingId(item.id);
    setFormData({
      payerCode: item.payerCode,
      payerName: item.payerName,
      payerType: item.payerType,
      tpaName: item.tpaName || '',
      electronicPayerId: item.electronicPayerId || '',
      contactPerson: item.contactPerson || '',
      contactEmail: item.contactEmail || '',
      contactPhone: item.contactPhone || '',
      nhcxCode: item.metadata?.nhcxCode || '',
      portalUrl: item.metadata?.portalUrl || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
            🛡️ Insurance Payers, Third-Party Administrators (TPA) & Ayushman PM-JAY Master
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Manage commercial insurers, TPA cashless clearinghouses, NHCX integration keys & PM-JAY Ayushman package rates
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" onClick={openCreateModal}>
            + Add Insurance Payer / TPA
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: statusMsg.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${statusMsg.type === 'SUCCESS' ? '#10B981' : '#EF4444'}`,
            color: statusMsg.type === 'SUCCESS' ? '#34D399' : '#F87171'
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Payers Table */}
      <Card>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Loading insurance payers from database...
          </div>
        ) : payers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            No insurance payers configured in master database. Click "+ Add Insurance Payer / TPA" to create one.
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payer Code</TableHead>
                  <TableHead>Insurance Payer Name</TableHead>
                  <TableHead>Payer Type</TableHead>
                  <TableHead>TPA Desk</TableHead>
                  <TableHead>NHCX / Electronic ID</TableHead>
                  <TableHead>Ayushman Packages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payers.map((p) => {
                  const pkgs = p.metadata?.ayushmanPackages || [];
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700 }}>
                          {p.payerCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: '#F8FAFC' }}>{p.payerName}</strong>
                        {p.metadata?.portalUrl && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            Portal: {p.metadata.portalUrl}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.payerType === 'GOVERNMENT_HEALTHCARE' ? 'success' : 'primary'}>
                          {p.payerType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '0.8125rem' }}>{p.tpaName || 'In-House Claims'}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#A78BFA' }}>
                          {p.electronicPayerId || p.metadata?.nhcxCode || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {pkgs.length > 0 ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedPayerForPackages(p);
                              setIsPackageModalOpen(true);
                            }}
                          >
                            📦 View {pkgs.length} Packages
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Standard Tariff</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">ACTIVE</Badge>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button size="sm" variant="ghost" onClick={() => openEditModal(p)}>
                            ✏️ Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(p.id, p.payerName)}>
                            🗑️
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
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
              border: '1px solid #334155',
              borderRadius: '12px',
              maxWidth: '650px',
              width: '100%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC' }}>
                {editingId ? 'Edit Insurance Payer / TPA' : 'Add New Insurance Payer / TPA'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Payer Code *
                  </label>
                  <Input
                    required
                    value={formData.payerCode}
                    onChange={(e) => setFormData({ ...formData, payerCode: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Insurance Payer / Company Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Star Health & Allied Insurance Co."
                    value={formData.payerName}
                    onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Payer Type
                  </label>
                  <Select
                    value={formData.payerType}
                    onChange={(e) => setFormData({ ...formData, payerType: e.target.value })}
                    options={[
                      { value: 'COMMERCIAL_INSURANCE', label: 'Commercial Health Insurance' },
                      { value: 'TPA', label: 'Third-Party Administrator (TPA)' },
                      { value: 'GOVERNMENT_HEALTHCARE', label: 'Government Healthcare (PM-JAY / ECHS)' },
                      { value: 'CORPORATE_DIRECT', label: 'Corporate Direct Desk' }
                    ]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    TPA / Administrator Desk Name
                  </label>
                  <Input
                    placeholder="e.g. Medi Assist Healthcare TPA"
                    value={formData.tpaName}
                    onChange={(e) => setFormData({ ...formData, tpaName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    NHCX Payer ID / Electronic Code
                  </label>
                  <Input
                    placeholder="e.g. STAR_HLTH_01"
                    value={formData.nhcxCode}
                    onChange={(e) => setFormData({ ...formData, nhcxCode: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Cashless Claims Portal URL
                  </label>
                  <Input
                    placeholder="https://..."
                    value={formData.portalUrl}
                    onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Contact Person
                  </label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Desk Email
                  </label>
                  <Input
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Desk Phone
                  </label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingId ? 'Update Payer' : 'Save Payer to Master'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packages Viewer Modal */}
      {isPackageModalOpen && selectedPayerForPackages && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
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
              border: '1px solid #334155',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '100%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC' }}>
                Ayushman PM-JAY Tariff Packages ({selectedPayerForPackages.payerName})
              </h3>
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package Code</TableHead>
                    <TableHead>Procedure / Package Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Govt Tariff (₹)</TableHead>
                    <TableHead>Implant Covered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedPayerForPackages.metadata?.ayushmanPackages || []).map((pkg) => (
                    <TableRow key={pkg.code}>
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700 }}>
                          {pkg.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: '#F8FAFC' }}>{pkg.name}</strong>
                      </TableCell>
                      <TableCell>{pkg.specialty}</TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 700, color: '#10B981' }}>
                          ₹{pkg.standardRate.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pkg.implantCovered ? 'success' : 'neutral'}>
                          {pkg.implantCovered ? 'YES' : 'NO'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="primary" onClick={() => setIsPackageModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
