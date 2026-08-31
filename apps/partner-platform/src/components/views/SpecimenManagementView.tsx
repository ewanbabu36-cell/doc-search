import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { SurgicalSpecimenDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  specimens: SurgicalSpecimenDto[];
  schedules: OTScheduleDto[];
  onLogSpecimen: (schedule: OTScheduleDto) => void;
}

export const SpecimenManagementView: React.FC<Props> = ({ specimens, schedules, onLogSpecimen }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surgical Specimen & Pathology Handover</h1>
          <p className="text-sm text-gray-500">Excised tissue tracking, formalin fixation, and histopathology transit verification</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Active Surgeries</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} — {s.procedureName}</p>
                <p className="text-xs text-gray-500">{s.roomName}</p>
              </div>
              <Button variant="primary" onClick={() => onLogSpecimen(s)}>+ Log Surgical Specimen</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Specimen Registry</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Specimen #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Origin Site</th>
              <th className="py-2">Investigation</th>
              <th className="py-2">Lab Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {specimens.map(sp => (
              <tr key={sp.id}>
                <td className="py-2 font-bold text-gray-900">{sp.specimenNumber}</td>
                <td className="py-2">{sp.patientName}</td>
                <td className="py-2 font-medium">{sp.anatomicOriginSite}</td>
                <td className="py-2 text-gray-600">{sp.orderedInvestigation}</td>
                <td className="py-2"><Badge variant="success">{sp.labHandoverStatus}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
