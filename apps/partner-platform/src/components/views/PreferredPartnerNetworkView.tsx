import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import {
  partnerFoundationService,
  type ClinicPreferredPartnersDto,
  type PreferredPartnerDto
} from '../../services/partner-foundation-service.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface PartnerDispatchRecord {
  id: string;
  uhid: string;
  patientName: string;
  patientMobile: string;
  orderType: 'LAB_INVESTIGATION' | 'PHARMACY_RX';
  partnerName: string;
  partnerType: 'PATHOLOGY' | 'PHARMACY';
  itemsSummary: string;
  status: 'DISPATCHED' | 'SAMPLE_COLLECTED' | 'REPORT_VERIFIED' | 'DISPENSED' | 'COMPLETED';
  dispatchedAt: string;
  completedAt?: string;
  verifiedBy?: string;
}

export const MOCK_DISPATCH_RECORDS: PartnerDispatchRecord[] = [
  {
    id: 'disp-001',
    uhid: 'UHID-2026-9812',
    patientName: 'Ramesh Kumar',
    patientMobile: '9876543210',
    orderType: 'LAB_INVESTIGATION',
    partnerName: 'Shree Ram Diagnostics & Pathology',
    partnerType: 'PATHOLOGY',
    itemsSummary: 'CBC, Thyroid Profile (T3, T4, TSH), HbA1c',
    status: 'REPORT_VERIFIED',
    dispatchedAt: '10:15 AM',
    completedAt: '10:42 AM',
    verifiedBy: 'Dr. S. K. Verma (Pathologist, NABL)'
  },
  {
    id: 'disp-002',
    uhid: 'UHID-2026-9812',
    patientName: 'Ramesh Kumar',
    patientMobile: '9876543210',
    orderType: 'PHARMACY_RX',
    partnerName: 'City Medicos & Chemist POS',
    partnerType: 'PHARMACY',
    itemsSummary: 'Thyroxine 50mcg, Shelcal 500, Metformin 500mg',
    status: 'DISPENSED',
    dispatchedAt: '10:48 AM',
    completedAt: '10:55 AM'
  },
  {
    id: 'disp-003',
    uhid: 'UHID-2026-9813',
    patientName: 'Sunita Devi',
    patientMobile: '9835012345',
    orderType: 'LAB_INVESTIGATION',
    partnerName: 'Shree Ram Diagnostics & Pathology',
    partnerType: 'PATHOLOGY',
    itemsSummary: 'Urine Routine & Microscopic, KFT',
    status: 'SAMPLE_COLLECTED',
    dispatchedAt: '11:10 AM'
  },
  {
    id: 'disp-004',
    uhid: 'UHID-2026-9814',
    patientName: 'Anil Verma',
    patientMobile: '9431098765',
    orderType: 'PHARMACY_RX',
    partnerName: 'City Medicos & Chemist POS',
    partnerType: 'PHARMACY',
    itemsSummary: 'Paracetamol 650 TDS, Pantoprazole 40 OD',
    status: 'DISPATCHED',
    dispatchedAt: '11:20 AM'
  }
];

export interface PreferredPartnerNetworkViewProps {
  tenantId?: string;
  clinicId?: string;
  onNavigateToOpd?: () => void;
}

