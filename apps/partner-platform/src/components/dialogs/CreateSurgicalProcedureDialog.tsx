import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateSurgicalProcedureRequest, SurgicalSpecialty, ProcedureCategory, AnaesthesiaType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateSurgicalProcedureRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateSurgicalProcedureDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [procedureCode, setProcedureCode] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [specialty, setSpecialty] = useState<SurgicalSpecialty>('GENERAL_SURGERY');
  const [category, setCategory] = useState<ProcedureCategory>('ELECTIVE');
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState('60');
  const [recommendedAnaesthesia, setRecommendedAnaesthesia] = useState<AnaesthesiaType>('GENERAL_ANAESTHESIA');
  const [baseProcedureCharge, setBaseProcedureCharge] = useState('35000');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        procedureCode,
        procedureName,
        specialty,
        category,
        defaultDurationMinutes: parseInt(defaultDurationMinutes) || 60,
        recommendedAnaesthesia,
        requiresImplant: false,
        requiresBloodCrossmatch: false,
        requiresICUStay: false,
        baseProcedureCharge: parseFloat(baseProcedureCharge) || 35000
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Surgical Procedure</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Procedure Code</label>
              <Input value={procedureCode} onChange={(e) => setProcedureCode(e.target.value)} placeholder="e.g. PRC-HERNIA" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value as SurgicalSpecialty)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="GENERAL_SURGERY">General Surgery</option>
                <option value="ORTHOPAEDICS">Orthopaedics</option>
                <option value="CARDIOTHORACIC">Cardiothoracic</option>
                <option value="NEUROSURGERY">Neurosurgery</option>
                <option value="OBSTETRICS_GYNECOLOGY">Obstetrics & Gynaecology</option>
                <option value="UROLOGY">Urology</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Procedure Name</label>
            <Input value={procedureName} onChange={(e) => setProcedureName(e.target.value)} placeholder="e.g. Open Inguinal Hernioplasty" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProcedureCategory)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ELECTIVE">Elective</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="DAY_CARE">Day Care</option>
                <option value="MAJOR_PROCEDURE">Major Procedure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Est. Duration (Min)</label>
              <Input type="number" value={defaultDurationMinutes} onChange={(e) => setDefaultDurationMinutes(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Recommended Anaesthesia</label>
              <select
                value={recommendedAnaesthesia}
                onChange={(e) => setRecommendedAnaesthesia(e.target.value as AnaesthesiaType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="GENERAL_ANAESTHESIA">General Anaesthesia</option>
                <option value="SPINAL_ANAESTHESIA">Spinal Anaesthesia</option>
                <option value="EPIDURAL_ANAESTHESIA">Epidural Anaesthesia</option>
                <option value="LOCAL_ANAESTHESIA">Local Anaesthesia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Base Charge (₹)</label>
              <Input type="number" value={baseProcedureCharge} onChange={(e) => setBaseProcedureCharge(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Procedure'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
