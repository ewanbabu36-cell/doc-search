import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { SurgicalSafetyChecklistDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  checklists: SurgicalSafetyChecklistDto[];
  schedules: OTScheduleDto[];
  onOpenSafetyChecklist: (schedule: OTScheduleDto) => void;
}

export const SurgicalSafetyChecklistView: React.FC<Props> = ({ checklists, schedules, onOpenSafetyChecklist }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WHO Surgical Safety Checklist Vault</h1>
        <p className="text-sm text-gray-500">Sign-In, Time-Out, and Sign-Out safety audits for error prevention</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Execute Surgical Safety Checks</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} ({s.procedureName})</p>
                <p className="text-xs text-gray-500">{s.roomName} • Lead: {s.primarySurgeonName}</p>
              </div>
              <Button variant="primary" onClick={() => onOpenSafetyChecklist(s)}>Sign WHO Checklist</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Safety Audit Trail</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Stage</th>
              <th className="py-2">Conducted By</th>
              <th className="py-2">Counts Correct</th>
              <th className="py-2">Site Confirmed</th>
              <th className="py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {checklists.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-bold"><Badge variant={c.stage === 'TIME_OUT' ? 'danger' : 'primary'}>{c.stage}</Badge></td>
                <td className="py-2">{c.conductedBy} ({c.conductedRole})</td>
                <td className="py-2"><Badge variant={c.spongeCountCorrect ? 'success' : 'danger'}>{c.spongeCountCorrect ? '100% Reconciled' : 'Discrepancy'}</Badge></td>
                <td className="py-2"><Badge variant="success">Verified</Badge></td>
                <td className="py-2 text-xs text-gray-500">{new Date(c.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
