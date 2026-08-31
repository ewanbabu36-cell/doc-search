import React from 'react';
import { Card, Button } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  encounters: EmergencyEncounterDto[];
  onOpenProcedureDialog: (enc: EmergencyEncounterDto) => void;
}

export const EmergencyProcedureView: React.FC<Props> = ({ encounters, onOpenProcedureDialog }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Procedures & Interventions</h1>
        <p className="text-sm text-gray-500">Airway intubation, central venous access, chest tube thoracostomy, wound debridement, and splinting</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Active Patients Requiring Procedures</h2>
        <div className="space-y-2">
          {encounters.map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{e.patientName} ({e.patientMrn})</p>
                <p className="text-xs text-gray-600">{e.chiefComplaint} • Zone: {e.currentZoneName || 'Triage'}</p>
              </div>
              <Button variant="primary" onClick={() => onOpenProcedureDialog(e)}>+ Log Bedside Procedure</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
