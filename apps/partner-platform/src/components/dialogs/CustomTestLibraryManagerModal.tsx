import React, { useState, useEffect, useMemo } from 'react';
import {
  CLINICAL_DEPARTMENTS,
  getMergedClinicalTestLibrary,
  getCustomTestLibrary,
  saveCustomTestProfile,
  deleteCustomTestProfile,
  type ClinicalTestProfileDef,
  type ClinicalParameterDef
} from '../../services/clinical-test-library.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTestForWalkIn?: (profile: ClinicalTestProfileDef) => void;
  onSaved?: () => void;
}

export const CustomTestLibraryManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectTestForWalkIn,
  onSaved
}) => {
  const [allTests, setAllTests] = useState<Record<string, ClinicalTestProfileDef>>({});
  const [selectedKey, setSelectedKey] = useState<string>('CBC');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State for Active Edit / Create
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formDept, setFormDept] = useState('Clinical Biochemistry');
  const [formCategory, setFormCategory] = useState<ClinicalTestProfileDef['category']>('BIOCHEMISTRY');
  const [formSpecimen, setFormSpecimen] = useState('Serum (2 ml)');
  const [formTubeType, setFormTubeType] = useState<ClinicalTestProfileDef['tubeType']>('SERUM_SST_GOLD');
  const [formTubeLabel, setFormTubeLabel] = useState('Yellow Top (SST Clot Activator)');
  const [formTubeColorHex, setFormTubeColorHex] = useState('#EAB308');
  const [formFasting, setFormFasting] = useState(false);
  const [formPreparation, setFormPreparation] = useState('Routine outpatient non-fasting sample.');
  const [formPrice, setFormPrice] = useState('450');
  const [formParameters, setFormParameters] = useState<ClinicalParameterDef[]>([]);

  const refreshTests = () => {
    const merged = getMergedClinicalTestLibrary();
    setAllTests(merged);
  };

  useEffect(() => {
    if (isOpen) {
      refreshTests();
    }
  }, [isOpen]);

  const customLibrary = useMemo(() => getCustomTestLibrary(), [allTests]);

  const testList = useMemo(() => Object.values(allTests), [allTests]);

  const filteredTests = useMemo(() => {
    return testList.filter((t) => {
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.parameters.some((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [testList, selectedCategory, searchTerm]);

  const activeTest = allTests[selectedKey] || filteredTests[0] || testList[0];

  const handleStartEdit = (test: ClinicalTestProfileDef) => {
    setIsCreatingNew(false);
    setIsEditing(true);
    setFormKey(test.key);
    setFormName(test.name);
    setFormShortName(test.shortName);
    setFormDept(test.department);
    setFormCategory(test.category);
    setFormSpecimen(test.specimen);
    setFormTubeType(test.tubeType);
    setFormTubeLabel(test.tubeLabel);
    setFormTubeColorHex(test.tubeColorHex);
    setFormFasting(test.fastingRequired);
    setFormPreparation(test.preparation);
    setFormPrice(String(test.price || 400));
    setFormParameters(JSON.parse(JSON.stringify(test.parameters)));
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setIsEditing(true);
    const newKey = `CUSTOM_TEST_${Date.now().toString().slice(-4)}`;
    setFormKey(newKey);
    setFormName('CUSTOM CLINICAL PANEL');
    setFormShortName('Custom Panel');
    setFormDept('Clinical Biochemistry');
    setFormCategory('BIOCHEMISTRY');
    setFormSpecimen('Serum Gel Tube (3 ml)');
    setFormTubeType('SERUM_SST_GOLD');
    setFormTubeLabel('Yellow Top (SST Gel Clot Activator)');
    setFormTubeColorHex('#EAB308');
    setFormFasting(false);
    setFormPreparation('Routine random collection.');
    setFormPrice('550');
    setFormParameters([
      {
        id: '1',
        code: 'PARAM1',
        name: 'Primary Analyte',
        unit: 'mg/dL',
        referenceRange: '10.0 - 45.0',
        defaultValue: '28.0',
        maleRange: '12.0 - 48.0',
        femaleRange: '10.0 - 42.0',
        defaultMaleValue: '30.0',
        defaultFemaleValue: '26.0'
      }
    ]);
  };

  const handleSaveForm = () => {
    if (!formName.trim()) return;

    const profileToSave: ClinicalTestProfileDef = {
      key: formKey || `TEST_${Date.now().toString().slice(-5)}`,
      name: formName,
      shortName: formShortName || formName.slice(0, 12),
      department: formDept,
      category: formCategory,
      specimen: formSpecimen,
      tubeType: formTubeType,
      tubeLabel: formTubeLabel,
      tubeColorHex: formTubeColorHex,
      fastingRequired: formFasting,
      preparation: formPreparation,
      price: parseFloat(formPrice) || 450,
      parameters: formParameters
    };

    saveCustomTestProfile(profileToSave);
    refreshTests();
    setSelectedKey(profileToSave.key);
    setIsEditing(false);
    setIsCreatingNew(false);
    if (onSaved) onSaved();
  };

  const handleDelete = (key: string) => {
    if (window.confirm(`Delete customized test profile "${key}"?`)) {
      deleteCustomTestProfile(key);
      refreshTests();
      setSelectedKey('CBC');
      setIsEditing(false);
      if (onSaved) onSaved();
    }
  };

  const handleAddParam = () => {
    const id = String(formParameters.length + 1);
    setFormParameters([
      ...formParameters,
      {
        id,
        code: `PAR_${id}`,
        name: 'New Analyte',
        unit: 'mg/dL',
        referenceRange: '0.0 - 10.0',
        defaultValue: '5.0',
        maleRange: '0.0 - 10.0',
        femaleRange: '0.0 - 10.0',
        defaultMaleValue: '5.0',
        defaultFemaleValue: '5.0'
      }
    ]);
  };

  const handleRemoveParam = (index: number) => {
    setFormParameters(formParameters.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 12600,
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
          borderRadius: '16px',
          border: '1.5px solid #06B6D4',
          width: '98vw',
          maxWidth: '1520px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0B1120',
            borderBottom: '1.5px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                border: '1px solid #06B6D4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              ⚙️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                  CLINICAL TEST LIBRARY & CUSTOM PROFILE MANAGER
                </h2>
                <span style={{ fontSize: '0.6875rem', backgroundColor: '#06B6D4', color: '#070C16', padding: '2px 8px', borderRadius: '12px', fontWeight: 900 }}>
                  DYNAMIC PATHOLOGY ENGINE
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Create new blood test profiles, customize biological reference intervals (Male/Female), specimen types, and POS pricing.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleStartNew}
              style={{
                backgroundColor: '#10B981',
                color: '#064E3B',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              + Create New Test Profile
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Test Browser */}
          <div style={{ flex: '0 0 380px', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', backgroundColor: '#070C16' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search test or parameter..."
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px 10px', color: '#FFF', fontSize: '0.78rem' }}
              />
              <div style={{ marginTop: '8px', display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  style={{
                    backgroundColor: selectedCategory === 'ALL' ? '#06B6D4' : '#1E293B',
                    color: selectedCategory === 'ALL' ? '#070C16' : '#94A3B8',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  All ({testList.length})
                </button>
                {CLINICAL_DEPARTMENTS.filter((d) => d.id !== 'ALL').map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedCategory(dept.id)}
                    style={{
                      backgroundColor: selectedCategory === dept.id ? '#06B6D4' : '#1E293B',
                      color: selectedCategory === dept.id ? '#070C16' : '#94A3B8',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {dept.label.split(' ')[0]} {dept.label.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredTests.map((t) => {
                const isSelected = activeTest?.key === t.key;
                const isCustom = Boolean(customLibrary[t.key]);
                return (
                  <div
                    key={t.key}
                    onClick={() => {
                      setSelectedKey(t.key);
                      setIsEditing(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #06B6D4' : '3px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                        {t.name}
                      </span>
                      {isCustom && (
                        <span style={{ fontSize: '0.625rem', backgroundColor: '#9333EA', color: '#FFF', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t.department}</span>
                      <span style={{ color: '#34D399', fontWeight: 700 }}>₹{t.price || 400}</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                      {t.parameters.length} Analytes · {t.specimen}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detail View OR Interactive Editor */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#0B132B' }}>
            {isEditing ? (
              /* EDIT / CREATE FORM */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 800 }}>
                      {isCreatingNew ? 'CREATING NEW CLINICAL TEST PROFILE' : `EDITING TEMPLATE: ${formName}`}
                    </span>
                    <h3 style={{ margin: '2px 0', fontSize: '1.2rem', fontWeight: 900, color: '#FFF' }}>
                      {formName || 'Untitled Profile'}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleSaveForm}
                      style={{ backgroundColor: '#10B981', color: '#064E3B', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer' }}
                    >
                      💾 Save Test Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#94A3B8', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Profile Meta Inputs */}
                <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.78rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Profile Unique Key</label>
                    <input
                      type="text"
                      value={formKey}
                      onChange={(e) => setFormKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                      disabled={!isCreatingNew}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#38BDF8', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Full Test Name *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Short Name / Pill Label</label>
                    <input
                      type="text"
                      value={formShortName}
                      onChange={(e) => setFormShortName(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Department</label>
                    <input
                      type="text"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Specimen / Matrix</label>
                    <input
                      type="text"
                      value={formSpecimen}
                      onChange={(e) => setFormSpecimen(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>POS Billing MRP Price (₹)</label>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #10B981', borderRadius: '6px', padding: '6px 10px', color: '#34D399', fontWeight: 800 }}
                    />
                  </div>
                </div>

                {/* Parameters Editor */}
                <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>
                      🧪 Analytes, Standard Values & Gender Intervals:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddParam}
                      style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid #0284C7', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Analyte
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>#</th>
                        <th style={{ padding: '8px' }}>ANALYTE NAME</th>
                        <th style={{ padding: '8px' }}>UNIT</th>
                        <th style={{ padding: '8px' }}>MALE RANGE</th>
                        <th style={{ padding: '8px' }}>MALE DEFAULT</th>
                        <th style={{ padding: '8px' }}>FEMALE RANGE</th>
                        <th style={{ padding: '8px' }}>FEMALE DEFAULT</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>✕</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formParameters.map((p, idx) => (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '6px 8px', color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => {
                                const up = [...formParameters];
                                if (up[idx]) up[idx]!.name = e.target.value;
                                setFormParameters(up);
                              }}
                              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#FFF' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              value={p.unit}
                              onChange={(e) => {
                                const up = [...formParameters];
                                if (up[idx]) up[idx]!.unit = e.target.value;
                                setFormParameters(up);
                              }}
                              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#94A3B8' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              value={p.maleRange || p.referenceRange}
                              onChange={(e) => {
                                const up = [...formParameters];
                                if (up[idx]) {
                                  up[idx]!.maleRange = e.target.value;
                                  up[idx]!.referenceRange = e.target.value;
                                }
                                setFormParameters(up);
                              }}
                              placeholder="e.g. 13.0 - 17.0"
                              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#38BDF8' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              value={p.defaultMaleValue || p.defaultValue}
                              onChange={(e) => {
                                const up = [...formParameters];
                                if (up[idx]) {
                                  up[idx]!.defaultMaleValue = e.target.value;
                                  up[idx]!.defaultValue = e.target.value;
                                }
                                setFormParameters(up);
                              }}
                              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#34D399' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              value={p.femaleRange || p.referenceRange}
                              onChange={(e) => {
                                const up = [...formParameters];
                                if (up[idx]) up[idx]!.femaleRange = e.target.value;
                                setFormParameters(up);
                              }}
                              placeholder="e.g. 12.0 - 15.5"
                              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#F472B6' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              value={p.defaultFemaleValue || p.defaultValue}
                              onChange={(e) => {
                                const up = [...formParameters];
                                if (up[idx]) up[idx]!.defaultFemaleValue = e.target.value;
                                setFormParameters(up);
                              }}
                              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#F472B6' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveParam(idx)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 800 }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTest ? (
              /* DETAIL VIEW */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: activeTest.tubeColorHex, fontWeight: 900, textTransform: 'uppercase' }}>
                      {activeTest.tubeLabel} • {activeTest.department}
                    </span>
                    <h3 style={{ margin: '4px 0', fontSize: '1.3rem', fontWeight: 900, color: '#FFF' }}>
                      {activeTest.name}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                      Specimen: <strong style={{ color: '#FFF' }}>{activeTest.specimen}</strong> · Fasting: <strong>{activeTest.fastingRequired ? 'Yes (Strict 10-12h)' : 'No (Routine)'}</strong> · POS MRP: <strong style={{ color: '#34D399' }}>₹{activeTest.price || 400}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(activeTest)}
                      style={{ backgroundColor: '#9333EA', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      ✏️ Edit / Customize Profile
                    </button>
                    {onSelectTestForWalkIn && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTestForWalkIn(activeTest);
                          onClose();
                        }}
                        style={{ backgroundColor: '#DC2626', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer' }}
                      >
                        🩸 Load in Walk-In →
                      </button>
                    )}
                    {customLibrary[activeTest.key] && (
                      <button
                        type="button"
                        onClick={() => handleDelete(activeTest.key)}
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Parameters Table */}
                <h4 style={{ margin: '0 0 10px', fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8' }}>
                  🧪 Clinical Analytes & Dual-Gender Reference Intervals ({activeTest.parameters.length} Parameters):
                </h4>
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#070C16', color: '#94A3B8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>#</th>
                        <th style={{ padding: '8px 12px' }}>ANALYTE NAME</th>
                        <th style={{ padding: '8px 12px' }}>UNITS</th>
                        <th style={{ padding: '8px 12px' }}>MALE INTERVAL</th>
                        <th style={{ padding: '8px 12px' }}>MALE BASELINE</th>
                        <th style={{ padding: '8px 12px' }}>FEMALE INTERVAL</th>
                        <th style={{ padding: '8px 12px' }}>FEMALE BASELINE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTest.parameters.map((p, idx) => (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 12px', color: '#F8FAFC', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '8px 12px', color: '#94A3B8' }}>{p.unit}</td>
                          <td style={{ padding: '8px 12px', color: '#38BDF8' }}>{p.maleRange || p.referenceRange}</td>
                          <td style={{ padding: '8px 12px', color: '#34D399', fontWeight: 700 }}>{p.defaultMaleValue || p.defaultValue}</td>
                          <td style={{ padding: '8px 12px', color: '#F472B6' }}>{p.femaleRange || p.referenceRange}</td>
                          <td style={{ padding: '8px 12px', color: '#F472B6', fontWeight: 700 }}>{p.defaultFemaleValue || p.defaultValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
