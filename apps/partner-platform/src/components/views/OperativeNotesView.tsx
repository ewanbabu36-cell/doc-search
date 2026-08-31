import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { OperativeNoteDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  notes: OperativeNoteDto[];
  schedules: OTScheduleDto[];
  onDraftNote: (schedule: OTScheduleDto) => void;
  onFinalizeNote: (note: OperativeNoteDto) => void;
}

export const OperativeNotesView: React.FC<Props> = ({ notes, schedules, onDraftNote, onFinalizeNote }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operative Notes & Documentation</h1>
          <p className="text-sm text-gray-500">Detailed surgical notes, operative techniques, and consultant signature vault</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Draft New Operative Note</h2>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} ({s.procedureName})</p>
                <p className="text-xs text-gray-500">Lead Surgeon: {s.primarySurgeonName}</p>
              </div>
              <Button variant="primary" onClick={() => onDraftNote(s)}>Draft Operative Note</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Operative Notes Registry</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Note #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Surgeon</th>
              <th className="py-2">Procedure</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {notes.map(n => (
              <tr key={n.id}>
                <td className="py-2 font-bold text-gray-900">{n.noteNumber}</td>
                <td className="py-2">{n.patientName}</td>
                <td className="py-2">{n.primarySurgeonName}</td>
                <td className="py-2">{n.procedurePerformedTitle}</td>
                <td className="py-2"><Badge variant={n.isFinalized ? 'success' : 'warning'}>{n.isFinalized ? 'Signed & Final' : 'Draft'}</Badge></td>
                <td className="py-2 text-right">
                  {!n.isFinalized && (
                    <Button variant="primary" onClick={() => onFinalizeNote(n)}>Finalize & Seal</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
