import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  ProcurementExceptionDto,
  ResolveProcurementExceptionRequest,
  ProcurementExceptionStatus
} from '@docsearch/api-contracts';

export interface ResolveProcurementExceptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ResolveProcurementExceptionRequest) => Promise<void>;
  exception: ProcurementExceptionDto | null;
  tenantId: string;
}

export const ResolveProcurementExceptionDialog: React.FC<ResolveProcurementExceptionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  exception,
  tenantId
}) => {
  const [resolutionStatus, setResolutionStatus] = useState<ProcurementExceptionStatus>('VENDOR_CREDITED');
  const [resolution, setResolution] = useState('Vendor acknowledged price variance and provided adjusted credit note #CN-2026-09.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!exception) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        exceptionId: exception.id,
        resolutionStatus,
        resolution: resolution.trim(),
        actorId: 'Alice Wong',
        actorRole: 'Finance Officer',
        justification: resolution.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resolve exception.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Resolve Exception: ${exception.exceptionNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Exception Type:</strong> {exception.exceptionType}</div>
          <div><strong>Severity:</strong> {exception.severity}</div>
          <div><strong>Variance Amount:</strong> ${exception.varianceAmount.toFixed(2)}</div>
          <div><strong>Details:</strong> {exception.description}</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Resolution Status *
          </label>
          <Select
            value={resolutionStatus}
            onChange={(e) => setResolutionStatus(e.target.value as ProcurementExceptionStatus)}
            options={[
              { value: 'VENDOR_CREDITED', label: 'Vendor Credited (Credit Note Issued)' },
              { value: 'WAIVED_APPROVED', label: 'Waived & Approved by Controller' },
              { value: 'CLOSED', label: 'Closed (Settled)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Resolution Narrative & Settlement Terms *
          </label>
          <Input value={resolution} onChange={(e) => setResolution(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resolving...' : 'Commit Resolution'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
