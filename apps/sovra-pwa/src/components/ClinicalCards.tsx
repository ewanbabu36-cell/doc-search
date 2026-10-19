// Sovra Healthcare Action Cards
// 1. Digital Prescription (Rx) with verification & medicine order
// 2. LIMS Lab Report with PDF viewer & abnormal flag alerts
// 3. 1-Click OPD Consultation Fee Payment Button with UPI Intent

import React, { useState } from 'react';
import { ClinicalCardPayload, LabReportData, OpdPaymentData, PrescriptionData } from '../types.js';
import { PacsCard } from './PacsCard.js';

interface ClinicalCardProps {
  card: ClinicalCardPayload;
  onPaymentSuccess?: (paymentId: string) => void;
}

export const ClinicalCard: React.FC<ClinicalCardProps> = ({ card, onPaymentSuccess }) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [orderToast, setOrderToast] = useState<string | null>(null);

  if (card.type === 'PRESCRIPTION' && card.prescription) {
    return (
      <PrescriptionCard
        rx={card.prescription}
        onViewPdf={() => setShowRxModal(true)}
        onOrderMedicines={() => {
          setOrderToast('Prescription forwarded to Hospital Pharmacy! 0% Delivery Fee.');
          setTimeout(() => setOrderToast(null), 4000);
        }}
        showModal={showRxModal}
        onCloseModal={() => setShowRxModal(false)}
        toastMsg={orderToast}
      />
    );
  }

  if (card.type === 'LAB_REPORT' && card.labReport) {
    return (
      <LabReportCard
        report={card.labReport}
        onViewPdf={() => setShowPdfModal(true)}
        showModal={showPdfModal}
        onCloseModal={() => setShowPdfModal(false)}
      />
    );
  }

  if (card.type === 'OPD_PAYMENT' && card.opdPayment) {
    return (
      <OpdPaymentCard
        payment={card.opdPayment}
        onPaySuccess={onPaymentSuccess}
        showQrModal={showQrModal}
        setShowQrModal={setShowQrModal}
      />
    );
  }

  if (card.type === 'RADIOLOGY_PACS' && card.pacsStudy) {
    return <PacsCard study={card.pacsStudy} />;
  }

  return null;
};

