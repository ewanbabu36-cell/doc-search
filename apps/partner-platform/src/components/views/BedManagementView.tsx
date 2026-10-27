import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '@docsearch/ui-kit';
import type { InpatientBedDto, InpatientWardDto, InpatientAdmissionRequestDto } from '@docsearch/api-contracts';
import { PrintableBedsideQrCardModal } from '../dialogs/PrintableBedsideQrCardModal.js';

export interface BedManagementViewProps {
  beds: InpatientBedDto[];
  wards: InpatientWardDto[];
  onOpenCreateBed: () => void;
  onOpenEditBed: (bed: InpatientBedDto) => void;
  onOpenBlockBed: (bed: InpatientBedDto) => void;
  onOpenReserveBed: (bed: InpatientBedDto) => void;
  onOpenReleaseBed: (bed: InpatientBedDto) => void;
  onOpenQuickAdmit?: (bed: InpatientBedDto) => void;
  onCompleteCleaning?: (bed: InpatientBedDto) => void;
  onSelectBed?: (bed: InpatientBedDto) => void;
  requests?: InpatientAdmissionRequestDto[];
  admissionRequests?: InpatientAdmissionRequestDto[];
  onAllocateBedRequest?: (req: InpatientAdmissionRequestDto) => void;
  facilityName?: string | undefined;
}

