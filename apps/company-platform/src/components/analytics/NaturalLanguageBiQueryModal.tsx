import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NaturalLanguageBiQueryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('Show me top 5 revenue-generating hospital chains in Delhi NCR with their average patient wait times');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    interpretation: string;
    generatedAggregation: string;
    kpis: { label: string; value: string }[];
    summaryPoints: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleRunQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setResult(null);

    setTimeout(() => {
      setIsProcessing(false);
      setResult({
        interpretation: 'Aggregating August 2026 Invoiced Revenue and OPD Queue Token Timestamps across 34 Delhi NCR Healthcare Facilities.',
        generatedAggregation: `db.tenants.aggregate([
  { $match: { region: "DELHI_NCR", status: "ACTIVE" } },
  { $lookup: { from: "invoices", localField: "id", foreignField: "tenantId", as: "bills" } },
  { $lookup: { from: "opd_tokens", localField: "id", foreignField: "tenantId", as: "tokens" } },
  { $project: {
      name: "$tradeName",
      totalRevenue: { $sum: "$bills.totalAmount" },
      avgWaitMins: { $avg: "$tokens.waitTimeMinutes" }
  }},
  { $sort: { totalRevenue: -1 } },
  { $limit: 5 }
])`,
        kpis: [
          { label: 'TOP FACILITY REVENUE', value: '₹1.84 Cr (Apollo Delhi)' },
          { label: 'AVG WAIT TIME (NCR)', value: '14.2 Mins' },
          { label: 'OPD RETENTION RATE', value: '94.8%' },
          { label: 'ABDM SYNC SCORE', value: '99.4%' }
        ],
        summaryPoints: [
          'Apollo Multispecialty (Sarita Vihar) leads NCR revenue with ₹1.84 Cr (up +18% MoM), maintaining a low 11-min wait time.',
          'Max Healthcare Patparganj ranks #2 with ₹1.42 Cr and 98.4% digital prescription compliance.',
          'Fortis Escorts Okhla achieved the fastest triage speed with an average doctor consultation turnaround of 9.5 minutes.',
          'Actionable Recommendation: Allocate 2 additional OPD tokens/hr for Apollo cardiology wing to optimize afternoon wait times.'
        ]
      });
    }, 500);
  };

  const sampleQueries = [
    'Compare CBC & Dengue lab volume between July and August 2026',
    'Which 3 diagnostic labs have the fastest NABL digital signature turnaround?',
    'Show me total GST collected and partner payouts for Q2 2026'
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10005,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(6, 182, 212, 0.6)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 Natural Language AI Query Co-Pilot
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Ask any clinical, operational or financial question in plain English/Hinglish
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleRunQuery} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>
              YOUR NATURAL LANGUAGE QUERY:
            </label>
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1.5px solid #06B6D4', borderRadius: '8px', padding: '10px 14px', color: '#FFF', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>Quick Prompts:</span>
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(sq)}
                style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '4px 10px', fontSize: '0.6875rem', color: '#38BDF8', cursor: 'pointer' }}
              >
                {sq}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="submit"
              disabled={isProcessing}
              style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)' }}
            >
              {isProcessing ? '⚡ Analyzing Platform Data Lake...' : '✨ Execute AI Query'}
            </button>
          </div>
        </form>

        {result && (
          <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Interpretation */}
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid #06B6D4', borderRadius: '8px', padding: '10px 14px', fontSize: '0.75rem', color: '#A5F3FC' }}>
              💡 <strong>AI INTENT:</strong> {result.interpretation}
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              {result.kpis.map((k, i) => (
                <div key={i} style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '10px', textAlign: 'center', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 800 }}>{k.label}</span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Executive Summary Points */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                Executive Intelligence Synthesis:
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', color: '#CBD5E1' }}>
                {result.summaryPoints.map((pt, i) => (
                  <li key={i} style={{ lineHeight: '1.45' }}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Generated Query Pipeline */}
            <div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Underlying MongoDB Aggregation Pipeline:
              </span>
              <pre style={{ backgroundColor: '#020617', border: '1px solid #1E293B', borderRadius: '8px', padding: '10px', fontSize: '0.6875rem', color: '#38BDF8', overflowX: 'auto', margin: 0 }}>
                {result.generatedAggregation}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
