import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AbdmScanAndShareTokenDto } from '@docsearch/api-contracts';

interface Props {
  tokens: AbdmScanAndShareTokenDto[];
  onProcessScan: () => void;
}

export const ScanAndShareCounterView: React.FC<Props> = ({ tokens: initialTokens }) => {
  const [tokensList, setTokensList] = useState<AbdmScanAndShareTokenDto[]>(initialTokens);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPatient, setScannedPatient] = useState({
    tokenNumber: 'TKN-016',
    patientName: 'Rahul Verma',
    patientAbhaAddress: 'rahul.verma@abdm',
    patientAbhaNumber: '91-8841-2904-8120',
    gender: 'MALE',
    dob: '1988-04-12 (38y)',
    mobile: '+91 98765 43210',
    address: 'Mayur Vihar Phase 1, New Delhi, 110091',
    doctor: 'Dr. Rajesh Sharma, MD',
    chamber: 'CHAMBER 1 (General Medicine OPD)',
    waitEst: '12 mins',
    scannedAt: new Date().toLocaleTimeString()
  });

  const [printSuccess, setPrintSuccess] = useState(false);
  const [whatsAppDispatched, setWhatsAppDispatched] = useState(false);

  // Official ABDM Counter QR Code URL
  const counterQrData = 'https://abdm.gov.in/scan-share/counter?facId=IN0710002148&counter=01&dept=OPD_GENERAL';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(counterQrData)}&color=059669&bgcolor=060C18`;

  // Patient Sample Profiles for simulation
  const patientProfiles = [
    { name: 'Rahul Verma', abha: 'rahul.verma@abdm', num: '91-8841-2904-8120', gender: 'MALE', age: '38y', mobile: '+91 98765 43210', doc: 'Dr. Rajesh Sharma, MD', room: 'Chamber 1' },
    { name: 'Anjali Gupta', abha: 'anjali.gupta@abdm', num: '91-4421-8890-1123', gender: 'FEMALE', age: '29y', mobile: '+91 98112 33445', doc: 'Dr. Sarah Jenkins, MD', room: 'Chamber 2' },
    { name: 'Mohd. Farooq', abha: 'farooq.health@abdm', num: '91-7712-4432-9011', gender: 'MALE', age: '46y', mobile: '+91 97123 45678', doc: 'Dr. Marcus Vance, MD', room: 'Chamber 3' }
  ];

  const handleSimulateScan = (profIndex = 0) => {
    setIsScanning(true);
    const prof = patientProfiles[profIndex] ?? patientProfiles[0]!;
    const nextTokenNum = `TKN-0${Math.floor(16 + Math.random() * 20)}`;

    setTimeout(() => {
      setIsScanning(false);
      const newScan = {
        tokenNumber: nextTokenNum,
        patientName: prof.name,
        patientAbhaAddress: prof.abha,
        patientAbhaNumber: prof.num,
        gender: prof.gender,
        dob: prof.age,
        mobile: prof.mobile,
        address: 'New Delhi, India',
        doctor: prof.doc,
        chamber: prof.room,
        waitEst: '8-12 mins',
        scannedAt: new Date().toLocaleTimeString()
      };
      setScannedPatient(newScan);
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3000);

      // Add to tokens table
      const newRecord: AbdmScanAndShareTokenDto = {
        id: String(Date.now()),
        tokenNumber: nextTokenNum,
        patientName: prof.name,
        patientAbhaAddress: prof.abha,
        patientAbhaNumber: prof.num,
        mobile: prof.mobile,
        gender: prof.gender as 'MALE' | 'FEMALE',
        dob: '1988-04-12',
        scannedCounterName: 'Counter 01 - OPD Fast Track',
        assignedOpdDepartment: 'General Outpatient OPD',
        assignedDoctorName: prof.doc,
        scannedAt: new Date().toISOString(),
        status: 'CONVERTED_TO_APPOINTMENT'
      };
      setTokensList((prev) => [newRecord, ...prev]);
    }, 600);
  };

  const handleWhatsAppDispatch = () => {
    setWhatsAppDispatched(true);
    setTimeout(() => setWhatsAppDispatched(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.5rem' }}>🇮🇳</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              1-Second ABDM "Scan & Share" Reception Counter Kiosk
            </h2>
            <Badge variant="success">NHA ABDM Milestone 2 Live</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Zero-typing fast-track OPD registration. Patients scan QR using Aarogya Setu / ABHA app $ightarrow$ 1-second auto-token dispatch.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSimulateScan(0)}
            style={{ fontWeight: 800, backgroundColor: '#10B981', borderColor: '#10B981' }}
          >
            {isScanning ? '⏳ Reading ABHA e-KYC...' : '📲 Simulate Patient QR Scan'}
          </Button>
        </div>
      </div>

      {/* 2-Column Kiosk Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Left: Physical Counter Standee QR Display */}
        <div style={{
          backgroundColor: '#060C18',
          border: '2px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.25rem' }}>🇮🇳</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              AYUSHMAN BHARAT DIGITAL MISSION
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px' }}>
            National Health Authority (NHA) Verified Kiosk
          </div>

          {/* Hospital Counter QR Standee */}
          <div style={{
            backgroundColor: '#030712',
            border: '2px solid #10B981',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
            marginBottom: '16px'
          }}>
            <img
              src={qrImageUrl}
              alt="ABDM Scan and Share QR"
              style={{ width: '200px', height: '200px', borderRadius: '8px' }}
            />
            <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 800, marginTop: '8px' }}>
              COUNTER #01 • OPD RECEPTION
            </div>
            <div style={{ fontSize: '0.625rem', color: '#64748B' }}>
              Facility ID: IN0710002148 (Apex Multi-Specialty)
            </div>
          </div>

          {/* Scan Instructions */}
          <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: '1.4', marginBottom: '16px' }}>
            Scan with <strong>Aarogya Setu / ABHA App / Paytm / EkaCare</strong> to share demographic profile and get instant OPD token without waiting in line!
          </div>

          {/* Patient Profile Simulators */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => handleSimulateScan(0)}
              style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#A7F3D0', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
            >
              👤 Scan: Rahul Verma (38y/M)
            </button>
            <button
              onClick={() => handleSimulateScan(1)}
              style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38BDF8', color: '#BAE6FD', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
            >
              👤 Scan: Anjali Gupta (29y/F)
            </button>
            <button
              onClick={() => handleSimulateScan(2)}
              style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#FDE68A', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
            >
              👤 Scan: Mohd. Farooq (46y/M)
            </button>
          </div>
        </div>

        {/* Right: Instant 1-Second Token Slip & e-KYC Verification */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              🖨️ Auto-Dispensed 1-Second Token Slip
            </span>
            <Badge variant="success">ABHA e-KYC Verified</Badge>
          </div>

          {/* Printable 80mm ESC/POS Thermal Slip */}
          <div style={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            padding: '16px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
            border: '1px solid #CBD5E1'
          }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>APEX HOSPITAL & CLINIC</div>
            <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: '#475569' }}>ABDM Fast-Track OPD Reception Slip</div>
            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

            <div style={{ textAlign: 'center', margin: '6px 0' }}>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>YOUR TOKEN NUMBER</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#000' }}>
                {scannedPatient.tokenNumber}
              </div>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>Patient:</span>
              <strong>{scannedPatient.patientName} ({scannedPatient.dob})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>ABHA ID:</span>
              <strong style={{ color: '#047857' }}>{scannedPatient.patientAbhaAddress}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>ABHA No:</span>
              <span>{scannedPatient.patientAbhaNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>Mobile:</span>
              <span>{scannedPatient.mobile}</span>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

            <div style={{ margin: '3px 0' }}>
              <span>Doctor: </span>
              <strong>{scannedPatient.doctor}</strong>
            </div>
            <div style={{ margin: '3px 0' }}>
              <span>Chamber: </span>
              <strong style={{ color: '#1D4ED8' }}>{scannedPatient.chamber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>Est. Wait:</span>
              <strong>~{scannedPatient.waitEst}</strong>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
            <div style={{ textAlign: 'center', fontSize: '0.625rem', color: '#64748B' }}>
              Time: {scannedPatient.scannedAt} • Verified via NHA Gateway
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => window.print()}
              style={{ flex: '1 1 auto', fontWeight: 700 }}
            >
              {printSuccess ? '✓ Token Printed!' : '🖨️ Print 80mm Slip'}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleWhatsAppDispatch}
              style={{ flex: '1 1 auto', fontWeight: 800, backgroundColor: '#10B981', borderColor: '#10B981' }}
            >
              {whatsAppDispatched ? '✓ WhatsApp Slip Sent!' : '📲 Send on WhatsApp'}
            </Button>
          </div>
        </div>
      </div>

      
      {/* ABDM 2.0 Longitudinal Health Information Exchange (HIE-CM) Record Vault */}
      <Card style={{ padding: '18px', border: '1.5px solid #06B6D4', backgroundColor: '#0B132B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🇮🇳</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                ABDM 2.0 National Health Exchange (HIE-CM) Longitudinal Records
              </h3>
              <Badge variant="primary">NRCES FHIR R4 Decrypted</Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Patient consent verified for {scannedPatient.patientName} ({scannedPatient.patientAbhaAddress})
            </span>
          </div>

          <Badge variant="success">✓ Electronic Consent M3 Active</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>🏥 Max Healthcare (Saket)</span>
              <Badge variant="neutral">Discharge Summary</Badge>
            </div>
            <p style={{ margin: '6px 0 2px', fontSize: '0.75rem', color: '#F8FAFC' }}>Laparoscopic Cholecystectomy Post-Op Note</p>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Encounter Date: 14 Nov 2025 • Dr. S. K. Roy</span>
          </div>

          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#10B981' }}>🧪 Dr. Lal PathLabs (Central)</span>
              <Badge variant="neutral">Diagnostic Report</Badge>
            </div>
            <p style={{ margin: '6px 0 2px', fontSize: '0.75rem', color: '#F8FAFC' }}>Comprehensive Lipid Panel & HbA1c (6.8%)</p>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Sample Date: 18 Jan 2026 • Verified NABL</span>
          </div>

          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#A78BFA' }}>🩻 Apollo Hospital (Radiology)</span>
              <Badge variant="neutral">Digital DICOM X-Ray</Badge>
            </div>
            <p style={{ margin: '6px 0 2px', fontSize: '0.75rem', color: '#F8FAFC' }}>Chest PA View Normal / Clear Lung Fields</p>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Report Date: 02 Feb 2026 • NRCES Signed</span>
          </div>
        </div>
      </Card>


      {/* Recent Scan & Share Token Logs Table */}
      <Card style={{ padding: '18px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px' }}>
          Recent ABDM Scan & Share OPD Token Stream
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {tokensList.slice(0, 6).map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
                  {t.tokenNumber}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {t.patientName}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#06B6D4' }}>
                  {t.patientAbhaAddress}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge variant="success">{t.status}</Badge>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                  {t.assignedDoctorName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
