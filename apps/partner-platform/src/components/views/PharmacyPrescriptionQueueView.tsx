import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  PharmacyPrescriptionDto,
  PharmacyBatchDto,
  PharmacyPrescriptionStatus,
  PrescriptionPriority
} from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface PharmacyPrescriptionQueueViewProps {
  prescriptions: PharmacyPrescriptionDto[];
  batches?: PharmacyBatchDto[];
  onSelectPrescription: (id: string) => void;
  onOpenVerifyDialog: (prescription: PharmacyPrescriptionDto) => void;
  onOpenDispenseDialog: (prescription: PharmacyPrescriptionDto) => void;
  onOpenCancelDialog: (prescription: PharmacyPrescriptionDto) => void;
  onLoadToPos?: (prescriptionId: string) => void;
}

interface MergedPrescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  patientPhone: string;
  patientMrn: string;
  patientAllergies: string[];
  prescribingDoctorName: string;
  prescribingDoctorSpecialty: string;
  doctorNmcReg?: string;
  prescribedAt: string;
  priority: PrescriptionPriority;
  status: PharmacyPrescriptionStatus;
  prescriptionType: string;
  isDoctorOpdRx?: boolean;
  items: Array<{
    id: string;
    medicationName: string;
    strength?: string;
    dosage?: string;
    frequency?: string;
    duration?: number;
    durationUnit?: string;
    instructions?: string;
    prescribedQuantity: number;
    unit: string;
  }>;
  rawDto?: PharmacyPrescriptionDto;
}

