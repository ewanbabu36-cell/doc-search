import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface ClinicSeoRank {
  id: string;
  clinicName: string;
  cityArea: string;
  targetKeywords: string;
  googleMapsRank: string;
  docSearchRank: string;
  monthlyPatientImpressions: string;
  seoHealthScore: string;
}

const INITIAL_RANKS: ClinicSeoRank[] = [
  {
    id: 'SEO-LOC-01',
    clinicName: 'Max Heart & Vascular Institute',
    cityArea: 'Saket & South Delhi',
    targetKeywords: 'Best Cardiologist near me, ECG Saket',
    googleMapsRank: '#1 on Google Local 3-Pack',
    docSearchRank: '#1 Top Doctor Badge',
    monthlyPatientImpressions: '1,42,000 Views',
    seoHealthScore: '98.5%'
  },
  {
    id: 'SEO-LOC-02',
    clinicName: 'Apollo Children & Newborn Care Clinic',
    cityArea: 'Indiranagar, Bengaluru',
    targetKeywords: 'Pediatrician Indiranagar, Vaccination Clinic',
    googleMapsRank: '#2 on Google Maps',
    docSearchRank: '#1 Verified Specialist',
    monthlyPatientImpressions: '98,400 Views',
    seoHealthScore: '96.2%'
  },
  {
    id: 'SEO-LOC-03',
    clinicName: 'Manipal Orthopaedic & Spine Center',
    cityArea: 'Banjara Hills, Hyderabad',
    targetKeywords: 'Joint Replacement Hyderabad, Spine Doctor',
    googleMapsRank: '#1 on Google Local 3-Pack',
    docSearchRank: '#2 Top Hospital',
    monthlyPatientImpressions: '1,12,000 Views',
    seoHealthScore: '99.1%'
  }
];

export const HyperlocalClinicSeoRankView: React.FC = () => {
  const [ranks] = useState<ClinicSeoRank[]>(INITIAL_RANKS);
  const [optimizeNotice, setOptimizeNotice] = useState<string | null>(null);

  const handleBoostRank = (c: ClinicSeoRank) => {
    setOptimizeNotice(`✓ Hyperlocal Schema markup & Google Business Profile auto-optimized for "${c.clinicName}"!`);
    setTimeout(() => setOptimizeNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📍 Hyperlocal Healthcare SEO & Clinic Rank Booster
          </h2>
          <Badge variant="success">● Google Maps 3-Pack & Local SEO AI Booster Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Real-time tracking and automated schema markup to rank partner doctors and clinics #1 on local patient search results
        </p>
      </div>

      {optimizeNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {optimizeNotice}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL LOCAL SEARCH REACH</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>3.8 Million / mo</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>High-intent patient searches</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>#1 GOOGLE 3-PACK DOMINANCE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>84.2% Clinics</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Top 3 Local Map rankings</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ORGANIC APPOINTMENT SHARE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>72.8% Free Traffic</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero ad spend required</span>
        </div>
      </div>

      {/* SEO Table */}
      <Card title="📜 Hyperlocal Clinic & Hospital Search Engine Dominance" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinic / Hospital</TableHead>
                <TableHead>Locality & City</TableHead>
                <TableHead>Target Keywords</TableHead>
                <TableHead>Google Maps Rank</TableHead>
                <TableHead>DocSearch Rank</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranks.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.clinicName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Monthly: {r.monthlyPatientImpressions}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {r.cityArea}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    {r.targetKeywords}
                  </TableCell>
                  <TableCell style={{ color: '#10B981', fontWeight: 800 }}>
                    {r.googleMapsRank}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{r.docSearchRank}</Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleBoostRank(r)}
                      style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      🚀 AI Boost Rank
                    </button>
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
