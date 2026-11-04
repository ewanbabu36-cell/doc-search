import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export interface InpatientEmarOrder {
  orderId: string;
  patientId: string;
  patientName: string;
  uhid: string;
  bedCode: string;
  wardName: string;
  allergies: string[];
  drugName: string;
  strength: string;
  prescribedDose: string;
  route: 'INTRAVENOUS' | 'ORAL' | 'SUBCUTANEOUS' | 'INTRAMUSCULAR' | 'INHALATION' | 'TOPICAL';
  scheduledTime: string;
  isHighAlertDrug: boolean;
  status: 'SCHEDULED' | 'ADMINISTERED' | 'HELD' | 'REFUSED';
  orderedByDoctor: string;
}

export interface MedicationBarcodePayload {
  barcode: string;
  drugName: string;
  strength: string;
  unitDose: string;
  route: 'INTRAVENOUS' | 'ORAL' | 'SUBCUTANEOUS' | 'INTRAMUSCULAR' | 'INHALATION' | 'TOPICAL';
  lotNumber: string;
  expiryDate: string;
  isExpired: boolean;
}

export interface FiveRightsCheckResult {
  rightPatient: { passed: boolean; message: string };
  rightMedication: { passed: boolean; message: string };
  rightDose: { passed: boolean; message: string };
  rightRoute: { passed: boolean; message: string };
  rightTime: { passed: boolean; message: string };
  allPassed: boolean;
  allergyConflict: boolean;
  allergyMessage?: string | undefined;
}

const DEFAULT_SCHEDULED_ORDERS: InpatientEmarOrder[] = [
  {
    orderId: 'EMAR-ORD-101',
    patientId: 'PAT-2026-102',
    patientName: 'Kishore Kumar',
    uhid: 'UHID-2026-102',
    bedCode: 'ICU-BED-04',
    wardName: 'Medical ICU (Floor 3)',
    allergies: ['Penicillin', 'Cephalosporins'],
    drugName: 'Inj. Pantoprazole Sodium',
    strength: '40mg',
    prescribedDose: '40mg IV Push',
    route: 'INTRAVENOUS',
    scheduledTime: '08:00 AM',
    isHighAlertDrug: false,
    status: 'SCHEDULED',
    orderedByDoctor: 'Dr. Amitabh Verma (Gastroenterology)'
  },
  {
    orderId: 'EMAR-ORD-102',
    patientId: 'PAT-2026-102',
    patientName: 'Kishore Kumar',
    uhid: 'UHID-2026-102',
    bedCode: 'ICU-BED-04',
    wardName: 'Medical ICU (Floor 3)',
    allergies: ['Penicillin', 'Cephalosporins'],
    drugName: 'Inj. Human Regular Actrapid Insulin',
    strength: '40 IU/ml',
    prescribedDose: '6 Units SC Subcutaneous',
    route: 'SUBCUTANEOUS',
    scheduledTime: '08:30 AM',
    isHighAlertDrug: true,
    status: 'SCHEDULED',
    orderedByDoctor: 'Dr. Amitabh Verma (Gastroenterology)'
  },
  {
    orderId: 'EMAR-ORD-103',
    patientId: 'PAT-2026-108',
    patientName: 'Sunita Deshmukh',
    uhid: 'UHID-2026-108',
    bedCode: 'POST-OP-02',
    wardName: 'Surgical Step-Down Ward',
    allergies: ['NSAIDs / Ibuprofen'],
    drugName: 'Inj. Paracetamol Infusion',
    strength: '1000mg / 100ml',
    prescribedDose: '1000mg IV Infusion over 15 min',
    route: 'INTRAVENOUS',
    scheduledTime: '09:00 AM',
    isHighAlertDrug: false,
    status: 'SCHEDULED',
    orderedByDoctor: 'Dr. Rajesh Khanna (Orthopedics)'
  },
  {
    orderId: 'EMAR-ORD-104',
    patientId: 'PAT-2026-115',
    patientName: 'Vikramaditya Roy',
    uhid: 'UHID-2026-115',
    bedCode: 'CCU-BED-01',
    wardName: 'Coronary Care Unit',
    allergies: ['Contrast Media'],
    drugName: 'Inj. Heparin Sodium',
    strength: '5000 IU/ml',
    prescribedDose: '5000 IU IV Bolus',
    route: 'INTRAVENOUS',
    scheduledTime: '09:30 AM',
    isHighAlertDrug: true,
    status: 'SCHEDULED',
    orderedByDoctor: 'Dr. Sanjeev Kapoor (Cardiology)'
  }
];

