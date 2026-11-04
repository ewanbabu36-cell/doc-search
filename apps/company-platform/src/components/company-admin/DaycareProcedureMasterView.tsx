import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface DaycareProcedureMasterItem {
  id: string;
  procedureCode: string;
  procedureName: string;
  specialty: string;
  category: string;
  defaultDurationMinutes: number;
  baseProcedureCharge: string;
  isActive: boolean;
  metadata?: {
    nursingInstructions?: string;
  };
}

export const DaycareProcedureMasterView: React.FC = () => {
  const [procedures, setProcedures] = useState<DaycareProcedureMasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    procedureCode: '',
    procedureName: '',
    specialty: 'General Medicine',
    category: 'NEBULIZATION',
    defaultDurationMinutes: 15,
    baseProcedureCharge: '150.00',
    nursingInstructions: ''
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const fetchProcedures = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/company/masters/daycare-procedures', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setProcedures(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load daycare procedures:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProcedures();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const payload = {
        procedureCode: formData.procedureCode || `PROC-${Date.now().toString().slice(-4)}`,
        procedureName: formData.procedureName,
        specialty: formData.specialty,
        category: formData.category,
        defaultDurationMinutes: Number(formData.defaultDurationMinutes) || 15,
        baseProcedureCharge: formData.baseProcedureCharge,
        metadata: {
          nursingInstructions: formData.nursingInstructions
        }
      };

      const url = editingId
        ? `/api/v1/company/masters/daycare-procedures/${editingId}`
        : '/api/v1/company/masters/daycare-procedures';
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
          text: `Daycare procedure "${formData.procedureName}" saved successfully!`
        });
        setIsModalOpen(false);
        setEditingId(null);
        void fetchProcedures();
      } else {
        setStatusMsg({ type: 'ERROR', text: 'Failed to save procedure.' });
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Network communication error.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove procedure "${name}"?`)) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch(`/api/v1/company/masters/daycare-procedures/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: `Procedure "${name}" removed.` });
        void fetchProcedures();
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Delete failed.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      procedureCode: `PROC-${Date.now().toString().slice(-4)}`,
      procedureName: '',
      specialty: 'General Medicine',
      category: 'NEBULIZATION',
      defaultDurationMinutes: 15,
      baseProcedureCharge: '150.00',
      nursingInstructions: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: DaycareProcedureMasterItem) => {
    setEditingId(item.id);
    setFormData({
      procedureCode: item.procedureCode,
      procedureName: item.procedureName,
      specialty: item.specialty,
      category: item.category,
      defaultDurationMinutes: item.defaultDurationMinutes,
      baseProcedureCharge: item.baseProcedureCharge,
      nursingInstructions: item.metadata?.nursingInstructions || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
            🩺 Daycare Procedures, Minor OT & Nursing Orders Master
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Standardize OPD daycare procedures, nebulization, injections, wound care, standard charges and nursing protocol orders
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" onClick={openCreateModal}>
            + Add Daycare Procedure
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

      {/* Procedures Table */}
      <Card>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Loading procedures from database...
          </div>
        ) : procedures.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            No procedures found. Click "+ Add Daycare Procedure" to create one.
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Procedure Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Standard Charge</TableHead>
                  <TableHead>Nursing Protocol Instructions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedures.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700 }}>
                        {p.procedureCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC' }}>{p.procedureName}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{p.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem' }}>{p.specialty}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                        {p.defaultDurationMinutes} mins
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>
                        ₹{Number(p.baseProcedureCharge || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '300px', display: 'block' }}>
                        {p.metadata?.nursingInstructions || 'Standard aseptic nursing technique.'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(p)}>
                          ✏️ Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(p.id, p.procedureName)}>
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
                {editingId ? 'Edit Daycare Procedure' : 'Add New Daycare Procedure'}
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
                    Procedure Code *
                  </label>
                  <Input
                    required
                    value={formData.procedureCode}
                    onChange={(e) => setFormData({ ...formData, procedureCode: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Procedure / Intervention Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Nebulization (Duolin + Budecort)"
                    value={formData.procedureName}
                    onChange={(e) => setFormData({ ...formData, procedureName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    options={[
                      { value: 'NEBULIZATION', label: 'Nebulization' },
                      { value: 'INJECTION', label: 'Injection (IM/IV/SC)' },
                      { value: 'IV_DRIP', label: 'IV Infusion / Fluid' },
                      { value: 'DRESSING', label: 'Wound Dressing / Suture' },
                      { value: 'DIAGNOSTIC', label: 'In-Chamber Diagnostic (ECG/CBG)' },
                      { value: 'DAYCARE', label: 'Daycare Surgery / Minor OT' }
                    ]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Specialty
                  </label>
                  <Input
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Standard Tariff (₹) *
                  </label>
                  <Input
                    type="number"
                    required
                    value={formData.baseProcedureCharge}
                    onChange={(e) => setFormData({ ...formData, baseProcedureCharge: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Nursing Instructions & Protocol Guide
                </label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    fontSize: '0.875rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="e.g. Administer 1 ampoule Duolin + 0.5mg Budecort via oxygen nebulizer over 15 mins. Monitor post-neb SpO2."
                  value={formData.nursingInstructions}
                  onChange={(e) => setFormData({ ...formData, nursingInstructions: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingId ? 'Update Procedure' : 'Save Procedure to Master'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
