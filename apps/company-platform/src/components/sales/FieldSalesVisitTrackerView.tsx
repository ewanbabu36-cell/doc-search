import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface FieldVisit {
  visitId: string;
  bdmName: string;
  visitedEntity: string;
  gpsCoordinates: string;
  gpsVerified: boolean;
  meetingKeyPersonnel: string;
  clinicalDiscussionNotes: string;
  visitTimestamp: string;
}

const INITIAL_VISITS: FieldVisit[] = [
  {
    visitId: 'VISIT-GPS-101',
    bdmName: 'Vikram Sethi (Senior BDM)',
    visitedEntity: 'Medanta - The Medicity (Sector 38, Gurugram)',
    gpsCoordinates: '28.4392° N, 77.0428° E (Hospital OPD Lobby)',
    gpsVerified: true,
    meetingKeyPersonnel: 'Dr. A. K. Dubey (Medical Superintendent)',
    clinicalDiscussionNotes: 'Demonstrated SNOMED CT Rx auto-complete & ABDM 2.0 gateway. MS requested formal pricing proposal for 850 OPD doctor licenses.',
    visitTimestamp: 'Today, 11:30 AM'
  },
  {
    visitId: 'VISIT-GPS-102',
    bdmName: 'Pooja Hegde (Regional Lead)',
    visitedEntity: 'Manipal Hospital (Old Airport Road, Bengaluru)',
    gpsCoordinates: '12.9592° N, 77.6499° E (Radiology Dept Block)',
    gpsVerified: true,
    meetingKeyPersonnel: 'HOD Radiology & PACS Admin',
    clinicalDiscussionNotes: 'Reviewed 3D DICOM Web PACS viewer load times across CT scan volumes. Radiologist team gave 100% technical approval.',
    visitTimestamp: 'Yesterday'
  }
];

export const FieldSalesVisitTrackerView: React.FC = () => {
  const [visits, setVisits] = useState<FieldVisit[]>(INITIAL_VISITS);
  const [logNotice, setLogNotice] = useState<string | null>(null);

  const handleSimulateCheckin = () => {
    const newV: FieldVisit = {
      visitId: `VISIT-GPS-${Math.floor(100 + Math.random() * 900)}`,
      bdmName: 'Rohit Kulkarni (Enterprise Lead)',
      visitedEntity: 'Kokilaben Dhirubhai Ambani Hospital (Andheri West, Mumbai)',
      gpsCoordinates: '19.1314° N, 72.8258° E (Executive Boardroom)',
      gpsVerified: true,
      meetingKeyPersonnel: 'Chief Procurement Officer & IT Director',
      clinicalDiscussionNotes: 'Reviewed BAA Data Retention and DPDP Act 2023 compliance agreements. Contract queued for final sign-off.',
      visitTimestamp: 'Just now'
    };
    setVisits((prev) => [newV, ...prev]);
    setLogNotice(`✓ GPS Verified On-Ground Hospital Check-In logged for "${newV.visitedEntity}"!`);
    setTimeout(() => setLogNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              📍 Field BDM GPS Check-In & Clinic Visit Tracker
            </h2>
            <Badge variant="success">● Geo-Fenced On-Ground Hospital Visit Audit Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time GPS coordinate verification of field sales visits, doctor meeting notes dictation, and contract procurement tracking
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulateCheckin}
          style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 900, fontSize: '0.8125rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
        >
          📍 Log Verified Hospital Visit
        </button>
      </div>

      {logNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {logNotice}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>HOSPITAL VISITS LOGGED (MONTH)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>148 Visits</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% Geo-Fenced GPS Verified</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>MEETINGS WITH CHIEF DOCTORS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>82 Consultations</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Medical Superintendent & HOD level</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>DEMO-TO-PROPOSAL CONVERSION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>64.8%</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Rapid proposal delivery within 24h</span>
        </div>
      </div>

      {/* Visits Table */}
      <Card title="📜 Field Sales Hospital Visits & Clinical Discussions" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BDM Name & Hospital</TableHead>
                <TableHead>Geo-Fenced GPS Location</TableHead>
                <TableHead>Key Personnel Met</TableHead>
                <TableHead>Clinical Discussion & Deal Notes</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Visit Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((v) => (
                <TableRow key={v.visitId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{v.visitedEntity}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Rep: {v.bdmName}</span>
                    <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{v.visitId}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">✓ GPS Verified</Badge>
                    <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#CBD5E1', display: 'block', marginTop: '2px' }}>
                      {v.gpsCoordinates}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FCD34D' }}>
                    {v.meetingKeyPersonnel}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '300px', lineHeight: '1.4' }}>
                    {v.clinicalDiscussionNotes}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94A3B8' }}>
                    {v.visitTimestamp}
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
