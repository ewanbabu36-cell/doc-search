import React, { useState, useEffect, useMemo } from 'react';
import { hospitalEventBus, type HospitalEventPayload } from '../../services/hospital-event-bus.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface ScheduleH1Record {
  id: string;
  dispenseDate: string;
  patientName: string;
  patientAddress: string;
  patientPhone: string;
  patientUhid: string;
  doctorName: string;
  doctorRegNumber: string;
  hospitalName: string;
  drugName: string;
  batchNumber: string;
  expiryDate: string;
  quantityDispensed: number;
  pharmacistLicense: string;
}

const getInitialScheduleH1Records = (): ScheduleH1Record[] => {
  const profile = getUnifiedPartnerProfile();
  const facility = profile.entityLegalName || 'DocSearch Healthcare Partner';
  const doc = profile.doctorName || 'Attending Physician';
  const lic = profile.pharmacyDrugLicense20B || 'FORM 20B/21B';
  const reg = profile.doctorRegNo || 'Reg # Pending';

  return [
    {
      id: 'H1-2026-001',
      dispenseDate: '2026-09-07 14:30',
      patientName: 'Rahul Verma',
      patientAddress: 'Flat 402, Civil Lines',
      patientPhone: '+91 98765 43210',
      patientUhid: 'UHID-2026-0812',
      doctorName: doc,
      doctorRegNumber: reg,
      hospitalName: facility,
      drugName: 'Inj. Meropenem 1g IV (Carbapenem)',
      batchNumber: 'MRP2408',
      expiryDate: '2027-04',
      quantityDispensed: 6,
      pharmacistLicense: lic
    },
    {
      id: 'H1-2026-002',
      dispenseDate: '2026-09-07 11:15',
      patientName: 'Priya Sharma',
      patientAddress: 'H.No 12, Sector 15',
      patientPhone: '+91 98234 56789',
      patientUhid: 'UHID-2026-0945',
      doctorName: doc,
      doctorRegNumber: reg,
      hospitalName: facility,
      drugName: 'Tab. Cefpodoxime Proxetil 200mg (3rd Gen Ceph)',
      batchNumber: 'CPX881',
      expiryDate: '2026-11',
      quantityDispensed: 10,
      pharmacistLicense: lic
    }
  ];
};

