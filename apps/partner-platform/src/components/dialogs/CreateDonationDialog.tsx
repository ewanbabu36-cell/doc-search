import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodDonorDto, CreateDonationRequest, DonorType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  donor: BloodDonorDto | null;
  onSubmit: (req: CreateDonationRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateDonationDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  donor,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [vol, setVol] = useState('450');
  const [anticoagulant, setAnticoagulant] = useState('CPDA-1 (63ml)');
  const [phleb, setPhleb] = useState('Marcus Miller, CPT');
  const [loc, setLoc] = useState('Main Donation Suite Chair #2');
  const [donationType, setDonationType] = useState<DonorType>(donor?.donorType || 'VOLUNTARY_NON_REMUNERATED');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !donor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        donorId: donor.id,
        donorName: donor.fullName,
        bloodGroup: donor.bloodGroup,
        donationType,
        collectedVolumeMl: parseInt(vol) || 450,
        anticoagulantType: anticoagulant,
        phlebotomistName: phleb,
        collectionLocation: loc
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Initiate Blood Collection / Phlebotomy</h2>
        <p className="text-xs text-gray-500 mb-4">{donor.donorCode} — {donor.fullName} ({donor.bloodGroup})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Collection Volume (mL)</label>
              <Input type="number" value={vol} onChange={(e) => setVol(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Anticoagulant Preservative</label>
              <Input value={anticoagulant} onChange={(e) => setAnticoagulant(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Certified Phlebotomist</label>
              <Input value={phleb} onChange={(e) => setPhleb(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Collection Chair / Location</label>
              <Input value={loc} onChange={(e) => setLoc(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Donation Type</label>
            <select value={donationType} onChange={(e) => setDonationType(e.target.value as DonorType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="VOLUNTARY_NON_REMUNERATED">Voluntary Non-Remunerated</option>
              <option value="REPLACEMENT_FAMILY">Replacement Family</option>
              <option value="DIRECTED_PATIENT_SPECIFIC">Directed Patient Specific</option>
              <option value="AUTOLOGOUS_PRE_OP">Autologous Pre-Op</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Collecting...' : 'Register Collection'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
