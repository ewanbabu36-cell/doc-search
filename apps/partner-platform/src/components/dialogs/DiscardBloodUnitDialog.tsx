import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodComponentDto, DiscardBloodUnitRequest, DiscardReason } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unit: BloodComponentDto | null;
  onSubmit: (req: DiscardBloodUnitRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const DiscardBloodUnitDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  unit,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [reason, setReason] = useState<DiscardReason>('EXPIRATION_DATE_EXCEEDED');
  const [pathologist, setPathologist] = useState('Dr. Alistair Vance, MD');
  const [method, setMethod] = useState('Autoclave sterilization & regulated biohazard incineration');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !unit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        componentCode: unit.componentCode,
        componentType: unit.componentType,
        bloodGroup: unit.bloodGroup,
        reason,
        authorizedByPathologist: pathologist,
        disposalMethod: method
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-red-900 mb-2">Authorize Biohazard Blood Discard</h2>
        <p className="text-xs text-gray-500 mb-4">{unit.componentCode} ({unit.bloodGroup}) — {unit.componentType}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Discard Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value as DiscardReason)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
              <option value="EXPIRATION_DATE_EXCEEDED">Expiration Date Exceeded</option>
              <option value="INFECTIOUS_DISEASE_SEROPOSITIVE">Infectious Disease Seropositive</option>
              <option value="HEMOLYSIS_OR_CLOT_NOTED">Hemolysis or Clot Noted</option>
              <option value="COLD_CHAIN_TEMPERATURE_EXCURSION">Cold Chain Temperature Excursion</option>
              <option value="BAG_LEAK_OR_PHYSICAL_DAMAGE">Bag Leak or Physical Damage</option>
              <option value="UNSATISFACTORY_COMPONENT_YIELD">Unsatisfactory Component Yield</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorized Pathologist</label>
            <Input value={pathologist} onChange={(e) => setPathologist(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Disposal Method</label>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Discarding...' : 'Authorize & Log Discard'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
