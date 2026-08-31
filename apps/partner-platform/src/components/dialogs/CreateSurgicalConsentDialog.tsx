import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateSurgicalConsentRequest, SurgeryRequestDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: SurgeryRequestDto | null;
  onSubmit: (req: CreateSurgicalConsentRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateSurgicalConsentDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [consentingPersonName, setConsentingPersonName] = useState(request?.patientName || '');
  const [relationshipToPatient, setRelationshipToPatient] = useState('SELF');
  const [counselledByDoctor, setCounselledByDoctor] = useState(request?.primarySurgeonName || 'Dr. Gregory House, MS');
  const [witnessName, setWitnessName] = useState('Staff Nurse Jennifer Adams');
  const [highRiskConsentGiven, setHighRiskConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        surgeryRequestId: request.id,
        patientId: request.patientId,
        patientName: request.patientName,
        procedureConsentGiven: true,
        anaesthesiaConsentGiven: true,
        bloodTransfusionConsentGiven: true,
        highRiskConsentGiven,
        implantConsentGiven: true,
        consentingPersonName: consentingPersonName || request.patientName,
        relationshipToPatient,
        counselledByDoctor,
        witnessName
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Execute Surgical Consent</h2>
        <p className="text-xs text-gray-500 mb-4">{request.patientName} — {request.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Consenting Signee Name</label>
            <Input value={consentingPersonName} onChange={(e) => setConsentingPersonName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship</label>
              <Input value={relationshipToPatient} onChange={(e) => setRelationshipToPatient(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Witness Name</label>
              <Input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Counselled By Surgeon</label>
            <Input value={counselledByDoctor} onChange={(e) => setCounselledByDoctor(e.target.value)} required />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
              <input type="checkbox" checked={highRiskConsentGiven} onChange={(e) => setHighRiskConsentGiven(e.target.checked)} className="rounded" />
              Acknowledge High-Risk Surgical / Anaesthesia Consent
            </label>
            <p className="text-gray-600">Confirms explanation of procedural risks, potential intraoperative complications, and blood transfusion protocols.</p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Executing...' : 'Sign & Record Consent'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
