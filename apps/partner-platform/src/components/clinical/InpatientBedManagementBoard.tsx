import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'RESERVED' | 'MAINTENANCE';
export type WardType = 'ALL' | 'ICU' | 'GENERAL' | 'SEMI_PRIVATE' | 'DELUXE' | 'ISOLATION';

export interface BedDetail {
  id: string;
  code: string;
  wardId: string;
  wardName: string;
  wardType: Exclude<WardType, 'ALL'>;
  status: BedStatus;
  currentPatient?: {
    uhid: string;
    name: string;
    ageGender: string;
    admittedAt: string;
    attendingDoctor: string;
    primaryDiagnosis: string;
    acuityLevel: 'STABLE' | 'MODERATE' | 'CRITICAL';
  } | undefined;
  dailyRate: number;
  hasOxygen: boolean;
  hasVentilator: boolean;
  lastCleanedAt?: string | undefined;
}

export interface InpatientBedManagementBoardProps {
  initialBeds?: BedDetail[];
  onAdmitPatient?: (bedId: string) => void;
  onTransferPatient?: (sourceBedId: string, targetBedId: string) => void;
  onDischargePatient?: (bedId: string) => void;
  onInitiateCleaning?: (bedId: string) => void;
  onCompleteCleaning?: (bedId: string) => void;
}

const DEFAULT_BEDS: BedDetail[] = [
  {
    id: 'BED-ICU-01',
    code: 'ICU-B01',
    wardId: 'WARD-ICU',
    wardName: 'Critical Care ICU',
    wardType: 'ICU',
    status: 'OCCUPIED',
    dailyRate: 12500,
    hasOxygen: true,
    hasVentilator: true,
    currentPatient: {
      uhid: 'UHID-2026-901',
      name: 'Rajesh Mehra',
      ageGender: '58Y / M',
      admittedAt: '2026-11-02 14:30',
      attendingDoctor: 'Dr. Amitabh Verma (Cardiology)',
      primaryDiagnosis: 'Acute Coronary Syndrome / Post-PCI',
      acuityLevel: 'CRITICAL'
    }
  },
  {
    id: 'BED-ICU-02',
    code: 'ICU-B02',
    wardId: 'WARD-ICU',
    wardName: 'Critical Care ICU',
    wardType: 'ICU',
    status: 'AVAILABLE',
    dailyRate: 12500,
    hasOxygen: true,
    hasVentilator: true,
    lastCleanedAt: '2026-11-03 08:00'
  },
  {
    id: 'BED-GEN-01',
    code: 'GW-101',
    wardId: 'WARD-GEN',
    wardName: 'General Male Ward',
    wardType: 'GENERAL',
    status: 'OCCUPIED',
    dailyRate: 2200,
    hasOxygen: true,
    hasVentilator: false,
    currentPatient: {
      uhid: 'UHID-2026-944',
      name: 'Sunil Gavaskar',
      ageGender: '42Y / M',
      admittedAt: '2026-11-01 10:15',
      attendingDoctor: 'Dr. Sunita Rao (Internal Med)',
      primaryDiagnosis: 'Dengue with Thrombocytopenia',
      acuityLevel: 'MODERATE'
    }
  },
  {
    id: 'BED-GEN-02',
    code: 'GW-102',
    wardId: 'WARD-GEN',
    wardName: 'General Male Ward',
    wardType: 'GENERAL',
    status: 'CLEANING',
    dailyRate: 2200,
    hasOxygen: true,
    hasVentilator: false
  },
  {
    id: 'BED-SEMI-01',
    code: 'SP-201-A',
    wardId: 'WARD-SEMI',
    wardName: 'Semi-Private 2nd Floor',
    wardType: 'SEMI_PRIVATE',
    status: 'OCCUPIED',
    dailyRate: 4500,
    hasOxygen: true,
    hasVentilator: false,
    currentPatient: {
      uhid: 'UHID-2026-952',
      name: 'Ananya Gupta',
      ageGender: '29Y / F',
      admittedAt: '2026-11-03 09:00',
      attendingDoctor: 'Dr. Kavita Joshi (Gynecology)',
      primaryDiagnosis: 'Post-Elective Lower Segment C-Section',
      acuityLevel: 'STABLE'
    }
  },
  {
    id: 'BED-DLX-01',
    code: 'DLX-301',
    wardId: 'WARD-DLX',
    wardName: 'Deluxe Presidential Wing',
    wardType: 'DELUXE',
    status: 'AVAILABLE',
    dailyRate: 9000,
    hasOxygen: true,
    hasVentilator: false,
    lastCleanedAt: '2026-11-03 06:45'
  },
  {
    id: 'BED-ISO-01',
    code: 'ISO-401',
    wardId: 'WARD-ISO',
    wardName: 'Negative Pressure Airborne Isolation',
    wardType: 'ISOLATION',
    status: 'RESERVED',
    dailyRate: 8500,
    hasOxygen: true,
    hasVentilator: true
  }
];

