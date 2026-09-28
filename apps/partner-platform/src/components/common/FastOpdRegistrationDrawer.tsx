import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { ProfileUpdateRequiredAlertModal } from './ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { hardwarePrinterService, type HardwarePrinterStatus } from '../../services/hardware-printer-service.js';
import { uniqueIdentifierService } from '../../services/unique-identifier-service.js';
import { apiRequest, isMockFallbackAllowed } from '../../services/api-client.js';
import { doctorRosterService } from '../../services/doctor-roster-service.js';
import { partnerFoundationService } from '../../services/partner-foundation-service.js';

export interface FastOpdRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patientData: any) => void;
  tenantId?: string | undefined;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
}

interface DoctorOption {
  id: string;
  name: string;
  department: string;
  room: string;
  opdFee: number;
}

const AVAILABLE_DOCTORS: DoctorOption[] = [
  { id: 'DOC-1', name: 'Dr. Alok Nath', department: 'General Medicine', room: 'Room 101', opdFee: 300 },
  { id: 'DOC-2', name: 'Dr. Rajesh Verma', department: 'Cardiology', room: 'Room 102', opdFee: 500 },
  { id: 'DOC-3', name: 'Dr. Sunita Rao', department: 'Pediatrics', room: 'Room 105', opdFee: 400 },
  { id: 'DOC-4', name: 'Dr. Priya Nair', department: 'Gynecology & Obstetrics', room: 'Room 204', opdFee: 500 },
  { id: 'DOC-5', name: 'Dr. Vikram Seth', department: 'Orthopedics', room: 'Room 108', opdFee: 450 }
];

