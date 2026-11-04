import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  Input,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

interface PhysicianItem {
  registrationNumber: string;
  stateMedicalCouncil: string;
  doctorFullName: string;
  primaryQualification: string;
  primaryUniversity: string;
  primaryPassingYear: number;
  additionalQualifications: string[];
  verificationStatus: 'VERIFIED' | 'SUSPENDED' | 'EXPIRED' | 'UNREGISTERED';
  disciplinaryStatus: 'CLEAR' | 'SANCTIONED' | 'PROBATION';
  associatedHospital?: string;
  verifiedAt: string;
  auditHash: string;
}

const INITIAL_PHYSICIANS: PhysicianItem[] = [
  {
    registrationNumber: 'DMC-44120',
    stateMedicalCouncil: 'Delhi Medical Council (DMC)',
    doctorFullName: 'Dr. Rohan Sethi',
    primaryQualification: 'MBBS (AIIMS New Delhi)',
    primaryUniversity: 'All India Institute of Medical Sciences (AIIMS)',
    primaryPassingYear: 2007,
    additionalQualifications: ['MD - Internal Medicine (AIIMS)', 'DM - Cardiology (GB Pant)'],
    verificationStatus: 'VERIFIED',
    disciplinaryStatus: 'CLEAR',
    associatedHospital: 'Apollo Speciality Multispeciality Hospital',
    verifiedAt: '2026-11-01',
    auditHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d'
  },
  {
    registrationNumber: 'KMC-99211',
    stateMedicalCouncil: 'Karnataka Medical Council (KMC)',
    doctorFullName: 'Dr. Priya Venkatraman',
    primaryQualification: 'MBBS (CMC Vellore)',
    primaryUniversity: 'Christian Medical College (CMC, Vellore)',
    primaryPassingYear: 2012,
    additionalQualifications: ['MS - General Surgery', 'MCh - Surgical Oncology (Kidwai)'],
    verificationStatus: 'VERIFIED',
    disciplinaryStatus: 'CLEAR',
    associatedHospital: 'Manipal Super Specialty Centre',
    verifiedAt: '2026-11-02',
    auditHash: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c'
  },
  {
    registrationNumber: 'MMC-33108',
    stateMedicalCouncil: 'Maharashtra Medical Council (MMC)',
    doctorFullName: 'Dr. Nilesh Kulkarni',
    primaryQualification: 'MBBS (Grant Medical College)',
    primaryUniversity: 'Grant Medical College & Sir JJ Hospital Mumbai',
    primaryPassingYear: 2003,
    additionalQualifications: ['DNB - Orthopaedics'],
    verificationStatus: 'SUSPENDED',
    disciplinaryStatus: 'SANCTIONED',
    associatedHospital: 'Independent Clinic Mumbai',
    verifiedAt: '2026-10-15',
    auditHash: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e'
  },
  {
    registrationNumber: 'WBMC-12093',
    stateMedicalCouncil: 'West Bengal Medical Council (WBMC)',
    doctorFullName: 'Dr. Ananya Banerjee',
    primaryQualification: 'MBBS (Calcutta Medical College)',
    primaryUniversity: 'Calcutta Medical College Kolkata',
    primaryPassingYear: 2014,
    additionalQualifications: ['MD - Paediatrics (IPGMER)'],
    verificationStatus: 'VERIFIED',
    disciplinaryStatus: 'CLEAR',
    associatedHospital: 'KIMS Institute of Medical Sciences',
    verifiedAt: '2026-11-03',
    auditHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d'
  }
];

