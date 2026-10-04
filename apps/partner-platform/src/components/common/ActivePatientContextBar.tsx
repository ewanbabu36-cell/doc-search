import React, { useState, useEffect } from 'react';
import {
  hospitalEventBus,
  type ActivePatientSummary,
  type HospitalEventPayload
} from '../../services/hospital-event-bus.js';
import type { PartnerModuleKey } from '../PartnerPlatformShell.js';
import { patientRegistrationService } from '../../services/patient-registration-service.js';
import { Patient360ExperienceModal } from './Patient360ExperienceModal.js';

export interface ActivePatientContextBarProps {
  currentModule?: PartnerModuleKey;
  onNavigateModule: (moduleKey: PartnerModuleKey, subTab?: string) => void;
  onOpenPrintModal?: (type: 'WRISTBAND' | 'TOKEN' | 'PRESCRIPTION' | 'RECEIPT', patient?: ActivePatientSummary) => void;
}

const loadStoredRecentPatients = (): ActivePatientSummary[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('docsearch_recent_patients');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
};

const saveStoredRecentPatients = (patients: ActivePatientSummary[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('docsearch_recent_patients', JSON.stringify(patients.slice(0, 5)));
  } catch {}
};

export const ActivePatientContextBar: React.FC<ActivePatientContextBarProps> = ({
  currentModule,
  onNavigateModule,
  onOpenPrintModal
}) => {
  const [activePatient, setActivePatient] = useState<ActivePatientSummary | null>(() =>
    hospitalEventBus.getActivePatient()
  );
  const [recentPatients, setRecentPatients] = useState<ActivePatientSummary[]>(loadStoredRecentPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showPatient360, setShowPatient360] = useState(false);
  const [liveResults, setLiveResults] = useState<ActivePatientSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const updateRecentPatientsList = React.useCallback((patient: ActivePatientSummary) => {
    setRecentPatients((prev) => {
      const filtered = prev.filter((p) => p.id !== patient.id && p.uhid !== patient.uhid);
      const updated = [patient, ...filtered].slice(0, 4);
      saveStoredRecentPatients(updated);
      return updated;
    });
  }, []);

  // Fetch initial recent patients from backend database on mount
  useEffect(() => {
    let active = true;
    const fetchInitialPatients = async () => {
      try {
        const tenantId = (typeof window !== 'undefined' && localStorage.getItem('docsearch_partner_tenant')) || undefined;
        const patients = await patientRegistrationService.searchPatients({
          tenantId: tenantId || '',
          query: ''
        });
        if (!active) return;
        if (patients && patients.length > 0) {
          const converted: ActivePatientSummary[] = patients.slice(0, 4).map((p) => ({
            id: p.id,
            uhid: p.mrn,
            name: p.fullName || `${p.firstName} ${p.lastName}`,
            age: p.dateOfBirth ? Math.max(1, new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()) : 35,
            gender: (p.gender === 'MALE' || p.gender === 'FEMALE' ? p.gender : 'OTHER') as any,
            phone: p.primaryContact?.primaryMobile || undefined,
            bloodGroup: p.bloodGroup ? String(p.bloodGroup) : undefined,
            doctorName: 'Attending Consultant',
            diagnosis: 'Master Patient Index Record'
          }));
          setRecentPatients((prev) => {
            if (prev.length > 0) return prev;
            saveStoredRecentPatients(converted);
            return converted;
          });
        }
      } catch {}
    };
    void fetchInitialPatients();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = hospitalEventBus.subscribe('PATIENT_SELECTED', (payload: HospitalEventPayload) => {
      const selected = payload.data as ActivePatientSummary;
      if (selected && (selected.id || selected.uhid)) {
        setActivePatient(selected);
        updateRecentPatientsList(selected);
      }
    });

    const unsubscribeClear = hospitalEventBus.subscribe('PATIENT_CLEARED', () => {
      setActivePatient(null);
    });

    return () => {
      unsubscribe();
      unsubscribeClear();
    };
  }, [updateRecentPatientsList]);

  // Real asynchronous backend patient search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const tenantId = (typeof window !== 'undefined' && localStorage.getItem('docsearch_partner_tenant')) || undefined;
        const patients = await patientRegistrationService.searchPatients({
          tenantId: tenantId || '',
          query: searchQuery.trim()
        });
        if (!active) return;
        if (patients && patients.length > 0) {
          const converted: ActivePatientSummary[] = patients.map((p) => {
            const summary: ActivePatientSummary = {
              id: p.id,
              uhid: p.mrn,
              name: p.fullName || `${p.firstName} ${p.lastName}`,
              age: p.dateOfBirth ? Math.max(1, new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()) : 35,
              gender: (p.gender === 'MALE' || p.gender === 'FEMALE' ? p.gender : 'OTHER') as any,
              phone: p.primaryContact?.primaryMobile || undefined,
              bloodGroup: p.bloodGroup ? String(p.bloodGroup) : undefined,
              doctorName: 'Attending Consultant',
              diagnosis: 'Master Patient Index Record'
            };
            return summary;
          });
          setLiveResults(converted);
        } else {
          setLiveResults([]);
        }
      } catch {
        if (active) {
          setLiveResults([]);
        }
      } finally {
        if (active) setIsSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredPatients = liveResults;

  const handleSelectPatient = (patient: ActivePatientSummary) => {
    hospitalEventBus.setActivePatient(patient, 'ActivePatientContextBar');
    setActivePatient(patient);
    updateRecentPatientsList(patient);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleClearPatient = () => {
    hospitalEventBus.clearActivePatient('ActivePatientContextBar');
    setActivePatient(null);
  };

  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        border: activePatient ? '1.5px solid #0284C7' : '1px solid #1E293B',
        borderRadius: '10px',
        padding: '10px 14px',
        marginBottom: '12px',
        boxShadow: activePatient ? '0 4px 16px rgba(2, 132, 199, 0.18)' : 'none',
        transition: 'all 0.2s ease'
      }}
    >
      {activePatient ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Top Line: Patient Demographic & Diagnostic Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: activePatient.gender === 'FEMALE' ? '#EC4899' : '#0284C7',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  flexShrink: 0
                }}
              >
                {(activePatient?.name || 'P').charAt(0).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#F8FAFC' }}>
                    {activePatient?.name || 'Active Patient'}
                  </span>
                  <span
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #0284C7',
                      color: '#38BDF8',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      fontFamily: 'monospace'
                    }}
                  >
                    {activePatient.uhid}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {activePatient.age}y • {activePatient.gender}
                  </span>
                  {activePatient.bloodGroup && (
                    <span
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #EF4444',
                        color: '#F87171',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}
                    >
                      🩸 {activePatient.bloodGroup}
                    </span>
                  )}
                  {activePatient.bedNumber && (
                    <span
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10B981',
                        color: '#34D399',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}
                    >
                      🛏️ {activePatient.bedNumber} ({activePatient.wardName})
                    </span>
                  )}
                  {activePatient.opdToken && (
                    <span
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid #F59E0B',
                        color: '#FCD34D',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}
                    >
                      ⏱️ OPD Token #{activePatient.opdToken}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.75rem',
                    color: '#94A3B8',
                    marginTop: '2px',
                    flexWrap: 'wrap'
                  }}
                >
                  <span>
                    <strong style={{ color: '#CBD5E1' }}>Attending:</strong> {activePatient.doctorName || 'Assigned Consultant'}
                  </span>
                  <span>•</span>
                  <span>
                    <strong style={{ color: '#CBD5E1' }}>Diagnosis:</strong> {activePatient.diagnosis || 'Clinical evaluation'}
                  </span>
                  {activePatient.insuranceProvider && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#6EE7B7' }}>
                        🛡️ {activePatient.insuranceProvider}
                      </span>
                    </>
                  )}
                  {activePatient.allergies && activePatient.allergies.length > 0 && activePatient.allergies[0] !== 'None Reported' && (
                    <>
                      <span>•</span>
                      <span
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#FCA5A5',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}
                      >
                        ⚠️ Allergy: {activePatient.allergies.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Cross-Department Action Buttons (Contextual: Hides button for current module to eliminate duplicate reload) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowPatient360(true)}
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.25)',
                  border: '1.5px solid #0284C7',
                  color: '#38BDF8',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 10px rgba(2, 132, 199, 0.3)'
                }}
                title="Open 360-Degree Unified Patient Journey & Clinical Dossier"
              >
                <span>👁️</span>
                <span>Patient 360</span>
              </button>

              {currentModule !== 'clinical-consultation' && (
                <button
                  type="button"
                  onClick={() => onNavigateModule('clinical-consultation')}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #0284C7',
                    color: '#38BDF8',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open Doctor Consultation Desk for this patient"
                >
                  <span>🩺</span>
                  <span>Doctor Desk</span>
                </button>
              )}

              {currentModule !== 'clinical-investigation' && (
                <button
                  type="button"
                  onClick={() => onNavigateModule('clinical-investigation')}
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid #A855F7',
                    color: '#C084FC',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open Pathology & Lab Orders for this patient"
                >
                  <span>🧪</span>
                  <span>Lab Orders</span>
                </button>
              )}

              {currentModule !== 'pharmacy-medication' && (
                <button
                  type="button"
                  onClick={() => onNavigateModule('pharmacy-medication', 'pos')}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10B981',
                    color: '#34D399',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open Pharmacy Dispensing POS for this patient"
                >
                  <span>💊</span>
                  <span>Dispense Rx</span>
                </button>
              )}

              {currentModule !== 'billing-revenue-cycle' && (
                <button
                  type="button"
                  onClick={() => onNavigateModule('billing-revenue-cycle')}
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #F59E0B',
                    color: '#FCD34D',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open Cashier Billing & Invoicing for this patient"
                >
                  <span>⚡</span>
                  <span>Cashier POS</span>
                </button>
              )}

              {activePatient.bedNumber && currentModule !== 'inpatient-management' && (
                <button
                  type="button"
                  onClick={() => onNavigateModule('inpatient-management')}
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid #6366F1',
                    color: '#A5B4FC',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open Inpatient Bed & Ward for this patient"
                >
                  <span>🛏️</span>
                  <span>Inpatient Bed</span>
                </button>
              )}

              {onOpenPrintModal && (
                <button
                  type="button"
                  onClick={() => onOpenPrintModal('WRISTBAND', activePatient)}
                  style={{
                    backgroundColor: 'rgba(100, 116, 139, 0.2)',
                    border: '1px solid #64748B',
                    color: '#CBD5E1',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Print Thermal Patient Wristband or Token Slip"
                >
                  <span>🖨️</span>
                  <span>Print Slip</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClearPatient}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Clear patient context"
              >
                ✕ Clear
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Quick Search & Demo Patient Fast-Load Strip */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px', position: 'relative' }}>
            <span style={{ fontSize: '1rem', color: '#38BDF8' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search patient by Name, UHID, or Mobile to load across all hospital departments..."
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                padding: '6px 10px',
                paddingRight: isSearching ? '90px' : '10px',
                color: '#F8FAFC',
                fontSize: '0.8125rem'
              }}
            />
            {isSearching && (
              <span style={{ position: 'absolute', right: '10px', fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>
                ⏳ Searching...
              </span>
            )}

            {showSearchResults && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: '28px',
                  right: 0,
                  backgroundColor: '#0F172A',
                  border: '1.5px solid #0284C7',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  zIndex: 200,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  padding: '4px'
                }}
              >
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1E293B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div>
                        <strong style={{ color: '#38BDF8', fontSize: '0.85rem' }}>{p.name}</strong>
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem', marginLeft: '8px' }}>
                          ({p.uhid}) • {p.age}y/{p.gender}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
                        {p.bedNumber ? `🛏️ ${p.bedNumber}` : `Token #${p.opdToken}`} ➔
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px', color: '#64748B', fontSize: '0.75rem', textAlign: 'center' }}>
                    No patient found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Recent Patients:</span>
            {recentPatients.length > 0 ? (
              recentPatients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPatient(p)}
                  title={`${p.name} • ${p.uhid} • ${p.gender}`}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#CBD5E1',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.2)';
                    e.currentTarget.style.borderColor = '#0284C7';
                    e.currentTarget.style.color = '#38BDF8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#CBD5E1';
                  }}
                >
                  <span>{p.gender === 'FEMALE' ? '👩' : '👨'}</span>
                  <span>{(p?.name || 'Patient').split(' ')[0]} ({p.uhid ? p.uhid.slice(-4) : 'PAT'})</span>
                </button>
              ))
            ) : (
              <span style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                No active patients
              </span>
            )}
          </div>
        </div>
      )}

      {/* Unified Patient 360 Spatial Dossier Modal */}
      {showPatient360 && activePatient && (
        <Patient360ExperienceModal
          isOpen={showPatient360}
          onClose={() => setShowPatient360(false)}
          patient={activePatient}
          onNavigateModule={onNavigateModule}
          onOpenPrintModal={onOpenPrintModal}
        />
      )}
    </div>
  );
};

