import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateQualityCapaRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  incidentId?: string | undefined;
  onClose: () => void;
  onSubmit: (data: CreateQualityCapaRequest) => Promise<void>;
}

export const CreateCapaActionDialog: React.FC<Props> = ({ isOpen, incidentId, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [actionType, setActionType] = useState<'CORRECTIVE' | 'PREVENTIVE' | 'SYSTEMIC_REDESIGN'>('SYSTEMIC_REDESIGN');
  const [assignedOwner, setAssignedOwner] = useState('Pharm. Sunita Patil (Pharmacy Head)');
  const [targetCompletionDate, setTargetCompletionDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] || '2026-09-15');
  const [verificationMetric, setVerificationMetric] = useState('100% audit compliance for 8 consecutive weekly rounds.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        incidentId,
        title,
        actionDescription,
        actionType,
        assignedOwner,
        targetCompletionDate,
        verificationMetric
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Formulate CAPA Action Item</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">CAPA Action Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ward LASA Medication Segregation & Tall-Man Overhaul" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Action Description & Scope</label>
            <Input value={actionDescription} onChange={(e) => setActionDescription(e.target.value)} placeholder="Detailed corrective / preventive action steps..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Action Type</label>
              <Select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as 'CORRECTIVE' | 'PREVENTIVE' | 'SYSTEMIC_REDESIGN')}
                options={[
                  { value: 'CORRECTIVE', label: 'Corrective Action' },
                  { value: 'PREVENTIVE', label: 'Preventive Action' },
                  { value: 'SYSTEMIC_REDESIGN', label: 'Systemic / Workflow Redesign' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Completion Date</label>
              <Input type="date" value={targetCompletionDate} onChange={(e) => setTargetCompletionDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Action Owner</label>
            <Input value={assignedOwner} onChange={(e) => setAssignedOwner(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Verification & Success Metric</label>
            <Input value={verificationMetric} onChange={(e) => setVerificationMetric(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Formulate CAPA'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
