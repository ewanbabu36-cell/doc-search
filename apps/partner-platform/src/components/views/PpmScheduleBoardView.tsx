import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { PpmScheduleDto } from '@docsearch/api-contracts';

interface Props {
  schedules: PpmScheduleDto[];
  onCreateSchedule: () => void;
  onCompletePpm: (schedule: PpmScheduleDto) => void;
}

export const PpmScheduleBoardView: React.FC<Props> = ({ schedules, onCreateSchedule, onCompletePpm }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Planned Preventive Maintenance (PPM) Scheduler</h2>
          <p className="text-xs text-gray-500">Statutory and manufacturer-mandated maintenance cycles & checklists</p>
        </div>
        <Button variant="primary" onClick={onCreateSchedule}>+ Schedule PPM Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <span className="text-xs font-bold text-gray-900">{schedule.scheduleCode}</span>
                <span className="text-xs text-gray-500 block">{schedule.frequency}</span>
              </div>
              <Badge variant={schedule.status === 'COMPLETED_PASS' ? 'success' : schedule.status === 'OVERDUE' ? 'danger' : 'warning'}>
                {schedule.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{schedule.assetName}</p>
              <p className="text-xs text-gray-500">Tag: {schedule.assetCode} | {schedule.departmentName}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-gray-700">Due Date: {schedule.scheduledDueDate}</p>
              <p className="text-gray-600">Assigned: {schedule.assignedEngineer}</p>
              <p className="text-gray-500 text-[11px] mt-1">{schedule.tasksChecklist.length} inspection tasks in checklist</p>
            </div>
            {schedule.servicingNotes && (
              <p className="text-xs text-gray-600 italic bg-green-50 p-2 rounded">
                Notes: {schedule.servicingNotes}
              </p>
            )}
            <div className="pt-2 border-t flex justify-end">
              {schedule.status !== 'COMPLETED_PASS' ? (
                <Button variant="primary" size="sm" onClick={() => onCompletePpm(schedule)}>Sign & Complete PPM</Button>
              ) : (
                <Badge variant="success">Completed on {schedule.completedDate}</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
