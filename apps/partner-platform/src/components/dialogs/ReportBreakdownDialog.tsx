import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, CreateWorkOrderRequest, WorkOrderPriority } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  assets: BiomedicalAssetDto[];
  onClose: () => void;
  onSubmit: (data: CreateWorkOrderRequest) => Promise<void>;
}

export const ReportBreakdownDialog: React.FC<Props> = ({ isOpen, assets, onClose, onSubmit }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [problemDescription, setProblemDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('URGENT');
  const [clinicalImpactLevel, setClinicalImpactLevel] = useState<'CRITICAL_PATIENT_SAFETY' | 'PROCEDURE_HALTED' | 'SUB_OPTIMAL_BACKUP_AVAILABLE' | 'ROUTINE_NO_IMPACT'>('PROCEDURE_HALTED');
  const [reportedByClinician, setReportedByClinician] = useState('Dr. Vivek Mehra (Surgeon)');
  const [departmentName, setDepartmentName] = useState('Operation Theatre Complex');
  const [roomBedLocation, setRoomBedLocation] = useState('OT Room 02');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: selectedAssetId,
        problemDescription,
        priority,
        clinicalImpactLevel,
        reportedByClinician,
        departmentName,
        roomBedLocation
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-red-700">🚨 Log Equipment Breakdown / Work Order</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Malfunctioning Equipment</label>
            <Select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                const a = assets.find((x) => x.id === e.target.value);
                if (a) {
                  setDepartmentName(a.departmentName);
                  setRoomBedLocation(a.physicalLocation);
                }
              }}
              options={assets.map((a) => ({ value: a.id, label: `${a.assetCode} - ${a.assetName} (${a.departmentName})` }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Problem Description / Error Codes</label>
            <Input value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} placeholder="Describe symptoms, alarms, error codes..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Urgency Priority</label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                options={[
                  { value: 'EMERGENCY_STAT', label: '🚨 STAT Emergency (Patient on Table)' },
                  { value: 'URGENT', label: '⚠️ Urgent (Critical Ward / ICU)' },
                  { value: 'ROUTINE', label: 'Routine (Non-critical)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Impact</label>
              <Select
                value={clinicalImpactLevel}
                onChange={(e) => setClinicalImpactLevel(e.target.value as 'CRITICAL_PATIENT_SAFETY' | 'PROCEDURE_HALTED' | 'SUB_OPTIMAL_BACKUP_AVAILABLE' | 'ROUTINE_NO_IMPACT')}
                options={[
                  { value: 'CRITICAL_PATIENT_SAFETY', label: 'Critical Patient Safety Threat' },
                  { value: 'PROCEDURE_HALTED', label: 'Surgical Procedure Halted' },
                  { value: 'SUB_OPTIMAL_BACKUP_AVAILABLE', label: 'Backup Equipment Active' },
                  { value: 'ROUTINE_NO_IMPACT', label: 'Routine No Direct Impact' }
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reporting Clinician / Staff</label>
              <Input value={reportedByClinician} onChange={(e) => setReportedByClinician(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
              <Input value={roomBedLocation} onChange={(e) => setRoomBedLocation(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Dispatch Breakdown Ticket'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