export const FastOpdRegistrationDrawer: React.FC<FastOpdRegistrationDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [doctorsList, setDoctorsList] = useState<DoctorOption[]>(AVAILABLE_DOCTORS);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(AVAILABLE_DOCTORS[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'FREE'>('CASH');
  const [customFee, setCustomFee] = useState<number>(300);
  const [panelCtx, setPanelCtx] = useState<any>(null);

  useEffect(() => {
    partnerFoundationService.getPanelContext().then((c) => setPanelCtx(c)).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadDoctors() {
      try {
        const docs = await doctorRosterService.getDoctors('default');
        if (Array.isArray(docs) && docs.length > 0) {
          const mapped: DoctorOption[] = docs.map((d: any) => ({
            id: d.id || d.doctorCode || 'DOC-1',
            name: d.fullName || `Dr. ${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Dr. Physician',
            department: d.primarySpecialty || 'General Medicine',
            room: d.roomNumber || 'Room 101',
            opdFee: d.consultationFee || 300
          }));
          setDoctorsList(mapped);
          if (mapped[0]) {
            setSelectedDoctorId(mapped[0].id);
            setCustomFee(mapped[0].opdFee);
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic doctor roster:', err);
      }
    }
    loadDoctors();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);
  const [printerStatus, setPrinterStatus] = useState<HardwarePrinterStatus>(() => hardwarePrinterService.getStatus());
  const [printFeedback, setPrintFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [autoPrintThermal, setAutoPrintThermal] = useState(true);

  const handlePairPrinter = async (type: 'usb' | 'serial') => {
    try {
      let ok = false;
      if (type === 'usb') {
        ok = await hardwarePrinterService.requestUsbPrinter();
      } else {
        ok = await hardwarePrinterService.requestSerialPrinter();
      }
      const newStatus = hardwarePrinterService.getStatus();
      setPrinterStatus(newStatus);
      if (ok) {
        setPrintFeedback({
          type: 'success',
          message: `Thermal printer connected: ${newStatus.deviceName || 'Thermal ESC/POS'}!`
        });
      }
    } catch (err: unknown) {
      setPrintFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Printer connection failed.'
      });
    }
  };

  const handleDisconnectPrinter = async () => {
    await hardwarePrinterService.disconnect();
    setPrinterStatus(hardwarePrinterService.getStatus());
    setPrintFeedback({ type: 'warning', message: 'Thermal printer disconnected.' });
    setTimeout(() => setPrintFeedback(null), 2500);
  };

  const handlePrintSlip = () => {
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }
    window.print();
  };

  const handleDirectThermalPrint = async (slipToPrint?: {
    tokenNumber: string;
    uhid: string;
    mrn: string;
    patientName: string;
    doctorName: string;
    room: string;
    time: string;
    fee: number;
  }) => {
    const slip = slipToPrint || generatedSlip;
    if (!slip) return;

    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }

    try {
      const res = await hardwarePrinterService.printOpdTokenSlip({
        tokenNumber: slip.tokenNumber,
        uhid: slip.uhid,
        mrn: slip.mrn,
        patientName: slip.patientName,
        doctorName: slip.doctorName,
        room: slip.room,
        time: slip.time,
        fee: slip.fee,
        paymentMode,
        clinicName: 'DOCSEARCH OPD CLINIC & HOSPITALS'
      });

      setPrintFeedback({
        type: res.success ? 'success' : 'warning',
        message: res.message
      });
      setTimeout(() => setPrintFeedback(null), 4000);
    } catch {
      window.print();
    }
  };

  const [printMode, setPrintMode] = useState<'THERMAL_80MM' | 'LASER_A4'>('THERMAL_80MM');
  const [generatedSlip, setGeneratedSlip] = useState<{
    tokenNumber: string;
    uhid: string;
    mrn: string;
    patientName: string;
    doctorName: string;
    room: string;
    time: string;
    fee: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = doctorsList.find((d) => d.id === docId);
    if (doc) {
      setCustomFee(doc.opdFee);
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMob = mobile.trim();
    if (!cleanMob || cleanMob.length !== 10 || !/^[6-9]/.test(cleanMob)) {
      alert('Kripya valid 10-digit Indian mobile number enter karein (starts with 6, 7, 8, or 9).');
      return;
    }
    if (!fullName || fullName.trim().length < 2) {
      alert('Kripya patient ka pura naam enter karein.');
      return;
    }

    setIsSubmitting(true);
    const selectedDoc = doctorsList.find((d) => d.id === selectedDoctorId);
    const opdTokenObj = uniqueIdentifierService.generateOpdToken();
    const tokenSeq = opdTokenObj.tokenNumber;
    const tokenStr = opdTokenObj.tokenDisplay;
    const uhidStr = uniqueIdentifierService.generateUhid('default');
    const mrnStr = uhidStr;
    const encounterNumber = opdTokenObj.encounterNumber;

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Patient';
    const lastName = nameParts.slice(1).join(' ') || 'Kumar';

    let persistedPatientId = `patient-${Date.now()}`;

    // 1. Authoritative Server Registration: POST /api/v1/partner/patients
    try {
      const pRes = await apiRequest<any>('/api/v1/partner/patients', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          gender,
          mobileNumber: cleanMob,
          mrn: mrnStr
        })
      });
      if (pRes.success && pRes.data?.id) {
        persistedPatientId = pRes.data.id;
      } else if (!isMockFallbackAllowed() && pRes.error) {
        setIsSubmitting(false);
        alert(`Server registration error: ${pRes.error.message || 'Failed to register patient'}`);
        return;
      }
    } catch (apiErr: any) {
      if (!isMockFallbackAllowed()) {
        setIsSubmitting(false);
        alert(`Network error during registration: ${apiErr?.message || 'Connection failed'}`);
        return;
      }
    }

    // 2. Authoritative Server Encounter Check-in: POST /api/v1/partner/encounters
    try {
      const encRes = await apiRequest<any>('/api/v1/partner/encounters', {
        method: 'POST',
        body: JSON.stringify({
          patientId: persistedPatientId,
          doctorId: selectedDoc?.id,
          encounterType: 'WALK_IN',
          status: 'WAITING',
          chiefComplaint: 'Outpatient Consultation & Prescription Request'
        })
      });
      if (!encRes.success && !isMockFallbackAllowed() && encRes.error) {
        console.warn('Encounter creation warning on server:', encRes.error);
      }
    } catch (encErr) {
      console.warn('Encounter creation network notice:', encErr);
    }

    const newPatientRecord = {
      id: persistedPatientId,
      uhid: uhidStr,
      mrn: mrnStr,
      name: fullName.trim(),
      mobile: mobile.trim(),
      age: age ? parseInt(age, 10) : 32,
      gender,
      doctor: selectedDoc?.name || 'Duty Consultant',
      department: selectedDoc?.department || 'General OPD',
      room: selectedDoc?.room || 'Room 101',
      token: tokenStr,
      paymentMode,
      feePaid: paymentMode === 'FREE' ? 0 : customFee,
      registeredAt: new Date().toISOString()
    };

    // Save into localStorage patient queue and encounters store for live multi-station interoperability
    try {
      const existingRaw = localStorage.getItem('docsearch_recent_opd_queue');
      const queue = existingRaw ? JSON.parse(existingRaw) : [];
      queue.unshift(newPatientRecord);
      localStorage.setItem('docsearch_recent_opd_queue', JSON.stringify(queue.slice(0, 50)));

      const effectiveTenantId = tenantId || panelCtx?.activeTenantId || 'default';
      const effectivePartnerId = partnerId || panelCtx?.activePartnerId || 'default';
      const effectiveOrgId = organizationId || panelCtx?.activeOrganizationId || '33333333-3333-4333-8333-333333333333';
      const effectiveBranchId = branchId || panelCtx?.activeFacilityId || '44444444-4444-4444-8444-444444444444';

      // Synchronize with docsearch_encounters so Nurse Station & Doctor Worklist see the arriving token
      const newEncounter = {
        id: newPatientRecord.id,
        tenantId: effectiveTenantId,
        partnerId: effectivePartnerId,
        organizationId: effectiveOrgId,
        organizationName: panelCtx?.activeOrganizationName || 'Doctor Clinic & Multi-Specialty OPD',
        branchId: effectiveBranchId,
        branchName: panelCtx?.activeFacilityName || 'Main OPD Floor',
        departmentId: 'dept-opd-001',
        departmentName: selectedDoc?.department || 'General OPD',
        patientId: newPatientRecord.id,
        patientName: fullName.trim(),
        patientMrn: newPatientRecord.mrn,
        patientGender: gender,
        patientDob: new Date(Date.now() - (newPatientRecord.age || 30) * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0],
        patientMobile: mobile.trim(),
        doctorId: selectedDoc?.id || 'DOC-1',
        doctorName: selectedDoc?.name || 'Dr. Alok Nath',
        doctorSpecialty: selectedDoc?.department || 'General Medicine',
        encounterNumber,
        encounterType: 'WALK_IN',
        status: 'WAITING',
        priority: 'ROUTINE',
        consultationMode: 'IN_PERSON',
        chiefComplaint: 'Outpatient Consultation & Prescription Request',
        tokenNumber: tokenStr,
        registeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          paymentMode,
          feePaid: paymentMode === 'FREE' ? 0 : customFee,
          room: selectedDoc?.room || 'Room 101'
        }
      };

      const existingEncsRaw = localStorage.getItem('docsearch_encounters');
      const encs = existingEncsRaw ? JSON.parse(existingEncsRaw) : [];
      encs.unshift(newEncounter);
      localStorage.setItem('docsearch_encounters', JSON.stringify(encs.slice(0, 100)));

      // Dispatch global events for instant UI live sync across tabs
      window.dispatchEvent(new CustomEvent('docsearch:patient-registered', { detail: newPatientRecord }));
      window.dispatchEvent(new CustomEvent('docsearch:encounters-updated', { detail: newEncounter }));

      // Broadcast to Hospital Event Bus for Active Patient Context
      hospitalEventBus.publish('PATIENT_SELECTED', 'FastOpdRegistrationDrawer', {
        patientId: newPatientRecord.id,
        name: fullName.trim(),
        uhid: uhidStr,
        opdToken: parseInt(tokenSeq.toString(), 10),
        doctorName: selectedDoc?.name || 'Duty Consultant',
        encounterType: 'OPD'
      });
    } catch (err) {
      console.warn('Queue storage error:', err);
    }

    const slipObj = {
      tokenNumber: tokenStr,
      uhid: uhidStr,
      mrn: mrnStr,
      patientName: fullName.trim(),
      doctorName: selectedDoc?.name || 'Duty Consultant',
      room: selectedDoc?.room || 'Room 101',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fee: paymentMode === 'FREE' ? 0 : customFee
    };

    setGeneratedSlip(slipObj);
    setIsSubmitting(false);

    if (autoPrintThermal && printerStatus.isConnected) {
      void handleDirectThermalPrint(slipObj);
    }
    if (onSuccess) onSuccess(newPatientRecord);
  };

  const handleResetForNext = () => {
    setGeneratedSlip(null);
    setMobile('');
    setFullName('');
    setAge('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      {/* Slide-over Drawer Panel */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: '#0F172A',
          borderLeft: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          color: '#F8FAFC',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0B1120'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              ⚡
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                1-Step Quick OPD Intake
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                30-second patient registration & doctor token
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.3rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Thermal Hardware Status Ribbon */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: printerStatus.isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{printerStatus.isConnected ? '🟢' : '🔌'}</span>
            <span style={{ fontWeight: 600, color: printerStatus.isConnected ? '#34D399' : '#94A3B8' }}>
              {printerStatus.isConnected
                ? `Thermal Printer: ${printerStatus.deviceName} (Silent Cut Active)`
                : 'Direct Thermal: Not Connected (Browser Dialog Active)'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {printerStatus.isConnected ? (
              <button
                type="button"
                onClick={handleDisconnectPrinter}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#F87171',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '0.7rem'
                }}
              >
                Disconnect
              </button>
            ) : (
              <>
                {printerStatus.isWebUsbSupported && (
                  <button
                    type="button"
                    onClick={() => handlePairPrinter('usb')}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38BDF8',
                      color: '#38BDF8',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}
                  >
                    + Pair USB
                  </button>
                )}
                {printerStatus.isWebSerialSupported && (
                  <button
                    type="button"
                    onClick={() => handlePairPrinter('serial')}
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid #C084FC',
                      color: '#C084FC',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}
                  >
                    + Pair Serial
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {printFeedback && (
          <div
            style={{
              padding: '8px 24px',
              backgroundColor:
                printFeedback.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : printFeedback.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
              color:
                printFeedback.type === 'success'
                  ? '#34D399'
                  : printFeedback.type === 'error'
                  ? '#F87171'
                  : '#FBBF24',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {printFeedback.message}
          </div>
        )}

        {/* Drawer Body */}
        <div style={{ padding: '24px', flex: 1 }}>
          {generatedSlip ? (
            /* Success Slip Preview */
            <div
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✅</div>
              <Badge variant="success" size="md">
                Token Generated Successfully
              </Badge>

              {/* Print Stylesheet */}
              <style>{`
                @media print {
                  @page {
                    size: ${printMode === 'THERMAL_80MM' ? '80mm auto' : 'A4 portrait'};
                    margin: ${printMode === 'THERMAL_80MM' ? '2mm 3mm' : '10mm 15mm'};
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-opd-token, #printable-opd-token * {
                    visibility: visible !important;
                  }
                  #printable-opd-token {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: ${printMode === 'THERMAL_80MM' ? '76mm' : '100%'} !important;
                    max-width: ${printMode === 'THERMAL_80MM' ? '380px' : '720px'} !important;
                    margin: 0 !important;
                    padding: ${printMode === 'THERMAL_80MM' ? '4px' : '24px'} !important;
                    background: #FFFFFF !important;
                    color: #000000 !important;
                    border: none !important;
                    box-shadow: none !important;
                  }
                }
              `}</style>

              {/* Format Switcher */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px', marginBottom: '8px' }}>
                <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setPrintMode('THERMAL_80MM')}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: printMode === 'THERMAL_80MM' ? '#0284C7' : '#1E293B',
                      color: printMode === 'THERMAL_80MM' ? '#FFFFFF' : '#94A3B8'
                    }}
                  >
                    🧾 3-inch Thermal Slip (80mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintMode('LASER_A4')}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: printMode === 'LASER_A4' ? '#0284C7' : '#1E293B',
                      color: printMode === 'LASER_A4' ? '#FFFFFF' : '#94A3B8'
                    }}
                  >
                    📄 Normal A4 Sheet
                  </button>
                </div>
              </div>

              {/* Thermal Token Card */}
              <div
                id="printable-opd-token"
                style={{
                  margin: '12px auto',
                  maxWidth: printMode === 'THERMAL_80MM' ? '380px' : '650px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  padding: printMode === 'THERMAL_80MM' ? '16px' : '28px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  textAlign: 'left',
                  fontFamily: printMode === 'THERMAL_80MM' ? 'monospace' : 'system-ui, -apple-system, sans-serif'
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #CBD5E1', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>DOC SEARCH HEALTHCARE</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>OPD CONSULTATION SLIP</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0284C7', margin: '8px 0' }}>
                    {generatedSlip.tokenNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A' }}>
                    {generatedSlip.room}
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Patient:</span>
                    <strong style={{ color: '#0F172A' }}>{generatedSlip.patientName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>UHID:</span>
                    <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{generatedSlip.uhid}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>MRN:</span>
                    <span style={{ color: '#475569', fontFamily: 'monospace' }}>{generatedSlip.mrn}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Doctor:</span>
                    <strong style={{ color: '#0F172A' }}>{generatedSlip.doctorName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Time:</span>
                    <span>{generatedSlip.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: 800 }}>Fee Paid:</span>
                    <strong style={{ color: '#0284C7', fontSize: '1rem' }}>₹{generatedSlip.fee}</strong>
                  </div>
                </div>

                {/* Optical Barcode (Code 128) & WhatsApp Health Card QR Code */}
                <div style={{ borderTop: '1px dashed #CBD5E1', marginTop: '12px', paddingTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{ width: '100%' }}
                    dangerouslySetInnerHTML={{
                      __html: uniqueIdentifierService.generateCode128Svg(generatedSlip.uhid, {
                        height: 36,
                        barWidth: 1.3,
                        showText: true
                      })
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: uniqueIdentifierService.generateQrCodeSvg(generatedSlip.uhid, 2.2)
                      }}
                    />
                    <div style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.3 }}>
                      <strong>Scan QR:</strong> Live OPD Queue Tracking &amp;<br />Instant WhatsApp Digital Health Card
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleDirectThermalPrint()}
                    style={{ fontWeight: 800, flex: 1, backgroundColor: '#0284C7' }}
                  >
                    ⚡ Direct Thermal (Silent Cut)
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handlePrintSlip}
                    style={{ fontWeight: 800 }}
                  >
                    🖨️ Browser Dialog
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleResetForNext}
                  style={{ fontWeight: 800, width: '100%' }}
                >
                  + Next Patient
                </Button>
              </div>
            </div>
          ) : (
            /* 1-Screen Quick Intake Form */
            <form onSubmit={handleQuickSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Phone & Name Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>
                  Mobile Number (10-Digit Mobile) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: '#38BDF8', fontWeight: 800, fontSize: '0.875rem', pointerEvents: 'none' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => {
                      let digits = e.target.value.replace(/\D/g, '');
                      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                      else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                      setMobile(digits.slice(0, 10));
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 48px',
                      backgroundColor: '#0B1120',
                      border: mobile.length === 10 && /^[6-9]/.test(mobile)
                        ? '1.5px solid #10B981'
                        : mobile.length > 0
                        ? '1.5px solid #EF4444'
                        : '1.5px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {mobile.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: mobile.length === 10 && /^[6-9]/.test(mobile) ? '#10B981' : '#EF4444'
                      }}
                    >
                      {mobile.length === 10 && /^[6-9]/.test(mobile) ? '✓ 10-Digit' : `${mobile.length}/10`}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>
                  Patient Full Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0B1120',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Age & Gender Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>Age (Years)</label>
                  <input
                    type="number"
                    placeholder="35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={0}
                    max={120}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0B1120',
                      border: '1.5px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>Gender</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        style={{
                          flex: 1,
                          padding: '10px 6px',
                          borderRadius: '8px',
                          border: gender === g ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: gender === g ? 'rgba(56, 189, 248, 0.15)' : '#0B1120',
                          color: gender === g ? '#38BDF8' : '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {g === 'MALE' ? '👨 M' : g === 'FEMALE' ? '👩 F' : '⚧ O'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Select Doctor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>
                  Assign Consulting Doctor <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {doctorsList.map((doc) => (
                    <label
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: selectedDoctorId === doc.id ? 'rgba(56, 189, 248, 0.12)' : '#0B1120',
                        border: selectedDoctorId === doc.id ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="radio"
                          name="doctor"
                          checked={selectedDoctorId === doc.id}
                          onChange={() => handleDoctorChange(doc.id)}
                          style={{ accentColor: '#38BDF8' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F8FAFC' }}>{doc.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{doc.department} • {doc.room}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8' }}>₹{doc.opdFee}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fee & Payment Mode */}
              <div
                style={{
                  backgroundColor: '#0B1120',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>Consultation Fee</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>₹</span>
                    <input
                      type="number"
                      value={customFee}
                      onChange={(e) => setCustomFee(Number(e.target.value))}
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #38BDF8',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['CASH', 'UPI', 'FREE'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMode(m)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: paymentMode === m ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: paymentMode === m ? 'rgba(16, 185, 129, 0.15)' : '#1E293B',
                        color: paymentMode === m ? '#10B981' : '#94A3B8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {m === 'CASH' ? '💵 Cash' : m === 'UPI' ? '📱 UPI Auto' : '🆓 Free / Exempt'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Silent Auto-Cut Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#0B1120',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <input
                  type="checkbox"
                  id="autoPrintCheckbox"
                  checked={autoPrintThermal}
                  onChange={(e) => setAutoPrintThermal(e.target.checked)}
                  style={{ accentColor: '#0284C7', cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="autoPrintCheckbox" style={{ fontSize: '0.75rem', color: '#CBD5E1', cursor: 'pointer', userSelect: 'none' }}>
                  ⚡ Auto-cut thermal slip instantly on token creation (Skip print dialog)
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  borderRadius: '10px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                {isSubmitting ? '⏳ Generating Token...' : '🎫 Generate OPD Token & Print Slip ➔'}
              </Button>
            </form>
          )}
        </div>
      </div>
      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName="OPD Token Thermal Slip Print"
        missingFields={profileMissingFields}
      />
    </div>
  );
};
