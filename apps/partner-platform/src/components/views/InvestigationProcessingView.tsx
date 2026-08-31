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
  computeAutoClinicalFlag
} from '../../services/clinical-test-knowledge-base.js';

export interface InvestigationProcessingViewProps {
  orders: InvestigationOrderDto[];
  onEnterResults?: (order: InvestigationOrderDto) => void;
  onSelectOrder?: (orderId: string) => void;
  onSubmitResults?: (request: EnterInvestigationResultRequest) => Promise<void>;
  onOpenPrint?: (order: InvestigationOrderDto) => void;
}

export const InvestigationProcessingView: React.FC<InvestigationProcessingViewProps> = ({
  orders,
  onSubmitResults,
  onOpenPrint
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

      setActiveTestKey(key);
      if (!selectedTests.includes(key)) {
        setSelectedTests([key]);
      }

      if (selectedOrder.results && selectedOrder.results.length > 0) {
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
      } else {
        setResults(loadParametersForTest(key));
      }
      setSaveSuccess(false);
      setError(null);
    }
  }, [selectedOrderId]);

  // Handle adding an additional test panel to this patient
  const handleToggleTest = (key: string) => {
    if (selectedTests.includes(key)) {
      if (selectedTests.length === 1) return; // Keep at least one
      const updated = selectedTests.filter(t => t !== key);
      setSelectedTests(updated);
      if (activeTestKey === key) {
        setActiveTestKey(updated[0] || 'CBC');
        setResults(loadParametersForTest(updated[0] || 'CBC'));
      }
    } else {
      setSelectedTests([...selectedTests, key]);
      setActiveTestKey(key);
      setResults(loadParametersForTest(key));
    }
  };

  const handleSelectActiveTest = (key: string) => {
    setActiveTestKey(key);
    setResults(loadParametersForTest(key));
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
    if (results.some((r) => !r.parameterName.trim() || !r.resultValue.trim())) {
      setError('Every result parameter requires a name and observed value.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (onSubmitResults) {
        await onSubmitResults({
          tenantId: selectedOrder.tenantId,
          orderId: selectedOrder.id,
          specimenId: selectedOrder.specimens[0]?.id,
          results,
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
                  Specimen: {MULTI_TEST_KNOWLEDGE_BASE[activeTestKey]?.specimenType} · Gender-Specific Normal Ranges Active
                </div>
              </div>

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
            </div>

            {/* Alert / Success messages */}
            {error && <div style={{ marginBottom: '12px' }}><Alert type="error" title="Error">{error}</Alert></div>}
            {saveSuccess && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700 }}>
                ✓ Analytical Results Saved Successfully with Gender Normal Ranges & Clinical Flags!
              </div>
            )}

            {/* Parameters Table Grid with Real-Time Auto-Flagging */}
            <form onSubmit={handleSaveResults}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {results.map((param, idx) => {
                  const isCritical = param.abnormalFlag === 'CRITICAL_HIGH' || param.abnormalFlag === 'CRITICAL_LOW';
                  const isHigh = param.abnormalFlag === 'HIGH';
                  const isLow = param.abnormalFlag === 'LOW';
                  const isNormal = param.abnormalFlag === 'NORMAL';

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

                      {/* Auto-Calculated Dynamic Clinical Flag */}
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

              {/* Submit & Print Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                {onOpenPrint && (
                  <button
                    type="button"
                    onClick={() => onOpenPrint(selectedOrder)}
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      color: '#38BDF8',
                      border: '1.5px solid #06B6D4',
                      borderRadius: '8px',
                      padding: '8px 18px',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🖨️</span>
                    <span>Preview & Print NABL A4 Report</span>
                  </button>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#06B6D4',
                    borderColor: '#06B6D4',
                    color: '#070C16',
                    fontWeight: 900,
                    padding: '8px 24px',
                    fontSize: '0.875rem'
                  }}
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
