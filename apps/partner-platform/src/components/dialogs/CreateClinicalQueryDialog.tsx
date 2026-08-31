import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, CreateClinicalDocumentationQueryRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordIndexDto | null;
  onSubmit: (req: CreateClinicalDocumentationQueryRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateClinicalQueryDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [title, setTitle] = useState('Clarification of Acute Respiratory Failure vs Chronic COPD');
  const [coder, setCoder] = useState('Marcus Chen, RHIT');
  const [doctor, setDoctor] = useState(record?.primaryAttendingDoctor || 'Dr. Arthur Pendelton, MD');
  const [reason, setReason] = useState('ABG indicates acute hypoxemic respiratory failure, but narrative mentions chronic COPD exacerbation.');
  const [snippet, setSnippet] = useState('ABG on room air: pH 7.28, pO2 54, pCO2 58 on Admission 2026-08-20.');
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
        queryTitle: title,
        initiatedByCoder: coder,
        assignedDoctorName: doctor,
        clinicalReason: reason,
        supportingDocumentationSnippet: snippet
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Initiate Clinical Documentation Query (CDI)</h2>
        <p className="text-xs text-gray-500 mb-4">{record.recordNumber} — {record.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Query Subject / Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Initiating Coder</label>
              <Input value={coder} onChange={(e) => setCoder(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Physician</label>
              <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Clarification Question</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Chart Evidence / Lab Snippet</label>
            <Input value={snippet} onChange={(e) => setSnippet(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Transmit Query to Doctor'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
