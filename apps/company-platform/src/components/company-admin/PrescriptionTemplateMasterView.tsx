import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface PrescriptionTemplateItem {
  id: string;
  templateCode: string;
  name: string;
  icon: string;
  category: string;
  chiefComplaint?: string;
  diagnosis: string;
  medications?: any[];
  labTests?: any[];
  isActive: boolean;
}

export const PrescriptionTemplateMasterView: React.FC = () => {
  const [templates, setTemplates] = useState<PrescriptionTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    templateCode: '',
    name: '',
    icon: '🩺',
    category: 'GENERAL_MEDICINE',
    chiefComplaint: '',
    diagnosis: '',
    treatmentPlan: ''
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/company/masters/prescription-templates', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load prescription templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/company/masters/prescription-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          medications: [
            { medicineName: 'Paracetamol 650mg', dose: '1 tab', timing: 'TID (After Food)', days: '3 days' }
          ],
          labTests: ['Complete Blood Count (CBC)']
        })
      });
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: `Clinical kit "${formData.name}" added to master database!` });
        setIsModalOpen(false);
        setFormData({
          templateCode: '',
          name: '',
          icon: '🩺',
          category: 'GENERAL_MEDICINE',
          chiefComplaint: '',
          diagnosis: '',
          treatmentPlan: ''
        });
        void fetchTemplates();
      } else {
        setStatusMsg({ type: 'ERROR', text: 'Failed to create prescription template.' });
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Network error saving template.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
            Clinical Prescription Template & Protocol Kits Master
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Manage pre-configured clinical kits (Fever, Hypertension, Diabetes, Pediatrics) published across OPD desks
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          ➕ Add Clinical Prescription Kit
        </Button>
      </div>

      {statusMsg && (
        <div style={{
          backgroundColor: statusMsg.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${statusMsg.type === 'SUCCESS' ? '#10B981' : '#EF4444'}`,
          borderRadius: '8px',
          padding: '10px 14px',
          color: statusMsg.type === 'SUCCESS' ? '#A7F3D0' : '#FECACA',
          fontSize: '0.8125rem',
          fontWeight: 700
        }}>
          {statusMsg.text}
        </div>
      )}

      {isModalOpen && (
        <Card padding="md" style={{ border: '2px solid #8B5CF6', backgroundColor: '#0B132B' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, color: '#A78BFA', fontSize: '1rem', fontWeight: 800 }}>Create Specialty Clinical Protocol Kit</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Kit Name</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Acute Viral Fever Protocol" required />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Template Code</label>
                <Input value={formData.templateCode} onChange={(e) => setFormData({ ...formData, templateCode: e.target.value })} placeholder="e.g. TPL-VIRAL-01" required />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Clinical Specialty</label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={[
                    { label: 'General Medicine', value: 'GENERAL_MEDICINE' },
                    { label: 'Pediatrics', value: 'PEDIATRICS' },
                    { label: 'Cardiology', value: 'CARDIOLOGY' },
                    { label: 'Orthopedics', value: 'ORTHOPEDICS' },
                    { label: 'Dermatology', value: 'DERMATOLOGY' }
                  ]}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Primary Diagnosis</label>
                <Input value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} placeholder="e.g. Acute Upper Respiratory Tract Infection" required />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit">Save Template to Database</Button>
            </div>
          </form>
        </Card>
      )}

      <Card padding="none">
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Template Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Default Medicines</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                    No prescription kits registered yet. Click &quot;Add Clinical Prescription Kit&quot; above.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell><strong>{t.templateCode}</strong></TableCell>
                    <TableCell>{t.icon} {t.name}</TableCell>
                    <TableCell><Badge variant="primary">{t.category}</Badge></TableCell>
                    <TableCell>{t.diagnosis}</TableCell>
                    <TableCell>{Array.isArray(t.medications) ? t.medications.length : 0} items</TableCell>
                    <TableCell><Badge variant="success">ACTIVE</Badge></TableCell>
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
