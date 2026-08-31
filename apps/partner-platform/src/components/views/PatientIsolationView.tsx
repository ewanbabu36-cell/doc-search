import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { PatientIsolationDto } from '@docsearch/api-contracts';

interface Props {
  isolations: PatientIsolationDto[];
  onAssignIsolation: () => void;
  onDischargeIsolation: (iso: PatientIsolationDto) => void;
}

export const PatientIsolationView: React.FC<Props> = ({ isolations, onAssignIsolation, onDischargeIsolation }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hospital Patient Isolation & Barrier Nursing Management</h2>
          <p className="text-xs text-gray-500">Contact, Droplet, Airborne & Protective precautions tracking for MDRO & contagious pathogens</p>
        </div>
        <Button variant="danger" onClick={onAssignIsolation}>+ Initiate Patient Isolation</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isolations.map((iso) => (
          <Card key={iso.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-gray-900">{iso.isolationCode}</span>
              <Badge variant={iso.precautionType === 'AIRBORNE' ? 'danger' : iso.precautionType === 'CONTACT' ? 'warning' : 'neutral'}>
                {iso.precautionType} PRECAUTIONS
              </Badge>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{iso.patientName} (MRN: {iso.patientMrn})</p>
              <p className="text-xs text-gray-600 mt-1">📍 {iso.departmentName} - <strong>{iso.roomBedNumber}</strong></p>
              <p className="text-xs text-red-700 mt-1"><strong>Pathogen:</strong> {iso.indicatedReasonOrPathogen}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="text-gray-500">Initiated: {iso.startDate}</p>
              <p className="text-gray-500">Nurse Lead: {iso.assignedNurseLead}</p>
            </div>
            <div className="pt-2 border-t flex justify-end">
              {iso.isActive ? (
                <Button variant="outline" size="sm" onClick={() => onDischargeIsolation(iso)}>Discontinue Isolation</Button>
              ) : (
                <Badge variant="success">Discontinued</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