export const InpatientBedManagementBoard: React.FC<InpatientBedManagementBoardProps> = ({
  initialBeds = DEFAULT_BEDS,
  onAdmitPatient,
  onTransferPatient,
  onDischargePatient,
  onInitiateCleaning,
  onCompleteCleaning
}) => {
  const [beds, setBeds] = useState<BedDetail[]>(initialBeds);
  const [selectedWard, setSelectedWard] = useState<WardType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BedStatus>('ALL');
  const [transferSourceBed, setTransferSourceBed] = useState<BedDetail | null>(null);

  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      const wardMatch = selectedWard === 'ALL' || b.wardType === selectedWard;
      const statusMatch = statusFilter === 'ALL' || b.status === statusFilter;
      return wardMatch && statusMatch;
    });
  }, [beds, selectedWard, statusFilter]);

  const stats = useMemo(() => {
    const total = beds.length;
    const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
    const available = beds.filter((b) => b.status === 'AVAILABLE').length;
    const cleaning = beds.filter((b) => b.status === 'CLEANING').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, available, cleaning, occupancyRate };
  }, [beds]);

  const handleDischarge = (bedId: string) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? { ...b, status: 'CLEANING', currentPatient: undefined, lastCleanedAt: undefined }
          : b
      )
    );
    onDischargePatient?.(bedId);
    onInitiateCleaning?.(bedId);
  };

  const handleFinishCleaning = (bedId: string) => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId ? { ...b, status: 'AVAILABLE', lastCleanedAt: `Today ${now}` } : b
      )
    );
    onCompleteCleaning?.(bedId);
  };

  const handleExecuteTransfer = (targetBed: BedDetail) => {
    if (!transferSourceBed || targetBed.status !== 'AVAILABLE') return;

    setBeds((prev) =>
      prev.map((b) => {
        if (b.id === transferSourceBed.id) {
          return { ...b, status: 'CLEANING', currentPatient: undefined };
        }
        if (b.id === targetBed.id) {
          return { ...b, status: 'OCCUPIED', currentPatient: transferSourceBed.currentPatient };
        }
        return b;
      })
    );

    onTransferPatient?.(transferSourceBed.id, targetBed.id);
    setTransferSourceBed(null);
  };

  const getStatusColor = (status: BedStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return '#10b981';
      case 'OCCUPIED':
        return '#ef4444';
      case 'CLEANING':
        return '#f59e0b';
      case 'RESERVED':
        return '#8b5cf6';
      case 'MAINTENANCE':
        return '#64748b';
    }
  };

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#090d16', minHeight: '100%', color: '#f8fafc' }}>
      {/* Top Header & Metrics Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
              Inpatient ADT & Bed Cockpit
            </h1>
            <Badge variant="primary">NABH Standard</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Live Admission, Discharge, Bed Turnaround & Clinical Telemetry
          </p>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38bdf8' }}>{stats.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Beds</div>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.occupied}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Occupied ({stats.occupancyRate}%)</div>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>{stats.available}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Available Ready</div>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.cleaning}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Turnaround / Cleaning</div>
          </div>
        </div>
      </div>

      {/* Transfer Alert Bar if in Transfer Mode */}
      {transferSourceBed && (
        <div
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid #8b5cf6',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.25rem' }}>🔄</span>
            <div>
              <div style={{ fontWeight: 600, color: '#c4b5fd' }}>
                Transferring Patient: {transferSourceBed.currentPatient?.name} ({transferSourceBed.code})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a78bfa' }}>
                Click on any AVAILABLE green bed below to complete the bed transfer.
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setTransferSourceBed(null)}>
            Cancel Transfer
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'ICU', 'GENERAL', 'SEMI_PRIVATE', 'DELUXE', 'ISOLATION'] as WardType[]).map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWard(w)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: selectedWard === w ? '#0284c7' : '#1e293b',
                color: selectedWard === w ? '#ffffff' : '#94a3b8'
              }}
            >
              {w.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status:</span>
          {(['ALL', 'AVAILABLE', 'OCCUPIED', 'CLEANING'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: statusFilter === s ? '1px solid #38bdf8' : '1px solid transparent',
                backgroundColor: '#1e293b',
                color: statusFilter === s ? '#38bdf8' : '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Bed Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem'
        }}
      >
        {filteredBeds.map((bed) => {
          const isTargetSelectable = transferSourceBed && bed.status === 'AVAILABLE';

          return (
            <Card
              key={bed.id}
              style={{
                backgroundColor: '#111827',
                border: isTargetSelectable
                  ? '2px dashed #8b5cf6'
                  : `1px solid ${bed.status === 'OCCUPIED' ? '#374151' : '#1f2937'}`,
                borderTop: `4px solid ${getStatusColor(bed.status)}`,
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f8fafc' }}>
                      {bed.code}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{bed.wardName}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${getStatusColor(bed.status)}20`,
                      color: getStatusColor(bed.status),
                      border: `1px solid ${getStatusColor(bed.status)}50`
                    }}
                  >
                    {bed.status}
                  </span>
                </div>

                {/* Patient / Telemetry Section */}
                {bed.status === 'OCCUPIED' && bed.currentPatient ? (
                  <div
                    style={{
                      backgroundColor: '#1f2937',
                      borderRadius: '6px',
                      padding: '10px',
                      margin: '8px 0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600, color: '#f3f4f6', fontSize: '0.95rem' }}>
                        {bed.currentPatient.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {bed.currentPatient.ageGender}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '2px' }}>
                      UHID: {bed.currentPatient.uhid}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#d1d5db', marginTop: '4px' }}>
                      {bed.currentPatient.primaryDiagnosis}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                      Doctor: {bed.currentPatient.attendingDoctor}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {bed.hasOxygen && (
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#0284c7', padding: '1px 6px', borderRadius: '4px' }}>
                          O2 Connected
                        </span>
                      )}
                      {bed.hasVentilator && (
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#dc2626', padding: '1px 6px', borderRadius: '4px' }}>
                          Ventilator
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor:
                            bed.currentPatient.acuityLevel === 'CRITICAL' ? '#b91c1c' : '#047857',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {bed.currentPatient.acuityLevel}
                      </span>
                    </div>
                  </div>
                ) : bed.status === 'CLEANING' ? (
                  <div style={{ padding: '1.25rem 0', textAlign: 'center', color: '#f59e0b' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🧹</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>NABH Terminal Disinfection</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Housekeeping turnaround in progress</div>
                  </div>
                ) : (
                  <div style={{ padding: '1.25rem 0', textAlign: 'center', color: '#10b981' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🛏</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ready for Admission</div>
                    {bed.lastCleanedAt && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Disinfected: {bed.lastCleanedAt}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div style={{ marginTop: '12px', borderTop: '1px solid #1f2937', paddingTop: '8px', display: 'flex', gap: '8px' }}>
                {bed.status === 'OCCUPIED' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTransferSourceBed(bed)}
                      style={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      Transfer
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDischarge(bed.id)}
                      style={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      Discharge
                    </Button>
                  </>
                )}

                {bed.status === 'AVAILABLE' && (
                  <>
                    {isTargetSelectable ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleExecuteTransfer(bed)}
                        style={{ width: '100%', backgroundColor: '#8b5cf6', fontSize: '0.8rem' }}
                      >
                        Confirm Transfer Here
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onAdmitPatient?.(bed.id)}
                        style={{ width: '100%', fontSize: '0.75rem' }}
                      >
                        + Admit Patient
                      </Button>
                    )}
                  </>
                )}

                {bed.status === 'CLEANING' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleFinishCleaning(bed.id)}
                    style={{ width: '100%', borderColor: '#10b981', color: '#10b981', fontSize: '0.75rem' }}
                  >
                    ✓ Mark Housekeeping Ready
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