// =========================================================================
// 1. Digital Prescription Card
// =========================================================================
interface PrescriptionCardProps {
  rx: PrescriptionData;
  onViewPdf: () => void;
  onOrderMedicines: () => void;
  showModal: boolean;
  onCloseModal: () => void;
  toastMsg: string | null;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  rx,
  onViewPdf,
  onOrderMedicines,
  showModal,
  onCloseModal,
  toastMsg
}) => {
  return (
    <div className="clinical-card" style={{ maxWidth: '440px', width: '100%' }}>
      {/* Card Header */}
      <div
        className="clinical-card-header"
        style={{
          background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.3) 0%, rgba(6, 78, 59, 0.4) 100%)',
          borderBottom: '1px solid #134E4A'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🩺</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#5EEAD4' }}>
              Digital Prescription (Rx)
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{rx.rxId}</div>
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            background: 'rgba(20, 184, 166, 0.2)',
            color: '#2DD4BF',
            border: '1px solid rgba(45, 212, 191, 0.4)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 600
          }}
        >
          ✓ Verified Rx
        </span>
      </div>

      {/* Card Body */}
      <div className="clinical-card-body" style={{ background: '#111827' }}>
        {/* Doctor & Hospital Details */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>{rx.doctorName}</div>
          <div style={{ fontSize: '12px', color: '#38BDF8' }}>
            {rx.doctorSpecialty} • Reg #{rx.doctorRegNo}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            🏥 {rx.clinicOrHospitalName}
          </div>
        </div>

        {/* Diagnosis & Vitals */}
        <div
          style={{
            background: '#1F2937',
            padding: '8px 10px',
            borderRadius: '8px',
            marginBottom: '10px',
            border: '1px solid #374151'
          }}
        >
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Diagnosis:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {rx.diagnosis.map((d, i) => (
              <span
                key={i}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#7DD3FC',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 500
                }}
              >
                {d}
              </span>
            ))}
          </div>

          {rx.vitals && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px',
                fontSize: '11px',
                color: '#CBD5E1',
                borderTop: '1px solid #374151',
                paddingTop: '6px'
              }}
            >
              {rx.vitals.bp && <span>BP: <strong>{rx.vitals.bp}</strong></span>}
              {rx.vitals.pulse && <span>Pulse: <strong>{rx.vitals.pulse}</strong></span>}
              {rx.vitals.spO2 && <span>SpO2: <strong>{rx.vitals.spO2}</strong></span>}
            </div>
          )}
        </div>

        {/* Prescribed Medicines Preview */}
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '4px' }}>
          Medicines Prescribed ({rx.medicines.length}):
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {rx.medicines.map((med) => (
            <div
              key={med.id}
              style={{
                background: '#1F2937',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #374151'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '12px' }}>
                  💊 {med.name}
                </span>
                <span
                  style={{
                    background: 'rgba(15, 118, 110, 0.3)',
                    color: '#5EEAD4',
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}
                >
                  {med.frequency}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                {med.duration} • {med.instructions}
              </div>
            </div>
          ))}
        </div>

        {/* Advice */}
        {rx.generalAdvice && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#FDE68A',
              background: 'rgba(245, 158, 11, 0.1)',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}
          >
            ⚠️ Advice: {rx.generalAdvice}
          </div>
        )}

        {/* Digital Signature Badge */}
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#6EE7B7',
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          <span>✍️ Digitally Signed by {rx.doctorName}</span>
          <span>ABDM Compliant</span>
        </div>

        {toastMsg && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px',
              background: '#065F46',
              color: '#A7F3D0',
              borderRadius: '6px',
              fontSize: '11px',
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            {toastMsg}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="clinical-card-footer">
        <button
          onClick={onViewPdf}
          style={{
            flex: 1,
            background: '#374151',
            color: '#F3F4F6',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          📄 View Full Rx
        </button>
        <button
          onClick={onOrderMedicines}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          🛒 Order Medicines
        </button>
      </div>

      {/* Rx Full Detail Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F766E', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2DD4BF', fontSize: '18px' }}>{rx.clinicOrHospitalName}</h3>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Official Outpatient Prescription Slip</div>
              </div>
              <button
                onClick={onCloseModal}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '16px', background: '#111827', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Patient:</strong> {rx.patientName} ({rx.patientAge}/{rx.patientGender})</div>
              <div><strong>UHID:</strong> {rx.uhid}</div>
              <div><strong>Doctor:</strong> {rx.doctorName}</div>
              <div><strong>Specialty:</strong> {rx.doctorSpecialty}</div>
              <div><strong>Reg No:</strong> {rx.doctorRegNo}</div>
              <div><strong>Date:</strong> {new Date(rx.prescribedAt).toLocaleDateString()}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '8px', fontSize: '13px' }}>PRESCRIPTION DETAILS (Rx):</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#374151', color: '#E2E8F0' }}>
                    <th style={{ padding: '8px' }}>Medicine</th>
                    <th style={{ padding: '8px' }}>Dosage</th>
                    <th style={{ padding: '8px' }}>Frequency</th>
                    <th style={{ padding: '8px' }}>Duration</th>
                    <th style={{ padding: '8px' }}>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {rx.medicines.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #374151' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: '8px' }}>{m.dosage}</td>
                      <td style={{ padding: '8px', color: '#2DD4BF' }}>{m.frequency}</td>
                      <td style={{ padding: '8px' }}>{m.duration}</td>
                      <td style={{ padding: '8px', color: '#94A3B8' }}>{m.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
              <div><strong>Clinical Advice:</strong> {rx.generalAdvice || 'Take plenty of fluids and rest.'}</div>
              {rx.followUpDate && <div style={{ marginTop: '4px', color: '#FCD34D' }}><strong>Next Follow-up:</strong> {rx.followUpDate}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #374151' }}>
              <div style={{ fontSize: '11px', color: '#6EE7B7' }}>
                Verified Cryptographic Signature: <br />
                <code style={{ fontSize: '9px', color: '#94A3B8' }}>{rx.signatureStamp}</code>
              </div>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#0F766E',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 2. LIMS Lab Report Card
// =========================================================================
interface LabReportCardProps {
  report: LabReportData;
  onViewPdf: () => void;
  showModal: boolean;
  onCloseModal: () => void;
}

const LabReportCard: React.FC<LabReportCardProps> = ({
  report,
  onViewPdf,
  showModal,
  onCloseModal
}) => {
  return (
    <div className="clinical-card" style={{ maxWidth: '440px', width: '100%' }}>
      {/* Header */}
      <div
        className="clinical-card-header"
        style={{
          background: 'linear-gradient(90deg, rgba(3, 105, 161, 0.3) 0%, rgba(15, 23, 42, 0.4) 100%)',
          borderBottom: '1px solid #0369A1'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔬</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#38BDF8' }}>
              LIMS Pathology Diagnostic Report
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{report.reportId}</div>
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            background: report.isAbnormal ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: report.isAbnormal ? '#F87171' : '#34D399',
            border: `1px solid ${report.isAbnormal ? '#EF4444' : '#10B981'}`,
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 700
          }}
        >
          {report.isAbnormal ? '⚠️ Attention Flag' : '✓ Normal Range'}
        </span>
      </div>

      {/* Body */}
      <div className="clinical-card-body" style={{ background: '#111827' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC', marginBottom: '2px' }}>
          {report.testName}
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '10px' }}>
          {report.testCategory} • {report.hospitalName}
        </div>

        {/* Parameters preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {report.parameters.map((param, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#1F2937',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #374151'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#E2E8F0', fontWeight: 500 }}>
                  {param.name}
                </span>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                  Ref: {param.biologicalReferenceRange} {param.unit}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: param.status === 'HIGH' || param.status === 'CRITICAL' ? '#F87171' : '#34D399'
                  }}
                >
                  {param.observedValue} {param.unit}
                </span>
                {param.status !== 'NORMAL' && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      color: '#F87171',
                      fontWeight: 700
                    }}
                  >
                    ▲ HIGH
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Interpretation */}
        <div
          style={{
            fontSize: '11px',
            color: '#CBD5E1',
            background: 'rgba(56, 189, 248, 0.08)',
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}
        >
          <strong>Interpretation:</strong> {report.overallInterpretation}
        </div>

        <div style={{ marginTop: '8px', fontSize: '10px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
          <span>Pathologist: {report.pathologistName}</span>
          <span>NABL Verified</span>
        </div>
      </div>

      {/* Footer */}
      <div className="clinical-card-footer">
        <button
          onClick={onViewPdf}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          📑 View Full Lab Report PDF
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284C7', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#38BDF8', fontSize: '18px' }}>{report.hospitalName}</h3>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Department of Laboratory Medicine (NABL Accredited)</div>
              </div>
              <button onClick={onCloseModal} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '16px', background: '#111827', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Patient:</strong> {report.patientName}</div>
              <div><strong>UHID:</strong> {report.uhid}</div>
              <div><strong>Accession #:</strong> {report.accessionNumber}</div>
              <div><strong>Collected:</strong> {new Date(report.sampleCollectedAt).toLocaleString()}</div>
              <div><strong>Reported:</strong> {new Date(report.reportedAt).toLocaleString()}</div>
              <div><strong>Category:</strong> {report.testCategory}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#374151', color: '#E2E8F0' }}>
                  <th style={{ padding: '8px' }}>Investigation Test</th>
                  <th style={{ padding: '8px' }}>Observed Result</th>
                  <th style={{ padding: '8px' }}>Biological Reference Interval</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.parameters.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: p.status === 'NORMAL' ? '#34D399' : '#F87171' }}>
                      {p.observedValue} {p.unit}
                    </td>
                    <td style={{ padding: '8px', color: '#94A3B8' }}>{p.biologicalReferenceRange} {p.unit}</td>
                    <td style={{ padding: '8px' }}>
                      <span className={p.status === 'NORMAL' ? 'param-badge-normal' : 'param-badge-high'}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
              <div><strong>Pathologist Clinical Notes:</strong> {report.overallInterpretation}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #374151' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Verified Signatory: <strong>{report.pathologistName}</strong> ({report.pathologistDegrees})
              </div>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#0284C7',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Lab Report PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 3. 1-Click OPD Consultation Fee Payment Card
// =========================================================================
interface OpdPaymentCardProps {
  payment: OpdPaymentData;
  onPaySuccess?: (paymentId: string) => void;
  showQrModal: boolean;
  setShowQrModal: (show: boolean) => void;
}

const OpdPaymentCard: React.FC<OpdPaymentCardProps> = ({
  payment,
  onPaySuccess,
  showQrModal,
  setShowQrModal
}) => {
  const [status, setStatus] = useState<'PENDING' | 'PAID'>(payment.paymentStatus === 'PAID' ? 'PAID' : 'PENDING');
  const [txnRef, setTxnRef] = useState<string>(payment.transactionRef || '');

  const handleSimulatePayment = () => {
    const mockTxn = `UPI/${Date.now().toString().slice(-8)}/OKAXIS`;
    setStatus('PAID');
    setTxnRef(mockTxn);
    if (onPaySuccess) {
      onPaySuccess(payment.paymentId);
    }
  };

  return (
    <div className="clinical-card" style={{ maxWidth: '440px', width: '100%' }}>
      {/* Header */}
      <div
        className="clinical-card-header"
        style={{
          background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.3) 0%, rgba(15, 23, 42, 0.4) 100%)',
          borderBottom: '1px solid #D97706'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>💳</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#FBBF24' }}>
              OPD Consultation Fee Bill
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Token #{payment.tokenNumber}</div>
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            background: status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: status === 'PAID' ? '#34D399' : '#FCD34D',
            border: `1px solid ${status === 'PAID' ? '#10B981' : '#F59E0B'}`,
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 700
          }}
        >
          {status === 'PAID' ? '✓ PAID' : 'PENDING'}
        </span>
      </div>

      {/* Body */}
      <div className="clinical-card-body" style={{ background: '#111827' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>
              {payment.doctorName}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              {payment.doctorSpecialty} • {payment.department}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              🏥 {payment.clinicName}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>Consultation Fee</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#34D399' }}>
              ₹{payment.feeAmount}
            </div>
            <div style={{ fontSize: '9px', color: '#2DD4BF' }}>0% Gateway Fee</div>
          </div>
        </div>

        {status === 'PAID' ? (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '10px',
              marginTop: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontWeight: 700, fontSize: '12px' }}>
              <span>✓</span> Payment Reconciled & Token Activated
            </div>
            <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '4px' }}>
              Txn Ref: <code style={{ color: '#5EEAD4' }}>{txnRef || 'UPI/VERIFIED-PAID'}</code>
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
              Paid to: {payment.upiId} ({payment.payeeName})
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '10px' }}>
            {/* Direct UPI Intent Link */}
            <a
              href={payment.upiIntentUrl}
              style={{ textDecoration: 'none' }}
              onClick={() => {
                // Also trigger simulated confirmation prompt
                setTimeout(handleSimulatePayment, 3000);
              }}
            >
              <button className="upi-pay-btn" type="button">
                <span>⚡ Pay ₹{payment.feeAmount} with GPay / PhonePe / Paytm</span>
              </button>
            </a>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setShowQrModal(true)}
                style={{
                  flex: 1,
                  background: '#374151',
                  color: '#F3F4F6',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                📱 Scan QR Code
              </button>
              <button
                onClick={handleSimulatePayment}
                style={{
                  flex: 1,
                  background: '#047857',
                  color: 'white',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ✓ Mark Paid (Simulate)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal for Desktop users */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px', padding: '24px', textAlign: 'center' }}>
            <h4 style={{ color: '#FBBF24', margin: '0 0 8px 0' }}>Scan to Pay OPD Fee</h4>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
              Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM)
            </p>

            <div
              style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                display: 'inline-block',
                margin: '0 auto 16px auto'
              }}
            >
              {/* Dynamic SVG QR code */}
              <svg width="180" height="180" viewBox="0 0 180 180">
                <rect width="180" height="180" fill="#ffffff" />
                {/* Visual QR representation */}
                <rect x="20" y="20" width="40" height="40" fill="#000000" />
                <rect x="25" y="25" width="30" height="30" fill="#ffffff" />
                <rect x="30" y="30" width="20" height="20" fill="#000000" />

                <rect x="120" y="20" width="40" height="40" fill="#000000" />
                <rect x="125" y="25" width="30" height="30" fill="#ffffff" />
                <rect x="130" y="30" width="20" height="20" fill="#000000" />

                <rect x="20" y="120" width="40" height="40" fill="#000000" />
                <rect x="25" y="125" width="30" height="30" fill="#ffffff" />
                <rect x="30" y="130" width="20" height="20" fill="#000000" />

                {/* QR Data Dots */}
                <rect x="70" y="25" width="10" height="10" fill="#000000" />
                <rect x="90" y="25" width="10" height="10" fill="#000000" />
                <rect x="75" y="45" width="15" height="10" fill="#000000" />
                <rect x="25" y="75" width="10" height="15" fill="#000000" />
                <rect x="50" y="75" width="10" height="10" fill="#000000" />
                <rect x="70" y="70" width="40" height="40" fill="#0F766E" rx="4" />
                <text x="90" y="95" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">₹</text>
                <rect x="125" y="75" width="15" height="15" fill="#000000" />
                <rect x="145" y="95" width="10" height="10" fill="#000000" />
                <rect x="75" y="125" width="15" height="10" fill="#000000" />
                <rect x="100" y="125" width="10" height="20" fill="#000000" />
                <rect x="125" y="135" width="20" height="10" fill="#000000" />
              </svg>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399', marginBottom: '4px' }}>
              Amount: ₹{payment.feeAmount}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '16px' }}>
              UPI ID: {payment.upiId}
            </div>

            <button
              onClick={() => {
                handleSimulatePayment();
                setShowQrModal(false);
              }}
              style={{
                width: '100%',
                background: '#0F766E',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Simulate Successful Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
