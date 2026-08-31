import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { GenerateFhirBundleRequest, FhirBundleProfile } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GenerateFhirBundleRequest) => Promise<void>;
}

export const GenerateFhirBundleDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [profileType, setProfileType] = useState<FhirBundleProfile>('PRESCRIPTION_RECORD');
  const [patientAbhaAddress, setPatientAbhaAddress] = useState('gopal.krishna@abdm');
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [careContextRef, setCareContextRef] = useState('VISIT-OPD-2026-8819');
  const [authorPractitionerHprId, setAuthorPractitionerHprId] = useState('HP-DOC-10293');
  const [authorPractitionerName, setAuthorPractitionerName] = useState('Dr. Sanjay Gupta');
  const [clinicalSummaryText, setClinicalSummaryText] = useState('Atorvastatin 20mg 1 tab OD at bedtime, Metoprolol 25mg 1 tab BD. Advised low salt diet & review in 30 days.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        profileType,
        patientAbhaAddress,
        patientMrn,
        careContextRef,
        authorPractitionerHprId,
        authorPractitionerName,
        clinicalSummaryText
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-purple-900">📦 Generate FHIR R4 Bundle & Sign (Milestone 3)</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">FHIR R4 Profile</label>
              <Select
                value={profileType}
                onChange={(e) => setProfileType(e.target.value as FhirBundleProfile)}
                options={[
                  { value: 'PRESCRIPTION_RECORD', label: 'Prescription Record (NRCeS)' },
                  { value: 'DIAGNOSTIC_REPORT_LAB', label: 'Diagnostic Report (Lab LOINC)' },
                  { value: 'DIAGNOSTIC_REPORT_RAD', label: 'Diagnostic Report (Radiology DICOM)' },
                  { value: 'DISCHARGE_SUMMARY', label: 'Inpatient Discharge Summary' },
                  { value: 'IMMUNIZATION_RECORD', label: 'Immunization Record' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Care Context Ref</label>
              <Input value={careContextRef} onChange={(e) => setCareContextRef(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient ABHA Address</label>
              <Input value={patientAbhaAddress} onChange={(e) => setPatientAbhaAddress(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor Name</label>
              <Input value={authorPractitionerName} onChange={(e) => setAuthorPractitionerName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor HPR ID</label>
              <Input value={authorPractitionerHprId} onChange={(e) => setAuthorPractitionerHprId(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Narrative (Bundled into Composition HTML)</label>
            <Input value={clinicalSummaryText} onChange={(e) => setClinicalSummaryText(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Validating FHIR R4 Schema...' : 'Generate & Digitally Sign'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
