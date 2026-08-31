import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { NeedleStickOccupationalLogDto } from '@docsearch/api-contracts';

interface Props {
  logs: NeedleStickOccupationalLogDto[];
  onRecordLog: () => void;
}

export const NeedleStickPepView: React.FC<Props> = ({ logs, onRecordLog }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Needle Stick & Occupational Post-Exposure Prophylaxis (PEP)</h2>
          <p className="text-xs text-gray-500">Golden hour starter pack tracking, source viral status, and 6w/3m/6m serology surveillance</p>
        </div>
        <Button variant="danger" onClick={onRecordLog}>🚨 Initiate PEP Protocol</Button>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-gray-900">{log.incidentCode}</span>
              <Badge variant="success">Golden Hour PEP Initiated</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-gray-800">{log.exposedStaffName} ({log.staffRole})</p>
                <p className="text-gray-500">{log.departmentName} | {log.exposureDateTime.replace('T', ' ').substring(0, 16)}</p>
                <p className="text-gray-700 mt-1 font-semibold">PEP: {log.pepRegimenDetails}</p>
              </div>
              <div>
                <p className="text-gray-600"><strong>Source Patient Serology:</strong></p>
                <p className="text-gray-500">HIV: {log.sourcePatientHivStatus} | HBsAg: {log.sourcePatientHbsAgStatus} | HCV: {log.sourcePatientHcvStatus}</p>
                <p className="text-red-700 font-semibold mt-1">Next Follow-up Due: {log.followUpSerologyDue}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
