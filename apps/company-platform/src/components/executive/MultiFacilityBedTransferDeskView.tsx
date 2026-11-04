import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';

export interface BedBreakdown {
  total: number;
  occupied: number;
  available: number;
}

export interface FacilityCensusRow {
  partnerId: string;
  facilityName: string;
  city: string;
  tier: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercent: number;
  alertLevel: 'NORMAL' | 'WARNING_HIGH' | 'CRITICAL_SURGE';
  icuVentilator: BedBreakdown;
  hdu: BedBreakdown;
  isolation: BedBreakdown;
}

export interface TransferRequestRow {
  id: string;
  transferNumber: string;
  patientName: string;
  patientUhid: string;
  age: number;
  gender: string;
  acuityLevel: 'CRITICAL_L1_VENTILATOR' | 'URGENT_L2_OXYGEN' | 'STABLE_L3_STEPDOWN';
  diagnosis: string;
  originFacility: string;
  destinationFacility: string;
  requestedBed: string;
  assignedBed?: string | undefined;
  transportType: string;
  ambulance?: string | undefined;
  status: 'PENDING_APPROVAL' | 'BED_RESERVED_LOCKED' | 'AMBULANCE_EN_ROUTE' | 'COMPLETED_HANDOVER';
}

const INITIAL_FACILITIES: FacilityCensusRow[] = [
  {
    partnerId: 'PARTNER-001',
    facilityName: 'Metropolitan Multispecialty Hospital',
    city: 'Mumbai',
    tier: 'Tertiary Super-Specialty',
    totalBeds: 250,
    occupiedBeds: 232,
    availableBeds: 18,
    occupancyPercent: 92.8,
    alertLevel: 'CRITICAL_SURGE',
    icuVentilator: { total: 30, occupied: 29, available: 1 },
    hdu: { total: 40, occupied: 38, available: 2 },
    isolation: { total: 20, occupied: 18, available: 2 }
  },
  {
    partnerId: 'PARTNER-004',
    facilityName: 'City Heart Diagnostics & Cardiac Center',
    city: 'Pune',
    tier: 'Secondary Cardiac Hub',
    totalBeds: 80,
    occupiedBeds: 62,
    availableBeds: 18,
    occupancyPercent: 77.5,
    alertLevel: 'NORMAL',
    icuVentilator: { total: 12, occupied: 8, available: 4 },
    hdu: { total: 18, occupied: 14, available: 4 },
    isolation: { total: 5, occupied: 3, available: 2 }
  },
  {
    partnerId: 'PARTNER-005',
    facilityName: 'Delhi Central Medical Institute',
    city: 'New Delhi',
    tier: 'Tertiary Academic Hub',
    totalBeds: 320,
    occupiedBeds: 284,
    availableBeds: 36,
    occupancyPercent: 88.8,
    alertLevel: 'WARNING_HIGH',
    icuVentilator: { total: 40, occupied: 36, available: 4 },
    hdu: { total: 50, occupied: 45, available: 5 },
    isolation: { total: 20, occupied: 17, available: 3 }
  }
];

const INITIAL_TRANSFERS: TransferRequestRow[] = [
  {
    id: 'TRF-001',
    transferNumber: 'TRF-MUM-8819',
    patientName: 'Kishore Kumar',
    patientUhid: 'UHID-2026-102',
    age: 58,
    gender: 'Male',
    acuityLevel: 'CRITICAL_L1_VENTILATOR',
    diagnosis: 'ARDS secondary to Severe Pneumonia; requires ECMO/Tertiary ICU',
    originFacility: 'City Heart Diagnostics (Pune)',
    destinationFacility: 'Metropolitan Multispecialty (Mumbai)',
    requestedBed: 'ICU Ventilator Bed',
    assignedBed: 'ICU-VENT-04',
    transportType: 'ACLS Cardiac Ambulance',
    ambulance: 'AMB-MH-01-CT-9912 (ETA 34 mins)',
    status: 'AMBULANCE_EN_ROUTE'
  },
  {
    id: 'TRF-002',
    transferNumber: 'TRF-DL-4401',
    patientName: 'Sunita Deshmukh',
    patientUhid: 'UHID-2026-319',
    age: 64,
    gender: 'Female',
    acuityLevel: 'URGENT_L2_OXYGEN',
    diagnosis: 'NSTEMI with cardiogenic instability; requires Emergency Cath Lab Angiogram',
    originFacility: 'Dr. Amitabh Verma Clinic (Delhi)',
    destinationFacility: 'Delhi Central Medical Institute',
    requestedBed: 'High Dependency HDU Bed',
    transportType: 'BLS Oxygen Ambulance',
    status: 'PENDING_APPROVAL'
  }
];