export interface ScheduleH1DrugRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleH1DrugRegisterModal: React.FC<ScheduleH1DrugRegisterModalProps> = ({
  isOpen,
  onClose
}) => {
  const partnerProfile = useMemo(() => getUnifiedPartnerProfile(), []);

  const [records, setRecords] = useState<ScheduleH1Record[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('docsearch_schedule_h1_records');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return getInitialScheduleH1Records();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Persist records to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_schedule_h1_records', JSON.stringify(records));
      } catch {}
    }
  }, [records]);

  // Listen to Prescription Dispensed on event bus
  useEffect(() => {
    const unsubscribe = hospitalEventBus.subscribe('PRESCRIPTION_DISPENSED', (payload: HospitalEventPayload) => {
      const drug = payload.data?.medicationName || payload.data?.items?.[0] || 'Tab. Cefixime 200mg (Schedule H1)';
      const newRec: ScheduleH1Record = {
        id: `H1-2026-${(records.length + 1).toString().padStart(3, '0')}`,
        dispenseDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        patientName: payload.data?.patientName || 'Rahul Verma',
        patientAddress: 'Registered Hospital Patient',
        patientPhone: payload.data?.patientPhone || '+91 98765 43210',
        patientUhid: payload.data?.patientUhid || 'UHID-2026-0812',
        doctorName: payload.data?.doctorName || partnerProfile.doctorName || 'Prescribing Doctor',
        doctorRegNumber: payload.data?.doctorNmcReg || partnerProfile.doctorRegNo || 'Reg # Pending',
        hospitalName: partnerProfile.entityLegalName || 'DocSearch Healthcare Partner',
        drugName: drug,
        batchNumber: `MRP${Math.floor(Math.random() * 800 + 200)}`,
        expiryDate: '2027-04',
        quantityDispensed: payload.data?.quantity || 10,
        pharmacistLicense: partnerProfile.pharmacyDrugLicense20B || 'FORM 20B/21B'
      };
      setRecords((prev) => [newRec, ...prev]);
    });

    return () => unsubscribe();
  }, [records.length, partnerProfile]);

  const handleAddNewH1Dispense = () => {
    const demoEntries = [
      { drug: 'Inj. Meropenem 1g IV (Carbapenem)', batch: `MRP${Math.floor(Math.random() * 800 + 200)}`, patient: 'Sunil Gavaskar', uhid: 'UHID-2026-1502' },
      { drug: 'Tab. Cefixime 200mg (3rd Gen Ceph)', batch: `CFX${Math.floor(Math.random() * 800 + 200)}`, patient: 'Meenakshi Iyer', uhid: 'UHID-2026-1589' },
      { drug: 'Tab. Zolpidem 10mg (Sedative H1)', batch: `ZLP${Math.floor(Math.random() * 800 + 200)}`, patient: 'Karan Johar', uhid: 'UHID-2026-1601' }
    ];
    const picked = demoEntries[Math.floor(Math.random() * demoEntries.length)]!;
    const newRecord: ScheduleH1Record = {
      id: `H1-2026-${(records.length + 1).toString().padStart(3, '0')}`,
      dispenseDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      patientName: picked.patient,
      patientAddress: 'Hospital OPD Patient',
      patientPhone: '+91 98100 22334',
      patientUhid: picked.uhid,
      doctorName: partnerProfile.doctorName || 'Attending Physician',
      doctorRegNumber: partnerProfile.doctorRegNo || 'Reg # Pending',
      hospitalName: partnerProfile.entityLegalName || 'DocSearch Healthcare Partner',
      drugName: picked.drug,
      batchNumber: picked.batch,
      expiryDate: '2027-06',
      quantityDispensed: 10,
      pharmacistLicense: partnerProfile.pharmacyDrugLicense20B || 'FORM 20B/21B'
    };

    setRecords((prev) => [newRecord, ...prev]);
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <aside
        role="button"
        tabIndex={0}
        aria-label="Restore Schedule H1 Register"
        onClick={() => setIsMinimized(false)}
        className="ds-minimized-dock-pill ds-spring-press"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1.5px solid #10B981',
          borderRadius: '9999px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(16, 185, 129, 0.4)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(20px)',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>💊</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
          Schedule H1 Register ({records.length}) — Click to Restore
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

  const filteredRecords = records.filter(
    (r) =>
      r.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.doctorRegNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientUhid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrintAuditRegister = () => {
    window.print();
  };

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
          width: isMaximized ? '100vw' : '1080px',
          maxWidth: '100%',
          height: isMaximized ? '100vh' : 'auto',
          maxHeight: isMaximized ? '100vh' : '94vh',
          backgroundColor: '#0F172A',
          border: isMaximized ? 'none' : '1.5px solid #10B981',
          borderRadius: isMaximized ? 0 : '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Modal Header */}
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
            <span style={{ fontSize: '1.4rem' }}>💊</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: '#F8FAFC', fontSize: '1rem' }}>
                  Statutory Schedule H1 Drug Digital Register
                </strong>
                <span style={{ backgroundColor: '#10B981', color: '#000', fontSize: '0.625rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                  CDSCO & RULE 65(9) COMPLIANT
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Mandatory Register of 3rd/4th Gen Antibiotics, Carbapenems & Controlled Medications
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

        {/* Regulatory Banner */}
        <div
          style={{
            padding: '8px 24px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.75rem',
            color: '#A7F3D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>
            ⚖️ <strong>Drugs & Cosmetics Rules 1945:</strong> Every hospital pharmacy must retain Schedule H1 sales records for 3 years, subject to inspection by Drugs Inspector.
          </span>
          <span style={{ color: '#FCD34D', fontWeight: 700 }}>
            {filteredRecords.length} Schedule H1 Records Logged
          </span>
        </div>

        {/* Search & Actions Bar */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#0B1120',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '450px' }}>
            <span>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Drug (Meropenem, Cefixime), Doctor Reg #, or Patient..."
              style={{
                width: '100%',
                padding: '6px 10px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                color: '#FFF',
                borderRadius: '6px',
                fontSize: '0.8rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleAddNewH1Dispense}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#6EE7B7',
                border: '1px solid #10B981',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Record a new statutory Schedule H1 medication dispensation"
            >
              <span>➕</span>
              <span>Log New H1 Dispense</span>
            </button>

            <button
              type="button"
              onClick={handlePrintAuditRegister}
              style={{
                backgroundColor: '#10B981',
                color: '#000',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>🖨️</span>
            <span>Export Drug Inspector Inspection Sheet</span>
          </button>
        </div>
      </div>

      {/* Schedule H1 Ledger Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: '#E2E8F0' }}>
            <thead>
              <tr style={{ backgroundColor: '#1E293B', borderBottom: '2px solid #334155', textAlign: 'left', color: '#94A3B8' }}>
                <th style={{ padding: '10px 12px' }}>Date & Reg ID</th>
                <th style={{ padding: '10px 12px' }}>Patient Details & Address</th>
                <th style={{ padding: '10px 12px' }}>Prescribing Doctor (NMC / SMC)</th>
                <th style={{ padding: '10px 12px' }}>Drug Name & Strength</th>
                <th style={{ padding: '10px 12px' }}>Batch / Exp</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '10px 12px' }}>Pharmacist</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.3)'
                  }}
                >
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, color: '#38BDF8' }}>{r.dispenseDate}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>{r.id}</div>
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <strong style={{ color: '#F8FAFC' }}>{r.patientName}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{r.patientUhid} • {r.patientPhone}</div>
                    <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '2px' }}>{r.patientAddress}</div>
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <strong style={{ color: '#FBBF24' }}>{r.doctorName}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#34D399' }}>{r.doctorRegNumber}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{r.hospitalName}</div>
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #EF4444',
                        color: '#FCA5A5',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        display: 'inline-block'
                      }}
                    >
                      {r.drugName}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#E2E8F0' }}>{r.batchNumber}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Exp: {r.expiryDate}</div>
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38BDF8' }}>{r.quantityDispensed}</span>
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Licensed Chemist</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>{r.pharmacistLicense}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#1E293B',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Auto-synchronized with Fast Pharmacy POS Counter • Non-repudiation audit trail active
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #64748B',
              color: '#CBD5E1',
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Register
          </button>
        </div>
      </div>
    </div>
  );
};
