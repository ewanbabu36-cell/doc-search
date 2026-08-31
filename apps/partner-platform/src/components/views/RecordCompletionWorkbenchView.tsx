import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { MedicalRecordCompletionTaskDto } from '@docsearch/api-contracts';

interface Props {
  tasks: MedicalRecordCompletionTaskDto[];
  onCompleteTask: (task: MedicalRecordCompletionTaskDto) => void;
}

export const RecordCompletionWorkbenchView: React.FC<Props> = ({ tasks, onCompleteTask }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Record Completion & Deficiency Workbench</h2>
        <p className="text-xs text-gray-500">Track and resolve missing signatures, operative notes, and incomplete discharge summaries</p>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-3">Task Code</th>
              <th className="p-3">Deficiency Type</th>
              <th className="p-3">Responsible Clinician</th>
              <th className="p-3">Description</th>
              <th className="p-3">Deadline</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-amber-700">{t.taskCode}</td>
                <td className="p-3 font-semibold text-gray-900">{t.deficiencyType}</td>
                <td className="p-3 text-gray-700">{t.responsibleStaffName} ({t.responsibleStaffRole})</td>
                <td className="p-3 text-gray-600">{t.description}</td>
                <td className="p-3 text-gray-500">{new Date(t.dueDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <Badge variant={t.isResolved ? 'success' : 'danger'}>
                    {t.isResolved ? 'RESOLVED' : 'PENDING'}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  {!t.isResolved && (
                    <Button size="sm" variant="primary" onClick={() => onCompleteTask(t)}>Mark Resolved</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
