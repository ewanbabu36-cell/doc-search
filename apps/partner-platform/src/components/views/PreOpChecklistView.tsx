import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { PreOpChecklistDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  checklists: PreOpChecklistDto[];
  schedules: OTScheduleDto[];
  onOpenChecklist: (schedule: OTScheduleDto) => void;
}

export const PreOpChecklistView: React.FC<Props> = ({ checklists, schedules, onOpenChecklist }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pre-Operative Safety Checklists</h1>
        <p className="text-sm text-gray-500">Nursing checklists, site markings, NPO verifications, and pre-medication logs</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Cases Awaiting Checklist Sign-Off</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} — {s.procedureName}</p>
                <p className="text-xs text-gray-500">{s.roomName} • {new Date(s.startTime).toLocaleTimeString()}</p>
              </div>
              <Button variant="primary" onClick={() => onOpenChecklist(s)}>Complete Checklist</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Executed Checklists</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Verified By</th>
              <th className="py-2">Site Marked</th>
              <th className="py-2">NPO Status</th>
              <th className="py-2">Blood Ready</th>
              <th className="py-2">OT Cleared</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {checklists.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-semibold">{c.verifiedByNurse}</td>
                <td className="py-2"><Badge variant={c.surgicalSiteMarked ? 'success' : 'danger'}>{c.surgicalSiteMarked ? 'Yes' : 'No'}</Badge></td>
                <td className="py-2"><Badge variant={c.npoVerified ? 'success' : 'danger'}>{c.npoVerified ? 'Verified' : 'Violation'}</Badge></td>
                <td className="py-2"><Badge variant={c.bloodReservedAndChecked ? 'success' : 'warning'}>{c.bloodReservedAndChecked ? 'Available' : 'Pending'}</Badge></td>
                <td className="py-2"><Badge variant="success">Cleared</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
