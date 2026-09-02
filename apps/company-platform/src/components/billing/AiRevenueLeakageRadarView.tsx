import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface LeakageAnomalyItem {
  id: string;
  category: 'UNBILLED_TOKEN' | 'GST_SAC_ANOMALY' | 'UNCOLLECTED_TPA_COPAY' | 'SPLIT_MISMATCH';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  entityName: string;
  patientName?: string;
  detectedAt: string;
  leakageAmountInr: number;
  description: string;
  rootCause: string;
  recommendedAction: string;
  status: 'DETECTED' | 'RESOLVING' | 'RESOLVED';
}

export const AiRevenueLeakageRadarView: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const [anomalies, setAnomalies] = useState<LeakageAnomalyItem[]>([
    {
      id: 'LEAK-801',
      category: 'UNBILLED_TOKEN',
      severity: 'CRITICAL',
      entityName: 'Max Super Speciality Hospital Saket',
      patientName: 'Ramesh Kumar (Token #OPD-1842)',
      detectedAt: '2026-09-02 06:45 AM',
      leakageAmountInr: 1200,
      description: 'Patient consultation completed with Dr. Vivek Sengupta (Neuro). Zero billing invoice generated.',
      rootCause: 'EMR Doctor closed SOAP note before reception marked token as Billed.',
      recommendedAction: 'Auto-Generate ₹1,200 Tax Invoice & Dispatch SMS Link',
      status: 'DETECTED'
    },
    {
      id: 'LEAK-802',
      category: 'GST_SAC_ANOMALY',
      severity: 'HIGH',
      entityName: 'Apollo Hospital Bangalore',
      detectedAt: '2026-09-02 05:20 AM',
      leakageAmountInr: 8999,
      description: 'Platform Software Subscription mapped to Healthcare Exemption SAC instead of IT SAC 998313.',
      rootCause: 'Manual billing account override selected wrong SAC exemption category during onboarding.',
      recommendedAction: 'Re-align to SAC 998313 (GST 18%) & Re-generate IRN Credit Note',
      status: 'DETECTED'
    },
    {
      id: 'LEAK-803',
      category: 'UNCOLLECTED_TPA_COPAY',
      severity: 'HIGH',
      entityName: 'Fortis Memorial Research Institute',
      patientName: 'Sunita Sharma (Claim #CLM-STAR-9021)',
      detectedAt: '2026-09-02 04:10 AM',
      leakageAmountInr: 4500,
      description: 'Star Health TPA approved 85% claim. Patient 15% co-pay (₹4,500) uncollected upon discharge.',
      rootCause: 'Fast-track emergency discharge occurred before co-pay POS settlement.',
      recommendedAction: 'Dispatch Instant WhatsApp 1-Click UPI Payment Link with Claim Summary',
      status: 'DETECTED'
    },
    {
      id: 'LEAK-804',
      category: 'UNBILLED_TOKEN',
      severity: 'CRITICAL',
      entityName: 'Medanta The Medicity Gurugram',
      patientName: 'Pooja Verma (Token #OPD-3049)',
      detectedAt: '2026-09-02 03:30 AM',
      leakageAmountInr: 950,
      description: 'Tele-consultation completed with Dr. Sunita Deshmukh. Invoice state stuck in DRAFT.',
      rootCause: 'Razorpay webhook response timed out during network glitch.',
      recommendedAction: 'Re-verify Payment Gateway Settlement & Finalize Paid Invoice',
      status: 'DETECTED'
    },
    {
      id: 'LEAK-805',
      category: 'GST_SAC_ANOMALY',
      severity: 'MEDIUM',
      entityName: 'Tata Diagnostic & Molecular Lab',
      detectedAt: '2026-09-01 11:15 PM',
      leakageAmountInr: 2400,
      description: 'Home Blood Sample Collection Fee billed under SAC 999312 instead of Courier SAC 996813.',
      rootCause: 'Phlebotomy convenience fee tagged under Clinical Consultation head.',
      recommendedAction: 'Update Line Item Tax Mapping to Correct SAC Code',
      status: 'DETECTED'
    }
  ]);

  const handleRunAiScan = () => {
    setIsScanning(true);
    setActionSuccessNotice(null);
    setTimeout(() => {
      setIsScanning(false);
      setActionSuccessNotice('✅ AI Background Scanner completed! 1,420 transactions scanned across 18 hospital partitions. 5 active anomalies isolated.');
    }, 1200);
  };

  const handleAutoResolve = (id: string, actionMsg: string) => {
    setAnomalies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'RESOLVED' } : item))
    );
    setActionSuccessNotice(`⚡ Successfully Auto-Resolved [${id}]: ${actionMsg}`);
  };

  // Filter calculations
  const filteredItems = anomalies.filter((item) => {
    const matchCat = filterCategory === 'ALL' || item.category === filterCategory;
    const matchSev = filterSeverity === 'ALL' || item.severity === filterSeverity;
    return matchCat && matchSev;
  });

  const totalLeakageRecoverableInr = anomalies
    .filter((a) => a.status !== 'RESOLVED')
    .reduce((acc, curr) => acc + curr.leakageAmountInr, 0);

  const totalResolvedInr = anomalies
    .filter((a) => a.status === 'RESOLVED')
    .reduce((acc, curr) => acc + curr.leakageAmountInr, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 50%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>⚡</span>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Automated AI Revenue Leakage & Anomaly Radar
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Real-time autonomous scanner detecting unbilled OPD tokens, GST SAC code misclassifications, and uncollected TPA co-pays.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="primary"
            onClick={handleRunAiScan}
            disabled={isScanning}
          >
            {isScanning ? '🔄 Scanning 1,420 Nodes...' : '🔍 Trigger Real-Time AI Leakage Scan'}
          </Button>
        </div>
      </div>

      {actionSuccessNotice && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1.5px solid #10B981',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#6EE7B7',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <span>{actionSuccessNotice}</span>
          <button
            type="button"
            onClick={() => setActionSuccessNotice(null)}
            style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Cards Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '14px',
          padding: '18px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 700, textTransform: 'uppercase' }}>
            🚨 At-Risk Revenue Leakage
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
            ₹{totalLeakageRecoverableInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Across {anomalies.filter((a) => a.status !== 'RESOLVED').length} Active Anomalies
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '14px',
          padding: '18px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, textTransform: 'uppercase' }}>
            ✅ Recovered Revenue Today
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{totalResolvedInr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Auto-reconciled by AI rules
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '14px',
          padding: '18px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase' }}>
            ⚠️ GST SAC Risk Score
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            99.2%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Govt NIC SAC 999312 / 998313 Accuracy
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '14px',
          padding: '18px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
            🏥 TPA Co-Pay Collection Rate
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#06B6D4', marginTop: '4px' }}>
            96.8%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Avg recovery latency: 4.2 mins
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Anomalies' },
            { id: 'UNBILLED_TOKEN', label: '🔍 Unbilled Tokens' },
            { id: 'GST_SAC_ANOMALY', label: '⚠️ GST SAC Mismatch' },
            { id: 'UNCOLLECTED_TPA_COPAY', label: '📉 Uncollected TPA Co-Pay' }
          ].map((tab) => {
            const isSelected = filterCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCategory(tab.id)}
                style={{
                  backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                  border: isSelected ? '1.5px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#FFFFFF' : '#94A3B8',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Severity Filter:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#FFF',
              fontSize: '0.8125rem'
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
        </div>
      </div>

      {/* Anomalies List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredItems.length === 0 ? (
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#94A3B8'
          }}>
            <span style={{ fontSize: '2rem' }}>🎉</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginTop: '8px' }}>
              Zero Anomalies in this Category!
            </div>
            <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
              All billing nodes are fully reconciled and 100% compliant.
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isResolved = item.status === 'RESOLVED';
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: isResolved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.8)',
                  border: isResolved
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : item.severity === 'CRITICAL'
                    ? '1.5px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
                }}
              >
                {/* Header Line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        backgroundColor: item.severity === 'CRITICAL' ? '#EF4444' : item.severity === 'HIGH' ? '#F59E0B' : '#3B82F6',
                        color: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: 800
                      }}>
                        {item.severity}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {item.entityName}
                      </span>
                      {item.patientName && (
                        <span style={{ fontSize: '0.8125rem', color: '#38BDF8' }}>
                          • {item.patientName}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      Anomaly ID: <strong style={{ color: '#E2E8F0' }}>{item.id}</strong> • Detected: {item.detectedAt}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isResolved ? '#10B981' : '#EF4444' }}>
                      ₹{item.leakageAmountInr.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: isResolved ? '#34D399' : '#F87171', fontWeight: 700 }}>
                      {isResolved ? '✅ RECOVERED & RECONCILED' : '🚨 LEAKAGE AT RISK'}
                    </div>
                  </div>
                </div>

                {/* Description & Root Cause */}
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '10px',
                  fontSize: '0.8125rem'
                }}>
                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Issue Description:</span>
                    <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{item.description}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Root Cause Analysis:</span>
                    <span style={{ color: '#FCD34D', fontWeight: 500 }}>{item.rootCause}</span>
                  </div>
                </div>

                {/* Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 600 }}>
                    💡 Suggested Solution: {item.recommendedAction}
                  </div>

                  <div>
                    {isResolved ? (
                      <Badge variant="success">RESOLVED</Badge>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handleAutoResolve(item.id, item.recommendedAction)}
                      >
                        ⚡ 1-Click Auto-Heal & Reconcile
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
