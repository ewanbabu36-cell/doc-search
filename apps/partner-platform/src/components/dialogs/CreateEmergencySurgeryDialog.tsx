import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateEmergencySurgeryRequest, OperationTheatreRoomDto, SurgicalSpecialty } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rooms: OperationTheatreRoomDto[];
  onSubmit: (req: CreateEmergencySurgeryRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateEmergencySurgeryDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  rooms,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [procedureName, setProcedureName] = useState('Emergency Exploratory Laparotomy');
  const [specialty, setSpecialty] = useState<SurgicalSpecialty>('GENERAL_SURGERY');
  const [primarySurgeon, setPrimarySurgeon] = useState('Dr. Arthur Vance, MS');
  const [leadAnaesthetist, setLeadAnaesthetist] = useState('Dr. Christopher Nolan, MD');
  const [roomId, setRoomId] = useState(rooms[0]?.id || '');
  const [preOpDiagnosis, setPreOpDiagnosis] = useState('Blunt Trauma Abdomen with Hemoperitoneum');
  const [emergencyIndication, setEmergencyIndication] = useState('Hemodynamic instability with acute splenic laceration');
  const [authorizedBy, setAuthorizedBy] = useState('Dr. Arthur Vance (Chief of Surgery)');
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
        patientId: 'pat-emg-' + Math.random().toString(36).substring(2, 7),
        patientName,
        patientMrn,
        primarySurgeonName: primarySurgeon,
        leadAnaesthetistName: leadAnaesthetist,
        procedureName,
        specialty,
        roomId: roomId || rooms[0]?.id || '',
        preOperativeDiagnosis: preOpDiagnosis,
        emergencyIndication,
        emergencyAuthorizationBy: authorizedBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border-4 border-red-500">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🚨</span>
          <h2 className="text-xl font-bold text-red-700">Emergency Surgery Fast-Track Insertion</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">Stat emergency override bypasses elective queue with mandatory surgical audit.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Unknown Male / Trauma" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">MRN / Emergency ID</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. EMG-2026-09" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Procedure</label>
            <Input value={procedureName} onChange={(e) => setProcedureName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Surgical Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value as SurgicalSpecialty)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="GENERAL_SURGERY">General Surgery</option>
                <option value="ORTHOPAEDICS">Orthopaedics</option>
                <option value="CARDIOTHORACIC">Cardiothoracic</option>
                <option value="NEUROSURGERY">Neurosurgery</option>
                <option value="OBSTETRICS_GYNECOLOGY">Obstetrics</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target OT Suite</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.roomName} ({r.roomNumber})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Trauma Surgeon</label>
              <Input value={primarySurgeon} onChange={(e) => setPrimarySurgeon(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Anaesthetist</label>
              <Input value={leadAnaesthetist} onChange={(e) => setLeadAnaesthetist(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-Operative Diagnosis</label>
            <Input value={preOpDiagnosis} onChange={(e) => setPreOpDiagnosis(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Life-Threatening Indication</label>
            <Input value={emergencyIndication} onChange={(e) => setEmergencyIndication(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Authorization By</label>
            <Input value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Deploying...' : 'Deploy Emergency OT Team'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
