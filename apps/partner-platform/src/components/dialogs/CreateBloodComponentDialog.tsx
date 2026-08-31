import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodDonationDto, CreateComponentRequest, BloodComponentType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  donation: BloodDonationDto | null;
  onSubmit: (req: CreateComponentRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateBloodComponentDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  donation,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [componentType, setComponentType] = useState<BloodComponentType>('PACKED_RED_BLOOD_CELLS_PRBC');
  const [vol, setVol] = useState('280');
  const [loc, setLoc] = useState('Blood Refrigerator #1 (PRBC)');
  const [tech, setTech] = useState('Samantha Ray, SBB');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !donation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        donationId: donation.id,
        componentType,
        bloodGroup: donation.bloodGroup,
        volumeMl: parseInt(vol) || 280,
        storageLocation: loc,
        preparedByTechnician: tech
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Component Separation & Preparation</h2>
        <p className="text-xs text-gray-500 mb-4">Parent Unit: {donation.donationNumber} ({donation.bloodGroup})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Component</label>
            <select value={componentType} onChange={(e) => setComponentType(e.target.value as BloodComponentType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
              <option value="PACKED_RED_BLOOD_CELLS_PRBC">Packed Red Blood Cells (PRBC)</option>
              <option value="RANDOM_DONOR_PLATELETS_RDP">Random Donor Platelets (RDP)</option>
              <option value="SINGLE_DONOR_PLATELETS_SDP">Single Donor Platelets (SDP)</option>
              <option value="FRESH_FROZEN_PLASMA_FFP">Fresh Frozen Plasma (FFP)</option>
              <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
              <option value="LEUKOREDUCED_PRBC">Leukoreduced PRBC</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Yield Volume (mL)</label>
              <Input type="number" value={vol} onChange={(e) => setVol(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Storage Location</label>
              <Input value={loc} onChange={(e) => setLoc(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Preparation Technologist</label>
            <Input value={tech} onChange={(e) => setTech(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Preparing...' : 'Create Component Unit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
