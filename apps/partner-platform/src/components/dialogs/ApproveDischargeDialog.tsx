import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { ApproveDischargeRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface ApproveDischargeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: ApproveDischargeRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
}

export const ApproveDischargeDialog: React.FC<ApproveDischargeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId
}) => {
  const [clinicalClearance, setClinicalClearance] = useState(true);
  const [financialClearance, setFinancialClearance] = useState(true);
  const [insuranceClearance, setInsuranceClearance] = useState(true);
  const [authorizedBy, setAuthorizedBy] = useState('Central Discharge Authority Officer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!admission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        dischargeRequestId: 'req-' + admission.id,
        tenantId,
        clinicalClearance,
        financialClearance,
        insuranceClearance,
        authorizedBy
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to authorize discharge clearances');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Multi-Department Discharge Clearance — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={clinicalClearance} onChange={(e) => setClinicalClearance(e.target.checked)} />
            ✅ Clinical & Physician Clearance Confirmed
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={financialClearance} onChange={(e) => setFinancialClearance(e.target.checked)} />
            ✅ Billing & Inpatient Pharmacy Ledger Cleared
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={insuranceClearance} onChange={(e) => setInsuranceClearance(e.target.checked)} />
            ✅ TPA / Insurance Final Pre-Settlement Approved
          </label>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Authorizing Executive</label>
          <Input value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || !clinicalClearance || !financialClearance || !insuranceClearance}>
            {isSubmitting ? 'Clearing...' : 'Approve Clearances'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};