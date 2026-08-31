import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { ResolveSurgeEventRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResolveSurgeEventRequest) => Promise<void>;
}

export const ResolveSurgeEventDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [resolvedBy, setResolvedBy] = useState('Dr. Alok Verma (Chief Medical Officer)');
  const [outcomeNotes, setOutcomeNotes] = useState('All surge casualties triaged and stabilized; ICU admissions allocated; ER returning to baseline capacity.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ resolvedBy, outcomeNotes });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">De-escalate & Stand Down Surge Alert</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">De-escalation Outcome Notes</label>
            <Input value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Officer</label>
            <Input value={resolvedBy} onChange={(e) => setResolvedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Updating...' : 'Return to Normal Green'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
