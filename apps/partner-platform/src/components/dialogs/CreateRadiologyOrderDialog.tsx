import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type {
  CreateRadiologyOrderRequest,
  RadiologyProcedureCatalogDto,
  RadiologyPriority
} from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  procedures: RadiologyProcedureCatalogDto[];
  onSubmit: (req: CreateRadiologyOrderRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateRadiologyOrderDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  procedures,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patientName, setPatientName] = useState('Arthur Pendelton');
  const [patientMrn, setPatientMrn] = useState('MRN-849102');
  const [patientId] = useState('pat-991');
  const [encounterId] = useState('enc-881');
  const [doctor, setDoctor] = useState('Dr. Meredith Grey, MD');
  const [dept, setDept] = useState('Emergency Department (Trauma)');
  const [selectedProcId, setSelectedProcId] = useState(procedures[0]?.id || '');
  const [priority, setPriority] = useState<RadiologyPriority>('ROUTINE_ELECTIVE');
  const [indication, setIndication] = useState('Rule out acute fracture vs ligamentous tear.');
  const [pregnancy, setPregnancy] = useState('NEGATIVE');
  const [egfr, setEgfr] = useState('92 mL/min/1.73m2 (Normal)');
  const [allergies, setAllergies] = useState('NKDA');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentProc = procedures.find((p) => p.id === selectedProcId) || procedures[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProc) return;
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId,
        patientName,
        patientMrn,
        encounterId,
        orderingDoctorName: doctor,
        orderingDepartment: dept,
        procedureId: currentProc.id,
        procedureName: currentProc.procedureName,
        modalityType: currentProc.modalityType,
        priority,
        clinicalIndication: indication,
        requiresContrast: currentProc.requiresContrast,
        pregnancyScreeningResult: pregnancy,
        renalEgfrResult: egfr,
        knownAllergies: allergies
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Create Clinical Radiology Order</h2>
        <p className="text-xs text-gray-500 mb-4">Request imaging study, specify clinical indication & safety screenings</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ordering Doctor</label>
              <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ordering Department</label>
              <Input value={dept} onChange={(e) => setDept(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Imaging Procedure</label>
            <select
              value={selectedProcId}
              onChange={(e) => setSelectedProcId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
            >
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.modalityType.split('_')[0]}] {p.procedureName} — ${p.priceAmount}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RadiologyPriority)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ROUTINE_ELECTIVE">Routine Elective</option>
                <option value="URGENT_WITHIN_4_HOURS">Urgent (Within 4h)</option>
                <option value="STAT_EMERGENCY_IMMEDIATE">STAT Emergency (Immediate)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pregnancy Status</label>
              <Input value={pregnancy} onChange={(e) => setPregnancy(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">eGFR / Renal Risk</label>
              <Input value={egfr} onChange={(e) => setEgfr(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Known Allergies</label>
              <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Indication & History</label>
            <Input value={indication} onChange={(e) => setIndication(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Submit Order'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