export const BedManagementView: React.FC<BedManagementViewProps> = ({
  beds = [],
  wards = [],
  requests = [],
  admissionRequests = [],
  onOpenCreateBed,
  onOpenEditBed,
  onOpenBlockBed,
  onOpenReserveBed,
  onOpenReleaseBed,
  onOpenQuickAdmit,
  onCompleteCleaning,
  onSelectBed,
  onAllocateBedRequest,
  facilityName
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'BED_CENSUS' | 'WARD_CONFIGURATOR' | 'OT_SCHEDULER'>('BED_CENSUS');
  const [selectedWard, setSelectedWard] = useState('ALL');

  // Dynamic Ward Configurator State
  const [customWards, setCustomWards] = useState<Array<{
    id: string;
    wardName: string;
    wardType: string;
    floor: string;
    totalBeds: number;
    baseTariffInr: number;
    equipmentTags: string[];
  }>>([
    {
      id: 'WARD-ICU-01',
      wardName: 'Medical Intensive Care Unit (MICU)',
      wardType: 'ICU',
      floor: '3rd Floor - Critical Wing',
      totalBeds: 12,
      baseTariffInr: 6500,
      equipmentTags: ['Central O2 Pipeline', 'Dedicated Ventilator / BiPAP', '7-Para Cardiac Monitor', '5-Function Motorized Cot']
    },
    {
      id: 'WARD-NICU-01',
      wardName: 'Neonatal Intensive Care Unit (NICU)',
      wardType: 'NICU',
      floor: '2nd Floor - Maternity Wing',
      totalBeds: 8,
      baseTariffInr: 5800,
      equipmentTags: ['Central O2 Pipeline', 'Infant Radiant Warmer', 'LED Phototherapy Unit', 'Neonatal Monitor']
    },
    {
      id: 'WARD-GEN-01',
      wardName: 'General Inpatient Ward (Male)',
      wardType: 'GENERAL',
      floor: '1st Floor - East Wing',
      totalBeds: 24,
      baseTariffInr: 1200,
      equipmentTags: ['Central O2 Pipeline', 'Semi-Fowler Bed', 'Nurse Call Bell']
    },
    {
      id: 'WARD-DLX-01',
      wardName: 'Deluxe Private Suite Ward',
      wardType: 'DELUXE',
      floor: '4th Floor - Executive Wing',
      totalBeds: 10,
      baseTariffInr: 4500,
      equipmentTags: ['Central O2 Pipeline', 'Motorized Cot', 'Attendant Recliner Sofa', 'Multipara Monitor']
    },
    {
      id: 'WARD-ISO-01',
      wardName: 'Negative-Pressure Airborne Isolation Ward',
      wardType: 'ISOLATION',
      floor: 'Ground Floor - Infectious Wing',
      totalBeds: 6,
      baseTariffInr: 7200,
      equipmentTags: ['HEPA Air Filter Negative Pressure', 'Central O2 Pipeline', 'Dedicated Ventilator', 'Isolation Anteroom']
    }
  ]);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);
  const [newWardName, setNewWardName] = useState('');
  const [newWardType, setNewWardType] = useState('ICU');
  const [newWardFloor, setNewWardFloor] = useState('2nd Floor');
  const [newWardBeds, setNewWardBeds] = useState(10);
  const [newWardTariff, setNewWardTariff] = useState(3500);
  const [newWardTags] = useState<string[]>(['Central O2 Pipeline', '7-Para Cardiac Monitor']);

  // OT & Cath-Lab Sterilization Scheduler State
  const [otMaintenanceSchedules, setOtMaintenanceSchedules] = useState<Array<{
    id: string;
    roomName: string;
    roomType: 'OT' | 'CATH_LAB';
    maintenanceType: 'WEEKLY_FUMIGATION' | 'BIOMEDICAL_CALIBRATION' | 'HEPA_FILTER_AIR_CHANGE';
    scheduledDate: string;
    timeWindow: string;
    engineerName: string;
    infectionControlSignoff: boolean;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'CERTIFIED';
  }>>([
    {
      id: 'OT-CAL-001',
      roomName: 'Operation Theatre 1 (Cardiothoracic & Neuro)',
      roomType: 'OT',
      maintenanceType: 'WEEKLY_FUMIGATION',
      scheduledDate: 'Every Sunday',
      timeWindow: '22:00 – 06:00 (8 hrs Blockout)',
      engineerName: 'Vikas Sharma (Biomedical Lead)',
      infectionControlSignoff: true,
      status: 'SCHEDULED'
    },
    {
      id: 'OT-CAL-002',
      roomName: 'Cath-Lab Suite 1 (Siemens Artis Q)',
      roomType: 'CATH_LAB',
      maintenanceType: 'BIOMEDICAL_CALIBRATION',
      scheduledDate: '28 Oct 2026',
      timeWindow: '19:00 – 23:00 (4 hrs Blockout)',
      engineerName: 'Siemens Healthineers Field Service',
      infectionControlSignoff: true,
      status: 'SCHEDULED'
    },
    {
      id: 'OT-CAL-003',
      roomName: 'Operation Theatre 2 (Orthopedics & Joint)',
      roomType: 'OT',
      maintenanceType: 'HEPA_FILTER_AIR_CHANGE',
      scheduledDate: '29 Oct 2026',
      timeWindow: '20:00 – 02:00 (6 hrs Blockout)',
      engineerName: 'HVAC Air Systems Engineering',
      infectionControlSignoff: false,
      status: 'SCHEDULED'
    }
  ]);
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [otRoomName, setOtRoomName] = useState('Operation Theatre 3 (Laparoscopy)');
  const [otMaintType, setOtMaintType] = useState<'WEEKLY_FUMIGATION' | 'BIOMEDICAL_CALIBRATION' | 'HEPA_FILTER_AIR_CHANGE'>('WEEKLY_FUMIGATION');
  const [otDate, setOtDate] = useState('30 Oct 2026');
  const [otTime, setOtTime] = useState('22:00 – 04:00 (6 hrs)');
  const [otEngineer, setOtEngineer] = useState('Vikas Sharma');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBedForQr, setSelectedBedForQr] = useState<InpatientBedDto | null>(null);

  const safeBeds = Array.isArray(beds) ? beds : [];
  const safeWards = Array.isArray(wards) ? wards : [];
  const rawRequests = (admissionRequests && admissionRequests.length > 0) ? admissionRequests : requests;
  const safeRequests = Array.isArray(rawRequests) ? rawRequests : [];
  const pendingRequests = safeRequests.filter(
    (r) => r && (String(r.status) === 'PENDING' || r.status === 'SUBMITTED' || r.status === 'BED_PENDING' || r.status === 'UNDER_REVIEW' || !r.status)
  );

  const filtered = safeBeds.filter((b) => {
    if (!b) return false;
    const matchWard = selectedWard === 'ALL' || b.wardId === selectedWard;
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const bedCodeStr = (b.bedCode || '').toLowerCase();
    const patientNameStr = (b.currentPatientName || '').toLowerCase();
    const searchLower = (searchTerm || '').toLowerCase();
    const matchSearch = bedCodeStr.includes(searchLower) || patientNameStr.includes(searchLower);
    return matchWard && matchStatus && matchSearch;
  });

  const availableCount = safeBeds.filter((b) => b?.status === 'AVAILABLE').length;
  const occupiedCount = safeBeds.filter((b) => b?.status === 'OCCUPIED').length;
  const cleaningCount = safeBeds.filter((b) => b?.status === 'CLEANING').length;
  const blockedCount = safeBeds.filter((b) => b?.status === 'BLOCKED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 3 Infrastructure Pillar Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'BED_CENSUS' as const, label: `🛏️ Live Ward & Bed Census (${safeBeds.length})`, icon: '🛏️' },
          { id: 'WARD_CONFIGURATOR' as const, label: `🏛️ Dynamic Ward & Floorplan Configurator (${customWards.length})`, icon: '🏛️' },
          { id: 'OT_SCHEDULER' as const, label: `🔬 OT & Cath-Lab Sterilization & Calibration (${otMaintenanceSchedules.length})`, icon: '🔬' }
        ].map((tab) => {
          const isSelected = activeViewMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveViewMode(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 800 : 600,
                backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isSelected ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
              Visual Ward & Bed Master Board
            </h2>
            <span style={{ backgroundColor: '#10B981', color: '#064E3B', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
              1-CLICK ACTIONS
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Directly admit patients to available beds, release beds upon discharge, and complete sanitization in 1-click.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateBed}>+ Register Bed</Button>
      </div>

      {activeViewMode === 'BED_CENSUS' && (
        <>
        {/* Real-time Facility Occupancy Summary Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem',
        backgroundColor: 'var(--ds-color-surface, #0f172a)',
        border: '1px solid var(--ds-color-border, #334155)',
        borderRadius: '10px',
        padding: '10px 16px'
      }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Licensed</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #f8fafc)' }}>{safeBeds.length} Beds</div>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#16a34a', textTransform: 'uppercase' }}>🟢 Available</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{availableCount} Vacant</div>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#2563eb', textTransform: 'uppercase' }}>🔴 Occupied</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{occupiedCount} Patients</div>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#d97706', textTransform: 'uppercase' }}>🟡 Sanitizing</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{cleaningCount} Cleaning</div>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#a78bfa', textTransform: 'uppercase' }}>Occupancy Rate</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a78bfa' }}>
            {safeBeds.length > 0 ? Math.round((occupiedCount / safeBeds.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Active Stat Admission Orders from OPD Cockpit */}
      {pendingRequests.length > 0 && (
        <div
          data-testid="admission-requisitions-banner"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🚨</span>
              <div>
                <strong style={{ fontSize: '1rem', color: '#F87171' }}>
                  Active Admission Requisitions from Doctor OPD Cockpit ({pendingRequests.length} Pending)
                </strong>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                  Stat IPD admission orders dispatched from physician chambers awaiting bedside allocation.
                </p>
              </div>
            </div>
            <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px' }}>
              OPD DISPATCH ACTIVE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {pendingRequests.map((req) => (
              <Card
                key={req.id}
                data-testid={`admission-requisition-card-${req.id}`}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#F8FAFC' }}>
                    👤 {req.patientName || 'Emergency Patient'}
                  </strong>
                  <Badge variant={req.priority === 'EMERGENCY' ? 'danger' : 'warning'}>
                    {req.priority || 'EMERGENCY'}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  MRN/Token: <span style={{ color: '#38BDF8', fontWeight: 700 }}>{req.patientMrn || (req as any).tokenNumber || 'STAT'}</span>
                  {' • '}Target: <strong style={{ color: '#E2E8F0' }}>{(req as any).targetWard || req.requestedWardType || 'ICU'}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '6px' }}>
                  <strong>Dx:</strong> {req.provisionalDiagnosis || 'Acute clinical indication requiring bed'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    data-testid={`allocate-bed-btn-${req.id}`}
                    onClick={() => onAllocateBedRequest && onAllocateBedRequest(req)}
                    style={{
                      backgroundColor: '#10B981',
                      borderColor: '#10B981',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🛏️</span>
                    <span>Allocate Bed</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ward Department Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setSelectedWard('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: selectedWard === 'ALL' ? '2px solid #38bdf8' : '1px solid var(--ds-color-border, #334155)',
            backgroundColor: selectedWard === 'ALL' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: selectedWard === 'ALL' ? '#38bdf8' : 'var(--ds-color-text-secondary, #94a3b8)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          🏥 All Wards ({safeBeds.length})
        </button>
        {safeWards.map((w) => {
          const wardBedCount = safeBeds.filter((b) => b.wardId === w.id).length;
          const isSelected = selectedWard === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setSelectedWard(w.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: isSelected ? '2px solid #38bdf8' : '1px solid var(--ds-color-border, #334155)',
                backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: isSelected ? '#38bdf8' : 'var(--ds-color-text-secondary, #94a3b8)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {w.wardName} ({wardBedCount})
            </button>
          );
        })}
      </div>

      {/* Quick Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setStatusFilter('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'ALL' ? '2px solid #0284C7' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'ALL' ? '#E0F2FE' : '#FFFFFF',
            color: statusFilter === 'ALL' ? '#0369A1' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          All Beds ({safeBeds.length})
        </button>
        <button
          onClick={() => setStatusFilter('AVAILABLE')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'AVAILABLE' ? '2px solid #16A34A' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'AVAILABLE' ? '#DCFCE7' : '#FFFFFF',
            color: statusFilter === 'AVAILABLE' ? '#15803D' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          ✅ Available ({availableCount})
        </button>
        <button
          onClick={() => setStatusFilter('OCCUPIED')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'OCCUPIED' ? '2px solid #2563EB' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'OCCUPIED' ? '#DBEAFE' : '#FFFFFF',
            color: statusFilter === 'OCCUPIED' ? '#1D4ED8' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          👤 Occupied ({occupiedCount})
        </button>
        <button
          onClick={() => setStatusFilter('CLEANING')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'CLEANING' ? '2px solid #D97706' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'CLEANING' ? '#FEF3C7' : '#FFFFFF',
            color: statusFilter === 'CLEANING' ? '#B45309' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          🧹 Cleaning ({cleaningCount})
        </button>
        <button
          onClick={() => setStatusFilter('BLOCKED')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'BLOCKED' ? '2px solid #DC2626' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'BLOCKED' ? '#FEE2E2' : '#FFFFFF',
            color: statusFilter === 'BLOCKED' ? '#B91C1C' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          ⚠️ Maintenance Block ({blockedCount})
        </button>
      </div>

      <Card style={{ padding: '0.85rem 1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px' }}>
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="🔍 Search bed code or patient name..." />
        </div>
        <div style={{ width: '220px' }}>
          <Select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            options={[{ value: 'ALL', label: 'All Wards' }, ...safeWards.map((w) => ({ value: w?.id || '', label: w?.wardName || 'Ward' }))]}
          />
        </div>
      </Card>

      {/* Bed Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
        {filtered.map((bed) => (
          <Card
            key={bed.id}
            style={{
              padding: '1rem',
              borderTop: `4px solid ${
                bed.status === 'AVAILABLE' ? '#16a34a' :
                bed.status === 'OCCUPIED' ? '#2563eb' :
                bed.status === 'CLEANING' ? '#ca8a04' : '#dc2626'
              }`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🛏️</span>
                <strong
                  className="truncate"
                  style={{
                    fontSize: '1.15rem',
                    color: 'var(--ds-color-text-primary, #f8fafc)',
                    fontWeight: 800,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                  title={bed.bedCode}
                >
                  {bed.bedCode}
                </strong>
              </div>
              <Badge variant={bed.status === 'AVAILABLE' ? 'success' : bed.status === 'OCCUPIED' ? 'neutral' : bed.status === 'CLEANING' ? 'warning' : 'danger'}>
                {bed.status === 'AVAILABLE' ? 'Available' : bed.status === 'OCCUPIED' ? 'Occupied' : bed.status === 'CLEANING' ? 'Cleaning' : 'Blocked'}
              </Badge>
            </div>

            <div
              className="truncate"
              style={{
                fontSize: '0.8rem',
                color: 'var(--ds-color-text-muted, #94a3b8)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
              title={`${bed.wardName || 'Ward'} • ${bed.bedClass || 'Standard'}`}
            >
              {bed.wardName} • {bed.bedClass}
            </div>

            <div style={{ margin: '0.6rem 0', fontSize: '0.85rem', minHeight: '36px' }}>
              {bed.status === 'OCCUPIED' && (
                <div style={{ backgroundColor: 'var(--ds-color-surface-subtle, #182234)', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))', borderRadius: '6px', padding: '6px 10px', minWidth: 0, overflow: 'hidden' }}>
                  <div
                    className="truncate"
                    style={{
                      color: 'var(--ds-color-accent, #38bdf8)',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      display: 'block'
                    }}
                    title={bed.currentPatientName || 'Patient Admitted'}
                  >
                    👤 {bed.currentPatientName || 'Patient Admitted'}
                  </div>
                  <div
                    className="truncate"
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--ds-color-text-secondary, #cbd5e1)',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    MRN: {bed.currentPatientMrn || 'N/A'}
                  </div>
                </div>
              )}
              {bed.status === 'AVAILABLE' && (
                <div style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>✅</span> Ready for new admission (₹{bed.dailyChargeRate || 1800}/day)
                </div>
              )}
              {bed.status === 'CLEANING' && (
                <div style={{ color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🧹</span> Sanitization & linen change in progress
                </div>
              )}
              {bed.status === 'BLOCKED' && (
                <div style={{ color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {bed.notes || 'Maintenance / Isolation Block'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {/* AVAILABLE BED: Direct Quick Admit button */}
              {bed.status === 'AVAILABLE' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenQuickAdmit ? onOpenQuickAdmit(bed) : onOpenReserveBed(bed)}
                    style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 }}
                  >
                    + Admit Patient
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenReserveBed(bed)}>Reserve</Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenBlockBed(bed)}>Block</Button>
                </>
              )}

              {/* OCCUPIED BED: Bedside Concierge QR & 1-Click Release Bed */}
              {bed.status === 'OCCUPIED' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBedForQr(bed)}
                    style={{ borderColor: '#6366F1', color: '#818CF8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Generate Bedside Patient Concierge QR Standee"
                  >
                    <span>📱</span>
                    <span>Bedside QR</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenReleaseBed(bed)}
                    style={{ borderColor: '#EF4444', color: '#DC2626', fontWeight: 600 }}
                  >
                    🚪 Release Bed
                  </Button>
                </>
              )}

              {/* CLEANING BED: 1-Click Mark Cleaned */}
              {bed.status === 'CLEANING' && onCompleteCleaning && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onCompleteCleaning(bed)}
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontWeight: 700 }}
                >
                  ✅ Sanitized & Ready
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={() => onOpenEditBed(bed)}>Edit</Button>
              {onSelectBed && (
                <Button variant="outline" size="sm" onClick={() => onSelectBed(bed)}>Details</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      
        </>
      )}

      {/* PILLAR 4: Dynamic Ward & Floorplan Configurator */}
      {activeViewMode === 'WARD_CONFIGURATOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                Inpatient Wards & Bed Equipment Master
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                Configure clinical wards, bed capacity, daily base tariff, and tagged biomedical life-support equipment.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddWardModalOpen(true)}
              style={{ backgroundColor: '#0284C7', fontWeight: 800 }}
            >
              ➕ Register Inpatient Ward
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {customWards.map((w) => (
              <Card
                key={w.id}
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {w.wardType === 'ICU' ? '🚨' : w.wardType === 'NICU' ? '👶' : w.wardType === 'DELUXE' ? '🌟' : w.wardType === 'ISOLATION' ? '☣️' : '🏥'}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                        {w.wardName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        {w.floor} • ID: {w.id}
                      </div>
                    </div>
                  </div>
                  <Badge variant={w.wardType === 'ICU' || w.wardType === 'ISOLATION' ? 'danger' : 'primary'}>
                    {w.wardType}
                  </Badge>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>CAPACITY</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8' }}>{w.totalBeds} Licensed Beds</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>BASE TARIFF</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981' }}>₹{w.baseTariffInr.toLocaleString('en-IN')}/day</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                    TAGGED BED EQUIPMENT & LIFE-SUPPORT:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {w.equipmentTags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          color: '#38BDF8',
                          border: '1px solid rgba(56, 189, 248, 0.25)'
                        }}
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PILLAR 4: OT & Cath-Lab Sterilization Scheduler */}
      {activeViewMode === 'OT_SCHEDULER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                OT & Cath-Lab Sterilization & Calibration Blockout Scheduler
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                Weekly recurring fumigation windows, biomedical equipment calibration, and HEPA air change validation.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsOtModalOpen(true)}
              style={{ backgroundColor: '#A855F7', borderColor: '#9333EA', fontWeight: 800 }}
            >
              ➕ Schedule Maintenance Blockout
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {otMaintenanceSchedules.map((ot) => (
              <div
                key={ot.id}
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {ot.roomType === 'CATH_LAB' ? '🩻' : '🔬'}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {ot.roomName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      Maintenance Protocol: <strong>{ot.maintenanceType.replace(/_/g, ' ')}</strong> • Engineer: {ot.engineerName}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {ot.scheduledDate}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#A855F7', fontFamily: 'monospace' }}>
                      {ot.timeWindow}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: ot.infectionControlSignoff ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: ot.infectionControlSignoff ? '#34D399' : '#FBBF24',
                      border: ot.infectionControlSignoff ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    {ot.infectionControlSignoff ? '✓ ICN Certified' : '⏳ Pending Signoff'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Ward Modal */}
      {isAddWardModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #38BDF8', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 800 }}>Register Inpatient Ward</h3>
              <button type="button" onClick={() => setIsAddWardModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Ward Name</label>
                <input type="text" placeholder="e.g. Coronary Care Unit (CCU)" value={newWardName} onChange={(e) => setNewWardName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Ward Category</label>
                  <select value={newWardType} onChange={(e) => setNewWardType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }}>
                    <option value="ICU">ICU (Intensive Care)</option>
                    <option value="NICU">NICU (Neonatal)</option>
                    <option value="GENERAL">General Ward</option>
                    <option value="DELUXE">Deluxe Room</option>
                    <option value="ISOLATION">Negative-Pressure Isolation</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Floor / Wing</label>
                  <input type="text" value={newWardFloor} onChange={(e) => setNewWardFloor(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Bed Capacity</label>
                  <input type="number" value={newWardBeds} onChange={(e) => setNewWardBeds(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Base Tariff (₹/day)</label>
                  <input type="number" value={newWardTariff} onChange={(e) => setNewWardTariff(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <Button variant="outline" onClick={() => setIsAddWardModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => {
                  if (newWardName.trim()) {
                    setCustomWards((prev) => [...prev, {
                      id: `WARD-${Date.now().toString().slice(-4)}`,
                      wardName: newWardName,
                      wardType: newWardType,
                      floor: newWardFloor,
                      totalBeds: newWardBeds,
                      baseTariffInr: newWardTariff,
                      equipmentTags: newWardTags
                    }]);
                    setIsAddWardModalOpen(false);
                    setNewWardName('');
                  }
                }}>Save Ward</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule OT Maintenance Modal */}
      {isOtModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #A855F7', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 800 }}>Schedule OT Maintenance Blockout</h3>
              <button type="button" onClick={() => setIsOtModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Theatre / Room</label>
                <input type="text" value={otRoomName} onChange={(e) => setOtRoomName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Maintenance Protocol</label>
                <select value={otMaintType} onChange={(e) => setOtMaintType(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }}>
                  <option value="WEEKLY_FUMIGATION">Weekly Fumigation & Formalin Vaporization</option>
                  <option value="BIOMEDICAL_CALIBRATION">Biomedical Equipment Calibration</option>
                  <option value="HEPA_FILTER_AIR_CHANGE">HEPA Filter Air Change Validation</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Date</label>
                  <input type="text" value={otDate} onChange={(e) => setOtDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Time Window</label>
                  <input type="text" value={otTime} onChange={(e) => setOtTime(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>Assigned Engineer</label>
                <input type="text" value={otEngineer} onChange={(e) => setOtEngineer(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #475569', color: '#FFF' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <Button variant="outline" onClick={() => setIsOtModalOpen(false)}>Cancel</Button>
                <Button variant="primary" style={{ backgroundColor: '#A855F7', borderColor: '#9333EA' }} onClick={() => {
                  setOtMaintenanceSchedules((prev) => [...prev, {
                    id: `OT-CAL-${Date.now().toString().slice(-4)}`,
                    roomName: otRoomName,
                    roomType: 'OT',
                    maintenanceType: otMaintType,
                    scheduledDate: otDate,
                    timeWindow: otTime,
                    engineerName: otEngineer,
                    infectionControlSignoff: true,
                    status: 'SCHEDULED'
                  }]);
                  setIsOtModalOpen(false);
                }}>Confirm Blockout</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bedside Patient Concierge QR Standee Modal */}
      {selectedBedForQr && (
        <PrintableBedsideQrCardModal
          isOpen={Boolean(selectedBedForQr)}
          onClose={() => setSelectedBedForQr(null)}
          bed={selectedBedForQr}
          facilityName={facilityName}
        />
      )}
    </div>
  );
};