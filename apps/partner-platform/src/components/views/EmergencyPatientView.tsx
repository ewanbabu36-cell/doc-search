import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  encounter: EmergencyEncounterDto | null;
  onBack: () => void;
  onTriage: (enc: EmergencyEncounterDto) => void;
  onDisposition: (enc: EmergencyEncounterDto) => void;
}

export const EmergencyPatientView: React.FC<Props> = ({ encounter, onBack, onTriage, onDisposition }) => {
  if (!encounter) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack}>← Back to Queue</Button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{encounter.patientName} ({encounter.encounterNumber})</h1>
        </div>
        <div className="flex gap-2">
          {!encounter.triageEsiLevel && <Button variant="primary" onClick={() => onTriage(encounter)}>Perform Triage</Button>}
          <Button variant="danger" onClick={() => onDisposition(encounter)}>Authorize Disposition</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Patient & Arrival Profile</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">MRN:</span> <span className="font-semibold text-gray-900">{encounter.patientMrn}</span>
            <span className="text-gray-500">Arrival Mode:</span> <span className="font-semibold text-gray-900">{encounter.arrivalMode}</span>
            <span className="text-gray-500">Brought By:</span> <span className="text-gray-900">{encounter.broughtBy}</span>
            <span className="text-gray-500">Arrival Timestamp:</span> <span className="text-gray-900">{new Date(encounter.arrivalTimestamp).toLocaleTimeString()}</span>
            <span className="text-gray-500">ESI Acuity:</span> <span><Badge variant="danger">{encounter.triageEsiLevel || 'Pending'}</Badge></span>
            <span className="text-gray-500">MLC Case:</span> <span><Badge variant={encounter.isMLC ? 'warning' : 'neutral'}>{encounter.isMLC ? 'YES (MLC)' : 'No'}</Badge></span>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Clinical Complaints & Location</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Chief Complaint:</span> <p className="font-semibold text-gray-900 mt-1">{encounter.chiefComplaint}</p></div>
            <div><span className="text-gray-500">Current Zone / Bed:</span> <p className="text-gray-900">{encounter.currentZoneName || 'Triage'} ({encounter.currentBedNumber || 'No bed'})</p></div>
            <div><span className="text-gray-500">Attending Physician:</span> <p className="text-gray-900">{encounter.assignedPhysicianName || 'Unassigned'}</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