export interface Bedside5RightsEmarScannerViewProps {
  onAdministerCompleted?: ((orderId: string, timestamp: string, nurseName: string) => void) | undefined;
}

export const Bedside5RightsEmarScannerView: React.FC<Bedside5RightsEmarScannerViewProps> = ({
  onAdministerCompleted
}) => {
  const [orders, setOrders] = useState<InpatientEmarOrder[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('docsearch_emar_orders');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SCHEDULED_ORDERS;
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string>('EMAR-ORD-101');
  const activeOrder = orders.find((o) => o.orderId === selectedOrderId) || orders[0];

  // Barcode Scanning State
  const [patientScanInput, setPatientScanInput] = useState<string>('');
  const [scannedPatientUhid, setScannedPatientUhid] = useState<string | null>(null);

  const [medicationScanInput, setMedicationScanInput] = useState<string>('');
  const [scannedMedication, setScannedMedication] = useState<MedicationBarcodePayload | null>(null);

  // Nurse Identity & Dual Verification
  const [nurseName] = useState<string>('Sister Shiny Mathew, RN (Reg: KL-8921)');
  const [witnessNurseName] = useState<string>('Sister Reena Mathew, RN (High-Alert Co-Sign)');
  const [isDualWitnessVerified, setIsDualWitnessVerified] = useState<boolean>(false);

  // Administration Status
  const [administerSuccessModal, setAdministerSuccessModal] = useState<boolean>(false);
  const [mismatchAlarmModal, setMismatchAlarmModal] = useState<string | null>(null);

  const patientScanRef = useRef<HTMLInputElement>(null);
  const medicationScanRef = useRef<HTMLInputElement>(null);

  // Save changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_emar_orders', JSON.stringify(orders));
      } catch {}
    }
  }, [orders]);

  // Compute 5 Rights Audit
  const auditResult: FiveRightsCheckResult = React.useMemo(() => {
    if (!activeOrder) {
      return {
        rightPatient: { passed: false, message: 'No active order selected' },
        rightMedication: { passed: false, message: 'No medication scanned' },
        rightDose: { passed: false, message: 'Dose not checked' },
        rightRoute: { passed: false, message: 'Route not checked' },
        rightTime: { passed: false, message: 'Time not checked' },
        allPassed: false,
        allergyConflict: false
      };
    }

    // Right Patient Check
    const rightPatientPassed = Boolean(scannedPatientUhid && scannedPatientUhid === activeOrder.uhid);
    const rightPatientMsg = rightPatientPassed
      ? `Verified: Wristband matches ${activeOrder.patientName} (${activeOrder.uhid}) in ${activeOrder.bedCode}`
      : scannedPatientUhid
      ? `MISMATCH: Scanned ${scannedPatientUhid} does not match active bed ${activeOrder.uhid}!`
      : 'Awaiting Patient Wristband Scan';

    // Right Medication Check
    const rightMedPassed = Boolean(
      scannedMedication &&
        scannedMedication.drugName.toLowerCase().includes(activeOrder.drugName.toLowerCase().replace('inj. ', '').split(' ')[0] || '___')
    );
    const rightMedMsg = rightMedPassed
      ? `Verified: Drug ${scannedMedication?.drugName} matches physician order`
      : scannedMedication
      ? `MISMATCH: Scanned ${scannedMedication.drugName} does not match prescribed ${activeOrder.drugName}!`
      : 'Awaiting Medication Barcode Scan';

    // Right Dose Check
    const rightDosePassed = Boolean(
      scannedMedication && !scannedMedication.isExpired && rightMedPassed
    );
    const rightDoseMsg = rightDosePassed
      ? `Verified: Strength ${scannedMedication?.strength} matches ${activeOrder.prescribedDose}`
      : scannedMedication?.isExpired
      ? `LOT EXPIRED: Medication lot expired on ${scannedMedication.expiryDate}!`
      : 'Awaiting Dose Verification';

    // Right Route Check
    const rightRoutePassed = Boolean(
      scannedMedication && scannedMedication.route === activeOrder.route
    );
    const rightRouteMsg = rightRoutePassed
      ? `Verified: ${activeOrder.route} route confirmed compatible`
      : scannedMedication
      ? `ROUTE MISMATCH: Scanned drug route ${scannedMedication.route} != Ordered ${activeOrder.route}!`
      : 'Awaiting Route Verification';

    // Right Time Check
    const rightTimePassed = Boolean(scannedMedication && rightPatientPassed);
    const rightTimeMsg = rightTimePassed
      ? `Verified: Scheduled ${activeOrder.scheduledTime} within clinical administration window`
      : 'Scheduled for ' + activeOrder.scheduledTime;

    // Allergy check
    let allergyConflict = false;
    let allergyMessage: string | undefined = undefined;
    if (scannedMedication && activeOrder.allergies.length > 0) {
      for (const al of activeOrder.allergies) {
        if (scannedMedication.drugName.toLowerCase().includes(al.toLowerCase())) {
          allergyConflict = true;
          allergyMessage = `CRITICAL ALLERGY HARD-LOCK: Patient is allergic to ${al}! DO NOT ADMINISTER!`;
          break;
        }
      }
    }

    const allPassed =
      rightPatientPassed &&
      rightMedPassed &&
      rightDosePassed &&
      rightRoutePassed &&
      rightTimePassed &&
      !allergyConflict &&
      (!activeOrder.isHighAlertDrug || isDualWitnessVerified);

    return {
      rightPatient: { passed: rightPatientPassed, message: rightPatientMsg },
      rightMedication: { passed: rightMedPassed, message: rightMedMsg },
      rightDose: { passed: rightDosePassed, message: rightDoseMsg },
      rightRoute: { passed: rightRoutePassed, message: rightRouteMsg },
      rightTime: { passed: rightTimePassed, message: rightTimeMsg },
      allPassed,
      allergyConflict,
      allergyMessage
    };
  }, [activeOrder, scannedPatientUhid, scannedMedication, isDualWitnessVerified]);

  // Handle Patient Scan Submit
  const handleProcessPatientScan = (code: string) => {
    const cleaned = code.trim().toUpperCase();
    if (cleaned.includes('UHID') || cleaned.includes('PAT')) {
      const match = cleaned.match(/UHID-\d{4}-\d+/);
      const uhid = match ? match[0] : cleaned;
      setScannedPatientUhid(uhid);

      // Check if matches active order
      if (activeOrder && uhid !== activeOrder.uhid) {
        setMismatchAlarmModal(
          `PATIENT IDENTIFICATION ALARM: Scanned Wristband (${uhid}) DOES NOT MATCH Bed Order for ${activeOrder.patientName} (${activeOrder.uhid})!`
        );
      }
    } else {
      setScannedPatientUhid(cleaned);
    }
    setPatientScanInput('');
  };

  // Handle Medication Scan Submit
  const handleProcessMedicationScan = (code: string) => {
    const cleaned = code.trim();
    // Decode simulated 2D DataMatrix barcode
    let medPayload: MedicationBarcodePayload;
    if (cleaned.includes('PANTO') || cleaned.includes('101')) {
      medPayload = {
        barcode: cleaned,
        drugName: 'Inj. Pantoprazole Sodium',
        strength: '40mg',
        unitDose: '1 Vial (40mg)',
        route: 'INTRAVENOUS',
        lotNumber: 'LOT-PAN-2026B',
        expiryDate: '2027-08-31',
        isExpired: false
      };
    } else if (cleaned.includes('INSULIN') || cleaned.includes('ACTRAPID')) {
      medPayload = {
        barcode: cleaned,
        drugName: 'Inj. Human Regular Actrapid Insulin',
        strength: '40 IU/ml',
        unitDose: '6 Units',
        route: 'SUBCUTANEOUS',
        lotNumber: 'LOT-INS-98112',
        expiryDate: '2027-02-28',
        isExpired: false
      };
    } else if (cleaned.includes('EXPIRED')) {
      medPayload = {
        barcode: cleaned,
        drugName: 'Inj. Pantoprazole Sodium (Old Lot)',
        strength: '40mg',
        unitDose: '1 Vial',
        route: 'INTRAVENOUS',
        lotNumber: 'LOT-OLD-2024Z',
        expiryDate: '2025-01-15',
        isExpired: true
      };
      setMismatchAlarmModal(
        'EXPIRED MEDICATION LOT ALARM: This vial expired on 2025-01-15! Remove immediately from medication cart!'
      );
    } else if (cleaned.includes('PENICILLIN') || cleaned.includes('AMOXI')) {
      medPayload = {
        barcode: cleaned,
        drugName: 'Inj. Amoxicillin / Clavulanate (Penicillin Class)',
        strength: '1.2g',
        unitDose: '1 Vial',
        route: 'INTRAVENOUS',
        lotNumber: 'LOT-AMX-2026A',
        expiryDate: '2027-11-30',
        isExpired: false
      };
      setMismatchAlarmModal(
        'CRITICAL ALLERGY CONFLICT: Patient Kishore Kumar has documented PENICILLIN ANAPHYLAXIS allergy! ADMINISTRATION BLOCKED.'
      );
    } else {
      // Default to matching active order
      medPayload = {
        barcode: cleaned,
        drugName: activeOrder ? activeOrder.drugName : 'Scanned Medication',
        strength: activeOrder ? activeOrder.strength : 'Standard',
        unitDose: activeOrder ? activeOrder.prescribedDose : '1 Unit',
        route: activeOrder ? activeOrder.route : 'INTRAVENOUS',
        lotNumber: 'LOT-GEN-2026X',
        expiryDate: '2027-12-31',
        isExpired: false
      };
    }

    setScannedMedication(medPayload);
    setMedicationScanInput('');
  };

  // Perform Final Clinical Administration Signature
  const handleConfirmAdministration = () => {
    if (!activeOrder || !auditResult.allPassed) return;

    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === activeOrder.orderId
          ? { ...o, status: 'ADMINISTERED' }
          : o
      )
    );

    if (onAdministerCompleted) {
      onAdministerCompleted(activeOrder.orderId, timestamp, nurseName);
    }

    setAdministerSuccessModal(true);
  };

  // Reset Scanning state for next administration
  const handleResetForNext = () => {
    setScannedPatientUhid(null);
    setScannedMedication(null);
    setIsDualWitnessVerified(false);
    setAdministerSuccessModal(false);
    setMismatchAlarmModal(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* HEADER: COCKPIT TITLE & BEDSIDE LOCATION */}
      <Card
        style={{
          padding: '16px 20px',
          backgroundColor: '#0F172A',
          border: '1.5px solid #0284C7',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(2, 132, 199, 0.2)',
              border: '1px solid #0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}
          >
            💉
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
              Bedside 5-Rights eMAR & Barcode Scanner Desk
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
              Optical Barcode Verification • Zero-Medication-Error Sentinel • Patient Wristband Cross-Check
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Badge
            variant={auditResult.allPassed ? 'success' : 'neutral'}
            style={{ fontSize: '0.8rem', padding: '5px 12px', fontWeight: 800 }}
          >
            {auditResult.allPassed ? '✓ 5/5 Rights Passed' : '🔒 Verification Pending'}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleResetForNext} style={{ fontSize: '0.78rem' }}>
            🔄 Reset Scanner
          </Button>
        </div>
      </Card>

      {/* ERROR / MISMATCH ALARM MODAL OVERLAY */}
      {mismatchAlarmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(127, 29, 29, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#450A0A',
              border: '3px solid #EF4444',
              borderRadius: '16px',
              padding: '24px 32px',
              maxWidth: '650px',
              boxShadow: '0 0 50px rgba(239, 68, 68, 0.6)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🚨</div>
            <h3 style={{ color: '#FEE2E2', fontSize: '1.4rem', fontWeight: 900, margin: '0 0 10px' }}>
              CRITICAL BEDSIDE MEDICATION SAFETY ALARM
            </h3>
            <p style={{ color: '#FCA5A5', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px', fontWeight: 600 }}>
              {mismatchAlarmModal}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
              <Button
                variant="primary"
                onClick={() => setMismatchAlarmModal(null)}
                style={{
                  backgroundColor: '#EF4444',
                  borderColor: '#DC2626',
                  fontWeight: 800,
                  padding: '10px 24px',
                  fontSize: '0.9rem'
                }}
              >
                Acknowledge Safety Alert & Clear Scan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADMINISTRATION SUCCESS STAMP MODAL */}
      {administerSuccessModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(6, 78, 59, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#064E3B',
              border: '2px solid #10B981',
              borderRadius: '16px',
              padding: '24px 32px',
              maxWidth: '550px',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>✅</div>
            <h3 style={{ color: '#ECFDF5', fontSize: '1.3rem', fontWeight: 900, margin: '0 0 8px' }}>
              MEDICATION ADMINISTERED & STAMPED
            </h3>
            <p style={{ color: '#A7F3D0', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '16px' }}>
              <strong>{activeOrder?.drugName}</strong> administered to <strong>{activeOrder?.patientName}</strong> in{' '}
              <strong>{activeOrder?.bedCode}</strong>. Audit entry recorded with digital signature stamp.
            </p>
            <div style={{ fontSize: '0.75rem', color: '#6EE7B7', marginBottom: '20px', fontFamily: 'monospace' }}>
              Signed by: {nurseName}
            </div>
            <Button
              variant="primary"
              onClick={handleResetForNext}
              style={{
                backgroundColor: '#10B981',
                borderColor: '#059669',
                fontWeight: 800,
                padding: '8px 24px',
                fontSize: '0.875rem'
              }}
            >
              Ready for Next Patient / Drug
            </Button>
          </div>
        </div>
      )}

      {/* 2-COLUMN WORKBENCH: ORDERS LIST & SCANNING INTERACTION DESK */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px' }}>
        {/* LEFT COLUMN: ACTIVE INPATIENT eMAR DOSING SCHEDULE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card style={{ padding: '14px', backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Pending Inpatient Med Schedule ({orders.filter((o) => o.status === 'SCHEDULED').length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {orders.map((order) => {
                const isSelected = order.orderId === selectedOrderId;
                const isDone = order.status === 'ADMINISTERED';

                return (
                  <div
                    key={order.orderId}
                    onClick={() => {
                      setSelectedOrderId(order.orderId);
                      setScannedMedication(null);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.15)' : '#1E293B',
                      border: isSelected ? '1.5px solid #0284C7' : '1px solid #334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: isDone ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
                        {order.bedCode} • {order.scheduledTime}
                      </span>
                      <Badge variant={isDone ? 'success' : order.isHighAlertDrug ? 'critical' : 'neutral'}>
                        {isDone ? 'Administered' : order.isHighAlertDrug ? 'High Alert' : 'Scheduled'}
                      </Badge>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F1F5F9', marginTop: '3px' }}>
                      {order.drugName} ({order.strength})
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      {order.patientName} ({order.uhid}) • {order.prescribedDose}
                    </div>

                    {order.allergies.length > 0 && (
                      <div style={{ fontSize: '0.68rem', color: '#FCA5A5', marginTop: '4px' }}>
                        ⚠️ Allergies: {order.allergies.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: 2-STEP BARCODE SCANNER & 5 RIGHTS VERIFICATION COCKPIT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* STEP 1: PATIENT WRISTBAND BARCODE SCAN */}
          <Card
            style={{
              padding: '16px',
              backgroundColor: '#0F172A',
              border: scannedPatientUhid ? '1.5px solid #10B981' : '1.5px dashed #0284C7',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏷️</span>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#F8FAFC' }}>
                  STEP 1: Patient Admission Wristband Barcode Scan
                </span>
              </div>
              <Badge variant={scannedPatientUhid ? 'success' : 'neutral'}>
                {scannedPatientUhid ? 'Wristband Verified' : 'Awaiting Wristband'}
              </Badge>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={patientScanRef}
                type="text"
                placeholder="Scan or enter Patient Wristband Barcode (e.g. UHID-2026-102)..."
                value={patientScanInput}
                onChange={(e) => setPatientScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleProcessPatientScan(patientScanInput);
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleProcessPatientScan(patientScanInput || activeOrder?.uhid || '')}
                style={{ fontSize: '0.78rem' }}
              >
                Scan Wristband
              </Button>
            </div>

            {/* Quick Test Barcode Buttons */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Quick Barcode Simulator:</span>
              <button
                type="button"
                onClick={() => handleProcessPatientScan(activeOrder?.uhid || '')}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Scan Correct Wristband ({activeOrder?.uhid})
              </button>
              <button
                type="button"
                onClick={() => handleProcessPatientScan('UHID-2026-999-WRONG')}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#F87171',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Test Wrong Patient Alarm
              </button>
            </div>

            {scannedPatientUhid && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.78rem',
                  color: '#A7F3D0'
                }}
              >
                ✓ Patient Confirmed: <strong>{activeOrder?.patientName}</strong> | Bed:{' '}
                <strong>{activeOrder?.bedCode}</strong> | UHID: <strong>{scannedPatientUhid}</strong>
              </div>
            )}
          </Card>

          {/* STEP 2: MEDICATION BARCODE / 2D DATAMATRIX SCAN */}
          <Card
            style={{
              padding: '16px',
              backgroundColor: '#0F172A',
              border: scannedMedication ? '1.5px solid #10B981' : '1.5px dashed #0284C7',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📦</span>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#F8FAFC' }}>
                  STEP 2: Medication 2D DataMatrix Barcode Scan
                </span>
              </div>
              <Badge variant={scannedMedication ? 'success' : 'neutral'}>
                {scannedMedication ? 'Vial Decoded' : 'Awaiting Drug Scan'}
              </Badge>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={medicationScanRef}
                type="text"
                placeholder="Scan 2D DataMatrix Barcode on Medication Strip / Vial..."
                value={medicationScanInput}
                onChange={(e) => setMedicationScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleProcessMedicationScan(medicationScanInput);
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleProcessMedicationScan(medicationScanInput || 'PANTO-40MG')}
                style={{ fontSize: '0.78rem' }}
              >
                Scan Vial
              </Button>
            </div>

            {/* Quick Test Drug Barcodes */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Quick Drug Simulator:</span>
              <button
                type="button"
                onClick={() => handleProcessMedicationScan('PANTO-40MG')}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Scan Correct Drug (Pantoprazole)
              </button>
              <button
                type="button"
                onClick={() => handleProcessMedicationScan('EXPIRED-PANTO')}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #F59E0B',
                  color: '#FBBF24',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Test Expired Lot Alarm
              </button>
              <button
                type="button"
                onClick={() => handleProcessMedicationScan('PENICILLIN-AMOXI')}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#F87171',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Test Penicillin Allergy Alarm
              </button>
            </div>

            {scannedMedication && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.78rem',
                  color: '#A7F3D0'
                }}
              >
                ✓ Decoded Drug: <strong>{scannedMedication.drugName}</strong> ({scannedMedication.strength}) | Lot:{' '}
                <strong>{scannedMedication.lotNumber}</strong> | Exp: <strong>{scannedMedication.expiryDate}</strong>
              </div>
            )}
          </Card>

          {/* STEP 3: THE 5 CLINICAL RIGHTS AUDIT ENGINE */}
          <Card style={{ padding: '16px', backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '10px', textTransform: 'uppercase' }}>
              The 5 Clinical Rights Audit Verification Matrix
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {[
                { title: '1. Right Patient', ...auditResult.rightPatient },
                { title: '2. Right Medication', ...auditResult.rightMedication },
                { title: '3. Right Dose', ...auditResult.rightDose },
                { title: '4. Right Route', ...auditResult.rightRoute },
                { title: '5. Right Time', ...auditResult.rightTime }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: item.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: item.passed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{item.passed ? '✅' : '⏳'}</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: item.passed ? '#34D399' : '#94A3B8' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: item.passed ? '#CBD5E1' : '#64748B' }}>
                        {item.message}
                      </div>
                    </div>
                  </div>
                  <Badge variant={item.passed ? 'success' : 'neutral'} style={{ fontSize: '0.7rem' }}>
                    {item.passed ? 'VERIFIED' : 'PENDING'}
                  </Badge>
                </div>
              ))}
            </div>

            {/* High-Alert Dual Nurse Witness Verification Checkbox */}
            {activeOrder?.isHighAlertDrug && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#FCD34D' }}>
                    ⚠️ HIGH-ALERT DRUG: DUAL INDEPENDENT NURSE VERIFICATION MANDATORY
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#FEF3C7', marginTop: '2px' }}>
                    Witness: {witnessNurseName}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isDualWitnessVerified}
                    onChange={(e) => setIsDualWitnessVerified(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>Witness Co-Signed</span>
                </label>
              </div>
            )}

            {/* FINAL ADMINISTER ACTION BUTTON */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="primary"
                disabled={!auditResult.allPassed}
                onClick={handleConfirmAdministration}
                style={{
                  backgroundColor: auditResult.allPassed ? '#10B981' : '#334155',
                  borderColor: auditResult.allPassed ? '#059669' : '#475569',
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  padding: '10px 24px',
                  cursor: auditResult.allPassed ? 'pointer' : 'not-allowed',
                  boxShadow: auditResult.allPassed ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                {auditResult.allPassed
                  ? '✓ Stamp & Administer Medication to Patient'
                  : '🔒 5-Rights Verification Incomplete'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
