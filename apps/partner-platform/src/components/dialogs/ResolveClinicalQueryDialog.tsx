import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { ClinicalDocumentationQueryDto, ResolveClinicalDocumentationQueryRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  query: ClinicalDocumentationQueryDto | null;
  onSubmit: (req: ResolveClinicalDocumentationQueryRequest) => Promise<void>;
  tenantId: string;
}

export const ResolveClinicalQueryDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  query,
  onSubmit,
  tenantId
}) => {
  const [response, setResponse] = useState('Confirmed Acute on Chronic Hypoxemic Respiratory Failure.');
  const [status, setStatus] = useState<'RESPONDED_BY_CLINICIAN' | 'RESOLVED' | 'CANCELLED'>('RESOLVED');
  const [doctor, setDoctor] = useState(query?.assignedDoctorName || 'Dr. Arthur Pendelton, MD');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !query) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        queryId: query.id,
        clinicianClarificationResponse: response,
        status,
        resolvedByDoctor: doctor
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Physician Response to Clinical Query</h2>
        <p className="text-xs text-gray-500 mb-4">{query.queryNumber} — {query.queryTitle}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded border text-xs text-blue-900">
            <span className="font-bold">Coder Question:</span> {query.clinicalReason}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinician Clarification Response</label>
            <Input value={response} onChange={(e) => setResponse(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Query Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'RESPONDED_BY_CLINICIAN' | 'RESOLVED' | 'CANCELLED')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="RESOLVED">Resolved & Incorporated into Chart</option>
                <option value="RESPONDED_BY_CLINICIAN">Responded - Pending Coder Update</option>
                <option value="CANCELLED">Cancelled / Query Retracted</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Responding Physician</label>
              <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Submit Resolution'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