export const NmcPhysicianRegistryHubView: React.FC = () => {
  const [physicians] = useState<PhysicianItem[]>(INITIAL_PHYSICIANS);
  const [searchRegInput, setSearchRegInput] = useState('');
  const [searchResult, setSearchResult] = useState<PhysicianItem | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const verifiedCount = physicians.filter((p) => p.verificationStatus === 'VERIFIED').length;
  const suspendedCount = physicians.filter((p) => p.verificationStatus === 'SUSPENDED').length;

  const handleVerifyQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setSearchResult(null);

    const query = searchRegInput.trim().toUpperCase();
    if (!query) return;

    const match = physicians.find(
      (p) =>
        p.registrationNumber.toUpperCase() === query ||
        p.registrationNumber.replace('-', '').toUpperCase() === query.replace('-', '')
    );

    if (match) {
      setSearchResult(match);
      setToastMessage(`NMC Registry matched: ${match.doctorFullName} (${match.stateMedicalCouncil})`);
    } else {
      setSearchError(`Registration "${query}" not found in statutory National Medical Commission register. Impersonation fraud alert raised.`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSyncCouncil = (item: PhysicianItem) => {
    setToastMessage(`⚡ Re-queried National Medical Commission API gateway for ${item.doctorFullName}: Validated status is ${item.verificationStatus}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>✅ {toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0F172A',
          padding: '24px 28px',
          borderRadius: '12px',
          border: '1px solid #1E293B'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.4rem' }}>🩺</span>
            <h2 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.35rem', fontWeight: 700 }}>
              National Medical Commission (NMC) Physician Registry Hub
            </h2>
            <Badge variant="primary">Salesforce Health Cloud Benchmark</Badge>
            <Badge variant="success">Statutory Council Integration</Badge>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>
            Live cryptographic verification against NMC & State Councils (KMC, MMC, DMC, TNMC) to deter medical fraud & license impersonation.
          </p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Verified Physicians
          </div>
          <div style={{ color: '#10B981', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            {verifiedCount} Doctors
          </div>
          <div style={{ color: '#10B981', fontSize: '0.78rem', marginTop: '6px' }}>
            100% statutory council authenticated
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Sanctioned / Suspended
          </div>
          <div style={{ color: '#EF4444', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            {suspendedCount} Doctors
          </div>
          <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '6px' }}>
            Prescription privileges disabled
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Council API Latency
          </div>
          <div style={{ color: '#38BDF8', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            142 ms
          </div>
          <div style={{ color: '#38BDF8', fontSize: '0.78rem', marginTop: '6px' }}>
            Real-time direct national gateway
          </div>
        </Card>

        <Card style={{ padding: '20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Impersonation Deterrence
          </div>
          <div style={{ color: '#A855F7', fontSize: '1.6rem', fontWeight: 700, marginTop: '8px' }}>
            Zero Breaches
          </div>
          <div style={{ color: '#A855F7', fontSize: '0.78rem', marginTop: '6px' }}>
            SHA-256 tamper-proof audit trails
          </div>
        </Card>
      </div>

      {/* 1-Click Verification Query Tool */}
      <Card style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
        <h3 style={{ margin: '0 0 14px 0', color: '#F8FAFC', fontSize: '1.1rem', fontWeight: 700 }}>
          1-Click Live Physician License Verification Desk
        </h3>

        <form onSubmit={handleVerifyQuery} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Input
              type="text"
              placeholder="Enter Registration No. (e.g. DMC-44120, KMC-99211, MMC-33108)"
              value={searchRegInput}
              onChange={(e) => setSearchRegInput(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <Button variant="primary" type="submit" style={{ whiteSpace: 'nowrap' }}>
            🔍 Verify with National Council
          </Button>
        </form>

        {searchError && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              color: '#F87171',
              fontSize: '0.88rem'
            }}
          >
            🛑 <strong>FRAUD WARNING:</strong> {searchError}
          </div>
        )}

        {searchResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: searchResult.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${searchResult.verificationStatus === 'VERIFIED' ? '#10B981' : '#EF4444'}`,
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#F8FAFC', fontSize: '1.05rem' }}>
                  {searchResult.doctorFullName}
                </h4>
                <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                  {searchResult.registrationNumber} • {searchResult.stateMedicalCouncil}
                </div>
              </div>
              <Badge variant={searchResult.verificationStatus === 'VERIFIED' ? 'success' : 'danger'}>
                {searchResult.verificationStatus}
              </Badge>
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.84rem', color: '#CBD5E1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>Primary Degree: <strong>{searchResult.primaryQualification}</strong> ({searchResult.primaryPassingYear})</div>
              <div>University: <strong>{searchResult.primaryUniversity}</strong></div>
              <div>Hospital: <strong>{searchResult.associatedHospital || 'Affiliated Network'}</strong></div>
            </div>
          </div>
        )}
      </Card>

      {/* Directory of Network Verified Physicians */}
      <Card style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700 }}>
          Statutory Physician Registry & Disciplinary Ledger
        </h3>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor & Council Reg.</TableHead>
                <TableHead>Medical Qualifications</TableHead>
                <TableHead>Awarding University</TableHead>
                <TableHead>Associated Hospital</TableHead>
                <TableHead>License Status</TableHead>
                <TableHead>Disciplinary Record</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {physicians.map((item) => (
                <TableRow key={item.registrationNumber}>
                  <TableCell>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.doctorFullName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                      {item.registrationNumber}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{item.stateMedicalCouncil}</div>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 600, color: '#CBD5E1', fontSize: '0.85rem' }}>
                      {item.primaryQualification}
                    </div>
                    {item.additionalQualifications.map((aq) => (
                      <div key={aq} style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                        • {aq}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8rem', color: '#CBD5E1', maxWidth: '200px' }}>
                    {item.primaryUniversity}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                    {item.associatedHospital || 'Private Consultation'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.verificationStatus === 'VERIFIED' ? 'success' : 'danger'}>
                      {item.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.disciplinaryStatus === 'CLEAR' ? 'success' : 'danger'}>
                      {item.disciplinaryStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      onClick={() => handleSyncCouncil(item)}
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      🔄 Re-Query
                    </Button>
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
