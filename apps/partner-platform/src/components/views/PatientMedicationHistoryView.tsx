import React, { useState } from 'react';
import {
  Card,
  Badge,
  Input,
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
  PharmacyDispensingDto
} from '@docsearch/api-contracts';

export interface PatientMedicationHistoryViewProps {
  prescriptions: PharmacyPrescriptionDto[];
  dispensing: PharmacyDispensingDto[];
}

export const PatientMedicationHistoryView: React.FC<PatientMedicationHistoryViewProps> = ({
  prescriptions,
  dispensing
}) => {
  const [searchTerm, setSearchTerm] = useState('Eleanor Vance');

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientMrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentPatientName = filteredPrescriptions[0]?.patientName || 'Eleanor Vance';
  const currentPatientMrn = filteredPrescriptions[0]?.patientMrn || 'DS-ORG001-000001';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
          👤 Patient Longitudinal Medication Profile
        </h2>
        <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
          Historical prescription records, outpatient dispensing compliance, and active pharmacotherapy.
        </p>
      </div>

      <Card padding="md">
        <div style={{ maxWidth: '400px', marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
            Lookup Patient by Name or MRN
          </label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient..."
          />
        </div>

        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
            Patient: {currentPatientName} ({currentPatientMrn})
          </div>
          <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.25rem' }}>
            Allergies: {filteredPrescriptions[0]?.patientAllergies.join(', ') || 'No known drug allergies (NKDA)'}
          </div>
        </div>

        <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 600 }}>
          Historical & Active Prescriptions
        </h3>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prescription #</TableHead>
                <TableHead>Prescribed Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Medications Ordered</TableHead>
                <TableHead>Fulfillment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescriptions.map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>{rx.prescriptionNumber}</TableCell>
                  <TableCell>{new Date(rx.prescribedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{rx.prescribingDoctorName}</TableCell>
                  <TableCell>
                    {rx.items.map((i) => (
                      <div key={i.id} style={{ fontSize: '0.85rem' }}>
                        • <strong>{i.medicationName}</strong>: {i.dosage} ({i.frequency}) [Dispensed: {i.dispensedQuantity}/{i.prescribedQuantity} {i.unit}]
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rx.status === 'COMPLETED' ? 'success' : 'primary'}>
                      {rx.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <h3 style={{ margin: '24px 0 12px', fontSize: '0.95rem', fontWeight: 600 }}>
          Patient Dispensing & Fulfillment Records
        </h3>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispensing #</TableHead>
                <TableHead>Dispensed Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Dispensed Items</TableHead>
                <TableHead>Pharmacist</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispensing.map((dsp) => (
                <TableRow key={dsp.id}>
                  <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>{dsp.dispensingNumber}</TableCell>
                  <TableCell>{new Date(dsp.dispensedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{dsp.dispensingMode}</Badge>
                  </TableCell>
                  <TableCell>
                    {dsp.items.map((i) => (
                      <div key={i.id} style={{ fontSize: '0.85rem' }}>
                        • {i.medicationName} (Batch: {i.batchNumber}) — <strong>{i.quantity} {i.unit}</strong>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{dsp.pharmacistName}</TableCell>
                  <TableCell>
                    <Badge variant={dsp.dispensingStatus === 'REVERSED' ? 'danger' : 'success'}>
                      {dsp.dispensingStatus}
                    </Badge>
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
