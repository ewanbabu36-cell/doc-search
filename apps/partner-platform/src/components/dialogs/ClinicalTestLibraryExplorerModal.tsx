import React, { useState } from 'react';
import {
  MASTER_CLINICAL_TEST_LIBRARY,
  CLINICAL_DEPARTMENTS,
  resolveGenderSpecificParameter,
  type ClinicalTestProfileDef
} from '../../services/clinical-test-library.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectForWalkIn?: (profile: ClinicalTestProfileDef) => void;
}

export const ClinicalTestLibraryExplorerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectForWalkIn
}) => {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>('CBC');
  const [previewGender, setPreviewGender] = useState<'ALL' | 'Male' | 'Female'>('ALL');

  if (!isOpen) return null;

  const allTests = Object.values(MASTER_CLINICAL_TEST_LIBRARY);

  const filteredTests = allTests.filter((test) => {
    if (selectedDept !== 'ALL' && test.category !== selectedDept) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = test.name.toLowerCase().includes(q) || test.shortName.toLowerCase().includes(q);
      const matchesDept = test.department.toLowerCase().includes(q);
      const matchesParam = test.parameters.some((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
      if (!matchesName && !matchesDept && !matchesParam) return false;
    }
    return true;
  });

  const currentProfile = MASTER_CLINICAL_TEST_LIBRARY[selectedProfileKey] || filteredTests[0] || allTests[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 12, 22, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 11500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          border: '1.5px solid #0284C7',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0,0,0,0.95)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            backgroundColor: '#070C16',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>📚</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#38BDF8' }}>
                MASTER CLINICAL TEST & PARAMETERS REPOSITORY
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                NABL ISO 15189:2022 Compliant Laboratory Test Directory with Biological Reference Intervals & Critical Panic Limits
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#CBD5E1',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ padding: '14px 24px', backgroundColor: '#1E293B', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search across all 55+ clinical blood tests, panels and analytes..."
                style={{
                  width: '100%',
                  backgroundColor: '#0F172A',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: '0.8125rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexWrap: 'wrap' }}>
              {CLINICAL_DEPARTMENTS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDept(d.id)}
                  style={{
                    backgroundColor: selectedDept === d.id ? '#0284C7' : 'rgba(255,255,255,0.05)',
                    color: selectedDept === d.id ? '#FFFFFF' : '#94A3B8',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column Explorer View */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Test Profiles List */}
          <div style={{ width: '360px', borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', backgroundColor: '#0B132B' }}>
            {filteredTests.map((test) => {
              const isSelected = (currentProfile?.key === test.key);
              return (
                <div
                  key={test.key}
                  onClick={() => setSelectedProfileKey(test.key)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    borderLeft: isSelected ? '4px solid #06B6D4' : '4px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.6875rem', color: test.tubeColorHex, fontWeight: 800 }}>
                      {test.tubeLabel}
                    </span>
                    <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: '#94A3B8' }}>
                      {test.parameters.length} Analyte{test.parameters.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.8125rem', color: isSelected ? '#38BDF8' : '#F1F5F9', display: 'block' }}>
                    {test.name}
                  </strong>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                    {test.department}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Complete Parameters Breakdown */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#0F172A' }}>
            {currentProfile ? (
              <div>
                {/* Profile Header Card */}
                <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: currentProfile.tubeColorHex, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {currentProfile.tubeLabel} • {currentProfile.department}
                      </span>
                      <h3 style={{ margin: '4px 0 6px', fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                        {currentProfile.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        <strong>Specimen Matrix:</strong> {currentProfile.specimen} | <strong>Fasting Required:</strong> {currentProfile.fastingRequired ? 'Yes (Strict 10-12h)' : 'No (Routine)'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                        <strong>Preparation / Clinical Notes:</strong> {currentProfile.preparation}
                      </div>
                    </div>

                    {onSelectForWalkIn && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectForWalkIn(currentProfile);
                          onClose();
                        }}
                      >
                        🩸 Load in Walk-In Test Form →
                      </button>
                    )}
                  </div>
                </div>

                {/* Parameters Table Header with Gender Norms Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8' }}>
                    🧪 Clinical Analytes, Standard Ranges & Panic Limits ({currentProfile.parameters.length} Parameters):
                  </h4>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', backgroundColor: '#0B132B', padding: '3px 6px', borderRadius: '6px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', marginRight: '4px', fontWeight: 600 }}>Gender Norms:</span>
                    {(['ALL', 'Male', 'Female'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPreviewGender(g)}
                        style={{
                          backgroundColor: previewGender === g ? (g === 'Female' ? '#EC4899' : '#0284C7') : 'transparent',
                          color: previewGender === g ? '#FFFFFF' : '#94A3B8',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {g === 'ALL' ? 'All (Both)' : g === 'Male' ? '♂ Male' : '♀ Female'}
                      </button>
                    ))}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', backgroundColor: '#1E293B', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0B132B', color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '10px 12px' }}>#</th>
                      <th style={{ padding: '10px 12px' }}>CODE</th>
                      <th style={{ padding: '10px 12px' }}>ANALYTE / PARAMETER NAME</th>
                      <th style={{ padding: '10px 12px' }}>DEFAULT VALUE</th>
                      <th style={{ padding: '10px 12px' }}>UNITS</th>
                      <th style={{ padding: '10px 12px' }}>
                        BIOLOGICAL REFERENCE INTERVAL {previewGender !== 'ALL' ? `(${previewGender.toUpperCase()})` : ''}
                      </th>
                      <th style={{ padding: '10px 12px' }}>CRITICAL PANIC LIMITS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProfile.parameters.map((p, idx) => {
                      const resolved = previewGender !== 'ALL' ? resolveGenderSpecificParameter(p, previewGender) : null;
                      const displayVal = resolved ? resolved.value : p.defaultValue;
                      const displayRange = resolved ? resolved.referenceRange : p.referenceRange;
                      return (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700 }}>{p.code}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#F8FAFC' }}>{p.name}</td>
                          <td style={{ padding: '8px 12px', color: '#34D399', fontWeight: 800 }}>{displayVal}</td>
                          <td style={{ padding: '8px 12px', color: '#94A3B8' }}>{p.unit}</td>
                          <td style={{ padding: '8px 12px', color: '#CBD5E1' }}>{displayRange}</td>
                          <td style={{ padding: '8px 12px' }}>
                            {p.criticalLow !== undefined || p.criticalHigh !== undefined ? (
                              <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.6875rem' }}>
                                {p.criticalLow !== undefined ? `< ${p.criticalLow}` : ''} {p.criticalHigh !== undefined ? `> ${p.criticalHigh}` : ''}
                              </span>
                            ) : (
                              <span style={{ color: '#64748B' }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                Select a test profile from the left column to view its parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
