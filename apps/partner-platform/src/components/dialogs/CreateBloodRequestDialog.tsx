import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateBloodRequestRequest, BloodComponentType, TransfusionBloodGroup, BloodRequestUrgency } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateBloodRequestRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateBloodRequestDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patName, setPatName] = useState('David K. Miller');
  const [mrn, setMrn] = useState('MRN-772101');
  const [dept, setDept] = useState('Emergency & Trauma Resuscitation');
  const [doctor, setDoctor] = useState('Dr. Evelyn Reed, MD');
  const [comp, setComp] = useState<BloodComponentType>('PACKED_RED_BLOOD_CELLS_PRBC');
  const [bloodGroup, setBloodGroup] = useState<TransfusionBloodGroup>('O_NEGATIVE');
  const [qty, setQty] = useState('2');
  const [urgency, setUrgency] = useState<BloodRequestUrgency>('STAT_EMERGENCY_IMMEDIATE');
  const [indication, setIndication] = useState('Massive internal hemorrhage secondary to polytrauma.');
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
        patientId: 'pat-emg-101',
        patientName: patName,
        patientMrn: mrn,
        encounterId: 'ee-001',
        requestingDepartment: dept,
        orderingPhysicianName: doctor,
        requestedComponentType: comp,
        patientBloodGroup: bloodGroup,
        quantityUnits: parseInt(qty) || 1,
        urgency,
        clinicalIndication: indication,
        requiredByTimestamp: new Date(Date.now() + 3600000).toISOString()
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Create Clinical Blood Requisition</h2>
        <p className="text-xs text-gray-500 mb-4">Request crossmatch and blood components from blood bank</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patName} onChange={(e) => setPatName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={mrn} onChange={(e) => setMrn(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Requesting Ward/Dept</label>
              <Input value={dept} onChange={(e) => setDept(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ordering Physician</label>
              <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as TransfusionBloodGroup)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="O_POSITIVE">O Positive</option>
                <option value="O_NEGATIVE">O Negative</option>
                <option value="A_POSITIVE">A Positive</option>
                <option value="A_NEGATIVE">A Negative</option>
                <option value="B_POSITIVE">B Positive</option>
                <option value="B_NEGATIVE">B Negative</option>
                <option value="AB_POSITIVE">AB Positive</option>
                <option value="AB_NEGATIVE">AB Negative</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Component</label>
              <select value={comp} onChange={(e) => setComp(e.target.value as BloodComponentType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="PACKED_RED_BLOOD_CELLS_PRBC">PRBC</option>
                <option value="RANDOM_DONOR_PLATELETS_RDP">Platelets</option>
                <option value="FRESH_FROZEN_PLASMA_FFP">FFP</option>
                <option value="CRYOPRECIPITATE">Cryo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Units Quantity</label>
              <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Urgency</label>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value as BloodRequestUrgency)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold text-red-800">
                <option value="STAT_EMERGENCY_IMMEDIATE">STAT / Emergency</option>
                <option value="URGENT_WITHIN_2_HOURS">Urgent (&lt; 2 Hours)</option>
                <option value="ROUTINE_SCHEDULED_OT">Routine Scheduled OT</option>
                <option value="STANDBY_RESERVATION">Standby Reservation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Indication</label>
              <Input value={indication} onChange={(e) => setIndication(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Ordering...' : 'Submit Blood Request'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
