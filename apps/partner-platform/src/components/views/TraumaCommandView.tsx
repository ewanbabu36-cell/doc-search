import React, { useState } from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { TraumaActivationDto, EmergencyEncounterDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  traumas: TraumaActivationDto[];
  encounters: EmergencyEncounterDto[];
  onActivateTrauma: (enc: EmergencyEncounterDto) => void;
  onRecordSecondary: (trauma: TraumaActivationDto) => void;
  onSelectTrauma?: (trauma: TraumaActivationDto) => void;
}

export interface CrashCartCheckItem {
  id: string;
  name: string;
  category: 'MEDICATION' | 'AIRWAY' | 'DEFIBRILLATOR';
  expiryDate: string;
  verified: boolean;
}

export const TraumaCommandView: React.FC<Props> = ({
  traumas,
  encounters,
  onActivateTrauma,
  onRecordSecondary,
  onSelectTrauma
}) => {
  const [selectedEsiFilter, setSelectedEsiFilter] = useState<'ALL' | 'ESI_1' | 'ESI_2' | 'ESI_3' | 'ESI_4' | 'ESI_5'>('ALL');
  const [isCodeBlueModalOpen, setIsCodeBlueModalOpen] = useState(false);
  const [codeBlueLocation, setCodeBlueLocation] = useState('ER Resuscitation Bay 1');
  const [codeBlueStatusMsg, setCodeBlueStatusMsg] = useState<string | null>(null);

  // Crash Cart Checklist State
  const [isCrashCartModalOpen, setIsCrashCartModalOpen] = useState(false);
  const [crashCartItems, setCrashCartItems] = useState<CrashCartCheckItem[]>([
    { id: 'cc-1', name: 'Inj Adrenaline 1:1000 (1mg/ml) - 5 Amps', category: 'MEDICATION', expiryDate: '31-Dec-2026', verified: true },
    { id: 'cc-2', name: 'Inj Atropine Sulphate 0.6mg - 5 Amps', category: 'MEDICATION', expiryDate: '15-Nov-2026', verified: true },
    { id: 'cc-3', name: 'Inj Amiodarone 150mg/3ml - 2 Amps', category: 'MEDICATION', expiryDate: '28-Feb-2027', verified: true },
    { id: 'cc-4', name: 'Adult & Paediatric Laryngoscope with Blades #3, #4', category: 'AIRWAY', expiryDate: 'Checked Battery OK', verified: true },
    { id: 'cc-5', name: 'Endotracheal Tubes (ET Sizes 6.5, 7.0, 7.5, 8.0)', category: 'AIRWAY', expiryDate: 'Sterile Pack Intact', verified: true },
    { id: 'cc-6', name: 'Biphasic Defibrillator (200 Joules Discharge Test)', category: 'DEFIBRILLATOR', expiryDate: 'Self-Test PASSED', verified: true }
  ]);
  const [cartSealNumber, setCartSealNumber] = useState('SEAL-ER-9921');
  const [cartSignOffSuccess, setCartSignOffSuccess] = useState(false);

  const handleTriggerCodeBlue = () => {
    hospitalEventBus.publish(
      'EMERGENCY_TRIAGE_ALERT',
      'TraumaCommandView',
      {
        location: codeBlueLocation,
        timestamp: new Date().toISOString(),
        severity: 'CODE_BLUE_CARDIAC_ARREST'
      },
      `🚨 CODE BLUE ACTIVATED AT ${codeBlueLocation.toUpperCase()}! Resuscitation Team Dispatched.`
    );

    setCodeBlueStatusMsg(`🚨 CODE BLUE DISPATCHED: Resuscitation Team Alerted for ${codeBlueLocation}`);
    setTimeout(() => {
      setIsCodeBlueModalOpen(false);
      setCodeBlueStatusMsg(null);
    }, 2000);
  };

  const toggleCartItem = (id: string) => {
    setCrashCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, verified: !item.verified } : item))
    );
  };

  const handleSignOffCrashCart = () => {
    setCartSignOffSuccess(true);
    setTimeout(() => {
      setCartSignOffSuccess(false);
      setIsCrashCartModalOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Trauma Header with Emergency Action Triggers */}
      <div style={{ backgroundColor: '#7F1D1D', color: '#FFFFFF', padding: '20px 24px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🚨</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>
                Emergency Trauma & ESI Triage Command
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#FECACA' }}>
                5-Level ESI Triage • ABCDE Protocol • Crash Cart Daily Verification • Code Blue Alert
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsCrashCartModalOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🛒 Crash Cart Checklist ({cartSealNumber})
          </button>
          <button
            type="button"
            onClick={() => setIsCodeBlueModalOpen(true)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: '#DC2626',
              border: '2px solid #FFFFFF',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
            }}
          >
            🚨 TRIGGER CODE BLUE
          </button>
        </div>
      </div>

      {/* 5-Level ESI Triage Classification Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', backgroundColor: '#0F172A', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>ESI Triage Filter:</span>
        <button
          type="button"
          onClick={() => setSelectedEsiFilter('ALL')}
          style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: selectedEsiFilter === 'ALL' ? '#38BDF8' : 'rgba(255,255,255,0.05)', color: selectedEsiFilter === 'ALL' ? '#0F172A' : '#CBD5E1', border: 'none' }}
        >
          All Cases ({encounters.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedEsiFilter('ESI_1')}
          style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: selectedEsiFilter === 'ESI_1' ? '#EF4444' : 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: '1px solid #EF4444' }}
        >
          Level 1: Resuscitation (Immediate)
        </button>
        <button
          type="button"
          onClick={() => setSelectedEsiFilter('ESI_2')}
          style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: selectedEsiFilter === 'ESI_2' ? '#F97316' : 'rgba(249, 115, 22, 0.15)', color: '#FDBA74', border: '1px solid #F97316' }}
        >
          Level 2: Emergent (&lt;10 mins)
        </button>
        <button
          type="button"
          onClick={() => setSelectedEsiFilter('ESI_3')}
          style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: selectedEsiFilter === 'ESI_3' ? '#FBBF24' : 'rgba(251, 191, 36, 0.15)', color: '#FDE68A', border: '1px solid #FBBF24' }}
        >
          Level 3: Urgent (2+ Resources)
        </button>
        <button
          type="button"
          onClick={() => setSelectedEsiFilter('ESI_4')}
          style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: selectedEsiFilter === 'ESI_4' ? '#10B981' : 'rgba(16, 185, 129, 0.15)', color: '#6EE7B7', border: '1px solid #10B981' }}
        >
          Level 4: Less Urgent
        </button>
      </div>

      {/* Trauma Candidates */}
      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Trauma Candidates in Emergency Department</h2>
        <div className="space-y-2">
          {encounters.map((e) => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{e.patientName} ({e.patientMrn})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint}</p>
              </div>
              <Button variant="danger" onClick={() => onActivateTrauma(e)}>Activate Trauma Team</Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Active & Closed Trauma Activations */}
      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Active & Closed Trauma Activations</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Activation #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Level</th>
              <th className="py-2">Mechanism</th>
              <th className="py-2">GCS</th>
              <th className="py-2">MTP / FAST</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {traumas.map((t) => (
              <tr key={t.id}>
                <td className="py-2 font-bold text-red-700">
                  {onSelectTrauma ? (
                    <button
                      type="button"
                      onClick={() => onSelectTrauma(t)}
                      className="text-red-700 hover:text-red-900 underline font-bold"
                      title="Open Trauma Patient Resuscitation Dossier"
                    >
                      {t.activationNumber}
                    </button>
                  ) : (
                    t.activationNumber
                  )}
                </td>
                <td className="py-2">{t.patientName}</td>
                <td className="py-2"><Badge variant="danger">{t.activationLevel}</Badge></td>
                <td className="py-2 text-xs text-gray-600 truncate max-w-[200px]">{t.mechanismOfInjury}</td>
                <td className="py-2 font-bold">{t.disabilityGcs}/15</td>
                <td className="py-2 text-xs">
                  {t.massiveTransfusionActivated && <Badge variant="danger">MTP</Badge>}
                  {t.fastScanPositive && <Badge variant="warning">FAST+</Badge>}
                </td>
                <td className="py-2 text-right space-x-1">
                  <Button variant="outline" onClick={() => onRecordSecondary(t)}>Secondary Survey</Button>
                  {onSelectTrauma && (
                    <Button variant="outline" onClick={() => onSelectTrauma(t)}>View</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* CODE BLUE BROADCAST MODAL */}
      {isCodeBlueModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ backgroundColor: '#7F1D1D', border: '3px solid #EF4444', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', color: '#FFFFFF', boxShadow: '0 0 80px rgba(239,68,68,0.7)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>🚨</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>CODE BLUE EMERGENCY BROADCAST</h2>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Cardiac Arrest / Respiratory Failure Immediate Response</span>
              </div>
            </div>

            {codeBlueStatusMsg ? (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center' }}>
                {codeBlueStatusMsg}
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                    Confirm Incident Location / Bay:
                  </label>
                  <input
                    type="text"
                    value={codeBlueLocation}
                    onChange={(e) => setCodeBlueLocation(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#991B1B', border: '1px solid #FECACA', color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 800 }}
                  />
                </div>

                <div style={{ fontSize: '0.75rem', color: '#FECACA', lineHeight: 1.4 }}>
                  Triggering Code Blue alerts the Hospital Intensivist, Anesthesiologist on call, Resuscitation Nurses, and sends an automated PA audio alert across the floor.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsCodeBlueModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleTriggerCodeBlue} style={{ padding: '10px 22px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: 'none', color: '#7F1D1D', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer' }}>
                    🚨 CONFIRM & BROADCAST
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CRASH CART CHECKLIST MODAL */}
      {isCrashCartModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '16px', width: '100%', maxWidth: '650px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
                  🛒 Daily Emergency Crash Cart & Defibrillator Log
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Mandatory NABH Quality Audit • Seal #{cartSealNumber}
                </span>
              </div>
              <button type="button" onClick={() => setIsCrashCartModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {cartSignOffSuccess ? (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center' }}>
                ✓ Crash Cart inspection verified and digitally signed for today!
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                  {crashCartItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleCartItem(item.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: item.verified ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: item.verified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: item.verified ? '#6EE7B7' : '#F8FAFC' }}>
                          {item.verified ? '✓ ' : '○ '} {item.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                          Status / Expiry: {item.expiryDate}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: item.verified ? '#10B981' : '#F87171' }}>
                        {item.verified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Seal Number:</label>
                    <input
                      type="text"
                      value={cartSealNumber}
                      onChange={(e) => setCartSealNumber(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#070C16', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.75rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setIsCrashCartModalOpen(false)} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
                    <button type="button" onClick={handleSignOffCrashCart} style={{ padding: '6px 18px', borderRadius: '6px', backgroundColor: '#10B981', border: 'none', color: '#070C16', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>Sign & Lock Seal</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
