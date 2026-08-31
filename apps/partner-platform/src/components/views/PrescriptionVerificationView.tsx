import React from 'react';
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
import type {
  PharmacyPrescriptionDto,
  PharmacyBatchDto
} from '@docsearch/api-contracts';

export interface PrescriptionVerificationViewProps {
  prescription: PharmacyPrescriptionDto | null;
  batches: PharmacyBatchDto[];
  onVerify: (prescription: PharmacyPrescriptionDto) => void;
  onRequestSubstitution: (prescription: PharmacyPrescriptionDto) => void;
  onReserveStock: (prescription: PharmacyPrescriptionDto) => void;
  onBackToQueue: () => void;
}

export const PrescriptionVerificationView: React.FC<PrescriptionVerificationViewProps> = ({
  prescription,
  batches,
  onVerify,
  onRequestSubstitution,
  onReserveStock,
  onBackToQueue
}) => {
  if (!prescription) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: '#64748b' }}>No prescription selected for clinical verification.</p>
          <Button variant="outline" onClick={onBackToQueue}>
            ← Back to Queue
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" onClick={onBackToQueue}>
            ← Queue
          </Button>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
              Pharmacist Clinical Verification: {prescription.prescriptionNumber}
            </h2>
            <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
              Verify dosage safety, allergy alerts, drug interactions, and pre-allocate FEFO stock batches.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={() => onRequestSubstitution(prescription)}>
            🔄 Request Substitution
          </Button>
          <Button variant="outline" onClick={() => onReserveStock(prescription)}>
            📦 Pre-Reserve Batch Stock
          </Button>
          <Button variant="primary" onClick={() => onVerify(prescription)}>
            ✅ Clinical Sign-off & Authorize
          </Button>
        </div>
      </div>

      {/* Patient & Doctor Banner */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Patient</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{prescription.patientName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>MRN: {prescription.patientMrn}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Allergies</div>
            {prescription.patientAllergies.length > 0 ? (
              <div style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.875rem' }}>
                ⚠️ {prescription.patientAllergies.join(', ')}
              </div>
            ) : (
              <div style={{ color: '#16a34a', fontSize: '0.875rem' }}>No Known Drug Allergies (NKDA)</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Prescribing Physician</div>
            <div style={{ fontWeight: 600 }}>{prescription.prescribingDoctorName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{prescription.prescribingDoctorSpecialty}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Priority & Status</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <Badge variant={prescription.priority === 'STAT' ? 'danger' : 'neutral'}>{prescription.priority}</Badge>
              <Badge variant="primary">{prescription.status}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Ordered Items Verification Table */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>
          Medication Items for Clinical Evaluation
        </h3>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage & Frequency</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Prescribed Qty</TableHead>
                <TableHead>Available FEFO Stock</TableHead>
                <TableHead>Instructions</TableHead>
                <TableHead>Fulfillment State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.items.map((item) => {
                const itemBatches = batches.filter(
                  (b) => b.medicationId === item.medicationId && b.availableQuantity > 0 && b.status !== 'BLOCKED' && b.status !== 'EXPIRED'
                );
                const totalStock = itemBatches.reduce((acc, b) => acc + b.availableQuantity, 0);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{item.medicationName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Code: {item.medicationCode}</div>
                    </TableCell>
                    <TableCell>
                      <div>{item.dosage}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.frequency}</div>
                    </TableCell>
                    <TableCell>{item.route}</TableCell>
                    <TableCell>{item.duration} {item.durationUnit}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{item.prescribedQuantity} {item.unit}</TableCell>
                    <TableCell>
                      <span style={{ color: totalStock >= item.prescribedQuantity ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                        {totalStock} {item.unit}
                      </span>{' '}
                      ({itemBatches.length} batches)
                    </TableCell>
                    <TableCell style={{ fontSize: '0.85rem' }}>{item.instructions || 'Standard dosing'}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{item.fulfillmentStatus}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
