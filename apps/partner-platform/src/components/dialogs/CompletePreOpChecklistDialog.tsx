import React, { useState } from 'react';
import { Button } from '@docsearch/ui-kit';
import type { OTScheduleDto, CompletePreOpChecklistRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CompletePreOpChecklistRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CompletePreOpChecklistDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [verifiedByNurse, setVerifiedByNurse] = useState('Nurse Jennifer Adams');
  const [patientIdentityVerified, setPatientIdentityVerified] = useState(true);
  const [surgicalSiteMarked, setSurgicalSiteMarked] = useState(true);
  const [consentVerified, setConsentVerified] = useState(true);
  const [npoVerified, setNpoVerified] = useState(true);
  const [allergiesChecked, setAllergiesChecked] = useState(true);
  const [preOpVitalsChecked, setPreOpVitalsChecked] = useState(true);
  const [bloodReservedAndChecked, setBloodReservedAndChecked] = useState(true);
  const [implantsVerifiedInOT, setImplantsVerifiedInOT] = useState(true);
  const [denturesJewelryRemoved, setDenturesJewelryRemoved] = useState(true);
  const [preMedicationAdministered, setPreMedicationAdministered] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        scheduleId: schedule.id,
        patientId: schedule.patientId,
        verifiedByNurse,
        patientIdentityVerified,
        surgicalSiteMarked,
        consentVerified,
        npoVerified,
        allergiesChecked,
        preOpVitalsChecked,
        labReportsAvailable: true,
        imagingAvailable: true,
        bloodReservedAndChecked,
        implantsVerifiedInOT,
        denturesJewelryRemoved,
        preMedicationAdministered,
        isClearedForOT: true
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pre-Operative Nursing Checklist</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} — {schedule.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={patientIdentityVerified} onChange={(e) => setPatientIdentityVerified(e.target.checked)} />
              Patient 2-Point ID Verified
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={surgicalSiteMarked} onChange={(e) => setSurgicalSiteMarked(e.target.checked)} />
              Surgical Site Indelibly Marked
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={consentVerified} onChange={(e) => setConsentVerified(e.target.checked)} />
              Signed Consents in Record
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={npoVerified} onChange={(e) => setNpoVerified(e.target.checked)} />
              NPO Status Confirmed (≥ 6-8 hrs)
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={allergiesChecked} onChange={(e) => setAllergiesChecked(e.target.checked)} />
              Allergies Cross-Checked
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={preOpVitalsChecked} onChange={(e) => setPreOpVitalsChecked(e.target.checked)} />
              Pre-Op Vitals Recorded
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={bloodReservedAndChecked} onChange={(e) => setBloodReservedAndChecked(e.target.checked)} />
              Blood Cross-Matched / Available
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={implantsVerifiedInOT} onChange={(e) => setImplantsVerifiedInOT(e.target.checked)} />
              Implants & Trays in Suite
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={denturesJewelryRemoved} onChange={(e) => setDenturesJewelryRemoved(e.target.checked)} />
              Dentures & Metal Removed
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-gray-50 border cursor-pointer">
              <input type="checkbox" checked={preMedicationAdministered} onChange={(e) => setPreMedicationAdministered(e.target.checked)} />
              Pre-Medications Administered
            </label>
          </div>
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Verifying Staff Nurse</label>
            <input
              type="text"
              value={verifiedByNurse}
              onChange={(e) => setVerifiedByNurse(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Authorize Clearance to OT'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