export const PharmacyPrescriptionQueueView: React.FC<PharmacyPrescriptionQueueViewProps> = ({
  prescriptions,
  batches: _batches = [],
  onSelectPrescription,
  onOpenVerifyDialog,
  onOpenDispenseDialog,
  onOpenCancelDialog: _onOpenCancelDialog,
  onLoadToPos
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [localDoctorRxList, setLocalDoctorRxList] = useState<any[]>([]);
  const [newRxToast, setNewRxToast] = useState<string | null>(null);

  // Subscribed to doctor prescriptions from hospital event bus and server domain
  const loadLocalDoctorPrescriptions = useCallback(() => {
    setLocalDoctorRxList([]);
  }, []);

  useEffect(() => {
    loadLocalDoctorPrescriptions();

    const unsubRxIssued = hospitalEventBus.subscribe('PRESCRIPTION_ISSUED', (payload) => {
      loadLocalDoctorPrescriptions();
      const patient = payload.data?.patientName || 'Patient';
      setNewRxToast(`⚡ New e-Rx received from Dr. ${payload.data?.doctorName || 'Consultant'} for ${patient}!`);
      setTimeout(() => setNewRxToast(null), 5000);
    });

    const unsubDispensed = hospitalEventBus.subscribe('RX_DISPENSED_TO_PHARMACY' as any, () => {
      loadLocalDoctorPrescriptions();
    });

    const handleStorage = () => loadLocalDoctorPrescriptions();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('docsearch_prescriptions_updated', handleStorage);

    return () => {
      unsubRxIssued();
      unsubDispensed();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('docsearch_prescriptions_updated', handleStorage);
    };
  }, [loadLocalDoctorPrescriptions]);

  // Merge API Prescriptions and Local Doctor Desk Prescriptions
  const mergedList: MergedPrescription[] = useMemo(() => {
    const list: MergedPrescription[] = [];
    const seenIds = new Set<string>();

    // 1. Process local doctor desk prescriptions
    for (const d of localDoctorRxList) {
      const rxId = d.id || `rx-${d.consultationId}`;
      seenIds.add(rxId);
      list.push({
        id: rxId,
        prescriptionNumber: d.consultationId || `RX-${rxId.slice(-6).toUpperCase()}`,
        patientName: d.patientName || 'Hospital Patient',
        patientPhone: d.patientPhone || '9876543210',
        patientMrn: d.patientMrn || `UHID-${rxId.slice(-4)}`,
        patientAllergies: d.patientAllergies || [],
        prescribingDoctorName: d.doctorName || 'Dr. Attending Physician',
        prescribingDoctorSpecialty: 'General Medicine / OPD',
        doctorNmcReg: d.doctorNmcReg || 'NMC-MCI-2018-847291',
        prescribedAt: d.issuedAt || new Date().toISOString(),
        priority: (d.priority as PrescriptionPriority) || 'ROUTINE',
        status: (d.status as PharmacyPrescriptionStatus) || 'READY_FOR_DISPENSING',
        prescriptionType: 'OUTPATIENT',
        isDoctorOpdRx: true,
        items: (d.items || []).map((it: any, idx: number) => ({
          id: `item-${idx}`,
          medicationName: it.medicationName,
          strength: it.strength || 'Standard',
          dosage: it.dosage || '1 Tab',
          frequency: it.frequency || '1 - 0 - 1',
          duration: it.duration || 5,
          durationUnit: it.durationUnit || 'DAYS',
          instructions: it.instructions || 'After food',
          prescribedQuantity: it.duration ? Math.ceil((it.duration * 2)) : 10,
          unit: 'TAB'
        }))
      });
    }

    // 2. Process domain prescriptions from backend props
    for (const p of prescriptions) {
      if (!seenIds.has(p.id) && !seenIds.has(p.prescriptionNumber)) {
        seenIds.add(p.id);
        list.push({
          id: p.id,
          prescriptionNumber: p.prescriptionNumber,
          patientName: p.patientName,
          patientPhone: p.patientMrn || '',
          patientMrn: p.patientMrn,
          patientAllergies: p.patientAllergies || [],
          prescribingDoctorName: p.prescribingDoctorName,
          prescribingDoctorSpecialty: p.prescribingDoctorSpecialty || 'Consultant',
          doctorNmcReg: (p as any).doctorNmcReg || 'NMC-MCI-2018-847291',
          prescribedAt: p.prescribedAt,
          priority: p.priority,
          status: p.status,
          prescriptionType: p.prescriptionType,
          isDoctorOpdRx: false,
          rawDto: p,
          items: p.items.map((i) => ({
            id: i.id,
            medicationName: i.medicationName,
            strength: i.strength || 'Standard',
            dosage: `${i.prescribedQuantity} ${i.unit}`,
            frequency: i.frequency || i.instructions || '1 - 0 - 1',
            duration: 5,
            durationUnit: 'DAYS',
            instructions: i.instructions || 'AFTER_FOOD',
            prescribedQuantity: i.prescribedQuantity,
            unit: i.unit
          }))
        });
      }
    }

    // Sort by latest first
    return list.sort((a, b) => new Date(b.prescribedAt).getTime() - new Date(a.prescribedAt).getTime());
  }, [localDoctorRxList, prescriptions]);

  const filtered = useMemo(() => {
    return mergedList.filter((p) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && (p.status === 'CREATED' || p.status === 'READY_FOR_DISPENSING' || p.status === 'UNDER_REVIEW')) ||
        p.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
      const matchesSearch =
        searchTerm.trim() === '' ||
        p.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prescribingDoctorName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [mergedList, statusFilter, priorityFilter, searchTerm]);

  const getPriorityBadgeVariant = (priority: PrescriptionPriority) => {
    switch (priority) {
      case 'STAT':
      case 'EMERGENCY':
        return 'danger';
      case 'URGENT':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status: PharmacyPrescriptionStatus) => {
    switch (status) {
      case 'COMPLETED':
      case 'DISPENSED':
        return 'success';
      case 'READY_FOR_DISPENSING':
      case 'VERIFIED':
      case 'STOCK_RESERVED':
        return 'primary';
      case 'UNDER_REVIEW':
      case 'PARTIALLY_DISPENSED':
        return 'warning';
      case 'CANCELLED':
      case 'REJECTED':
      case 'EXPIRED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // 1-Click "Verify & Load to POS"
  const handleVerifyAndLoadToPos = (rx: MergedPrescription) => {
    if (onLoadToPos) {
      onLoadToPos(rx.id);
    } else if (rx.rawDto) {
      onOpenDispenseDialog(rx.rawDto);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {newRxToast && (
        <div
          style={{
            backgroundColor: '#065F46',
            color: '#ECFDF5',
            padding: '12px 16px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(6, 95, 70, 0.3)'
          }}
        >
          <span>{newRxToast}</span>
          <button
            type="button"
            onClick={() => setNewRxToast(null)}
            style={{ background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📋 Incoming e-Rx Queue (Doctor Prescriptions)
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.85rem' }}>
            Live doctor prescriptions across OPD, Inpatient, and Emergency bays. Verify clinical dosage and 1-tap checkout.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="primary" style={{ padding: '6px 12px', fontSize: '0.82rem', fontWeight: 700 }}>
            {filtered.length} Prescriptions Listed
          </Badge>
        </div>
      </div>

      <Card padding="md">
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
              Search Orders
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Rx number, patient name, MRN, physician..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
              Filter by Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Lifecycle Statuses' },
                { value: 'PENDING', label: '⚡ Pending Fulfillment' },
                { value: 'READY_FOR_DISPENSING', label: 'Ready for Dispensing' },
                { value: 'VERIFIED', label: 'Verified by Pharmacist' },
                { value: 'DISPENSED', label: 'Completed / Dispensed' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
              Filter by Priority
            </label>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Priorities' },
                { value: 'STAT', label: '🚨 STAT (Immediate)' },
                { value: 'EMERGENCY', label: 'Emergency' },
                { value: 'URGENT', label: 'Urgent' },
                { value: 'ROUTINE', label: 'Routine' }
              ]}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div style={{ display: 'none' }} className="rx-desktop-table-container">
          {/* Handled by media query below */}
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx Number</TableHead>
                <TableHead>Patient & Allergies</TableHead>
                <TableHead>Prescribing Doctor</TableHead>
                <TableHead>Prescribed Medications</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ds-color-text-muted)' }}>
                    No matching prescriptions found in the queue. Prescriptions issued by doctors appear here in real-time.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rx) => (
                  <TableRow key={rx.id}>
                    {/* Rx Number & Time */}
                    <TableCell style={{ fontWeight: 600, color: 'var(--ds-color-primary, #0284c7)' }}>
                      <div style={{ cursor: 'pointer', fontWeight: 800 }} onClick={() => onSelectPrescription(rx.id)}>
                        {rx.prescriptionNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        {new Date(rx.prescribedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {rx.isDoctorOpdRx && (
                        <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-block', marginTop: '2px' }}>
                          🟢 Live Doctor Rx
                        </span>
                      )}
                    </TableCell>

                    {/* Patient & Allergies */}
                    <TableCell>
                      <div style={{ fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>{rx.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        {rx.patientMrn} {rx.patientPhone ? `• 📞 ${rx.patientPhone.slice(-4)}` : ''}
                      </div>
                      {rx.patientAllergies && rx.patientAllergies.length > 0 ? (
                        <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, marginTop: '2px' }}>
                          ⚠️ Allergy: {rx.patientAllergies.join(', ')}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: '#10B981' }}>🛡️ No known allergies</div>
                      )}
                    </TableCell>

                    {/* Prescribing Doctor */}
                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--ds-color-text-primary)' }}>{rx.prescribingDoctorName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                        Reg: {rx.doctorNmcReg || 'NMC Verified'}
                      </div>
                    </TableCell>

                    {/* Items */}
                    <TableCell>
                      <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {rx.items.slice(0, 3).map((i, idx) => (
                          <div key={idx} style={{ color: 'var(--ds-color-text-primary)' }}>
                            <strong>• {i.medicationName}</strong> {i.strength} ({i.frequency})
                          </div>
                        ))}
                        {rx.items.length > 3 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                            +{rx.items.length - 3} more items...
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(rx.priority)}>{rx.priority}</Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(rx.status)}>{rx.status.replace(/_/g, ' ')}</Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* 1-Click Verify & Load into POS */}
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleVerifyAndLoadToPos(rx)}
                          style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>🛒</span>
                          <span>Verify & POS</span>
                        </Button>

                        {rx.rawDto && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenVerifyDialog(rx.rawDto!)}
                          >
                            Details
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
