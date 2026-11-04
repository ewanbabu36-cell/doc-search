import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface MedicationMasterItem {
  id: string;
  medicationCode: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  category: string;
  route: string;
  controlledMedication: boolean;
  prescriptionRequired: boolean;
  status: string;
  metadata?: {
    mrp?: number | string;
    janAushadhiPrice?: number | string;
    schedule?: string;
    hindiInstructions?: string;
  };
}

export const NationalFormularyMasterView: React.FC = () => {
  const [medications, setMedications] = useState<MedicationMasterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    medicationCode: '',
    brandName: '',
    genericName: '',
    strength: '500mg',
    dosageForm: 'TABLET',
    manufacturer: 'Sun Pharma Ltd',
    category: 'ANTIBIOTIC',
    route: 'ORAL',
    mrp: '120.00',
    janAushadhiPrice: '28.00',
    schedule: 'H',
    prescriptionRequired: true,
    controlledMedication: false
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const fetchMedications = async (query = '') => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const url = `/api/v1/company/masters/medications${query ? `?q=${encodeURIComponent(query)}` : '?limit=100'}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setMedications(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load medications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMedications(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const payload = {
        medicationCode: formData.medicationCode || `MED-${Date.now().toString().slice(-4)}`,
        brandName: formData.brandName,
        genericName: formData.genericName,
        strength: formData.strength,
        dosageForm: formData.dosageForm,
        manufacturer: formData.manufacturer,
        category: formData.category,
        route: formData.route,
        prescriptionRequired: formData.prescriptionRequired,
        controlledMedication: formData.controlledMedication,
        metadata: {
          mrp: Number(formData.mrp) || 0,
          janAushadhiPrice: Number(formData.janAushadhiPrice) || 0,
          schedule: formData.schedule
        }
      };

      const url = editingId
        ? `/api/v1/company/masters/medications/${editingId}`
        : '/api/v1/company/masters/medications';
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
          text: `Medication "${formData.brandName}" saved to National Formulary!`
        });
        setIsModalOpen(false);
        setEditingId(null);
        void fetchMedications(searchTerm);
      } else {
        setStatusMsg({ type: 'ERROR', text: 'Failed to save medication entry.' });
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Network communication error.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the National Formulary?`)) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch(`/api/v1/company/masters/medications/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: `Medication "${name}" removed.` });
        void fetchMedications(searchTerm);
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Delete failed.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const openEditModal = (item: MedicationMasterItem) => {
    setEditingId(item.id);
    setFormData({
      medicationCode: item.medicationCode,
      brandName: item.brandName,
      genericName: item.genericName,
      strength: item.strength,
      dosageForm: item.dosageForm,
      manufacturer: item.manufacturer,
      category: item.category,
      route: item.route,
      mrp: String(item.metadata?.mrp || '100'),
      janAushadhiPrice: String(item.metadata?.janAushadhiPrice || '25'),
      schedule: item.metadata?.schedule || 'H',
      prescriptionRequired: item.prescriptionRequired,
      controlledMedication: item.controlledMedication
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      medicationCode: `MED-${Date.now().toString().slice(-4)}`,
      brandName: '',
      genericName: '',
      strength: '500mg',
      dosageForm: 'TABLET',
      manufacturer: 'Sun Pharma Ltd',
      category: 'ANTIBIOTIC',
      route: 'ORAL',
      mrp: '120.00',
      janAushadhiPrice: '28.00',
      schedule: 'H',
      prescriptionRequired: true,
      controlledMedication: false
    });
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
            💊 Central National Formulary & Drug Master (CDSCO / Jan Aushadhi)
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Authoritative CDSCO-compliant drug master with Jan Aushadhi generic substitution rates, schedule warnings & dosage forms
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" onClick={openCreateModal}>
            + Add New Drug to Formulary
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

      {/* Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Search by brand name, generic salt, code or therapeutic class (e.g. Paracetamol, Augmentin, Dolo)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="primary">{medications.length} Formulary Drugs Loaded</Badge>
        </div>
      </Card>

      {/* Formulary Table */}
      <Card>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Loading drug catalog from PostgreSQL database...
          </div>
        ) : medications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            No medications match your query. Click "+ Add New Drug to Formulary" to create one.
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Generic Salt / Composition</TableHead>
                  <TableHead>Form & Strength</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Schedule / Warning</TableHead>
                  <TableHead>Standard MRP</TableHead>
                  <TableHead>Jan Aushadhi</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#38BDF8' }}>
                        {m.medicationCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC' }}>{m.brandName}</strong>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: '#CBD5E1' }}>{m.genericName}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem' }}>
                        {m.dosageForm} • {m.strength}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>{m.manufacturer}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.metadata?.schedule === 'H1' || m.controlledMedication ? 'danger' : 'warning'}>
                        Schedule {m.metadata?.schedule || 'H'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontWeight: 700, color: '#38BDF8' }}>
                        ₹{Number(m.metadata?.mrp || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>
                        ₹{Number(m.metadata?.janAushadhiPrice || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(m)}>
                          ✏️ Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(m.id, m.brandName)}>
                          🗑️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
                {editingId ? 'Edit Formulary Drug' : 'Add New Drug to National Formulary'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Drug Code *
                  </label>
                  <Input
                    required
                    value={formData.medicationCode}
                    onChange={(e) => setFormData({ ...formData, medicationCode: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Brand Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Augmentin 625 Duo"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Generic Salt / Chemical Composition *
                </label>
                <Input
                  required
                  placeholder="e.g. Amoxicillin 500mg + Potassium Clavulanate 125mg"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Dosage Form
                  </label>
                  <Select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    options={[
                      { value: 'TABLET', label: 'Tablet' },
                      { value: 'CAPSULE', label: 'Capsule' },
                      { value: 'SYRUP', label: 'Syrup' },
                      { value: 'INJECTION', label: 'Injection' },
                      { value: 'OINTMENT', label: 'Ointment' },
                      { value: 'DROPS', label: 'Drops' },
                      { value: 'INHALER', label: 'Inhaler' }
                    ]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Strength
                  </label>
                  <Input
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Schedule
                  </label>
                  <Select
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    options={[
                      { value: 'H', label: 'Schedule H (Rx)' },
                      { value: 'H1', label: 'Schedule H1 (Controlled)' },
                      { value: 'X', label: 'Schedule X (Narcotics)' },
                      { value: 'OTC', label: 'OTC Non-Rx' }
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Manufacturer
                  </label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Standard MRP (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Jan Aushadhi Rate (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.janAushadhiPrice}
                    onChange={(e) => setFormData({ ...formData, janAushadhiPrice: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingId ? 'Update Medication' : 'Save to Formulary'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
