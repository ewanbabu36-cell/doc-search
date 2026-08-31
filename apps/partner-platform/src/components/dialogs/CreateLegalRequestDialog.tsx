import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, CreateLegalRecordRequestRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordIndexDto | null;
  onSubmit: (req: CreateLegalRecordRequestRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateLegalRequestDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [court, setCourt] = useState('High Court of Judicature / Police Subpoena');
  const [noticeRef, setNoticeRef] = useState('SUBPOENA-2026/9912');
  const [officer, setOfficer] = useState('Sub-Inspector Arvind Rao');
  const [subpoena, setSubpoena] = useState('Certified copy of complete inpatient stay, surgical notes, and blood toxicology.');
  const [preservation, setPreservation] = useState(true);
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
        patientName: record.patientName,
        courtOrAgencyName: court,
        legalNoticeReferenceNumber: noticeRef,
        officerInChargeName: officer,
        subpoenaDetails: subpoena,
        isPreservationOrder: preservation
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border-4 border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 mb-2">⚖ Legal Request & Subpoena Notice</h2>
        <p className="text-xs text-gray-500 mb-4">{record.recordNumber} — {record.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Court / Law Enforcement Agency</label>
            <Input value={court} onChange={(e) => setCourt(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subpoena / Notice Reference #</label>
              <Input value={noticeRef} onChange={(e) => setNoticeRef(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Investigating Officer Name</label>
              <Input value={officer} onChange={(e) => setOfficer(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subpoena & Production of Documents Details</label>
            <Input value={subpoena} onChange={(e) => setSubpoena(e.target.value)} required />
          </div>
          <div className="p-3 bg-red-50 rounded border border-red-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-900">
              <input type="checkbox" checked={preservation} onChange={(e) => setPreservation(e.target.checked)} />
              Apply Immediate Mandatory Legal Preservation Hold on Record
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Legal Subpoena'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
