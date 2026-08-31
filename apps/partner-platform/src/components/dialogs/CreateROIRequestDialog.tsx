import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, CreateROIRequestRequest, ROIRequestType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordIndexDto | null;
  onSubmit: (req: CreateROIRequestRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateROIRequestDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [requestType, setRequestType] = useState<ROIRequestType>('PATIENT_SELF_REQUEST');
  const [requestorName, setRequestorName] = useState(record?.patientName || '');
  const [org, setOrg] = useState('');
  const [purpose, setPurpose] = useState('Personal health record archive and insurance claim filing');
  const [delivery, setDelivery] = useState<'ELECTRONIC_SECURE_PORTAL' | 'PHYSICAL_CERTIFIED_COPIES' | 'IN_PERSON_COLLECTION'>('ELECTRONIC_SECURE_PORTAL');
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
        patientMrn: record.patientMrn,
        requestType,
        requestorName,
        requestorOrganization: org || undefined,
        purposeOfRequest: purpose,
        deliveryMethod: delivery
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Release of Information (ROI) Request</h2>
        <p className="text-xs text-gray-500 mb-4">{record.recordNumber} — {record.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Requesting Entity Type</label>
            <select value={requestType} onChange={(e) => setRequestType(e.target.value as ROIRequestType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
              <option value="PATIENT_SELF_REQUEST">Patient (Direct Request)</option>
              <option value="AUTHORIZED_REPRESENTATIVE">Authorized Legal Representative / Guardian</option>
              <option value="INSURANCE_TPA_AUDIT">Insurance / TPA Audit Request</option>
              <option value="LEGAL_SUBPOENA_COURT">Legal Subpoena / Court Request</option>
              <option value="GOVERNMENT_REGULATORY_BODY">Government / Regulatory Agency</option>
              <option value="EXTERNAL_HEALTHCARE_PROVIDER">External Tertiary Healthcare Provider</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Requestor Full Name</label>
              <Input value={requestorName} onChange={(e) => setRequestorName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Organization / Law Firm (if any)</label>
              <Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Purpose of Release</label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Method</label>
            <select value={delivery} onChange={(e) => setDelivery(e.target.value as 'ELECTRONIC_SECURE_PORTAL' | 'PHYSICAL_CERTIFIED_COPIES' | 'IN_PERSON_COLLECTION')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="ELECTRONIC_SECURE_PORTAL">Secure Electronic Patient Portal</option>
              <option value="PHYSICAL_CERTIFIED_COPIES">Physical Certified Paper Copies</option>
              <option value="IN_PERSON_COLLECTION">In-Person Collection at MRD Desk</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Log ROI Request'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
