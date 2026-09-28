import React, { useState, useEffect } from 'react';
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
import { hospitalEventBus, ActivePatientSummary } from '../../services/hospital-event-bus.js';

export interface PatientMedicationHistoryViewProps {
  prescriptions: PharmacyPrescriptionDto[];
  dispensing: PharmacyDispensingDto[];
}

export const PatientMedicationHistoryView: React.FC<PatientMedicationHistoryViewProps> = ({
  prescriptions,
  dispensing
}) => {
  const activeCtx = hospitalEventBus.getActivePatient();
  const [searchTerm, setSearchTerm] = useState<string>(activeCtx?.name || '');
  const [selectedPatient, setSelectedPatient] = useState<ActivePatientSummary | null>(activeCtx);

  useEffect(() => {
    const unsubSelect = hospitalEventBus.subscribe('PATIENT_SELECTED', (evt) => {
      const p = evt.data as ActivePatientSummary;
      if (p) {
        setSelectedPatient(p);
        setSearchTerm(p.name);
      }
    });

    const unsubClear = hospitalEventBus.subscribe('PATIENT_CLEARED', () => {
      setSelectedPatient(null);
      setSearchTerm('');
    });

    return () => {
      unsubSelect();
      unsubClear();
    };
  }, []);

  const trimmedSearch = searchTerm.trim().toLowerCase();

  const filteredPrescriptions = trimmedSearch
    ? prescriptions.filter(
        (p) =>
          p.patientName.toLowerCase().includes(trimmedSearch) ||
          p.patientMrn.toLowerCase().includes(trimmedSearch)
      )
    : [];

  const filteredDispensing = trimmedSearch
    ? dispensing.filter(
        (d) =>
          d.patientName.toLowerCase().includes(trimmedSearch) ||
          d.patientMrn.toLowerCase().includes(trimmedSearch) ||
          d.dispensingNumber.toLowerCase().includes(trimmedSearch)
      )
    : [];

  const currentPatientName =
    filteredPrescriptions[0]?.patientName ||
    filteredDispensing[0]?.patientName ||
    selectedPatient?.name ||
    searchTerm;

  const currentPatientMrn =
    filteredPrescriptions[0]?.patientMrn ||
    filteredDispensing[0]?.patientMrn ||
    selectedPatient?.uhid ||
    '';

  const allergies =
    filteredPrescriptions[0]?.patientAllergies?.join(', ') ||
    selectedPatient?.allergies?.join(', ') ||
    'No known drug allergies (NKDA)';

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
        <div style={{ maxWidth: '420px', marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
            Lookup Patient by Name or UHID / MRN
          </label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient name, UHID, or prescription #..."
          />
        </div>

        {!trimmedSearch ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              color: '#64748b'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
              No Patient Selected
            </div>
            <p style={{ fontSize: '0.875rem', maxWidth: '460px', margin: '6px auto 0' }}>
              Enter a patient name or UHID / MRN above, or select a patient from the hospital context bar to view longitudinal pharmacotherapy records.
            </p>
          </div>
        ) : filteredPrescriptions.length === 0 && filteredDispensing.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              color: '#64748b'
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🔍</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
              No medication or dispensing history found for "{searchTerm}"
            </div>
            <p style={{ fontSize: '0.825rem', marginTop: '4px' }}>
              Please verify the patient name or registration number.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                marginBottom: '20px'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>
                Patient: {currentPatientName} {currentPatientMrn ? `(${currentPatientMrn})` : ''}
              </div>
              <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.25rem' }}>
                Allergies: {allergies}
              </div>
            </div>

            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 600 }}>
              Historical & Active Prescriptions ({filteredPrescriptions.length})
            </h3>

            {filteredPrescriptions.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', marginBottom: '24px' }}>
                No prescription orders on file for this patient.
              </p>
            ) : (
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
                        <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>
                          {rx.prescriptionNumber}
                        </TableCell>
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
            )}

            <h3 style={{ margin: '24px 0 12px', fontSize: '0.95rem', fontWeight: 600 }}>
              Patient Dispensing & Fulfillment Records ({filteredDispensing.length})
            </h3>

            {filteredDispensing.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                No past dispensing transactions recorded for this patient.
              </p>
            ) : (
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
                    {filteredDispensing.map((dsp) => (
                      <TableRow key={dsp.id}>
                        <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>
                          {dsp.dispensingNumber}
                        </TableCell>
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
            )}
          </>
        )}
      </Card>
    </div>
  );
};
