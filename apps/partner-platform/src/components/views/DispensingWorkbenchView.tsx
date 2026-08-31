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
  PharmacyDispensingDto,
  PharmacyBatchDto
} from '@docsearch/api-contracts';

export interface DispensingWorkbenchViewProps {
  prescription: PharmacyPrescriptionDto | null;
  dispensingRecords: PharmacyDispensingDto[];
  batches: PharmacyBatchDto[];
  onOpenDispenseDialog: (prescription: PharmacyPrescriptionDto) => void;
  onOpenPartialDispenseDialog: (prescription: PharmacyPrescriptionDto) => void;
  onOpenReturnDialog: (dispensing: PharmacyDispensingDto) => void;
  onOpenReverseDialog: (dispensing: PharmacyDispensingDto) => void;
  onBackToQueue: () => void;
}

export const DispensingWorkbenchView: React.FC<DispensingWorkbenchViewProps> = ({
  prescription,
  dispensingRecords,
  onOpenDispenseDialog,
  onOpenPartialDispenseDialog,
  onOpenReturnDialog,
  onOpenReverseDialog,
  onBackToQueue
}) => {
  if (!prescription) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: '#64748b' }}>No prescription order selected for dispensing workbench.</p>
          <Button variant="outline" onClick={onBackToQueue}>
            ← Back to Queue
          </Button>
        </div>
      </Card>
    );
  }

  const relatedDispensing = dispensingRecords.filter((d) => d.prescriptionId === prescription.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" onClick={onBackToQueue}>
            ← Queue
          </Button>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
              Dispensing Fulfillment Workbench — {prescription.prescriptionNumber}
            </h2>
            <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
              Final batch deduction, patient counseling documentation, and electronic labeling.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {prescription.status !== 'COMPLETED' && prescription.status !== 'CANCELLED' && (
            <>
              <Button variant="outline" onClick={() => onOpenPartialDispenseDialog(prescription)}>
                📦 Partial Dispense
              </Button>
              <Button variant="primary" onClick={() => onOpenDispenseDialog(prescription)}>
                💊 Commit Full Dispense
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Patient & Prescription Overview */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Patient Name</div>
            <div style={{ fontWeight: 700 }}>{prescription.patientName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>MRN: {prescription.patientMrn}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Prescription Type</div>
            <Badge variant="neutral">{prescription.prescriptionType}</Badge>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verification Status</div>
            <Badge variant={prescription.verifiedAt ? 'success' : 'warning'}>
              {prescription.verifiedAt ? 'Verified by Pharmacist' : 'Pending Verification'}
            </Badge>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Order Status</div>
            <Badge variant="primary">{prescription.status}</Badge>
          </div>
        </div>
      </Card>

      {/* Line Items Fulfillment Progress */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>
          Prescription Items & Fulfillment Balance
        </h3>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Prescribed Qty</TableHead>
                <TableHead>Dispensed Qty</TableHead>
                <TableHead>Remaining Balance</TableHead>
                <TableHead>Dosage Instructions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell style={{ fontWeight: 600 }}>{item.medicationName}</TableCell>
                  <TableCell>{item.prescribedQuantity} {item.unit}</TableCell>
                  <TableCell style={{ color: '#16a34a', fontWeight: 600 }}>
                    {item.dispensedQuantity} {item.unit}
                  </TableCell>
                  <TableCell style={{ color: item.remainingQuantity > 0 ? '#ea580c' : '#64748b', fontWeight: 600 }}>
                    {item.remainingQuantity} {item.unit}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>
                    {item.dosage} ({item.frequency}) — {item.instructions || 'As directed'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.fulfillmentStatus === 'FULFILLED' ? 'success' : 'warning'}>
                      {item.fulfillmentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Past Dispensing History for this Prescription */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>
          Dispensing Transaction History
        </h3>

        {relatedDispensing.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>No dispensing transactions committed yet for this order.</div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispensing #</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Dispensed Items (Batch & Qty)</TableHead>
                  <TableHead>Pharmacist</TableHead>
                  <TableHead>Dispensed At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedDispensing.map((dsp) => (
                  <TableRow key={dsp.id}>
                    <TableCell style={{ fontWeight: 600 }}>{dsp.dispensingNumber}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{dsp.dispensingMode}</Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.85rem' }}>
                        {dsp.items.map((i) => (
                          <div key={i.id}>
                            • {i.medicationName} (Batch: {i.batchNumber}) — <strong>{i.quantity} {i.unit}</strong>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{dsp.pharmacistName}</TableCell>
                    <TableCell>{new Date(dsp.dispensedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={dsp.dispensingStatus === 'REVERSED' ? 'danger' : 'success'}>
                        {dsp.dispensingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {dsp.dispensingStatus !== 'REVERSED' && (
                          <>
                            <Button variant="outline" onClick={() => onOpenReturnDialog(dsp)}>
                              Log Return
                            </Button>
                            <Button variant="danger" onClick={() => onOpenReverseDialog(dsp)}>
                              Reverse
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  );
};
