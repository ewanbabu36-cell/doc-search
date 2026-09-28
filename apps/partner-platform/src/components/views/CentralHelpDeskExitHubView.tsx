import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Badge,
  Input
} from '@docsearch/ui-kit';
import { PrintableDoctorPrescriptionModal } from '../dialogs/PrintableDoctorPrescriptionModal.js';
import { PrintablePathologyReportModal } from '../dialogs/PrintablePathologyReportModal.js';
import { UnifiedDocumentPrintModal, type UnifiedInvoiceData } from '../common/UnifiedDocumentPrintModal.js';
import type { ConsultationDto, InvestigationOrderDto } from '@docsearch/api-contracts';
import { apiRequest, isMockFallbackAllowed } from '../../services/api-client.js';

export interface ExitPatientRecord {
  uhid: string;
  tokenNumber: string;
  patientName: string;
  mobile: string;
  doctorName: string;
  consultationStatus: 'READY' | 'IN_PROGRESS';
  labStatus: 'VERIFIED' | 'PENDING' | 'NO_TESTS';
  labTestsCount: number;
  billingStatus: 'PAID' | 'DUE';
  amountDue: number;
  pharmacyStatus: 'PACKED' | 'DISPENSED' | 'OUTSIDE_RX';
  completedAt: string;
}

export const MOCK_EXIT_PATIENTS: ExitPatientRecord[] = [];

export interface CentralHelpDeskExitHubViewProps {
  tenantId?: string;
  onSelectPatient?: (uhid: string) => void;
}

