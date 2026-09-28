import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MASTER_CLINICAL_TEST_LIBRARY,
  CLINICAL_DEPARTMENTS,
  type ClinicalTestProfileDef
} from '../../services/clinical-test-library.js';

export interface ClinicalTestLibraryDropdownProps {
  selectedKey?: string;
  onSelectTest: (profile: ClinicalTestProfileDef) => void;
  style?: React.CSSProperties;
  buttonLabel?: string;
}

export const ClinicalTestLibraryDropdown: React.FC<ClinicalTestLibraryDropdownProps> = ({
  selectedKey,
  onSelectTest,
  style,
  buttonLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTest, setPreviewTest] = useState<ClinicalTestProfileDef | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const allTests = useMemo(() => Object.values(MASTER_CLINICAL_TEST_LIBRARY), []);

  const filteredTests = useMemo(() => {
    return allTests.filter((test) => {
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
  }, [allTests, selectedDept, searchQuery]);

  const activeProfile = selectedKey ? MASTER_CLINICAL_TEST_LIBRARY[selectedKey] : null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', width: '100%', ...style }}>
      {/* Main Trigger Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          border: '1.5px solid #06B6D4',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.8125rem',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(6, 182, 212, 0.2)',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span style={{ fontSize: '1.1rem' }}>🔬</span>
          <span style={{ color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
            {activeProfile ? activeProfile.tubeLabel.split(' ')[0] : '📚'}
          </span>
          <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {activeProfile ? `${activeProfile.shortName} (${activeProfile.parameters.length} Parameters)` : (buttonLabel || `Select Diagnostic Test from Clinical Library (${allTests.length}+ Panels)...`)}
          </span>
        </div>
        <span style={{ color: '#06B6D4', fontSize: '0.875rem', marginLeft: '8px' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#0B132B',
            border: '1.5px solid #0284C7',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(2, 132, 199, 0.3)',
            zIndex: 99999,
            maxHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header & Search Bar */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#070C16' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.05em' }}>
                📖 MASTER CLINICAL TEST & PARAMETER REPOSITORY ({allTests.length} PANELS)
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                NABL ISO 15189 Standards
              </span>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search by test name, analyte or code (e.g. Troponin, AMH, Urea, Vitamin D, Dengue, PSA)..."
              autoFocus
              style={{
                width: '100%',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Department Category Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '10px', paddingBottom: '4px' }}>
              {CLINICAL_DEPARTMENTS.map((dept) => {
                const isSelected = selectedDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDept(dept.id)}
                    style={{
                      whiteSpace: 'nowrap',
                      backgroundColor: isSelected ? '#0284C7' : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#FFFFFF' : '#CBD5E1',
                      border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '20px',
                      padding: '4px 10px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {dept.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test List & Parameter Preview Split Container */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: '260px' }}>
            {/* Tests List Column */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '340px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              {filteredTests.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                  No diagnostic test found matching "{searchQuery}".
                </div>
              ) : (
                filteredTests.map((test) => {
                  const isCurrent = selectedKey === test.key;
                  return (
                    <div
                      key={test.key}
                      onClick={() => {
                        onSelectTest(test);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setPreviewTest(test)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        backgroundColor: isCurrent ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      className="test-dropdown-item"
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', color: test.tubeColorHex, fontWeight: 800 }}>
                            {test.tubeLabel}
                          </span>
                          <strong style={{ fontSize: '0.8125rem', color: isCurrent ? '#38BDF8' : '#F8FAFC' }}>
                            {test.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                          {test.department} • <i>{test.specimen}</i>
                        </div>
                      </div>

                      <div style={{ marginLeft: '12px', textAlign: 'right' }}>
                        <span style={{
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          color: '#38BDF8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.6875rem',
                          fontWeight: 800
                        }}>
                          {test.parameters.length} Params
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Live Parameter Preview Sidebar */}
            <div style={{ width: '310px', backgroundColor: '#070C16', overflowY: 'auto', maxHeight: '340px', padding: '12px' }}>
              {previewTest ? (
                <div>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>
                      INCLUDED PARAMETERS & NORMAL RANGES
                    </span>
                    <strong style={{ fontSize: '0.8125rem', color: '#38BDF8', display: 'block', marginTop: '2px' }}>
                      {previewTest.name}
                    </strong>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '3px' }}>
                      Specimen: <span style={{ color: '#CBD5E1' }}>{previewTest.specimen}</span>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6875rem' }}>
                    <thead>
                      <tr style={{ color: '#64748B', textAlign: 'left', borderBottom: '1px solid #1E293B' }}>
                        <th style={{ padding: '4px' }}>PARAMETER</th>
                        <th style={{ padding: '4px' }}>DEFAULT</th>
                        <th style={{ padding: '4px' }}>NORMAL RANGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewTest.parameters.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '4px', color: '#F1F5F9', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '4px', color: '#38BDF8', fontWeight: 800 }}>{p.defaultValue} {p.unit}</td>
                          <td style={{ padding: '4px', color: '#94A3B8' }}>{p.referenceRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTest(previewTest);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Load This Test Profile ({previewTest.parameters.length} Parameters)
                  </button>
                </div>
              ) : (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: '#475569', fontSize: '0.75rem' }}>
                  Hover over any test to preview its full clinical parameters and biological reference intervals.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