export const MultiFacilityBedTransferDeskView: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityCensusRow[]>(INITIAL_FACILITIES);
  const [transfers, setTransfers] = useState<TransferRequestRow[]>(INITIAL_TRANSFERS);
  const [notice, setNotice] = useState<string | null>(null);

  const totalNetworkBeds = facilities.reduce((sum, f) => sum + f.totalBeds, 0);
  const totalOccupied = facilities.reduce((sum, f) => sum + f.occupiedBeds, 0);
  const totalAvailable = facilities.reduce((sum, f) => sum + f.availableBeds, 0);
  const netOccupancy = Math.round((totalOccupied / totalNetworkBeds) * 100);

  const handleApproveTransfer = (trfId: string) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === trfId
          ? {
              ...t,
              status: 'AMBULANCE_EN_ROUTE',
              assignedBed: 'HDU-BED-09',
              ambulance: 'AMB-DL-02-EM-1102 (Dispatched)'
            }
          : t
      )
    );
    const target = transfers.find((t) => t.id === trfId);
    setNotice(
      `⚡ Transfer ${target?.transferNumber} APPROVED! Destination Bed locked at ${target?.destinationFacility} & ACLS Ambulance Dispatched!`
    );
    setTimeout(() => setNotice(null), 5000);
  };

  const handleSimulateDischarge = (partnerId: string) => {
    setFacilities((prev) =>
      prev.map((f) =>
        f.partnerId === partnerId
          ? {
              ...f,
              occupiedBeds: Math.max(0, f.occupiedBeds - 1),
              availableBeds: f.availableBeds + 1,
              occupancyPercent: Math.round(((f.occupiedBeds - 1) / f.totalBeds) * 1000) / 10
            }
          : f
      )
    );
    setNotice(`✓ Bed released at ${partnerId}. Network capacity updated in real time.`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏥</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                Pan-India Hospital Bed Grid & Inter-Facility Transfer Desk
              </h2>
              <Badge variant="success">Epic Grand Central Parity Active</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Real-time cross-facility bed occupancy telemetry, emergency triage transfer dispatch, and zero-phone-tag patient handover.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#38BDF8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              📡 Live HL7 ADT Bed Sensor Mesh Active
            </span>
          </div>
        </div>

        {/* Global Bed KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL NETWORK BEDS</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px', fontFamily: 'monospace' }}>
              {totalNetworkBeds} Beds
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>Across {facilities.length} Tier-1 Facilities</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #10B981' }}>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 700, textTransform: 'uppercase' }}>AVAILABLE BEDS</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#10B981', marginTop: '2px', fontFamily: 'monospace' }}>
              {totalAvailable} Available
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC' }}>Immediate Patient Intake</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #EF4444' }}>
            <span style={{ fontSize: '0.6875rem', color: '#F87171', fontWeight: 800, textTransform: 'uppercase' }}>NETWORK OCCUPANCY</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: netOccupancy > 85 ? '#EF4444' : '#F59E0B', marginTop: '2px', fontFamily: 'monospace' }}>
              {netOccupancy}%
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#FCA5A5' }}>{totalOccupied} Occupied Beds</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>ACTIVE TRANSIT TRANSFERS</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', fontFamily: 'monospace' }}>
              {transfers.length} Transfers
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>GPS Tracking Active</span>
          </div>
        </div>
      </div>

      {notice && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10B981',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#A7F3D0',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          {notice}
        </div>
      )}

      {/* Hospital Bed Matrix Table */}
      <Card title="🏥 Network Hospital Bed Capacity & Surge Matrix" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility & Location</TableHead>
                <TableHead>Occupancy Rate</TableHead>
                <TableHead>ICU Ventilator</TableHead>
                <TableHead>HDU (High Dependency)</TableHead>
                <TableHead>Negative Pressure Isolation</TableHead>
                <TableHead>Surge Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.map((f) => (
                <TableRow key={f.partnerId}>
                  <TableCell>
                    <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{f.facilityName}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{f.city} • {f.tier}</div>
                  </TableCell>

                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 900, color: f.occupancyPercent > 90 ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>
                        {f.occupancyPercent}%
                      </span>
                      <div style={{ width: '60px', height: '6px', backgroundColor: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${f.occupancyPercent}%`,
                            height: '100%',
                            backgroundColor: f.occupancyPercent > 90 ? '#EF4444' : '#10B981'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                      {f.occupiedBeds}/{f.totalBeds} Beds Filled
                    </div>
                  </TableCell>

                  <TableCell>
                    <span style={{ fontWeight: 800, color: f.icuVentilator.available > 0 ? '#10B981' : '#EF4444' }}>
                      {f.icuVentilator.available} Available
                    </span>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Total: {f.icuVentilator.total}</div>
                  </TableCell>

                  <TableCell>
                    <span style={{ fontWeight: 800, color: f.hdu.available > 0 ? '#10B981' : '#EF4444' }}>
                      {f.hdu.available} Available
                    </span>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Total: {f.hdu.total}</div>
                  </TableCell>

                  <TableCell>
                    <span style={{ fontWeight: 800, color: '#38BDF8' }}>
                      {f.isolation.available} Available
                    </span>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Total: {f.isolation.total}</div>
                  </TableCell>

                  <TableCell>
                    {f.alertLevel === 'CRITICAL_SURGE' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                        🚨 CRITICAL SURGE (&gt;90%)
                      </span>
                    )}
                    {f.alertLevel === 'WARNING_HIGH' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                        ⚠️ HIGH LOAD (80-90%)
                      </span>
                    )}
                    {f.alertLevel === 'NORMAL' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                        ✓ CAPACITY OPTIMAL
                      </span>
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSimulateDischarge(f.partnerId)}
                      style={{ fontWeight: 700 }}
                    >
                      Release Bed ➔
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Inter-Facility Patient Transfer Queue */}
      <Card title="🚑 Emergency Inter-Facility Patient Transfer Orchestrator" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer # & Patient</TableHead>
                <TableHead>Acuity Level</TableHead>
                <TableHead>Clinical Diagnosis</TableHead>
                <TableHead>Route (Origin ➔ Destination)</TableHead>
                <TableHead>Bed & Transport</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{t.transferNumber}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{t.patientName} ({t.age}y/{t.gender}) • {t.patientUhid}</div>
                  </TableCell>

                  <TableCell>
                    {t.acuityLevel === 'CRITICAL_L1_VENTILATOR' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 900, color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '3px 8px', borderRadius: '4px', border: '1px solid #EF4444' }}>
                        🔴 LEVEL 1 VENTILATOR
                      </span>
                    )}
                    {t.acuityLevel === 'URGENT_L2_OXYGEN' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 900, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '3px 8px', borderRadius: '4px', border: '1px solid #F59E0B' }}>
                        🟡 LEVEL 2 OXYGEN
                      </span>
                    )}
                    {t.acuityLevel === 'STABLE_L3_STEPDOWN' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 900, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '3px 8px', borderRadius: '4px', border: '1px solid #10B981' }}>
                        🟢 LEVEL 3 STEP-DOWN
                      </span>
                    )}
                  </TableCell>

                  <TableCell style={{ maxWidth: '240px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                      {t.diagnosis}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontSize: '0.75rem', color: '#F8FAFC', fontWeight: 600 }}>
                      {t.originFacility}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800 }}>
                      ➔ {t.destinationFacility}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 700 }}>
                      {t.assignedBed || t.requestedBed}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                      {t.ambulance || t.transportType}
                    </div>
                  </TableCell>

                  <TableCell>
                    {t.status === 'PENDING_APPROVAL' && (
                      <Badge variant="warning">AWAITING BED LOCK</Badge>
                    )}
                    {t.status === 'AMBULANCE_EN_ROUTE' && (
                      <Badge variant="info">AMBULANCE IN TRANSIT</Badge>
                    )}
                    {t.status === 'COMPLETED_HANDOVER' && (
                      <Badge variant="success">HANDOVER COMPLETE</Badge>
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    {t.status === 'PENDING_APPROVAL' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveTransfer(t.id)}
                        style={{ fontWeight: 800, backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16' }}
                      >
                        ⚡ Lock Bed & Dispatch
                      </Button>
                    )}
                    {t.status === 'AMBULANCE_EN_ROUTE' && (
                      <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                        📡 GPS Telemetry Live
                      </span>
                    )}
                    {t.status === 'COMPLETED_HANDOVER' && (
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Archived in EMR
                      </span>
                    )}
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
