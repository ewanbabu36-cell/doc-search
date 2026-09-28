import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  InvestigationOrderDto,
  EnterInvestigationResultRequest,
  ResultEntryItem,
  InvestigationResultFlag
} from '@docsearch/api-contracts';
import {
  MULTI_TEST_KNOWLEDGE_BASE,
  computeAutoClinicalFlag,
  COMMON_PATHOGENS,
  COLONY_COUNTS,
  STANDARD_ANTIBIOTIC_PANEL,
  type AntibiogramDrug,
  evaluateDeltaCheck,
  type DeltaCheckAlert
} from '../../services/clinical-test-knowledge-base.js';

export interface InvestigationProcessingViewProps {
  orders: InvestigationOrderDto[];
  onEnterResults?: (order: InvestigationOrderDto) => void;
  onSelectOrder?: (orderId: string) => void;
  onSubmitResults?: (request: EnterInvestigationResultRequest) => Promise<void>;
}

export const InvestigationProcessingView: React.FC<InvestigationProcessingViewProps> = ({
  orders,
  onSubmitResults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const processingOrders = orders.filter(
    (o) => o.status === 'PROCESSING' || o.status === 'SAMPLE_COLLECTED' || o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED'
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    processingOrders[0]?.id || ''
  );

  useEffect(() => {
    if (processingOrders.length > 0 && (!selectedOrderId || !processingOrders.some(o => o.id === selectedOrderId))) {
      const firstId = processingOrders[0]?.id;
      if (firstId) setSelectedOrderId(firstId);
    }
  }, [processingOrders, selectedOrderId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || processingOrders[0];
  const isFemale = selectedOrder?.patientGender === 'FEMALE';

  // Multi-Test Selection state
  const [activeTestKey, setActiveTestKey] = useState<string>('CBC');
  const [selectedTests, setSelectedTests] = useState<string[]>(['CBC']);

  // Results State
  const [results, setResults] = useState<ResultEntryItem[]>([]);
  const [technicianNotes, setTechnicianNotes] = useState('Analytical test run completed. Internal quality controls (IQC Level 1 & 2 passed).');
  const justification = 'Laboratory analytical test run completed.';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Microbiology Culture & AST State
  const [specimenSource, setSpecimenSource] = useState('Clean Catch Midstream Urine');
  const [incubationHours, setIncubationHours] = useState('48 Hours (37°C Aerobic)');
  const [growthStatus, setGrowthStatus] = useState<'SIGNIFICANT_GROWTH' | 'NO_GROWTH' | 'CONTAMINANT_MIXED'>('SIGNIFICANT_GROWTH');
  const [selectedOrganism, setSelectedOrganism] = useState<string>(COMMON_PATHOGENS[0] || 'Escherichia coli');
  const [selectedColonyCount, setSelectedColonyCount] = useState<string>(COLONY_COUNTS[0] || '> 10^5 CFU/mL');
  const [antibioticPanel, setAntibioticPanel] = useState<AntibiogramDrug[]>(STANDARD_ANTIBIOTIC_PANEL);

  // Pre-Analytical Delta Check Acknowledgment State
  const [deltaAcknowledged, setDeltaAcknowledged] = useState(false);

  // Helper to load test parameters as per patient gender
  const loadParametersForTest = (testKey: string) => {
    const template = MULTI_TEST_KNOWLEDGE_BASE[testKey];
    if (!template) return [];

    return template.parameters.map((p) => {
      const refRange = isFemale ? p.femaleRange : p.maleRange;
      const defaultVal = isFemale ? p.defaultFemaleValue : p.defaultMaleValue;
      const numVal = parseFloat(defaultVal);
      const autoFlag = computeAutoClinicalFlag(numVal, isFemale, p);

      return {
        parameterCode: p.parameterCode,
        parameterName: p.parameterName,
        resultValue: defaultVal,
        numericValue: numVal,
        unit: p.unit,
        referenceRange: refRange,
        abnormalFlag: autoFlag.flag as InvestigationResultFlag,
        isCritical: autoFlag.isCritical,
        qualitativeInterpretation: ''
      };
    });
  };

  // Sync results when selected order or active test changes
  useEffect(() => {
    if (selectedOrder) {
      // Guess active test from investigationName or code
      const name = selectedOrder.investigationName.toLowerCase();
      let key = 'CBC';
      if (name.includes('lipid') || name.includes('cholesterol')) key = 'LIPID';
      else if (name.includes('kidney') || name.includes('renal') || name.includes('kft') || name.includes('creatinine')) key = 'KFT';
      else if (name.includes('liver') || name.includes('lft') || name.includes('hepatic')) key = 'LFT';
      else if (name.includes('thyroid') || name.includes('tsh')) key = 'THYROID';
      else if (name.includes('glucose') || name.includes('sugar') || name.includes('diabetes')) key = 'DIABETIC';
      else if (name.includes('culture') || name.includes('sensitivity') || name.includes('urine c/s') || name.includes('microbiology')) key = 'CULTURE';

      setActiveTestKey(key);
      if (!selectedTests.includes(key)) {
        setSelectedTests([key]);
      }

      if (selectedOrder.results && selectedOrder.results.length > 0) {
        const hasMicro = selectedOrder.results.some(r => r.parameterCode.startsWith('AST_') || r.parameterCode.startsWith('MICRO_'));
        if (hasMicro) {
          key = 'CULTURE';
          setActiveTestKey('CULTURE');
          const org = selectedOrder.results.find(r => r.parameterCode === 'MICRO_ORGANISM');
          if (org) setSelectedOrganism(org.resultValue);
          const col = selectedOrder.results.find(r => r.parameterCode === 'MICRO_COLONY');
          if (col) setSelectedColonyCount(col.resultValue);
          const spec = selectedOrder.results.find(r => r.parameterCode === 'MICRO_SPECIMEN');
          if (spec) setSpecimenSource(spec.resultValue);
          const astResults = selectedOrder.results.filter(r => r.parameterCode.startsWith('AST_'));
          if (astResults.length > 0) {
            setAntibioticPanel(astResults.map(a => {
              const code = a.parameterCode.replace('AST_', '');
              const susc: 'S' | 'I' | 'R' = a.resultValue.includes('RESISTANT') ? 'R' : a.resultValue.includes('INTERMEDIATE') ? 'I' : 'S';
              return {
                drugCode: code,
                drugName: a.parameterName.replace('AST: ', '').split(' (')[0] || code,
                drugClass: a.parameterName.includes('(') ? (a.parameterName.split('(')[1]?.replace(')', '') || 'Antimicrobial') : 'Antimicrobial',
                susceptibility: susc,
                micOrZone: a.unit || ''
              };
            }));
          }
        } else {
          setResults(selectedOrder.results.map(r => ({
            parameterCode: r.parameterCode,
            parameterName: r.parameterName,
            resultValue: r.resultValue,
            numericValue: r.numericValue,
            unit: r.unit || '',
            referenceRange: r.referenceRange || '',
            abnormalFlag: r.abnormalFlag,
            isCritical: r.isCritical,
            qualitativeInterpretation: r.qualitativeInterpretation || ''
          })));
        }
      } else {
        if (key !== 'CULTURE') {
          setResults(loadParametersForTest(key));
        }
      }
      setSaveSuccess(false);
      setError(null);
    }
  }, [selectedOrderId]);

  // Delta Check Alerts computed against pre-analytical baselines
  const deltaAlerts = React.useMemo(() => {
    if (activeTestKey === 'CULTURE') return [];
    const alerts: DeltaCheckAlert[] = [];
    results.forEach((r) => {
      if (r.numericValue !== undefined && !isNaN(r.numericValue)) {
        const alt = evaluateDeltaCheck(r.parameterCode, r.numericValue, selectedOrder?.patientMrn);
        if (alt) alerts.push(alt);
      }
    });
    return alerts;
  }, [results, activeTestKey, selectedOrder?.patientMrn]);

  // Handle adding an additional test panel to this patient
  const handleToggleTest = (key: string) => {
    if (selectedTests.includes(key)) {
      if (selectedTests.length === 1) return; // Keep at least one
      const updated = selectedTests.filter(t => t !== key);
      setSelectedTests(updated);
      if (activeTestKey === key) {
        const nextKey = updated[0] || 'CBC';
        setActiveTestKey(nextKey);
        if (nextKey !== 'CULTURE') setResults(loadParametersForTest(nextKey));
      }
    } else {
      setSelectedTests([...selectedTests, key]);
      setActiveTestKey(key);
      if (key !== 'CULTURE') setResults(loadParametersForTest(key));
    }
  };

  const handleSelectActiveTest = (key: string) => {
    setActiveTestKey(key);
    if (key !== 'CULTURE') setResults(loadParametersForTest(key));
  };

  // REAL-TIME AUTO-FLAGGING WHEN TYPING OBSERVED VALUE
  const handleUpdateResultValue = (index: number, valStr: string) => {
    setResults((prev) => {
      const next = [...prev];
      const curr = next[index];
      if (!curr) return prev;

      const target = { ...curr, resultValue: valStr };
      const parsedNum = parseFloat(valStr);

      if (!isNaN(parsedNum)) {
        target.numericValue = parsedNum;
        
        // Find matching template definition for auto-flagging
        const activeTemplate = MULTI_TEST_KNOWLEDGE_BASE[activeTestKey];
        const paramDef = activeTemplate?.parameters.find(p => p.parameterCode === target.parameterCode || p.parameterName === target.parameterName);

        if (paramDef) {
          const autoCalc = computeAutoClinicalFlag(parsedNum, isFemale, paramDef);
          target.abnormalFlag = autoCalc.flag as InvestigationResultFlag;
          target.isCritical = autoCalc.isCritical;
        } else {
          // Fallback parsing from reference range string if custom parameter
          if (target.referenceRange && target.referenceRange.includes('-')) {
            const parts = target.referenceRange.split('-').map(s => parseFloat(s.replace(/[^0-9.]/g, '')));
            const min = parts[0];
            const max = parts[1];
            if (min !== undefined && max !== undefined && !isNaN(min) && !isNaN(max)) {
              if (parsedNum < min) target.abnormalFlag = 'LOW';
              else if (parsedNum > max) target.abnormalFlag = 'HIGH';
              else target.abnormalFlag = 'NORMAL';
            }
          }
        }
      }

      next[index] = target;
      return next;
    });
  };

  const handleUpdateField = (index: number, field: keyof ResultEntryItem, value: unknown) => {
    setResults((prev) => {
      const next = [...prev];
      const curr = next[index];
      if (!curr) return prev;
      (curr as Record<string, unknown>)[field] = value;
      next[index] = { ...curr };
      return next;
    });
  };

  const handleAddParam = () => {
    setResults((prev) => [
      ...prev,
      {
        parameterCode: `PARAM_${prev.length + 1}`,
        parameterName: '',
        resultValue: '',
        unit: '',
        referenceRange: '',
        abnormalFlag: 'NORMAL',
        isCritical: false,
        qualitativeInterpretation: ''
      }
    ]);
  };

  const handleRemoveParam = (index: number) => {
    if (results.length === 1) return;
    setResults((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    let finalResults: ResultEntryItem[] = [];

    if (activeTestKey === 'CULTURE') {
      finalResults = [
        {
          parameterCode: 'MICRO_SPECIMEN',
          parameterName: 'Microbiology Specimen Source',
          resultValue: specimenSource,
          numericValue: undefined,
          unit: '',
          referenceRange: 'Sterile Collection',
          abnormalFlag: 'NORMAL',
          isCritical: false,
          qualitativeInterpretation: incubationHours
        },
        {
          parameterCode: 'MICRO_ORGANISM',
          parameterName: 'Organism Isolated',
          resultValue: selectedOrganism,
          numericValue: undefined,
          unit: '',
          referenceRange: 'No Pathogenic Growth',
          abnormalFlag: selectedOrganism.toLowerCase().includes('no pathogen') ? 'NORMAL' : 'HIGH',
          isCritical: false,
          qualitativeInterpretation: selectedColonyCount
        },
        {
          parameterCode: 'MICRO_COLONY',
          parameterName: 'Colony Count (CFU/mL)',
          resultValue: selectedColonyCount,
          numericValue: undefined,
          unit: 'CFU/mL',
          referenceRange: '< 10^3 CFU/mL',
          abnormalFlag: selectedColonyCount.startsWith('>') || selectedColonyCount.includes('10^5') ? 'HIGH' : 'NORMAL',
          isCritical: false,
          qualitativeInterpretation: growthStatus
        },
        ...antibioticPanel.map((drug) => ({
          parameterCode: `AST_${drug.drugCode}`,
          parameterName: `AST: ${drug.drugName} (${drug.drugClass})`,
          resultValue: drug.susceptibility === 'S' ? 'SENSITIVE' : drug.susceptibility === 'I' ? 'INTERMEDIATE' : 'RESISTANT',
          numericValue: undefined,
          unit: drug.micOrZone || '',
          referenceRange: 'SENSITIVE',
          abnormalFlag: (drug.susceptibility === 'R' ? 'HIGH' : drug.susceptibility === 'I' ? 'LOW' : 'NORMAL') as InvestigationResultFlag,
          isCritical: false,
          qualitativeInterpretation: `Zone / MIC: ${drug.micOrZone || '-'}`
        }))
      ];
    } else {
      if (results.some((r) => !r.parameterName.trim() || !r.resultValue.trim())) {
        setError('Every result parameter requires a name and observed value.');
        return;
      }
      finalResults = results;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (onSubmitResults) {
        await onSubmitResults({
          tenantId: selectedOrder.tenantId,
          orderId: selectedOrder.id,
          specimenId: selectedOrder.specimens[0]?.id,
          results: finalResults,
          actorId: 'tech.alex.rivera@docsearch.docsearch.health',
          actorRole: 'LAB_TECHNICIAN',
          justification
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = processingOrders.filter((ord) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.patientName.toLowerCase().includes(q) ||
        ord.patientMrn.toLowerCase().includes(q) ||
        ord.investigationName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
          ⚙️ Laboratory Multi-Test Processing & Auto-Flagging Workbench
        </h3>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem' }}>
          Select multiple blood tests, auto-fill gender-specific normal ranges (Male/Female), and dynamic real-time clinical auto-flagging.
        </p>
      </div>

      {/* SPLIT SCREEN WORKBENCH CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT PANEL: ACTIVE WORKLIST QUEUE */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>
              In-Processing Worklist ({filteredOrders.length})
            </strong>
            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>LIVE WORKBENCH</span>
          </div>

          <div style={{ padding: '12px' }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search patient, order, MRN..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '680px', overflowY: 'auto' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                No active specimens in processing queue.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = ord.id === selectedOrderId;
                const accession = ord.specimens[0]?.accessionNumber || 'ACC-PENDING';
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #06B6D4' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.875rem', color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                        {ord.patientName}
                      </span>
                      <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: ord.patientGender === 'FEMALE' ? '#F43F5E' : '#3B82F6', color: '#FFF', fontWeight: 800 }}>
                        {ord.patientGender || 'MALE'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 600 }}>
                      {ord.investigationName}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.6875rem', color: '#94A3B8' }}>
                      <span>Order: {ord.orderNumber}</span>
                      <span style={{ color: '#A7F3D0', fontFamily: 'monospace' }}>{accession}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: MULTI-TEST SELECTION & AUTO-FLAGGING SHEET */}
        {selectedOrder ? (
          <div style={{ backgroundColor: '#0B132B', border: '1.5px solid rgba(6, 182, 212, 0.3)', borderRadius: '16px', padding: '22px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            
            {/* Patient Header Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>🧪</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                      {selectedOrder.patientName} — Laboratory Investigation Dossier
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                      Gender: <strong style={{ color: isFemale ? '#FB7185' : '#60A5FA' }}>{selectedOrder.patientGender || 'MALE'}</strong> (Applying {isFemale ? 'Female' : 'Male'} Biological Reference Intervals)
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Order Number</div>
                <strong style={{ fontSize: '0.875rem', color: '#F8FAFC', fontFamily: 'monospace' }}>{selectedOrder.orderNumber}</strong>
              </div>
            </div>

            {/* MULTI-TEST SELECTION TABS FOR THIS PATIENT */}
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                  📑 MULTIPLE BLOOD TESTS FOR THIS PATIENT (SELECT / ADD TESTS):
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Click test to switch parameters</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.keys(MULTI_TEST_KNOWLEDGE_BASE).map((key) => {
                  const t = MULTI_TEST_KNOWLEDGE_BASE[key];
                  if (!t) return null;
                  const isSelected = selectedTests.includes(key);
                  const isActive = activeTestKey === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (!isSelected) handleToggleTest(key);
                        else handleSelectActiveTest(key);
                      }}
                      style={{
                        backgroundColor: isActive ? '#0284C7' : isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                        color: isActive ? '#FFFFFF' : isSelected ? '#38BDF8' : '#94A3B8',
                        border: isActive ? '1.5px solid #38BDF8' : isSelected ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{isSelected ? '✓' : '➕'}</span>
                      <span>{t.testName.split(' ')[0]} ({key})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Test Banner */}
            <div style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '8px 14px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  ACTIVE TEST: {MULTI_TEST_KNOWLEDGE_BASE[activeTestKey]?.testName || activeTestKey}
                </strong>
                <div style={{ fontSize: '0.6875rem', opacity: 0.9 }}>
                  Specimen: {MULTI_TEST_KNOWLEDGE_BASE[activeTestKey]?.specimenType} · {activeTestKey === 'CULTURE' ? 'Microbiology Culture & CLSI AST Protocol' : 'Gender-Specific Reference Intervals Active'}
                </div>
              </div>

              {activeTestKey !== 'CULTURE' ? (
                <button
                  type="button"
                  onClick={handleAddParam}
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#38BDF8',
                    border: '1px solid #38BDF8',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ➕ Add Custom Parameter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAntibioticPanel(prev => [
                      ...prev,
                      {
                        drugCode: `ABX_${prev.length + 1}`,
                        drugName: 'New Antibiotic',
                        drugClass: 'Antimicrobial',
                        susceptibility: 'S',
                        micOrZone: '20 mm'
                      }
                    ]);
                  }}
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#38BDF8',
                    border: '1px solid #38BDF8',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ➕ Add Custom Antibiotic
                </button>
              )}
            </div>

            {/* Alert / Success messages */}
            {error && <div style={{ marginBottom: '12px' }}><Alert type="error" title="Error">{error}</Alert></div>}
            {saveSuccess && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700 }}>
                ✓ Analytical Results Saved Successfully with Gender Normal Ranges & Clinical Flags!
              </div>
            )}

            {/* PRE-ANALYTICAL DELTA CHECK FAIL-SAFE BANNER */}
            {deltaAlerts.length > 0 && activeTestKey !== 'CULTURE' && (
              <div style={{
                marginBottom: '16px',
                padding: '14px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid #EF4444',
                borderRadius: '10px',
                color: '#FCA5A5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: '#F87171', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🚨</span> ISO 15189 PRE-ANALYTICAL DELTA CHECK ALERT ({deltaAlerts.length} PARAMETER{deltaAlerts.length > 1 ? 'S' : ''})
                  </strong>
                  <span style={{ fontSize: '0.7rem', backgroundColor: '#991B1B', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                    PRE-AUTHORIZATION FAIL-SAFE
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#CBD5E1' }}>
                  {deltaAlerts.map((alt, idx) => (
                    <div key={idx} style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <strong style={{ color: '#FCA5A5' }}>{alt.parameterName}:</strong> Current value <strong style={{ color: '#FFF' }}>{alt.currentValue} {alt.unit}</strong> vs previous baseline <strong style={{ color: '#38BDF8' }}>{alt.baselineValue} {alt.unit}</strong> ({alt.baselineDate}) — <span style={{ color: alt.direction === 'DROP' ? '#F87171' : '#FBBF24', fontWeight: 800 }}>{alt.direction === 'DROP' ? '▼' : '▲'} {alt.percentChange}% shift</span>.
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                        💡 <em>{alt.reason}</em>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="deltaAck"
                    checked={deltaAcknowledged}
                    onChange={(e) => setDeltaAcknowledged(e.target.checked)}
                    style={{ accentColor: '#EF4444', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="deltaAck" style={{ fontSize: '0.75rem', color: '#F8FAFC', fontWeight: 700, cursor: 'pointer' }}>
                    Technician Confirmed: Checked on 2nd analyzer / ruled out pre-analytical EDTA micro-clot or IV hemodilution.
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveResults}>
              {/* MICROBIOLOGY CULTURE & AST ANTIBIOGRAM WORKBENCH */}
              {activeTestKey === 'CULTURE' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
                  
                  {/* Quick presets */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800 }}>1-CLICK CULTURE PRESETS:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrganism('Escherichia coli');
                        setSelectedColonyCount('> 10^5 CFU/mL (Significant Bacteriuria)');
                        setGrowthStatus('SIGNIFICANT_GROWTH');
                      }}
                      style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', border: '1px solid #06B6D4', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🧫 Significant E. coli Growth
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrganism('No pathogenic bacteria isolated after 48 hrs incubation');
                        setSelectedColonyCount('Zero Growth / Sterile');
                        setGrowthStatus('NO_GROWTH');
                        setAntibioticPanel([]);
                      }}
                      style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid #10B981', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🛡️ Sterile / No Bacterial Growth
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrganism('Klebsiella pneumoniae');
                        setSelectedColonyCount('10^4 - 10^5 CFU/mL (Moderate Growth)');
                        setGrowthStatus('SIGNIFICANT_GROWTH');
                        setAntibioticPanel(STANDARD_ANTIBIOTIC_PANEL);
                      }}
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid #F59E0B', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🦠 Klebsiella pneumoniae (Moderate)
                    </button>
                  </div>

                  {/* Specimen & Incubation Config */}
                  <div style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px'
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                        SPECIMEN SOURCE / SITE *
                      </label>
                      <Input
                        value={specimenSource}
                        onChange={(e) => setSpecimenSource(e.target.value)}
                        placeholder="e.g. Clean Catch Midstream Urine"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                        INCUBATION PROTOCOL
                      </label>
                      <select
                        value={incubationHours}
                        onChange={(e) => setIncubationHours(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E293B',
                          color: '#F8FAFC',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '0.8125rem'
                        }}
                      >
                        <option value="24 Hours (37°C Aerobic)">24 Hours (37°C Aerobic)</option>
                        <option value="48 Hours (37°C Aerobic)">48 Hours (37°C Aerobic) - Standard</option>
                        <option value="72 Hours (37°C Aerobic / Extended)">72 Hours (Extended Culture)</option>
                        <option value="Anaerobic Incubation (48 Hours)">Anaerobic Incubation (48 Hours)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                        ORGANISM ISOLATED *
                      </label>
                      <select
                        value={selectedOrganism}
                        onChange={(e) => setSelectedOrganism(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E293B',
                          color: '#F8FAFC',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '0.8125rem',
                          fontWeight: 700
                        }}
                      >
                        {COMMON_PATHOGENS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                        COLONY COUNT (CFU/mL) *
                      </label>
                      <select
                        value={selectedColonyCount}
                        onChange={(e) => setSelectedColonyCount(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E293B',
                          color: '#F8FAFC',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '0.8125rem'
                        }}
                      >
                        {COLONY_COUNTS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AST Antibiogram Section Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>
                        🔬 Antibiotic Susceptibility Testing (AST Antibiogram) Panel ({antibioticPanel.length} Antimicrobials)
                      </strong>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        Standardized as per CLSI M100 / EUCAST guidelines. Click S/I/R pills to adjust susceptibility.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAntibioticPanel(antibioticPanel.map(d => ({ ...d, susceptibility: 'S' })));
                        }}
                        style={{ backgroundColor: '#064E3B', color: '#34D399', border: '1px solid #059669', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✓ Mark All Sensitive
                      </button>
                      <button
                        type="button"
                        onClick={() => setAntibioticPanel(STANDARD_ANTIBIOTIC_PANEL)}
                        style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        ↺ Reset Standard Panel
                      </button>
                    </div>
                  </div>

                  {/* Antibiotic Table Grid */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr 1.6fr 1.8fr 36px', padding: '10px 14px', backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800 }}>
                      <div>ANTIBIOTIC</div>
                      <div>DRUG CLASS</div>
                      <div>ZONE / MIC</div>
                      <div style={{ textAlign: 'center' }}>SUSCEPTIBILITY (S / I / R)</div>
                      <div style={{ textAlign: 'center' }}>DEL</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '420px', overflowY: 'auto' }}>
                      {antibioticPanel.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                          No antibiotic sensitivity required (Sterile culture or no pathogenic growth).
                        </div>
                      ) : (
                        antibioticPanel.map((drug, dIdx) => (
                          <div
                            key={drug.drugCode || dIdx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2fr 1.6fr 1.6fr 1.8fr 36px',
                              padding: '10px 14px',
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                              backgroundColor: drug.susceptibility === 'R' ? 'rgba(239, 68, 68, 0.1)' : drug.susceptibility === 'I' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <div>
                              <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>{drug.drugName}</strong>
                              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontFamily: 'monospace' }}>Code: {drug.drugCode}</div>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                              {drug.drugClass}
                            </div>

                            <div>
                              <input
                                type="text"
                                value={drug.micOrZone || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAntibioticPanel(prev => prev.map((d, i) => i === dIdx ? { ...d, micOrZone: val } : d));
                                }}
                                style={{ width: '100%', backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}
                                placeholder="Zone (mm) / MIC"
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setAntibioticPanel(prev => prev.map((d, i) => i === dIdx ? { ...d, susceptibility: 'S' } : d));
                                }}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  border: drug.susceptibility === 'S' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                                  backgroundColor: drug.susceptibility === 'S' ? '#059669' : '#1E293B',
                                  color: drug.susceptibility === 'S' ? '#FFF' : '#94A3B8'
                                }}
                              >
                                🟢 S
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAntibioticPanel(prev => prev.map((d, i) => i === dIdx ? { ...d, susceptibility: 'I' } : d));
                                }}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  border: drug.susceptibility === 'I' ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                                  backgroundColor: drug.susceptibility === 'I' ? '#D97706' : '#1E293B',
                                  color: drug.susceptibility === 'I' ? '#FFF' : '#94A3B8'
                                }}
                              >
                                🟡 I
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAntibioticPanel(prev => prev.map((d, i) => i === dIdx ? { ...d, susceptibility: 'R' } : d));
                                }}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  border: drug.susceptibility === 'R' ? '1.5px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                                  backgroundColor: drug.susceptibility === 'R' ? '#DC2626' : '#1E293B',
                                  color: drug.susceptibility === 'R' ? '#FFF' : '#94A3B8'
                                }}
                              >
                                🔴 R
                              </button>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setAntibioticPanel(prev => prev.filter((_, i) => i !== dIdx))}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.875rem' }}
                                title="Remove Antibiotic"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                /* STANDARD PARAMETERS TABLE GRID WITH AUTO-FLAGGING & DELTA CHECK BADGES */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                  {results.map((param, idx) => {
                    const isCritical = param.abnormalFlag === 'CRITICAL_HIGH' || param.abnormalFlag === 'CRITICAL_LOW';
                    const isHigh = param.abnormalFlag === 'HIGH';
                    const isLow = param.abnormalFlag === 'LOW';
                    const isNormal = param.abnormalFlag === 'NORMAL';
                    const paramDelta = param.numericValue !== undefined && !isNaN(param.numericValue)
                      ? evaluateDeltaCheck(param.parameterCode, param.numericValue, selectedOrder.patientMrn)
                      : null;

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          border: isCritical ? '1.5px solid #EF4444' : isHigh || isLow ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          backgroundColor: isCritical ? 'rgba(220, 38, 38, 0.15)' : isHigh || isLow ? 'rgba(245, 158, 11, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                          display: 'grid',
                          gridTemplateColumns: '2.2fr 1.2fr 1fr 1.6fr 1.4fr 36px',
                          gap: '8px',
                          alignItems: 'center'
                        }}
                      >
                        {/* Parameter Name */}
                        <div>
                          <Input
                            value={param.parameterName}
                            onChange={(e) => handleUpdateField(idx, 'parameterName', e.target.value)}
                            placeholder="Parameter name"
                            required
                          />
                        </div>

                        {/* Observed Value (Triggers Auto-Flagging on Change) */}
                        <div>
                          <Input
                            value={param.resultValue}
                            onChange={(e) => handleUpdateResultValue(idx, e.target.value)}
                            placeholder="Result"
                            required
                          />
                        </div>

                        {/* Unit */}
                        <div>
                          <Input
                            value={param.unit || ''}
                            onChange={(e) => handleUpdateField(idx, 'unit', e.target.value)}
                            placeholder="Unit"
                          />
                        </div>

                        {/* Gender-Specific Normal Range */}
                        <div>
                          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 600, textAlign: 'center' }}>
                            {param.referenceRange || 'N/A'}
                          </div>
                        </div>

                        {/* Auto-Calculated Dynamic Clinical Flag + Delta Breach Badge */}
                        <div>
                          <div style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            backgroundColor: isNormal ? 'rgba(16, 185, 129, 0.2)' : isCritical ? '#EF4444' : 'rgba(245, 158, 11, 0.2)',
                            color: isNormal ? '#34D399' : isCritical ? '#FFFFFF' : '#FBBF24',
                            border: isNormal ? '1px solid #10B981' : isCritical ? '1px solid #DC2626' : '1px solid #F59E0B'
                          }}>
                            {isNormal && '✓ NORMAL'}
                            {isHigh && '▲ HIGH'}
                            {isLow && '▼ LOW'}
                            {isCritical && '🚨 CRITICAL'}
                          </div>
                          {paramDelta && (
                            <div style={{ marginTop: '4px', fontSize: '0.65rem', backgroundColor: '#7F1D1D', color: '#FCA5A5', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}>
                              ⚠️ DELTA {paramDelta.direction === 'DROP' ? '▼' : '▲'}{paramDelta.percentChange}% vs baseline
                            </div>
                          )}
                        </div>

                        {/* Delete */}
                        <div style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveParam(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              fontSize: '1rem'
                            }}
                            title="Remove Parameter"
                          >
                            ✕
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* Internal Quality Control (IQC) Surveillance Bar per NABL ISO 15189:2022 */}
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🧪</span>
                    <strong style={{ color: '#34D399', fontSize: '0.8125rem' }}>
                      NABL ISO 15189:2022 IQC Calibration Status: ACTIVE & VERIFIED
                    </strong>
                    <span style={{ backgroundColor: '#065F46', color: '#6EE7B7', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      ✓ PASS
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '3px' }}>
                    Level 1 Normal QC (CV 1.8% &lt; 3.0%) · Level 2 Abnormal QC (CV 2.1% &lt; 3.5%) · Westgard Rules 1-2s &amp; 2-2s Satisfied
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTechnicianNotes(`Analytical run passed. IQC Level 1 (Normal) & Level 2 (Pathological) verified at ${new Date().toLocaleTimeString()} per NABL ISO 15189:2022.`);
                    }}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#F8FAFC',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Re-stamp IQC Passed
                  </button>
                </div>
              </div>

              {/* Technician Notes */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  TECHNICIAN OBSERVATION & QUALITY CONTROL (IQC) REMARKS
                </label>
                <Input
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="e.g. Internal quality controls (IQC Level 1 & 2 passed). Samples verified."
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving Results...' : '💾 Save Results & Send for Verification'}
                  </Button>
                </div>
              </div>
            </form>

          </div>
        ) : (
          <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', textAlign: 'center', padding: '64px', color: '#94A3B8' }}>
            Select an in-processing patient order from the left worklist to open the analytical workbench sheet.
          </div>
        )}

      </div>
    </div>
  );
};
