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
  AmendInvestigationResultRequest,
  InvestigationResultFlag
} from '@docsearch/api-contracts';

export interface AmendInvestigationResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: AmendInvestigationResultRequest) => Promise<void>;
  order: InvestigationOrderDto | null;
  tenantId: string;
}

export const AmendInvestigationResultDialog: React.FC<AmendInvestigationResultDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  tenantId
}) => {
  const [selectedResultId, setSelectedResultId] = useState<string>(
    order?.results[0]?.id || ''
  );
  const [newValue, setNewValue] = useState('');
  const [newAbnormalFlag, setNewAbnormalFlag] = useState<InvestigationResultFlag>('NORMAL');
  const [amendmentReason, setAmendmentReason] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const currentResult = order.results.find((r) => r.id === selectedResultId) || order.results[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResultId) {
      setError('Please select a result parameter to amend.');
      return;
    }
    if (!newValue.trim()) {
      setError('New corrected value is required.');
      return;
    }
    if (!amendmentReason.trim()) {
      setError('Clinical reason for amendment is mandatory.');
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
        resultId: selectedResultId,
        newValue,
        newAbnormalFlag,
        amendmentReason,
        actorId: 'dr.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PATHOLOGIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to record result amendment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="📝 Formal Investigation Result Amendment"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording Amendment...' : 'Submit Audited Amendment'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <Alert type="warning" title="Immutable Audit Notice">
          Verified clinical results cannot be overwritten silently. This action generates a permanent, versioned amendment record and updates the audit ledger.
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Select Parameter to Amend *
          </label>
          <Select
            value={selectedResultId}
            onChange={(e) => {
              setSelectedResultId(e.target.value);
              const found = order.results.find((r) => r.id === e.target.value);
              if (found) {
                setNewValue(found.resultValue);
                setNewAbnormalFlag(found.abnormalFlag);
              }
            }}
            options={order.results.map((r) => ({
              label: `${r.parameterName} — Current: ${r.resultValue} ${r.unit ?? ''} [${r.abnormalFlag}] (v${r.version})`,
              value: r.id
            }))}
          />
        </div>

        {currentResult && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--ds-color-bg-subtle, #f8fafc)', borderRadius: '6px', fontSize: '0.8125rem' }}>
            <div><strong>Original Value:</strong> {currentResult.resultValue} {currentResult.unit ?? ''}</div>
            <div><strong>Original Flag:</strong> {currentResult.abnormalFlag}</div>
            <div><strong>Reference Range:</strong> {currentResult.referenceRange || 'N/A'}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Corrected / Amended Value *
            </label>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. 142"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Updated Abnormal Flag *
            </label>
            <Select
              value={newAbnormalFlag}
              onChange={(e) => setNewAbnormalFlag(e.target.value as InvestigationResultFlag)}
              options={[
                { label: 'Normal', value: 'NORMAL' },
                { label: 'High', value: 'HIGH' },
                { label: 'Low', value: 'LOW' },
                { label: 'Abnormal', value: 'ABNORMAL' },
                { label: '🚨 Critical High', value: 'CRITICAL_HIGH' },
                { label: '🚨 Critical Low', value: 'CRITICAL_LOW' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Clinical Reason for Amendment *
          </label>
          <Input
            value={amendmentReason}
            onChange={(e) => setAmendmentReason(e.target.value)}
            placeholder="e.g. Recalculated LDL following manual dilution verify or rerun on secondary analyzer."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Document supervisor approval and justification..."
          />
        </div>
      </form>
    </Dialog>
  );
};
