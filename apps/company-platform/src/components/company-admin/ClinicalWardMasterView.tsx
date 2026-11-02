import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface WardClassItem {
  id: string;
  wardCode: string;
  wardName: string;
  wardType: string;
  floorNumber: string;
  wingName: string;
  totalBeds: number;
  isOperational: boolean;
  metadata?: {
    baseDailyTariff?: number;
    nursingRatio?: string;
    hasOxygenSupply?: boolean;
    hasBipapVentilator?: boolean;
  };
}

export const ClinicalWardMasterView: React.FC = () => {
  const [wards, setWards] = useState<WardClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    wardCode: '',
    wardName: '',
    wardType: 'GENERAL',
    floorNumber: '1st Floor',
    wingName: 'East Wing',
    totalBeds: 20,
    baseDailyTariff: 1800,
    nursingRatio: '1:4',
    hasOxygenSupply: true,
    hasBipapVentilator: false
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const fetchWards = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/company/masters/ward-classes', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setWards(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchWards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/company/masters/ward-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: `Ward "${formData.wardName}" successfully added to master catalog!` });
        setIsModalOpen(false);
        setFormData({
          wardCode: '',
          wardName: '',
          wardType: 'GENERAL',
          floorNumber: '1st Floor',
          wingName: 'East Wing',
          totalBeds: 20,
          baseDailyTariff: 1800,
          nursingRatio: '1:4',
          hasOxygenSupply: true,
          hasBipapVentilator: false
        });
        void fetchWards();
      } else {
        setStatusMsg({ type: 'ERROR', text: 'Failed to create ward.' });
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Network error saving ward class.' });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
            Clinical Ward & Bed Class Master Console
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Manage universal ward classes, daily tariff benchmarks, and oxygen/ventilator specifications
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          ➕ Add Standard Ward Class
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
        <Card padding="md" style={{ border: '2px solid #3B82F6', backgroundColor: '#0B132B' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, color: '#38BDF8', fontSize: '1rem', fontWeight: 800 }}>Create New Standard Ward Class</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Ward Name</label>
                <Input value={formData.wardName} onChange={(e) => setFormData({ ...formData, wardName: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Ward Code</label>
                <Input value={formData.wardCode} onChange={(e) => setFormData({ ...formData, wardCode: e.target.value })} placeholder="e.g. ICU-01" required />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Ward Type</label>
                <Select
                  value={formData.wardType}
                  onChange={(e) => setFormData({ ...formData, wardType: e.target.value })}
                  options={[
                    { label: 'ICU / Critical Care', value: 'ICU' },
                    { label: 'General Ward', value: 'GENERAL' },
                    { label: 'Deluxe Private Suite', value: 'DELUXE' },
                    { label: 'Daycare Chemotherapy / Dialysis', value: 'DAYCARE' },
                    { label: 'Neonatal ICU (NICU)', value: 'NICU' }
                  ]}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Base Daily Tariff (₹)</label>
                <Input type="number" value={formData.baseDailyTariff} onChange={(e) => setFormData({ ...formData, baseDailyTariff: Number(e.target.value) })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total Bed Capacity</label>
                <Input type="number" value={formData.totalBeds} onChange={(e) => setFormData({ ...formData, totalBeds: Number(e.target.value) })} required />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit">Save Ward Class to PostgreSQL</Button>
            </div>
          </form>
        </Card>
      )}

      <Card padding="none">
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ward Code</TableHead>
                <TableHead>Ward Name</TableHead>
                <TableHead>Class Type</TableHead>
                <TableHead>Floor / Wing</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Base Tariff</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wards.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                    No ward classes registered yet. Click &quot;Add Standard Ward Class&quot; above to seed catalog.
                  </TableCell>
                </TableRow>
              ) : (
                wards.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell><strong>{w.wardCode}</strong></TableCell>
                    <TableCell>{w.wardName}</TableCell>
                    <TableCell><Badge variant="primary">{w.wardType}</Badge></TableCell>
                    <TableCell>{w.floorNumber} ({w.wingName})</TableCell>
                    <TableCell>{w.totalBeds} Beds</TableCell>
                    <TableCell>₹{w.metadata?.baseDailyTariff?.toLocaleString() || '1,500'} / day</TableCell>
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
