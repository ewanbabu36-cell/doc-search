import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, SubmitCodingReviewRequest, CodingReviewStatus } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordIndexDto | null;
  onSubmit: (req: SubmitCodingReviewRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const SubmitCodingReviewDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [reviewer, setReviewer] = useState('Dr. Rebecca Sterling, RHIA');
  const [role, setRole] = useState('HIM_DIRECTOR');
  const [level, setLevel] = useState<'FIRST_LEVEL_AUDIT' | 'SECOND_LEVEL_SENIOR_AUDIT' | 'COMPLIANCE_PEER_REVIEW'>('SECOND_LEVEL_SENIOR_AUDIT');
  const [status, setStatus] = useState<CodingReviewStatus>('APPROVED_FINALIZED');
  const [notes, setNotes] = useState('All primary and secondary ICD-10 diagnosis codes audited; 100% compliant with coding clinic guidelines.');
  const [accuracy, setAccuracy] = useState('100');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        recordId: record.id,
        reviewerName: reviewer,
        reviewerRole: role,
        reviewLevel: level,
        status,
        findingsAndErrorsNotes: notes,
        codingAccuracyScorePercent: parseInt(accuracy) || 100
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Coding Quality & Compliance Audit</h2>
        <p className="text-xs text-gray-500 mb-4">{record.recordNumber} — {record.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Review Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as 'FIRST_LEVEL_AUDIT' | 'SECOND_LEVEL_SENIOR_AUDIT' | 'COMPLIANCE_PEER_REVIEW')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="FIRST_LEVEL_AUDIT">1st Level Coding Audit</option>
                <option value="SECOND_LEVEL_SENIOR_AUDIT">2nd Level Senior Audit</option>
                <option value="COMPLIANCE_PEER_REVIEW">Compliance Peer Review</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Review Outcome Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as CodingReviewStatus)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
                <option value="APPROVED_FINALIZED">Approved & Finalized</option>
                <option value="UNDER_AUDIT_REVIEW">Under Audit Review</option>
                <option value="REJECTED_NEEDS_CORRECTION">Rejected - Needs Correction</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reviewer Name</label>
              <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reviewer Role</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Accuracy Score (%)</label>
              <Input type="number" min="0" max="100" value={accuracy} onChange={(e) => setAccuracy(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Findings & Feedback Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Sign & Finalize Audit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
