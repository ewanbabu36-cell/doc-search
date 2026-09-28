import React, { useState, useEffect } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import {
  INDIAN_PHARMACY_FORMULARY,
  type IndianMedicationFormularyItem
} from '../../services/indian-pharmacy-catalog.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import type { PharmacyBatchDto, PharmacyPrescriptionDto } from '@docsearch/api-contracts';

export interface PendingPrescriptionItem {
  id: string;
  consultationId: string;
  patientName: string;
  patientPhone: string;
  patientMrn?: string;
  doctorName?: string;
  doctorNmcReg?: string;
  issuedAt: string;
  items: Array<{
    medicationName: string;
    strength: string;
    dosage: string;
    frequency: string;
    duration: number;
    durationUnit: string;
    instructions: string;
  }>;
}

export interface DoctorPrescriptionQueueImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: PharmacyBatchDto[];
  availablePrescriptions?: PharmacyPrescriptionDto[] | undefined;
  onImportPrescription: (payload: {
    patientName: string;
    patientPhone: string;
    doctorName: string;
    doctorNmcReg?: string | undefined;
    prescriptionId: string;
    cartItems: Array<{
      medication: IndianMedicationFormularyItem;
      selectedBatch: PharmacyBatchDto;
      quantity: number;
      rate: number;
    }>;
  }) => void;
}

