import React, { useState } from 'react';
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
  PharmacyPrescriptionStatus,
  PrescriptionPriority
} from '@docsearch/api-contracts';

export interface PharmacyPrescriptionQueueViewProps {
  prescriptions: PharmacyPrescriptionDto[];
  onSelectPrescription: (id: string) => void;
  onOpenVerifyDialog: (prescription: PharmacyPrescriptionDto) => void;
  onOpenDispenseDialog: (prescription: PharmacyPrescriptionDto) => void;
  onOpenCancelDialog: (prescription: PharmacyPrescriptionDto) => void;
}

export const PharmacyPrescriptionQueueView: React.FC<PharmacyPrescriptionQueueViewProps> = ({
  prescriptions,
  onSelectPrescription,
  onOpenVerifyDialog,
  onOpenDispenseDialog,
  onOpenCancelDialog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filtered = prescriptions.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prescribingDoctorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
            📋 Pharmacy Fulfillment Queue
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Real-time incoming digital prescriptions across Outpatient, Emergency, and Inpatient departments.
          </p>
        </div>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Orders
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Rx number, patient name, MRN, physician..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Lifecycle Statuses' },
                { value: 'CREATED', label: 'Created / Transmitted' },
                { value: 'UNDER_REVIEW', label: 'Under Review' },
                { value: 'READY_FOR_DISPENSING', label: 'Ready for Dispensing' },
                { value: 'PARTIALLY_DISPENSED', label: 'Partially Dispensed' },
                { value: 'COMPLETED', label: 'Completed / Dispensed' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Priority
            </label>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Priorities' },
                { value: 'STAT', label: 'STAT (Immediate)' },
                { value: 'EMERGENCY', label: 'Emergency' },
                { value: 'URGENT', label: 'Urgent' },
                { value: 'ROUTINE', label: 'Routine' }
              ]}
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx Number</TableHead>
                <TableHead>Patient & Allergies</TableHead>
                <TableHead>Type / Department</TableHead>
                <TableHead>Prescribing Physician</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>
                    <div style={{ cursor: 'pointer' }} onClick={() => onSelectPrescription(rx.id)}>
                      {rx.prescriptionNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(rx.prescribedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 600 }}>{rx.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rx.patientMrn}</div>
                    {rx.patientAllergies.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>
                        ⚠️ {rx.patientAllergies.join(', ')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{rx.prescriptionType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>{rx.prescribingDoctorName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rx.prescribingDoctorSpecialty}</div>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontSize: '0.85rem' }}>
                      {rx.items.map((i) => (
                        <div key={i.id}>
                          • {i.medicationName} ({i.prescribedQuantity} {i.unit})
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(rx.priority)}>{rx.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(rx.status)}>{rx.status.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {rx.status === 'CREATED' || rx.status === 'RECEIVED_BY_PHARMACY' || rx.status === 'UNDER_REVIEW' ? (
                        <Button variant="primary" onClick={() => onOpenVerifyDialog(rx)}>
                          Verify
                        </Button>
                      ) : rx.status === 'READY_FOR_DISPENSING' || rx.status === 'PARTIALLY_DISPENSED' ? (
                        <Button variant="primary" onClick={() => onOpenDispenseDialog(rx)}>
                          Dispense
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => onSelectPrescription(rx.id)}>
                          View
                        </Button>
                      )}
                      {rx.status !== 'CANCELLED' && rx.status !== 'COMPLETED' && (
                        <Button variant="subtle" onClick={() => onOpenCancelDialog(rx)}>
                          Cancel
                        </Button>
                      )}
                    </div>
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
