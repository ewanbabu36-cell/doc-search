import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyStudyDto, CreatePacsReferenceRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  study: RadiologyStudyDto | null;
  onSubmit: (req: CreatePacsReferenceRequest) => Promise<void>;
  tenantId: string;
}

export const PacsReferenceDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  study,
  onSubmit,
  tenantId
}) => {
  const [url, setUrl] = useState(study?.pacsViewerUrl || 'https://pacs.docsearch.internal/viewer');
  const [status, setStatus] = useState<'SYNCED' | 'PENDING' | 'FAILED'>('SYNCED');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !study) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        studyId: study.id,
        pacsViewerUrl: url,
        syncStatus: status
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Configure DICOM PACS Integration</h2>
        <p className="text-xs text-gray-500 mb-4">{study.accessionNumber} — {study.studyDescription}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">PACS DICOM Web Viewer URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">DICOM Node Sync Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'SYNCED' | 'PENDING' | 'FAILED')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="SYNCED">Synced (Verified on PACS Server)</option>
              <option value="PENDING">Pending (Storage Commitment In Progress)</option>
              <option value="FAILED">Failed (Retry C-STORE required)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update PACS Node'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
