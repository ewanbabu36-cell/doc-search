import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, CreateAmbulanceTransferRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: CreateAmbulanceTransferRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateAmbulanceTransferDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [ambulance, setAmbulance] = useState('EMS-MEDIC-08');
  const [type, setType] = useState<'INBOUND_RECEIVAL' | 'OUTBOUND_INTER_FACILITY'>('OUTBOUND_INTER_FACILITY');
  const [sending, setSending] = useState('Apex Emergency Department');
  const [receiving, setReceiving] = useState('Apex Regional Super Specialty Hospital');
  const [paramedic, setParamedic] = useState('Paramedic Rajesh Kumar');
  const [reason, setReason] = useState('Need for emergent neuro-interventional thrombectomy');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !encounter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        encounterId: encounter.id,
        patientName: encounter.patientName,
        ambulanceNumber: ambulance,
        transportType: type,
        sendingFacility: sending,
        receivingFacility: receiving,
        accompanyingParamedic: paramedic,
        transferReason: reason
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ambulance Dispatch & Inter-Facility Transfer</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} ({encounter.patientMrn})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ambulance Vehicle #</label>
              <Input value={ambulance} onChange={(e) => setAmbulance(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transfer Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as 'INBOUND_RECEIVAL' | 'OUTBOUND_INTER_FACILITY')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="OUTBOUND_INTER_FACILITY">Outbound Inter-Facility Transfer</option>
                <option value="INBOUND_RECEIVAL">Inbound Hospital Receival</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Origin Facility</label>
              <Input value={sending} onChange={(e) => setSending(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Facility</label>
              <Input value={receiving} onChange={(e) => setReceiving(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Accompanying Paramedic</label>
            <Input value={paramedic} onChange={(e) => setParamedic(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Transfer Rationale</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Dispatching...' : 'Dispatch Transfer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
