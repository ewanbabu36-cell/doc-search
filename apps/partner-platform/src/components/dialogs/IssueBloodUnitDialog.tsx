import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodRequestDto, BloodComponentDto, IssueBloodUnitRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: BloodRequestDto | null;
  component: BloodComponentDto | null;
  onSubmit: (req: IssueBloodUnitRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const IssueBloodUnitDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  component,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [tech, setTech] = useState('Samantha Ray, SBB');
  const [nurse, setNurse] = useState('Nurse Mark Hopkins, RN');
  const [dept, setDept] = useState(request?.requestingDepartment || 'Emergency Resuscitation');
  const [temp, setTemp] = useState('4.2°C');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request || !component) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        requestId: request.id,
        componentId: component.id,
        componentCode: component.componentCode,
        patientName: request.patientName,
        patientMrn: request.patientMrn,
        destinationDepartment: dept,
        issuingTechnicianName: tech,
        receivingNurseName: nurse,
        transportBoxTemperatureC: temp
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Controlled Blood Dispatch & Issue</h2>
        <p className="text-xs text-gray-500 mb-4">{component.componentCode} ({component.bloodGroup}) → {request.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Dept</label>
              <Input value={dept} onChange={(e) => setDept(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transport Box Temp</label>
              <Input value={temp} onChange={(e) => setTemp(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Issuing Blood Bank Tech</label>
              <Input value={tech} onChange={(e) => setTech(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Receiving Clinical Staff</label>
              <Input value={nurse} onChange={(e) => setNurse(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Issuing...' : 'Authorize Dispatch & Issue'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