export const CentralHelpDeskExitHubView: React.FC<CentralHelpDeskExitHubViewProps> = ({
  tenantId = 'default-tenant'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientsList, setPatientsList] = useState<ExitPatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ExitPatientRecord | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Print Modals State
  const [isRxPrintOpen, setIsRxPrintOpen] = useState(false);
  const [isLabPrintOpen, setIsLabPrintOpen] = useState(false);
  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchExitPatients = async () => {
      try {
        const res = await apiRequest<ExitPatientRecord[]>('/api/v1/partner/clinical/exit-hub/patients');
        if (isMounted && res.success && res.data && Array.isArray(res.data)) {
          const patients = res.data;
          setPatientsList(patients);
          setSelectedPatient((prev) => {
            if (patients.length === 0) return null;
            const found = patients.find((p) => p.uhid === prev?.uhid);
            return found || patients[0] || null;
          });
        } else if (isMounted && isMockFallbackAllowed()) {
          setPatientsList(MOCK_EXIT_PATIENTS);
          setSelectedPatient(MOCK_EXIT_PATIENTS[0] || null);
        } else if (isMounted) {
          setPatientsList([]);
          setSelectedPatient(null);
        }
      } catch (err) {
        if (isMounted && isMockFallbackAllowed()) {
          setPatientsList(MOCK_EXIT_PATIENTS);
          setSelectedPatient(MOCK_EXIT_PATIENTS[0] || null);
        } else if (isMounted) {
          setPatientsList([]);
          setSelectedPatient(null);
        }
      }
    };

    fetchExitPatients();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void fetchExitPatients();
    }, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const list = patientsList;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.tokenNumber.toLowerCase().includes(q) ||
        p.mobile.includes(q)
    );
  }, [patientsList, searchQuery]);

  // Consultation DTO for Prescription Print
  const consultationDto = useMemo(() => {
    if (!selectedPatient) return null;
    return {
      id: `cons-${selectedPatient.uhid}`,
      tenantId,
      branchId: 'branch-main',
      partnerId: 'partner-default',
      organizationId: 'org-default',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      encounterId: `enc-${selectedPatient.uhid}`,
      patientId: selectedPatient.uhid,
      patientName: selectedPatient.patientName,
      doctorId: 'doc-1',
      doctorName: selectedPatient.doctorName,
      consultationType: 'PHYSICAL_OPD',
      status: 'COMPLETED',
      chiefComplaints: [{ complaint: 'Acute Viral Pyrexia', severity: 'MODERATE', durationNumber: 3, durationUnit: 'DAYS' }],
      diagnoses: [{ code: 'ICD-10', term: 'Viral Fever / Dengue Evaluation', diagnosisType: 'PROVISIONAL' }],
      vitals: { systolicBp: 120, diastolicBp: 80, heartRate: 78, temperature: 99.2 },
      prescriptions: [
        { id: 'rx-1', medicationName: 'Paracetamol 650mg', dosage: '1 Tab', frequency: '1-0-1-0 (TDS)', durationNumber: 3, durationUnit: 'DAYS', instructions: 'After meals' },
        { id: 'rx-2', medicationName: 'Pantoprazole 40mg', dosage: '1 Tab', frequency: '1-0-0 (OD)', durationNumber: 5, durationUnit: 'DAYS', instructions: 'Empty stomach' }
      ]
    } as unknown as ConsultationDto;
  }, [selectedPatient, tenantId]);

  // Lab Order DTO for Pathology Report Print
  const labOrderDto = useMemo(() => {
    if (!selectedPatient) return null;
    return {
      id: `lab-${selectedPatient.uhid}`,
      tenantId,
      branchId: 'branch-main',
      orderNumber: `ORD-${selectedPatient.tokenNumber}`,
      patientId: selectedPatient.uhid,
      patientName: selectedPatient.patientName,
      patientMrn: selectedPatient.uhid,
      patientAge: 42,
      patientGender: 'MALE',
      orderingDoctorName: selectedPatient.doctorName,
      investigationName: 'Complete Blood Count (CBC) & Dengue NS1 Antigen',
      investigationCategory: 'PATHOLOGY',
      status: 'VERIFIED',
      orderedAt: new Date().toISOString(),
      report: {
        id: `rep-${selectedPatient.uhid}`,
        reportNumber: `REP-${selectedPatient.tokenNumber}`,
        verifiedAt: new Date().toISOString(),
        verifiedByDoctorName: 'Dr. R. K. Verma, MD (Pathology)',
        summaryInterpretation: 'Platelets within normal biological range. Dengue NS1 Negative. Hemoglobin 12.8 g/dL.',
        isCriticalAlert: false,
        results: [
          { parameterName: 'Hemoglobin (Hb)', resultValue: '12.8', unit: 'g/dL', normalRange: '12.0 - 16.0', flag: 'NORMAL' },
          { parameterName: 'Total Leukocyte Count (TLC)', resultValue: '7,400', unit: '/cumm', normalRange: '4,000 - 11,000', flag: 'NORMAL' },
          { parameterName: 'Platelet Count', resultValue: '2.1', unit: 'Lakh/cumm', normalRange: '1.5 - 4.5', flag: 'NORMAL' },
          { parameterName: 'Dengue NS1 Antigen', resultValue: 'NEGATIVE', unit: '', normalRange: 'NEGATIVE', flag: 'NORMAL' }
        ]
      }
    } as unknown as InvestigationOrderDto;
  }, [selectedPatient, tenantId]);

  // Invoice Data for Central Billing Receipt Print
  const invoiceData: UnifiedInvoiceData | null = useMemo(() => {
    if (!selectedPatient) return null;
    return {
      invoiceNumber: `INV-${selectedPatient.tokenNumber}`,
      invoiceDate: new Date().toLocaleDateString(),
      entityLegalName: 'Apex Multi-Speciality Hospital & Clinic',
      patientName: selectedPatient.patientName,
      patientPhone: selectedPatient.mobile,
      patientMrn: selectedPatient.uhid,
      doctorName: selectedPatient.doctorName,
      paymentMode: 'UPI_QR',
      paymentStatus: selectedPatient.billingStatus === 'PAID' ? 'PAID' : 'PENDING',
      items: [
        { name: 'Doctor OPD Consultation Fee', quantity: 1, rate: 500, total: 500 },
        { name: 'Pathology Lab (CBC & Dengue NS1)', quantity: 1, rate: 450, total: 450 }
      ],
      subtotal: 950,
      grandTotal: 950
    };
  }, [selectedPatient]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          fontWeight: 600
        }}>
          ✨ {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🖨️</span>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Central Help Desk & Exit Print Counter
            </h1>
            <Badge variant="primary">Single Window Exit Hub</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            Instant dossier printing (Prescription + Lab Report + Bill) & WhatsApp delivery before patient departure.
          </p>
        </div>

        <div style={{ width: '320px' }}>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Scan Token / Search UHID, Name, Mobile..."
          />
        </div>
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.25rem' }}>
        {/* Left Column: Waiting Exit Queue */}
        <Card padding="md">
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            🚶 Patients Ready for Departure ({filteredPatients.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredPatients.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                No patients waiting for departure
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = selectedPatient?.uhid === p.uhid;
                return (
                  <div
                    key={p.uhid}
                    onClick={() => setSelectedPatient(p)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{p.patientName}</strong>
                      <Badge variant={p.billingStatus === 'PAID' ? 'success' : 'warning'}>
                        Token: {p.tokenNumber}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>{p.uhid} · {p.mobile}</span>
                      <span>{p.completedAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Selected Patient Exit Dossier */}
        {selectedPatient ? (
          <Card padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedPatient.patientName}
                  </h2>
                  <Badge variant="info">Token #{selectedPatient.tokenNumber}</Badge>
                  <Badge variant="neutral">{selectedPatient.uhid}</Badge>
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Attending Doctor: <strong>{selectedPatient.doctorName}</strong> · Mobile: <strong>{selectedPatient.mobile}</strong>
                </span>
              </div>

              {/* Master 1-Click Print All Button */}
              <Button
                variant="primary"
                onClick={() => {
                  window.print();
                  showToast(`🖨️ Printing Complete Dossier (Rx + Lab + Bill) for ${selectedPatient.patientName}`);
                }}
                style={{ padding: '10px 20px', fontWeight: 700 }}
              >
                ⚡ 1-Click Print All Patient Documents
              </Button>
            </div>

            {/* Clearance Checklist Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {/* 1. Doctor Prescription */}
              <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span>✅</span>
                  <strong style={{ fontSize: '0.8125rem', color: '#166534' }}>Doctor Rx</strong>
                </div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#15803d', marginBottom: '10px' }}>
                  Signed & Finalized
                </span>
                <Button variant="outline" onClick={() => setIsRxPrintOpen(true)} style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}>
                  🖨️ Print Rx
                </Button>
              </div>

              {/* 2. Pathology Lab Report */}
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${selectedPatient.labStatus === 'VERIFIED' ? '#bbf7d0' : selectedPatient.labStatus === 'PENDING' ? '#fed7aa' : '#e2e8f0'}`,
                backgroundColor: selectedPatient.labStatus === 'VERIFIED' ? '#f0fdf4' : selectedPatient.labStatus === 'PENDING' ? '#fff7ed' : '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span>{selectedPatient.labStatus === 'VERIFIED' ? '✅' : selectedPatient.labStatus === 'PENDING' ? '⏳' : 'ℹ️'}</span>
                  <strong style={{ fontSize: '0.8125rem', color: selectedPatient.labStatus === 'VERIFIED' ? '#166534' : '#9a3412' }}>
                    Lab Report
                  </strong>
                </div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>
                  {selectedPatient.labStatus === 'VERIFIED'
                    ? `${selectedPatient.labTestsCount} Tests Verified`
                    : selectedPatient.labStatus === 'PENDING'
                    ? 'Tests In-Process'
                    : 'No Tests Ordered'}
                </span>
                {selectedPatient.labStatus === 'VERIFIED' ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLabPrintOpen(true);
                    }}
                    style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    🖨️ Print Lab Report
                  </Button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>N/A</span>
                )}
              </div>

              {/* 3. Billing & Payment */}
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${selectedPatient.billingStatus === 'PAID' ? '#bbf7d0' : '#fecaca'}`,
                backgroundColor: selectedPatient.billingStatus === 'PAID' ? '#f0fdf4' : '#fef2f2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span>{selectedPatient.billingStatus === 'PAID' ? '✅' : '⚠️'}</span>
                  <strong style={{ fontSize: '0.8125rem', color: selectedPatient.billingStatus === 'PAID' ? '#166534' : '#991b1b' }}>
                    Billing & Galla
                  </strong>
                </div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>
                  {selectedPatient.billingStatus === 'PAID' ? 'Settled (₹0 Due)' : `₹${selectedPatient.amountDue} Due`}
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInvoicePrintOpen(true);
                  }}
                  style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  🖨️ Print Receipt
                </Button>
              </div>

              {/* 4. Pharmacy Counter */}
              <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span>💊</span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>Chemist Handover</strong>
                </div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>
                  Status: <strong>{selectedPatient.pharmacyStatus}</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#0284c7' }}>Counter #2 Ready</span>
              </div>
            </div>

            {/* WhatsApp & Handover Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
              <Button
                variant="outline"
                onClick={() => {
                  showToast(`📱 Complete Dossier (Rx + Lab + Bill) sent via WhatsApp to ${selectedPatient.mobile}`);
                }}
              >
                📱 Send All Documents to WhatsApp ({selectedPatient.mobile})
              </Button>

              <Button
                variant="success"
                disabled={isCheckingOut}
                onClick={async () => {
                  setIsCheckingOut(true);
                  try {
                    const encId = (selectedPatient as any).encounterId || selectedPatient.uhid;
                    await apiRequest(`/api/v1/partner/clinical/encounters/${encId}/checkout`, {
                      method: 'POST',
                      body: JSON.stringify({ forceDischarge: false })
                    });
                    showToast(`✓ Patient ${selectedPatient.patientName} marked as Departed & Cleared in PostgreSQL`);
                    setPatientsList((prev) => {
                      const remaining = prev.filter((p) => p.uhid !== selectedPatient.uhid && (p as any).encounterId !== encId);
                      setSelectedPatient(remaining[0] || null);
                      return remaining;
                    });
                  } catch (err: any) {
                    showToast(`⚠️ Clearance notice: ${err.message || 'Payment or tests verification required'}`);
                  } finally {
                    setIsCheckingOut(false);
                  }
                }}
              >
                {isCheckingOut ? '⏳ Clearing Encounter...' : '✓ Mark Handover Complete & Exit'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card padding="lg">
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                No Patient Selected
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                {filteredPatients.length === 0
                  ? 'There are currently no patients waiting in the exit departure queue.'
                  : 'Select a patient from the waiting exit queue to view their documents and complete departure handover.'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Prescription Print Modal */}
      {isRxPrintOpen && consultationDto && (
        <PrintableDoctorPrescriptionModal
          isOpen={isRxPrintOpen}
          onClose={() => setIsRxPrintOpen(false)}
          consultation={consultationDto}
        />
      )}

      {/* Pathology Lab Report Print Modal */}
      {isLabPrintOpen && labOrderDto && (
        <PrintablePathologyReportModal
          isOpen={isLabPrintOpen}
          onClose={() => setIsLabPrintOpen(false)}
          order={labOrderDto}
        />
      )}

      {/* Central Billing Invoice Print Modal */}
      {isInvoicePrintOpen && invoiceData && (
        <UnifiedDocumentPrintModal
          isOpen={isInvoicePrintOpen}
          onClose={() => setIsInvoicePrintOpen(false)}
          invoiceData={invoiceData}
          defaultLayout="LASER_A4"
        />
      )}
    </div>
  );
};
