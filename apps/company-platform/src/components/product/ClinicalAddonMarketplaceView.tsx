import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface ClinicalAddon {
  id: string;
  name: string;
  category: 'ICU_CRITICAL' | 'ONCOLOGY' | 'RADIOLOGY_AI' | 'NEONATAL';
  monthlyPrice: string;
  description: string;
  activeHospitals: number;
  isActivated: boolean;
}

const INITIAL_ADDONS: ClinicalAddon[] = [
  {
    id: 'ADDON-ICU-01',
    name: 'ICU Bed Real-Time Vital Telemetry Streamer',
    category: 'ICU_CRITICAL',
    monthlyPrice: '₹ 15,000 / month',
    description: 'Direct IoT streaming from Mindray / Philips patient monitors to Doctor Tablet & Central Nursing Station',
    activeHospitals: 24,
    isActivated: true
  },
  {
    id: 'ADDON-ONCO-02',
    name: 'Oncology Multi-Disciplinary Tumor Board Collaboration Suite',
    category: 'ONCOLOGY',
    monthlyPrice: '₹ 25,000 / month',
    description: 'Shared cancer case presentations, pathology slide viewer, and consensus radiation voting workspace',
    activeHospitals: 18,
    isActivated: true
  },
  {
    id: 'ADDON-RAD-03',
    name: 'AI Chest X-Ray & CT Scan Auto-Lesion Detector',
    category: 'RADIOLOGY_AI',
    monthlyPrice: '₹ 20,000 / month',
    description: 'Instant radiologist AI second-opinion for pneumonia, tuberculosis nodules, and intracranial hemorrhage',
    activeHospitals: 32,
    isActivated: false
  },
  {
    id: 'ADDON-NICU-04',
    name: 'NICU Smart Infant Incubator Sensor Sync',
    category: 'NEONATAL',
    monthlyPrice: '₹ 18,000 / month',
    description: 'Continuous temperature, phototherapy duration, and apnoea alarm routing to On-Duty Paediatrician',
    activeHospitals: 14,
    isActivated: false
  }
];

export const ClinicalAddonMarketplaceView: React.FC = () => {
  const [addons, setAddons] = useState<ClinicalAddon[]>(INITIAL_ADDONS);
  const [addonNotice, setAddonNotice] = useState<string | null>(null);

  const handleToggleAddon = (addonId: string) => {
    setAddons((prev) =>
      prev.map((a) =>
        a.id === addonId ? { ...a, isActivated: !a.isActivated } : a
      )
    );
    setAddonNotice(`✓ Clinical Add-On module "${addonId}" activation state updated for all eligible hospital contracts!`);
    setTimeout(() => setAddonNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🧩 Specialized Clinical Add-On Modules Marketplace
          </h2>
          <Badge variant="success">● Modular Hospital Add-On Ingress Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          High-margin department-specific plugins (ICU Telemetry, Tumor Board, AI Radiology) monetized on top of base SaaS subscription tiers
        </p>
      </div>

      {addonNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {addonNotice}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>ADD-ON MONTHLY REVENUE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>₹ 18.4 Lakhs / mo</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>High-margin pure software ARR</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>HOSPITALS WITH ADD-ONS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>64 Hospitals</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>42% Multi-department attachment rate</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TOP ATTACHED MODULE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>AI Radiology</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Chest X-Ray nodule detection</span>
        </div>
      </div>

      {/* Addons Table */}
      <Card title="📜 Clinical Department Add-On Marketplace" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Add-On Module & Description</TableHead>
                <TableHead>Clinical Category</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Subscribed Hospitals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{a.name}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{a.id}</span>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>{a.description}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">
                      {a.category.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#10B981' }}>
                    {a.monthlyPrice}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>
                    {a.activeHospitals} Hospital Networks
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.isActivated ? 'success' : 'neutral'}>
                      {a.isActivated ? '● ACTIVE FOR TENANTS' : '○ CATALOG DRAFT'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleAddon(a.id)}
                      style={{
                        backgroundColor: a.isActivated ? '#EF4444' : '#10B981',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {a.isActivated ? 'Deactivate' : '⚡ Activate Add-On'}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
