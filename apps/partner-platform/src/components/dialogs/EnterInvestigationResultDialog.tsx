import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  InvestigationOrderDto,
  EnterInvestigationResultRequest,
  ResultEntryItem,
  InvestigationResultFlag
} from '@docsearch/api-contracts';

export interface EnterInvestigationResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: EnterInvestigationResultRequest) => Promise<void>;
  order: InvestigationOrderDto | null;
  tenantId: string;
}

export const EnterInvestigationResultDialog: React.FC<EnterInvestigationResultDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  tenantId
}) => {
  const [results, setResults] = useState<ResultEntryItem[]>([
    {
      parameterCode: 'RESULT_MAIN',
      parameterName: order?.investigationName || 'Primary Finding',
      resultValue: '',
      unit: '',
      referenceRange: '',
      abnormalFlag: 'NORMAL',
      isCritical: false,
      qualitativeInterpretation: ''
    }
  ]);
  const [justification, setJustification] = useState('Laboratory analytical test run completed.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  React.useEffect(() => {
    if (order && order.results && order.results.length > 0) {
      setResults(order.results.map(r => ({
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
  }, [order]);

  const handleAutoFillCBC = () => {
    setResults([
      { parameterCode: 'WBC', parameterName: 'White Blood Cell (WBC)', resultValue: '7.8', numericValue: 7.8, unit: 'x10^3/uL', referenceRange: '4.5 - 11.0', abnormalFlag: 'NORMAL', isCritical: false, qualitativeInterpretation: '' },
      { parameterCode: 'HGB', parameterName: 'Hemoglobin (Hb)', resultValue: '14.2', numericValue: 14.2, unit: 'g/dL', referenceRange: '13.0 - 17.0', abnormalFlag: 'NORMAL', isCritical: false, qualitativeInterpretation: '' },
      { parameterCode: 'PLT', parameterName: 'Platelet Count', resultValue: '245', numericValue: 245, unit: 'x10^3/uL', referenceRange: '150 - 450', abnormalFlag: 'NORMAL', isCritical: false, qualitativeInterpretation: '' },
      { parameterCode: 'RBC', parameterName: 'Red Blood Cell (RBC)', resultValue: '4.8', numericValue: 4.8, unit: 'million/uL', referenceRange: '4.5 - 5.5', abnormalFlag: 'NORMAL', isCritical: false, qualitativeInterpretation: '' },
      { parameterCode: 'NEUT', parameterName: 'Neutrophils', resultValue: '65', numericValue: 65, unit: '%', referenceRange: '40 - 75', abnormalFlag: 'NORMAL', isCritical: false, qualitativeInterpretation: '' },
      { parameterCode: 'LYMPH', parameterName: 'Lymphocytes', resultValue: '28', numericValue: 28, unit: '%', referenceRange: '20 - 45', abnormalFlag: 'NORMAL', isCritical: false, qualitativeInterpretation: '' }
    ]);
  };

  if (!order) return null;

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

  const handleUpdateParam = (index: number, field: keyof ResultEntryItem, value: unknown) => {
    setResults((prev) => {
      const next = [...prev];
      const curr = next[index];
      if (!curr) return prev;
      const target = { ...curr };
      if (field === 'resultValue') {
        target.resultValue = String(value);
        const parsed = parseFloat(String(value));
        if (!isNaN(parsed)) {
          target.numericValue = parsed;
        }
      } else if (field === 'abnormalFlag') {
        target.abnormalFlag = value as InvestigationResultFlag;
        target.isCritical = value === 'CRITICAL_HIGH' || value === 'CRITICAL_LOW';
      } else {
        (target as Record<string, unknown>)[field] = value;
      }
      next[index] = target;
      return next;
    });
  };

  const handleRemoveParam = (index: number) => {
    if (results.length === 1) return;
    setResults((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (results.some((r) => !r.parameterName.trim() || !r.resultValue.trim())) {
      setError('Every result parameter requires a name and observed value.');
      return;
    }
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        orderId: order.id,
        specimenId: order.specimens[0]?.id,
        results,
        actorId: 'tech.alex.rivera@docsearch.docsearch.health',
        actorRole: 'LAB_TECHNICIAN',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to enter results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="📊 Enter Investigation Analytical Results"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving Results...' : 'Submit Results for Verification'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ padding: '14px 16px', backgroundColor: 'rgba(30, 41, 59, 0.85)', border: '1.5px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', fontSize: '0.8125rem', color: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div><span style={{ color: '#94A3B8' }}>Order:</span> <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{order.orderNumber}</strong> — <strong style={{ color: '#F8FAFC' }}>{order.investigationName}</strong></div>
            <span style={{ backgroundColor: '#0284C7', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>{order.investigationCategory}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
            <div><span style={{ color: '#94A3B8' }}>Patient:</span> <strong style={{ color: '#A7F3D0' }}>{order.patientName}</strong> · MRN: {order.patientMrn}</div>
            <div><span style={{ color: '#94A3B8' }}>Indication:</span> <strong style={{ color: '#FCD34D' }}>{order.clinicalIndication}</strong></div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Measured Parameters & Clinical Findings</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" size="sm" variant="primary" onClick={handleAutoFillCBC} style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#070C16', fontWeight: 800 }}>
                ⚡ Auto-Fetch Analyzer Machine Readings
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleAddParam}>
                ➕ Add Parameter
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.map((param, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  border: '1px solid var(--ds-color-border-subtle, #e2e8f0)',
                  borderRadius: '6px',
                  backgroundColor: param.isCritical ? '#fef2f2' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '8px' }}>
                  <Input
                    value={param.parameterName}
                    onChange={(e) => handleUpdateParam(idx, 'parameterName', e.target.value)}
                    placeholder="Parameter name (e.g. Total Cholesterol)"
                  />
                  <Input
                    value={param.resultValue}
                    onChange={(e) => handleUpdateParam(idx, 'resultValue', e.target.value)}
                    placeholder="Result value (e.g. 238, Negative)"
                  />
                  <Input
                    value={param.unit || ''}
                    onChange={(e) => handleUpdateParam(idx, 'unit', e.target.value)}
                    placeholder="Unit (mg/dL)"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '8px', alignItems: 'center' }}>
                  <Input
                    value={param.referenceRange || ''}
                    onChange={(e) => handleUpdateParam(idx, 'referenceRange', e.target.value)}
                    placeholder="Ref range (e.g. < 200, 13.5-17.5)"
                  />
                  <Select
                    value={param.abnormalFlag}
                    onChange={(e) => handleUpdateParam(idx, 'abnormalFlag', e.target.value)}
                    options={[
                      { label: 'Normal', value: 'NORMAL' },
                      { label: 'High (Above Reference)', value: 'HIGH' },
                      { label: 'Low (Below Reference)', value: 'LOW' },
                      { label: 'Abnormal / Pathological', value: 'ABNORMAL' },
                      { label: '🚨 CRITICAL HIGH (Immediate Alert)', value: 'CRITICAL_HIGH' },
                      { label: '🚨 CRITICAL LOW (Immediate Alert)', value: 'CRITICAL_LOW' }
                    ]}
                  />
                  {results.length > 1 && (
                    <Button type="button" size="sm" variant="danger" onClick={() => handleRemoveParam(idx)}>
                      Remove
                    </Button>
                  )}
                </div>

                <Input
                  value={param.qualitativeInterpretation || ''}
                  onChange={(e) => handleUpdateParam(idx, 'qualitativeInterpretation', e.target.value)}
                  placeholder="Technician observation / smear comment (optional)..."
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Analytical bench confirmation..."
          />
        </div>
      </form>
    </Dialog>
  );
};
