import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodRequestDto, BloodComponentDto, CreateCrossmatchRequest, CrossmatchResult } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: BloodRequestDto | null;
  components: BloodComponentDto[];
  onSubmit: (req: CreateCrossmatchRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateCrossmatchDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  components,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedCompId, setSelectedCompId] = useState(components[0]?.id || '');
  const [major, setMajor] = useState<'COMPATIBLE' | 'INCOMPATIBLE'>('COMPATIBLE');
  const [minor, setMinor] = useState<'COMPATIBLE' | 'INCOMPATIBLE'>('COMPATIBLE');
  const [coombs, setCoombs] = useState<'NEGATIVE' | 'POSITIVE'>('NEGATIVE');
  const [overall, setOverall] = useState<CrossmatchResult>('COMPATIBLE');
  const [tech, setTech] = useState('Samantha Ray, SBB');
  const [pathologist, setPathologist] = useState('Dr. Alistair Vance, MD');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const comp = components.find((c) => c.id === selectedCompId) || components[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comp) return;
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        requestId: request.id,
        componentId: comp.id,
        componentCode: comp.componentCode,
        patientName: request.patientName,
        patientBloodGroup: request.patientBloodGroup,
        donorBloodGroup: comp.bloodGroup,
        majorCrossmatchResult: major,
        minorCrossmatchResult: minor,
        coombsTestResult: coombs,
        overallResult: overall,
        testingTechnicianName: tech,
        verifiedByPathologist: pathologist
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Perform Serological Crossmatch</h2>
        <p className="text-xs text-gray-500 mb-4">{request.requestCode} — Patient: {request.patientName} ({request.patientBloodGroup})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Donor Unit</label>
            <select value={selectedCompId} onChange={(e) => setSelectedCompId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
              {components.map((c) => (
                <option key={c.id} value={c.id}>{c.componentCode} — {c.componentType} ({c.bloodGroup}) - Vol: {c.volumeMl}ml</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Major Crossmatch</label>
              <select value={major} onChange={(e) => setMajor(e.target.value as 'COMPATIBLE' | 'INCOMPATIBLE')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
                <option value="COMPATIBLE">Compatible</option>
                <option value="INCOMPATIBLE">Incompatible</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Minor Crossmatch</label>
              <select value={minor} onChange={(e) => setMinor(e.target.value as 'COMPATIBLE' | 'INCOMPATIBLE')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
                <option value="COMPATIBLE">Compatible</option>
                <option value="INCOMPATIBLE">Incompatible</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Coombs (IAT)</label>
              <select value={coombs} onChange={(e) => setCoombs(e.target.value as 'NEGATIVE' | 'POSITIVE')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
                <option value="NEGATIVE">Negative</option>
                <option value="POSITIVE">Positive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Overall Compatibility Decision</label>
            <select value={overall} onChange={(e) => setOverall(e.target.value as CrossmatchResult)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
              <option value="COMPATIBLE">COMPATIBLE - Cleared for Issue</option>
              <option value="INCOMPATIBLE">INCOMPATIBLE - Strictly Blocked</option>
              <option value="REQUIRES_SENIOR_REVIEW">Requires Senior Pathologist Review</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Testing Technologist</label>
              <Input value={tech} onChange={(e) => setTech(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Verified By Pathologist</label>
              <Input value={pathologist} onChange={(e) => setPathologist(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Sign & Complete Crossmatch'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
