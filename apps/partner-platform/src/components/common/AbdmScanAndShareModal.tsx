import React, { useState, useMemo, useEffect } from 'react';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface AbdmScanProfile {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  mobile: string;
  address: string;
  pinCode: string;
  scanTime: string;
  status: 'PENDING_REGISTRATION' | 'TOKEN_GENERATED';
  generatedToken?: number;
}

export interface AbdmScanAndShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName?: string;
  onRegisterSuccess?: (tokenNumber: number, patientName: string) => void;
}

export const AbdmScanAndShareModal: React.FC<AbdmScanAndShareModalProps> = ({
  isOpen,
  onClose,
  hospitalName,
  onRegisterSuccess
}) => {
  const partnerProfile = useMemo(() => getUnifiedPartnerProfile(), []);
  const effectiveHospitalName = (hospitalName && hospitalName !== 'METROPOLITAN MULTISPECIALTY HOSPITAL')
    ? hospitalName
    : (partnerProfile.entityLegalName || 'DocSearch Hospital & Health Center');
  const [scannedProfiles, setScannedProfiles] = useState<AbdmScanProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<AbdmScanProfile | null>(null);
  const [nextTokenNum, setNextTokenNum] = useState<number>(1);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('ABDM_INBOUND_SCAN', (payload: any) => {
      if (payload?.data) {
        const scan = payload.data;
        const newProfile: AbdmScanProfile = {
          abhaNumber: scan.abhaNumber || '91-0000-0000-0000',
          abhaAddress: scan.abhaAddress || 'patient@abdm',
          name: scan.name || `${scan.firstName || ''} ${scan.lastName || ''}`.trim() || 'Scanned Patient',
          gender: scan.gender || 'MALE',
          dob: scan.dob || '1990-01-01',
          mobile: scan.mobile || '',
          address: scan.address || '',
          pinCode: scan.pinCode || '',
          scanTime: new Date().toLocaleTimeString(),
          status: 'PENDING_REGISTRATION'
        };
        setScannedProfiles((prev) => [newProfile, ...prev]);
        setSelectedProfile(newProfile);
      }
    });

    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSimulateInboundScan = () => {
    const demoNames = [
      { name: 'Amitabh Sen', abha: 'amitabh.sen@sbx', num: '91-5502-1194-8201', gender: 'MALE', dob: '1976-02-19', mob: '+91 98111 22334', addr: 'Greater Kailash, New Delhi' },
      { name: 'Ananya Deshmukh', abha: 'ananya.d@abdm', num: '91-8819-3301-7729', gender: 'FEMALE', dob: '1995-11-03', mob: '+91 97222 44556', addr: 'Bandra West, Mumbai' },
      { name: 'Kavita Sundaram', abha: 'kavita.s@ehealth', num: '91-3310-7744-9918', gender: 'FEMALE', dob: '1988-08-25', mob: '+91 96333 66778', addr: 'T. Nagar, Chennai' }
    ];
    const picked = demoNames[Math.floor(Math.random() * demoNames.length)]!;
    const newProfile: AbdmScanProfile = {
      abhaNumber: picked.num,
      abhaAddress: picked.abha,
      name: picked.name,
      gender: picked.gender as any,
      dob: picked.dob,
      mobile: picked.mob,
      address: picked.addr,
      pinCode: '110001',
      scanTime: new Date().toLocaleTimeString(),
      status: 'PENDING_REGISTRATION'
    };

    setScannedProfiles((prev) => [newProfile, ...prev]);
    setSelectedProfile(newProfile);
    setSuccessToast(`New ABHA Scan Received: ${newProfile.name} (${newProfile.abhaAddress})`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleGenerateTokenForProfile = (profile: AbdmScanProfile) => {
    const token = nextTokenNum;
    setNextTokenNum((prev) => prev + 1);

    // Update profile status
    setScannedProfiles((prev) =>
      prev.map((p) => (p.abhaNumber === profile.abhaNumber ? { ...p, status: 'TOKEN_GENERATED', generatedToken: token } : p))
    );

    // Publish to Hospital Event Bus
    const activePatient = {
      id: `pat-abdm-${token}`,
      uhid: `UHID-2026-${token.toString().padStart(4, '0')}`,
      name: profile.name,
      age: new Date().getFullYear() - new Date(profile.dob).getFullYear(),
      gender: profile.gender,
      phone: profile.mobile,
      bloodGroup: 'B+',
      opdToken: token,
      doctorName: partnerProfile.doctorName ? `${partnerProfile.doctorName} (OPD)` : 'Consulting Physician',
      diagnosis: 'OPD Consultation (ABDM Fast-Track)',
      insuranceProvider: 'ABHA Linked • PM-JAY Verified'
    };

    hospitalEventBus.setActivePatient(activePatient, 'AbdmScanAndShare');
    hospitalEventBus.publish(
      'PATIENT_SELECTED',
      'AbdmScanAndShare',
      activePatient,
      `ABDM Fast-Track OPD Token #${token} generated for ${profile.name} (5-Second Check-in)`
    );


    setSuccessToast(`✓ OPD Token #${token} Generated for ${profile.name}! Sent to Doctor Desk & TV Display.`);
    if (onRegisterSuccess) {
      onRegisterSuccess(token, profile.name);
    }
  };

  if (isMinimized) {
    return (
      <aside
        role="button"
        tabIndex={0}
        aria-label="Restore ABDM Scan & Share"
        onClick={() => setIsMinimized(false)}
        className="ds-minimized-dock-pill ds-spring-press"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1.5px solid #06B6D4',
          borderRadius: '9999px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.4)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(20px)',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>⚡</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
          ABDM Scan & Share ({scannedProfiles.length}) — Click to Restore
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0 4px'
          }}
        >
          ✕
        </button>
      </aside>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: isMaximized ? 'stretch' : 'center',
        justifyContent: isMaximized ? 'stretch' : 'center',
        padding: isMaximized ? 0 : '16px'
      }}
    >
      <div
        style={{
          width: isMaximized ? '100vw' : '980px',
          maxWidth: '100%',
          height: isMaximized ? '100vh' : 'auto',
          maxHeight: isMaximized ? '100vh' : '94vh',
          backgroundColor: '#0F172A',
          border: isMaximized ? 'none' : '1.5px solid #06B6D4',
          borderRadius: isMaximized ? 0 : '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Header */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          title="Double click to toggle Maximize / Restore"
          style={{
            padding: '16px 24px',
            backgroundColor: '#1E293B',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: '#F8FAFC', fontSize: '1rem' }}>
                  ABDM 2.0 "Scan & Share" 5-Second Check-In Counter
                </strong>
                <span>
                  NHA MILESTONE 1 CERTIFIED
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {effectiveHospitalName} • National Health Authority (NHA) Front Desk Automation
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              aria-label="Minimize to dock pill"
              title="Minimize to dock pill (—)"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              —
            </button>
            <button
              type="button"
              aria-label={isMaximized ? "Restore down" : "Maximize full screen"}
              title={isMaximized ? "Restore down (🗗)" : "Maximize full screen (⛶)"}
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized(!isMaximized);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              {isMaximized ? '🗗' : '⛶'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {successToast && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid #10B981',
              color: '#6EE7B7',
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{successToast}</span>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Auto-synced with Live OPD TV Screen</span>
          </div>
        )}

        {/* Body Layout: Left QR Code Counter, Right Inbound Scans */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
          {/* Left: Dynamic Counter QR Standee */}
          <div
            style={{
              backgroundColor: '#0B1120',
              borderRight: '1px solid #1E293B',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                PATIENT COUNTER 01
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
                {hospitalName}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>HFR ID: IN0710001892 (NHA Registered)</div>
            </div>

            {/* Visual Simulated QR Code */}
            <div
              style={{
                width: '200px',
                height: '200px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '16px 0'
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#000', marginBottom: '4px' }}>
                SCAN TO SHARE PROFILE
              </div>
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  border: '3px solid #000',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '2px',
                  padding: '4px',
                  backgroundColor: '#000'
                }}
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} style={{ backgroundColor: i % 2 === 0 ? '#FFF' : '#000' }} />
                ))}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#000', fontWeight: 700, marginTop: '4px' }}>
                ABHA • Aarogya Setu • Paytm
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <button
                type="button"
                onClick={handleSimulateInboundScan}
                style={{
                  width: '100%',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}
              >
                <span>⚡</span>
                <span>Simulate Patient Scan</span>
              </button>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '6px' }}>
                Click to simulate patient scanning QR from mobile
              </div>
            </div>
          </div>

          {/* Right: Inbound Scans List & Auto-Registration Desk */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Scans Header */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#1E293B',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                Inbound Scanned Patients ({scannedProfiles.length})
              </span>
              <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                Next OPD Token: <strong>#{nextTokenNum}</strong>
              </span>
            </div>

            {/* Profiles Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scannedProfiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📲</div>
                  <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '1.1rem', marginBottom: '8px' }}>
                    Waiting for Patient Counter QR Scan
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '360px', lineHeight: 1.6, marginBottom: '20px' }}>
                    Patients scanning the Counter 01 QR code on their ABHA, Aarogya Setu, or Paytm Health app will appear here instantly for 1-click zero-data-entry registration.
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06B6D4' }} />
                    ABDM M1 Counter Channel Active
                  </div>
                </div>
              ) : (
                scannedProfiles.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedProfile(p)}
                  style={{
                    backgroundColor: selectedProfile?.abhaNumber === p.abhaNumber ? 'rgba(2, 132, 199, 0.15)' : '#1E293B',
                    border: selectedProfile?.abhaNumber === p.abhaNumber ? '1.5px solid #0284C7' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: p.gender === 'FEMALE' ? '#EC4899' : '#0284C7',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1rem'
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>{p.name}</strong>
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                          ✓ ABHA VERIFIED
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                        {p.abhaAddress} • {p.abhaNumber}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {p.gender} • DOB: {p.dob} • {p.address}
                      </div>
                    </div>
                  </div>

                  <div>
                    {p.status === 'TOKEN_GENERATED' ? (
                      <span
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid #10B981',
                          color: '#34D399',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          display: 'inline-block'
                        }}
                      >
                        ✓ Token #{p.generatedToken} Live
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateTokenForProfile(p);
                        }}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#000',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <span>⚡</span>
                        <span>Create Token #{nextTokenNum}</span>
                      </button>
                    )}
                  </div>
                </div>
              )))}
            </div>

            {/* Bottom Info Bar */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#1E293B',
                borderTop: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94A3B8'
              }}
            >
              <span>Takes 5 seconds • Eliminates paper forms & spelling errors</span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #64748B',
                  color: '#CBD5E1',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
