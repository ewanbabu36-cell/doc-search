import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface InvestigationMasterItem {
  id: string;
  testCode: string;
  testName: string;
  shortName?: string;
  category: string;
  department: string;
  specimenType: string;
  clinicalDescription?: string;
  fastingRequired: boolean;
  turnaroundTargetHours: number;
  metadata?: {
    mrp?: number | string;
    loincCode?: string;
    normalRange?: string;
    units?: string;
    panicLow?: number | string;
    panicHigh?: number | string;
  };
}

export const InvestigationCatalogMasterView: React.FC = () => {
  const [tests, setTests] = useState<InvestigationMasterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    testCode: '',
    testName: '',
    shortName: '',
    category: 'BIOCHEMISTRY',
    department: 'Biochemistry',
    specimenType: 'WHOLE_BLOOD',
    mrp: '450',
    loincCode: '24323-8',
    normalRange: '13.5 - 17.5 g/dL (Male), 12.0 - 15.5 g/dL (Female)',
    units: 'g/dL',
    turnaroundTargetHours: 24,
    fastingRequired: false,
    clinicalDescription: ''
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const fetchInvestigations = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      let url = '/api/v1/company/masters/investigations?limit=200';
      if (searchTerm) url += `&q=${encodeURIComponent(searchTerm)}`;
      if (selectedDept !== 'ALL') url += `&department=${encodeURIComponent(selectedDept)}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setTests(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load investigation catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchInvestigations();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDept]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const payload = {
        testCode: formData.testCode || `TEST-${Date.now().toString().slice(-4)}`,
        testName: formData.testName,
        shortName: formData.shortName,
        category: formData.category,
        department: formData.department,
        specimenType: formData.specimenType,
        fastingRequired: formData.fastingRequired,
        turnaroundTargetHours: Number(formData.turnaroundTargetHours) || 24,
        clinicalDescription: formData.clinicalDescription,
        metadata: {
          mrp: Number(formData.mrp) || 0,
          loincCode: formData.loincCode,
          normalRange: formData.normalRange,
          units: formData.units
        }
      };

      const url = editingId
        ? `/api/v1/company/masters/investigations/${editingId}`
        : '/api/v1/company/masters/investigations';
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
          text: `Lab investigation "${formData.testName}" saved to master catalog!`
        });
        setIsModalOpen(false);
        setEditingId(null);
        void fetchInvestigations();
      } else {
        setStatusMsg({ type: 'ERROR', text: 'Failed to save investigation.' });
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Network communication error.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the Investigation Catalog?`)) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch(`/api/v1/company/masters/investigations/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: `Investigation "${name}" removed.` });
        void fetchInvestigations();
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Delete failed.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const openEditModal = (item: InvestigationMasterItem) => {
    setEditingId(item.id);
    setFormData({
      testCode: item.testCode,
      testName: item.testName,
      shortName: item.shortName || '',
      category: item.category,
      department: item.department,
      specimenType: item.specimenType,
      mrp: String(item.metadata?.mrp || '350'),
      loincCode: item.metadata?.loincCode || '24323-8',
      normalRange: item.metadata?.normalRange || 'Normal',
      units: item.metadata?.units || '',
      turnaroundTargetHours: item.turnaroundTargetHours || 24,
      fastingRequired: item.fastingRequired,
      clinicalDescription: item.clinicalDescription || ''
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      testCode: `TEST-${Date.now().toString().slice(-4)}`,
      testName: '',
      shortName: '',
      category: 'BIOCHEMISTRY',
      department: 'Biochemistry',
      specimenType: 'WHOLE_BLOOD',
      mrp: '450',
      loincCode: '',
      normalRange: 'Normal',
      units: '',
      turnaroundTargetHours: 24,
      fastingRequired: false,
      clinicalDescription: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
            🔬 Standard Laboratory Investigation & Pathology Catalog (LOINC & NABL)
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Central standard laboratory tests with LOINC standardization, normal biological reference intervals, specimen guidelines & standard MRP
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" onClick={openCreateModal}>
            + Add Lab Investigation
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

      {/* Filter / Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Input
              placeholder="Search by test name, code, department (e.g. CBC, Lipid, HbA1c, Liver)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ width: '200px' }}>
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Departments' },
                { value: 'Pathology', label: 'Pathology' },
                { value: 'Biochemistry', label: 'Biochemistry' },
                { value: 'Hematology', label: 'Hematology' },
                { value: 'Microbiology', label: 'Microbiology' },
                { value: 'Serology', label: 'Serology' },
                { value: 'Endocrinology', label: 'Endocrinology' }
              ]}
            />
          </div>
          <Badge variant="primary">{tests.length} Standard Tests Active</Badge>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Loading investigations from PostgreSQL master catalog...
          </div>
        ) : tests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            No investigations found matching your filter criteria.
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Code</TableHead>
                  <TableHead>Investigation Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Specimen</TableHead>
                  <TableHead>LOINC Code</TableHead>
                  <TableHead>Biological Reference Interval</TableHead>
                  <TableHead>Standard MRP</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700 }}>
                        {t.testCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC' }}>{t.testName}</strong>
                      {t.fastingRequired && (
                        <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#F59E0B' }}>⚠️ Fasting</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{t.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem' }}>{t.specimenType}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94A3B8' }}>
                        {t.metadata?.loincCode || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                        {t.metadata?.normalRange || 'Standard Lab Range'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontWeight: 700, color: '#34D399' }}>
                        ₹{Number(t.metadata?.mrp || 350).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(t)}>
                          ✏️ Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(t.id, t.testName)}>
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
                {editingId ? 'Edit Lab Investigation' : 'Add New Lab Investigation to Catalog'}
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
                    Test Code *
                  </label>
                  <Input
                    required
                    value={formData.testCode}
                    onChange={(e) => setFormData({ ...formData, testCode: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Investigation Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Complete Blood Count (CBC with 5-Part Diff)"
                    value={formData.testName}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Department
                  </label>
                  <Select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    options={[
                      { value: 'Biochemistry', label: 'Biochemistry' },
                      { value: 'Hematology', label: 'Hematology' },
                      { value: 'Microbiology', label: 'Microbiology' },
                      { value: 'Serology', label: 'Serology' },
                      { value: 'Clinical Pathology', label: 'Clinical Pathology' },
                      { value: 'Endocrinology', label: 'Endocrinology' }
                    ]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Specimen Type
                  </label>
                  <Select
                    value={formData.specimenType}
                    onChange={(e) => setFormData({ ...formData, specimenType: e.target.value })}
                    options={[
                      { value: 'WHOLE_BLOOD', label: 'Whole Blood (EDTA)' },
                      { value: 'SERUM', label: 'Serum (SST Gold)' },
                      { value: 'PLASMA', label: 'Plasma (Fluoride/Citrate)' },
                      { value: 'URINE', label: 'Urine (Mid-stream)' },
                      { value: 'SWAB', label: 'Swab / Culture' }
                    ]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Standard MRP (₹) *
                  </label>
                  <Input
                    type="number"
                    required
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    LOINC Code Standard
                  </label>
                  <Input
                    placeholder="e.g. 58410-2"
                    value={formData.loincCode}
                    onChange={(e) => setFormData({ ...formData, loincCode: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Turnaround Time (Hours)
                  </label>
                  <Input
                    type="number"
                    value={formData.turnaroundTargetHours}
                    onChange={(e) => setFormData({ ...formData, turnaroundTargetHours: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Biological Reference Interval / Normal Range
                </label>
                <Input
                  placeholder="e.g. 13.5 - 17.5 g/dL (Male), 12.0 - 15.5 g/dL (Female)"
                  value={formData.normalRange}
                  onChange={(e) => setFormData({ ...formData, normalRange: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="fastingCheck"
                  checked={formData.fastingRequired}
                  onChange={(e) => setFormData({ ...formData, fastingRequired: e.target.checked })}
                />
                <label htmlFor="fastingCheck" style={{ fontSize: '0.875rem', color: '#CBD5E1', cursor: 'pointer' }}>
                  Fasting sample required (8-10 hours overnight)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingId ? 'Update Investigation' : 'Save to Master Catalog'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
