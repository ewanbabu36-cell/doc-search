import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OperativeNoteDto, FinalizeOperativeNoteRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  note: OperativeNoteDto | null;
  onSubmit: (req: FinalizeOperativeNoteRequest) => Promise<void>;
  tenantId: string;
}

export const FinalizeOperativeNoteDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  note,
  onSubmit,
  tenantId
}) => {
  const [finalizedBy, setFinalizedBy] = useState(note?.primarySurgeonName || 'Dr. Gregory House');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !note) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        noteId: note.id,
        tenantId,
        finalizedBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Finalize & Sign Operative Note</h2>
        <p className="text-xs text-gray-500 mb-4">{note.noteNumber} — {note.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Signing Consultant Surgeon</label>
            <Input value={finalizedBy} onChange={(e) => setFinalizedBy(e.target.value)} required />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            ⚠ Warning: Finalizing seals this operative note cryptographically. Amendments will require an audited addendum.
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Sealing...' : 'Sign & Seal Note'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