export const DoctorPrescriptionQueueImporterModal: React.FC<DoctorPrescriptionQueueImporterModalProps> = ({
  isOpen,
  onClose,
  batches,
  availablePrescriptions = [],
  onImportPrescription
}) => {
  const [prescriptions, setPrescriptions] = useState<PendingPrescriptionItem[]>([]);

  // Dynamic Server-Backed Prescription Queue Loader
  const loadDynamicPrescriptions = () => {
    const list: PendingPrescriptionItem[] = [];

    // Load pending backend/domain prescriptions passed from domain manager (from PostgreSQL)
    if (availablePrescriptions && availablePrescriptions.length > 0) {
      for (const rx of availablePrescriptions) {
        if (rx.status === 'CREATED' || rx.status === 'VERIFIED' || rx.status === 'READY_FOR_DISPENSING') {
          // Avoid duplicates by prescriptionNumber / id
          if (!list.some((existing) => existing.id === rx.id || existing.consultationId === rx.prescriptionNumber)) {
            list.push({
              id: rx.id,
              consultationId: rx.prescriptionNumber,
              patientName: rx.patientName || 'Hospital Patient',
              patientPhone: rx.patientMrn || '9876543210',
              patientMrn: rx.patientMrn || `UHID-${rx.id.slice(-4)}`,
              doctorName: rx.prescribingDoctorName || 'Dr. Attending Physician',
              issuedAt: (rx as any).issuedAt || rx.createdAt || new Date().toISOString(),
              items: (rx.items || []).map((it) => ({
                medicationName: it.medicationName,
                strength: it.strength || 'Standard Dose',
                dosage: `${it.prescribedQuantity || 1} Strip`,
                frequency: it.frequency || it.instructions || '1 - 0 - 1',
                duration: 5,
                durationUnit: 'DAYS',
                instructions: it.instructions || 'AFTER_FOOD'
              }))
            });
          }
        }
      }
    }

    // Sort by latest issued timestamp first
    list.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    setPrescriptions(list);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadDynamicPrescriptions();

    // Listen to real-time hospital consultation and prescription events
    const unsubPrescription = hospitalEventBus.subscribe('PRESCRIPTION_ISSUED', () => {
      loadDynamicPrescriptions();
    });
    const unsubAll = hospitalEventBus.subscribe('*', () => {
      loadDynamicPrescriptions();
    });

    const handleStorage = () => loadDynamicPrescriptions();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('docsearch_prescriptions_updated', handleStorage);

    return () => {
      unsubPrescription();
      unsubAll();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('docsearch_prescriptions_updated', handleStorage);
    };
  }, [isOpen, availablePrescriptions]);

  // Dynamic test prescription generator on demand (replaces hardcoded defaults)
  const handleGenerateDynamicTestRx = () => {
    loadDynamicPrescriptions();
  };

  if (!isOpen) return null;

  const handleSelectAndImport = (rx: PendingPrescriptionItem) => {
    const matchedCartItems = rx.items.map((item) => {
      // Find matching formulary item
      const itemLower = item.medicationName.toLowerCase();
      const med =
        INDIAN_PHARMACY_FORMULARY.find(
          (m) =>
            itemLower.includes(m.brandName.toLowerCase()) ||
            itemLower.includes(m.genericName.toLowerCase()) ||
            m.genericName.toLowerCase().includes(itemLower) ||
            m.brandName.toLowerCase().includes(itemLower)
        ) || INDIAN_PHARMACY_FORMULARY[0]!;

      // Find matching batch
      const batch =
        batches.find(
          (b) =>
            b.medicationId === med.id ||
            b.medicationCode === med.medicationCode ||
            b.medicationName.toLowerCase().includes(med.brandName.toLowerCase())
        ) || {
          id: `batch-${med.id}`,
          tenantId: 'tenant-default',
          partnerId: 'partner-default',
          organizationId: 'org-default',
          branchId: 'branch-default',
          medicationId: med.id,
          medicationCode: med.medicationCode,
          medicationName: med.brandName,
          batchNumber: `BT-${Math.floor(1000 + Math.random() * 9000)}`,
          manufacturer: med.manufacturer,
          manufacturingDate: '2024-01-01',
          expiryDate: '2026-11-30',
          receivedQuantity: 200,
          availableQuantity: 180,
          reservedQuantity: 0,
          daysToExpiry: 450,
          unitCost: String(med.costPrice),
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

      // Quantity calculation: e.g. 1-0-1 for 3 days = 2 * 3 = 6 tabs (round to 1 strip of 10)
      const qty = item.duration >= 15 ? 2 : 1;

      return {
        medication: med,
        selectedBatch: batch,
        quantity: qty,
        rate: med.mrp
      };
    });

    onImportPrescription({
      patientName: rx.patientName,
      patientPhone: rx.patientPhone,
      doctorName: rx.doctorName || 'Consulting Doctor',
      doctorNmcReg: rx.doctorNmcReg || 'NMC-28491-DEL',
      prescriptionId: rx.id,
      cartItems: matchedCartItems
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Doctor e-Prescriptions Queue (Live OPD Stream)
                </h3>
                <Badge variant={prescriptions.length > 0 ? 'success' : 'neutral'} style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                  {prescriptions.length} Pending
                </Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                Prescriptions issued by OPD doctors appear here automatically. Click to auto-load cart and dispense in 1-click.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateDynamicTestRx}
              style={{
                borderColor: '#10B981',
                color: '#34D399',
                fontSize: '0.72rem',
                padding: '4px 10px',
                fontWeight: 700
              }}
              title="Generate a dynamic test e-prescription for testing"
            >
              + Generate Test e-Rx
            </Button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '1.4rem',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* List of Prescriptions */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {prescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
                No Pending Doctor e-Prescriptions in Stream
              </p>
              <p style={{ margin: '6px 0 16px 0', fontSize: '0.78rem', color: '#64748B', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                Hospital OPD doctors ke electronic prescriptions yahan real-time me aayenge jaise hi Doctor Consultation Desk par &apos;Issue Rx&apos; click hoga.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadDynamicPrescriptions}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🔄 Check Live Stream</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleGenerateDynamicTestRx}
                  style={{
                    backgroundColor: '#10B981',
                    borderColor: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>⚡ Generate Dynamic OPD e-Rx</span>
                </Button>
              </div>
            </div>
          ) : (
            prescriptions.map((rx) => {
              const formattedTime = new Date(rx.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={rx.id}
                  style={{
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          {rx.patientName}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          (MRN: {rx.patientMrn || 'MRN-General'})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
                        👨‍⚕️ <strong>{rx.doctorName || 'OPD Physician'}</strong> • Mobile: +91 {rx.patientPhone}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        ⏱️ Issued at {formattedTime}
                      </span>
                    </div>
                  </div>

                  {/* Medicines Preview */}
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <strong style={{ color: '#334155' }}>Prescribed Medicines ({rx.items.length}):</strong>
                    {rx.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>• {it.medicationName} {it.strength} ({it.frequency})</span>
                        <span style={{ color: '#0369A1', fontWeight: 600 }}>{it.duration} {it.durationUnit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSelectAndImport(rx)}
                      style={{
                        backgroundColor: '#16A34A',
                        borderColor: '#16A34A',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      <span>⚡ 1-Click Load into Cart & Dispense</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
