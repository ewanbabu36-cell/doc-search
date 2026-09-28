import React, { useState, useEffect } from 'react';

export interface DecisionTierTrace {
  tierNumber: number;
  tierName: string;
  status: 'PASS' | 'DENY' | 'OVERRIDE' | 'SKIPPED';
  detail: string;
}

export interface AccessDecision {
  decision: 'ALLOW' | 'DENY';
  code: string;
  reason: string;
  decisiveTier: string;
  tierNumber: number;
  trace: DecisionTierTrace[];
  timestamp: string;
  evaluatedContext: any;
}

export interface StaffAccessAndSimulatorCockpitProps {
  partnerId: string;
  partnerName: string;
  onClose: () => void;
}

export const StaffAccessAndSimulatorCockpit: React.FC<StaffAccessAndSimulatorCockpitProps> = ({
  partnerId,
  partnerName,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'EFFECTIVE_ACCESS' | 'BREAK_GLASS'>('SIMULATOR');

  // Simulator Form State
  const [simRole, setSimRole] = useState('DOCTOR');
  const [simBranchId, setSimBranchId] = useState('patna-main-branch');
  const [simAction, setSimAction] = useState('patient.view');
  const [simGlobalFreeze, setSimGlobalFreeze] = useState(false);
  const [simLicenseStatus, setSimLicenseStatus] = useState<'ACTIVE' | 'EXPIRED' | 'SUSPENDED'>('ACTIVE');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<AccessDecision | null>(null);

  // Live Effective Access State
  const [liveRole, setLiveRole] = useState('RECEPTIONIST');
  const [liveAction, setLiveAction] = useState('invoice.view');
  const [evaluating, setEvaluating] = useState(false);
  const [liveResult, setLiveResult] = useState<AccessDecision | null>(null);

  // Break-Glass Form State
  const [emergencyReason, setEmergencyReason] = useState('');
  const [patientId, setPatientId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [breakGlassStatus, setBreakGlassStatus] = useState<string | null>(null);

  // Run Simulation
  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/v1/company/access/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          role: simRole,
          branchId: simBranchId,
          action: simAction,
          globalFreezeOverride: simGlobalFreeze,
          licenseStatusOverride: simLicenseStatus
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSimulationResult(data.data);
      }
    } catch (e) {
      console.error('Simulator error:', e);
    } finally {
      setSimulating(false);
    }
  };

  // Run Live Effective Access
  const handleRunEffectiveAccess = async () => {
    setEvaluating(true);
    setLiveResult(null);
    try {
      const res = await fetch(
        `/api/v1/company/partners/${partnerId}/effective-access?role=${encodeURIComponent(liveRole)}&action=${encodeURIComponent(liveAction)}`
      );
      const data = await res.json();
      if (res.ok) {
        setLiveResult(data.data);
      }
    } catch (e) {
      console.error('Effective access error:', e);
    } finally {
      setEvaluating(false);
    }
  };

  // Trigger Break-Glass Access
  const handleTriggerBreakGlass = async () => {
    if (!emergencyReason.trim()) return;
    try {
      const res = await fetch('/api/v1/company/break-glass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          reason: emergencyReason.trim(),
          patientId: patientId.trim() || undefined,
          durationMinutes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBreakGlassStatus(`Emergency Access Granted for ${durationMinutes} minutes. Audit ledger record created.`);
        setEmergencyReason('');
      } else {
        setBreakGlassStatus(`Error: ${data.message || 'Break glass trigger failed'}`);
      }
    } catch (e: any) {
      setBreakGlassStatus(`Error: ${e.message}`);
    }
  };

  // Run initial simulation on load
  useEffect(() => {
    void handleRunSimulation();
  }, [partnerId]);

  return (
    <div style={{
      backgroundColor: '#0F172A',
      border: '1px solid #334155',
      borderRadius: '16px',
      width: '100%',
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden'
    }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#090D1A'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                Effective Access Engine & Simulator: {partnerName}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              12-Tier Precedence Evaluation, Dry-Run What-If Testing, and Break-Glass Emergency Authorization
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 24px',
          borderBottom: '1px solid #1E293B',
          backgroundColor: '#0B1120'
        }}>
          {[
            { key: 'SIMULATOR', label: '🔬 Access Simulator (What-If Analysis)' },
            { key: 'EFFECTIVE_ACCESS', label: '⚡ Live Effective Access Check' },
            { key: 'BREAK_GLASS', label: '🚨 Break-Glass Emergency Clinical Access' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                backgroundColor: activeTab === tab.key ? '#38BDF8' : 'transparent',
                color: activeTab === tab.key ? '#070C16' : '#94A3B8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'SIMULATOR' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
              {/* Left Column: Simulator Controls */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Simulation Parameters
                </h3>
                <p style={{ margin: '4px 0 16px', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Execute safe dry-run access tests without mutating the database.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>ROLE</label>
                    <select
                      value={simRole}
                      onChange={(e) => setSimRole(e.target.value)}
                      style={{ width: '100%', marginTop: '4px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    >
                      <option value="DOCTOR">Doctor</option>
                      <option value="SENIOR_RECEPTION_MANAGER">Senior Reception Manager</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="PHARMACIST">Pharmacist</option>
                      <option value="LAB_TECHNICIAN">Lab Technician</option>
                      <option value="BILLING_EXECUTIVE">Billing Executive</option>
                      <option value="NURSE">Nurse</option>
                      <option value="HOSPITAL_ADMIN">Hospital Admin</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>BRANCH ID</label>
                    <input
                      type="text"
                      value={simBranchId}
                      onChange={(e) => setSimBranchId(e.target.value)}
                      placeholder="e.g. patna-main-branch"
                      style={{ width: '100%', marginTop: '4px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>REQUESTED ACTION</label>
                    <select
                      value={simAction}
                      onChange={(e) => setSimAction(e.target.value)}
                      style={{ width: '100%', marginTop: '4px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    >
                      <option value="patient.view">patient.view (Read Patient Record)</option>
                      <option value="appointment.token.create">appointment.token.create (OPD Token)</option>
                      <option value="invoice.view">invoice.view (View Invoices)</option>
                      <option value="invoice.refund">invoice.refund (Refund Billing - Strict Deny)</option>
                      <option value="pharmacy.dispense.create">pharmacy.dispense.create (Dispense Rx)</option>
                      <option value="lab.result.validate">lab.result.validate (Authorize Lab Result)</option>
                      <option value="bloodbank.donor.register">bloodbank.donor.register (Blood Bank)</option>
                    </select>
                  </div>

                  {/* Override Toggles */}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>WHAT-IF OVERRIDES:</span>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#F8FAFC', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={simGlobalFreeze}
                        onChange={(e) => setSimGlobalFreeze(e.target.checked)}
                      />
                      <span>Simulate HQ Global Freeze (Tier 1)</span>
                    </label>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Simulate License Status (Tier 3)</label>
                      <select
                        value={simLicenseStatus}
                        onChange={(e) => setSimLicenseStatus(e.target.value as any)}
                        style={{ width: '100%', marginTop: '4px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem' }}
                      >
                        <option value="ACTIVE">ACTIVE (Normal)</option>
                        <option value="EXPIRED">EXPIRED (Blocks Access)</option>
                        <option value="SUSPENDED">SUSPENDED (Regulatory Lock)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    style={{
                      backgroundColor: '#38BDF8',
                      color: '#070C16',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      marginTop: '10px'
                    }}
                  >
                    {simulating ? 'Evaluating 12 Tiers...' : '⚡ Run Access Simulation'}
                  </button>
                </div>
              </div>

              {/* Right Column: 12-Tier Evaluation Result & Explainable Trace */}
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                {simulationResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Final Verdict Banner */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '10px',
                      backgroundColor: simulationResult.decision === 'ALLOW' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${simulationResult.decision === 'ALLOW' ? '#10B981' : '#EF4444'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.25rem' }}>{simulationResult.decision === 'ALLOW' ? '✅' : '🛑'}</span>
                          <span style={{
                            fontSize: '1.125rem',
                            fontWeight: 900,
                            color: simulationResult.decision === 'ALLOW' ? '#34D399' : '#F87171'
                          }}>
                            {simulationResult.decision}: {simulationResult.code}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#F1F5F9', marginTop: '4px' }}>
                          {simulationResult.reason}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          backgroundColor: '#0F172A',
                          color: '#38BDF8',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: '1px solid #1E293B'
                        }}>
                          Decisive: {simulationResult.decisiveTier}
                        </span>
                      </div>
                    </div>

                    {/* Step-by-Step 12-Tier Audit Trace */}
                    <div>
                      <h4 style={{ margin: '0 0 10px', fontSize: '0.875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                        12-Tier Precedence Evaluation Trace
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {simulationResult.trace.map((tr) => (
                          <div
                            key={tr.tierNumber}
                            style={{
                              backgroundColor: '#0F172A',
                              border: `1px solid ${tr.status === 'DENY' ? '#EF4444' : '#1E293B'}`,
                              borderRadius: '8px',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: tr.status === 'PASS' ? '#10B981' : tr.status === 'DENY' ? '#EF4444' : '#64748B',
                                color: '#070C16',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6875rem',
                                fontWeight: 900
                              }}>
                                {tr.tierNumber}
                              </span>
                              <div>
                                <div style={{ fontWeight: 800, color: '#F1F5F9', fontSize: '0.8125rem' }}>
                                  {tr.tierName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                                  {tr.detail}
                                </div>
                              </div>
                            </div>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              color: tr.status === 'PASS' ? '#34D399' : tr.status === 'DENY' ? '#F87171' : '#94A3B8'
                            }}>
                              {tr.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                    Click &quot;Run Access Simulation&quot; to execute 12-tier evaluation.
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'EFFECTIVE_ACCESS' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                backgroundColor: '#0B1120',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F1F5F9' }}>
                  Evaluate Realtime Access For:
                </span>
                <input
                  type="text"
                  placeholder="Role (e.g. DOCTOR)"
                  value={liveRole}
                  onChange={(e) => setLiveRole(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8125rem', width: '160px' }}
                />
                <input
                  type="text"
                  placeholder="Action (e.g. invoice.view)"
                  value={liveAction}
                  onChange={(e) => setLiveAction(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8125rem', width: '220px' }}
                />
                <button
                  onClick={handleRunEffectiveAccess}
                  disabled={evaluating}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {evaluating ? 'Evaluating...' : '🔍 Evaluate Live Decision'}
                </button>
              </div>

              {liveResult && (
                <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
                  <div style={{
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: liveResult.decision === 'ALLOW' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${liveResult.decision === 'ALLOW' ? '#10B981' : '#EF4444'}`,
                    fontWeight: 800,
                    color: liveResult.decision === 'ALLOW' ? '#34D399' : '#F87171'
                  }}>
                    {liveResult.decision} ({liveResult.code}): {liveResult.reason} — Decisive Tier: {liveResult.decisiveTier}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🚨</span>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                    Break-Glass Emergency Clinical Authorization
                  </h3>
                </div>
                <p style={{ margin: '6px 0 16px', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Provides immediate emergency clinical override when patient survival requires bypassing routine role gates. Mandatory justification required. Fully audited.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Mandatory Clinical Emergency Justification *
                    </label>
                    <textarea
                      placeholder="e.g. Critical trauma resuscitation; attending physician required immediate cross-department clinical chart access"
                      value={emergencyReason}
                      onChange={(e) => setEmergencyReason(e.target.value)}
                      rows={3}
                      style={{ width: '100%', marginTop: '4px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '10px', borderRadius: '8px', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Patient ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PAT-908124"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      style={{ width: '100%', marginTop: '4px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Access Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                      style={{ width: '100%', marginTop: '4px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', fontSize: '0.875rem' }}
                    />
                  </div>

                  <button
                    onClick={handleTriggerBreakGlass}
                    disabled={!emergencyReason.trim()}
                    style={{
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      cursor: !emergencyReason.trim() ? 'not-allowed' : 'pointer',
                      opacity: !emergencyReason.trim() ? 0.6 : 1,
                      marginTop: '10px'
                    }}
                  >
                    🚨 Authorize Break-Glass Override
                  </button>

                  {breakGlassStatus && (
                    <div style={{
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      backgroundColor: breakGlassStatus.startsWith('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: breakGlassStatus.startsWith('Error') ? '#F87171' : '#34D399',
                      border: `1px solid ${breakGlassStatus.startsWith('Error') ? '#EF4444' : '#10B981'}`
                    }}>
                      {breakGlassStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};