export const PreferredPartnerNetworkView: React.FC<PreferredPartnerNetworkViewProps> = ({
  clinicId = 'default-clinic',
  onNavigateToOpd
}) => {
  const [preferredPartners, setPreferredPartnersState] = useState<ClinicPreferredPartnersDto>(() =>
    partnerFoundationService.getPreferredPartners(clinicId)
  );

  const [dispatchRecords, setDispatchRecords] = useState<PartnerDispatchRecord[]>(MOCK_DISPATCH_RECORDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Switch / Edit Partner Modal States
  const [isEditLabOpen, setIsEditLabOpen] = useState(false);
  const [isEditPharmacyOpen, setIsEditPharmacyOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Form Inputs for Lab
  const [labName, setLabName] = useState(preferredPartners.exclusiveLab?.partnerName || '');
  const [labCode, setLabCode] = useState(preferredPartners.exclusiveLab?.partnerCode || '');
  const [labPhone, setLabPhone] = useState(preferredPartners.exclusiveLab?.phone || '');
  const [labAddress, setLabAddress] = useState(preferredPartners.exclusiveLab?.address || '');

  // Form Inputs for Pharmacy
  const [pharmName, setPharmName] = useState(preferredPartners.exclusivePharmacy?.partnerName || '');
  const [pharmCode, setPharmCode] = useState(preferredPartners.exclusivePharmacy?.partnerCode || '');
  const [pharmPhone, setPharmPhone] = useState(preferredPartners.exclusivePharmacy?.phone || '');
  const [pharmAddress, setPharmAddress] = useState(preferredPartners.exclusivePharmacy?.address || '');

  // Auto-routing toggles
  const [autoRouteLab, setAutoRouteLab] = useState(true);
  const [autoRoutePharmacy, setAutoRoutePharmacy] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handleSync = () => {
      const updated = partnerFoundationService.getPreferredPartners(clinicId);
      setPreferredPartnersState(updated);
      if (updated.exclusiveLab) {
        setLabName(updated.exclusiveLab.partnerName || '');
        setLabCode(updated.exclusiveLab.partnerCode || '');
        setLabPhone(updated.exclusiveLab.phone || '');
        setLabAddress(updated.exclusiveLab.address || '');
      }
      if (updated.exclusivePharmacy) {
        setPharmName(updated.exclusivePharmacy.partnerName || '');
        setPharmCode(updated.exclusivePharmacy.partnerCode || '');
        setPharmPhone(updated.exclusivePharmacy.phone || '');
        setPharmAddress(updated.exclusivePharmacy.address || '');
      }
    };

    const unsub = hospitalEventBus.subscribe('PARTNER_INVITATION_ACCEPTED', (payload) => {
      handleSync();
      showToast(`🤝 Handshake Verified! ${payload.data?.partnerDetails?.partnerName || 'Partner'} confirmed tie-up.`);
    });

    window.addEventListener('docsearch_partner_links_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      unsub();
      window.removeEventListener('docsearch_partner_links_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [clinicId]);

  const handleSaveLab = () => {
    const updatedLab: PreferredPartnerDto = {
      partnerId: preferredPartners.exclusiveLab?.partnerId || `lab-${Date.now()}`,
      partnerName: labName.trim() || 'Preferred Diagnostic Centre',
      partnerType: 'PATHOLOGY',
      partnerCode: labCode.trim() || 'LAB-CUSTOM-01',
      phone: labPhone.trim(),
      address: labAddress.trim(),
      status: 'LINKED',
      linkedAt: new Date().toISOString()
    };
    const updated = partnerFoundationService.setPreferredPartners(clinicId, { exclusiveLab: updatedLab });
    setPreferredPartnersState(updated);
    setIsEditLabOpen(false);
    showToast(`✓ Exclusive Pathology Partner linked: ${updatedLab.partnerName}`);
  };

  const handleSavePharmacy = () => {
    const updatedPharm: PreferredPartnerDto = {
      partnerId: preferredPartners.exclusivePharmacy?.partnerId || `pharm-${Date.now()}`,
      partnerName: pharmName.trim() || 'Preferred Chemist & Pharmacy',
      partnerType: 'PHARMACY',
      partnerCode: pharmCode.trim() || 'PHARM-CUSTOM-01',
      phone: pharmPhone.trim(),
      address: pharmAddress.trim(),
      status: 'LINKED',
      linkedAt: new Date().toISOString()
    };
    const updated = partnerFoundationService.setPreferredPartners(clinicId, { exclusivePharmacy: updatedPharm });
    setPreferredPartnersState(updated);
    setIsEditPharmacyOpen(false);
    showToast(`✓ Exclusive Pharmacy Partner linked: ${updatedPharm.partnerName}`);
  };

  // Trigger Real-Time Loop Simulation
  const handleSimulateFullLoop = () => {
    // 1. Dispatch lab order
    const simUhid = `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLabOrder: PartnerDispatchRecord = {
      id: `disp-${Date.now()}`,
      uhid: simUhid,
      patientName: 'Kavita Singh',
      patientMobile: '9876500112',
      orderType: 'LAB_INVESTIGATION',
      partnerName: preferredPartners.exclusiveLab?.partnerName || 'Shree Ram Pathology',
      partnerType: 'PATHOLOGY',
      itemsSummary: 'Thyroid Profile, Complete Blood Count (CBC)',
      status: 'DISPATCHED',
      dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDispatchRecords((prev) => [newLabOrder, ...prev]);
    showToast(`🚀 Digital Requisition dispatched to ${preferredPartners.exclusiveLab?.partnerName} for Kavita Singh`);

    // 2. Simulate lab test completion & report loop-back after 2.5s
    setTimeout(() => {
      setDispatchRecords((prev) =>
        prev.map((r) =>
          r.id === newLabOrder.id
            ? {
                ...r,
                status: 'REPORT_VERIFIED',
                completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                verifiedBy: 'Dr. S. K. Verma (Pathologist, NABL)'
              }
            : r
        )
      );

      // Emit real-time alert to doctor desk
      hospitalEventBus.publish(
        'LAB_REPORT_COMPLETED',
        'EXCLUSIVE_PARTNER_LAB',
        {
          uhid: simUhid,
          patientName: 'Kavita Singh',
          partnerName: preferredPartners.exclusiveLab?.partnerName,
          tests: 'Thyroid Profile, CBC',
          verifiedAt: new Date().toLocaleTimeString()
        },
        `🔔 Lab Report Ready for Kavita Singh (${simUhid}) from ${preferredPartners.exclusiveLab?.partnerName}`
      );

      showToast(`🔔 ALERT LOOP-BACK: Lab Report verified by ${preferredPartners.exclusiveLab?.partnerName} and loaded on Doctor Desk!`);
    }, 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: 'var(--ds-color-surface, #0f172a)',
          color: '#38bdf8',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          fontWeight: 600
        }}>
          ✨ {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.5rem',
        backgroundColor: 'var(--ds-color-surface, #121826)',
        borderRadius: '12px',
        border: '1px solid var(--ds-color-border, #1e293b)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🤝</span>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
              Solo Clinic Preferred Partner Network (Exclusive Tie-Ups)
            </h1>
            <Badge variant="success">Active Encrypted Bridge</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
            Assign and manage your exclusive pathology laboratory and chemist store for seamless digital dispatch and automated report loop-back.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {onNavigateToOpd && (
            <Button variant="outline" onClick={onNavigateToOpd}>
              ⚡ Go to 1-Flow OPD
            </Button>
          )}
          <Button variant="outline" onClick={handleSimulateFullLoop}>
            ⚡ Test Live Closed-Loop Pipeline
          </Button>
          <Button variant="primary" onClick={() => setIsInviteModalOpen(true)}>
            + Invite New Partner
          </Button>
        </div>
      </div>

      {/* 2 Main Partner Cards: Pathology & Pharmacy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Card 1: Exclusive Pathology Partner */}
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                🔬
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Exclusive Pathology Partner
                </span>
                <h2 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                  {preferredPartners.exclusiveLab?.partnerName || 'No Partner Assigned'}
                </h2>
              </div>
            </div>

            <Badge variant="success">● Connected</Badge>
          </div>

          <div style={{
            backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--ds-color-border, #334155)',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Partner Code:</span>
              <strong>{preferredPartners.exclusiveLab?.partnerCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Contact Phone:</span>
              <span>{preferredPartners.exclusiveLab?.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Facility Address:</span>
              <span>{preferredPartners.exclusiveLab?.address}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Average Report TAT:</span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>⚡ 35-45 Minutes</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRouteLab}
                onChange={(e) => setAutoRouteLab(e.target.checked)}
              />
              <span>Auto-route all OPD lab orders to this partner</span>
            </label>

            <Button variant="outline" onClick={() => setIsEditLabOpen(true)}>
              ✏️ Change Lab Partner
            </Button>
          </div>
        </Card>

        {/* Card 2: Exclusive Pharmacy Partner */}
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: 'rgba(22, 163, 74, 0.15)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                💊
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Exclusive Pharmacy Partner
                </span>
                <h2 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
                  {preferredPartners.exclusivePharmacy?.partnerName || 'No Partner Assigned'}
                </h2>
              </div>
            </div>

            <Badge variant="success">● Connected</Badge>
          </div>

          <div style={{
            backgroundColor: 'var(--ds-color-surface-subtle, #1a2234)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--ds-color-border, #334155)',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Partner Code:</span>
              <strong>{preferredPartners.exclusivePharmacy?.partnerCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Contact Phone:</span>
              <span>{preferredPartners.exclusivePharmacy?.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Premises Address:</span>
              <span>{preferredPartners.exclusivePharmacy?.address}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-secondary, #94a3b8)' }}>Dispensing Status:</span>
              <span style={{ color: '#0284c7', fontWeight: 600 }}>🛒 1-Click POS Import Ready</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRoutePharmacy}
                onChange={(e) => setAutoRoutePharmacy(e.target.checked)}
              />
              <span>Auto-dispatch digital Rx to this chemist</span>
            </label>

            <Button variant="outline" onClick={() => setIsEditPharmacyOpen(true)}>
              ✏️ Change Pharmacy Partner
            </Button>
          </div>
        </Card>
      </div>

      {/* Closed-Loop Dispatch Register (Telemetry & Tracking) */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
              📡 Live Partner Dispatch & Report Return Stream
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #94a3b8)' }}>
              Encrypted bidirectional transaction log connecting Dr. Sharma Clinic with assigned partners.
            </span>
          </div>

          <Badge variant="info">
            {dispatchRecords.length} Transactions Today
          </Badge>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UHID & Patient</TableHead>
                <TableHead>Order Type</TableHead>
                <TableHead>Assigned Partner</TableHead>
                <TableHead>Ordered Requisition / Rx</TableHead>
                <TableHead>Dispatched At</TableHead>
                <TableHead>Loop Status</TableHead>
                <TableHead>Verification / Fulfillment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatchRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong>{r.patientName}</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      {r.uhid} · {r.patientMobile}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.orderType === 'LAB_INVESTIGATION' ? 'primary' : 'success'}>
                      {r.orderType === 'LAB_INVESTIGATION' ? '🔬 Lab Tests' : '💊 Pharmacy Rx'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <strong>{r.partnerName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {r.itemsSummary}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {r.dispatchedAt}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === 'REPORT_VERIFIED' || r.status === 'DISPENSED'
                          ? 'success'
                          : r.status === 'SAMPLE_COLLECTED'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {r.status === 'REPORT_VERIFIED' ? '✓ Report Verified' : r.status === 'DISPENSED' ? '✓ Dispensed' : r.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {r.verifiedBy || (r.completedAt ? `Completed at ${r.completedAt}` : 'In-Process')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal: Change Lab Partner */}
      {isEditLabOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: 'var(--ds-color-surface, #121826)', color: 'var(--ds-color-text-primary, #f8fafc)', border: '1px solid var(--ds-color-border, #334155)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
              🔬 Assign Exclusive Pathology Lab
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Laboratory Legal Name *
                </label>
                <Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="e.g. Shree Ram Diagnostics & Pathology" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Partner Code / DocSearch ID *
                </label>
                <Input value={labCode} onChange={(e) => setLabCode(e.target.value)} placeholder="e.g. LAB-SHREE-RAM-01" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Contact Phone
                </label>
                <Input value={labPhone} onChange={(e) => setLabPhone(e.target.value)} placeholder="+91 98350 11223" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Premises Address
                </label>
                <Input value={labAddress} onChange={(e) => setLabAddress(e.target.value)} placeholder="Opposite Sadar Hospital" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button variant="outline" onClick={() => setIsEditLabOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveLab}>
                Save & Establish Digital Bridge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Pharmacy Partner */}
      {isEditPharmacyOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: 'var(--ds-color-surface, #121826)', color: 'var(--ds-color-text-primary, #f8fafc)', border: '1px solid var(--ds-color-border, #334155)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
              💊 Assign Exclusive Chemist / Pharmacy
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Chemist Store Legal Name *
                </label>
                <Input value={pharmName} onChange={(e) => setPharmName(e.target.value)} placeholder="e.g. City Medicos & Chemist POS" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Partner Code / DocSearch ID *
                </label>
                <Input value={pharmCode} onChange={(e) => setPharmCode(e.target.value)} placeholder="e.g. PHARM-CITY-MED-01" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Contact Phone
                </label>
                <Input value={pharmPhone} onChange={(e) => setPharmPhone(e.target.value)} placeholder="+91 94310 99887" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Premises Address
                </label>
                <Input value={pharmAddress} onChange={(e) => setPharmAddress(e.target.value)} placeholder="Shop #4, Metro Complex" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button variant="outline" onClick={() => setIsEditPharmacyOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSavePharmacy}>
                Save & Establish Digital Bridge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Invite New Partner */}
      {isInviteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: 'var(--ds-color-surface, #121826)', color: 'var(--ds-color-text-primary, #f8fafc)', border: '1px solid var(--ds-color-border, #334155)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>📩</span>
            <h2 style={{ margin: '8px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
              Invite Nearby Chemist or Lab
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary, #94a3b8)', marginBottom: '16px' }}>
              Send an instant WhatsApp invite with your Clinic Partner Code to establish a digital tie-up.
            </p>

            <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.12)', padding: '12px', borderRadius: '8px', border: '1px dashed #0284c7', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Your Clinic Tie-Up Invitation Code:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', letterSpacing: '0.05em' }}>
                CLINIC-SHARMA-2026
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  showToast('📱 Invitation link copied & sent via WhatsApp');
                  setIsInviteModalOpen(false);
                }}
              >
                📱 Share via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
