import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { PpmScheduleDto } from '@docsearch/api-contracts';

interface Props {
  schedules: PpmScheduleDto[];
  onCreateSchedule: () => void;
  onCompletePpm: (schedule: PpmScheduleDto) => void;
}

export const PpmScheduleBoardView: React.FC<Props> = ({ schedules, onCreateSchedule, onCompletePpm }) => {
  const overdueSchedules = schedules.filter((s) => s.status === 'OVERDUE');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Planned Preventive Maintenance (PPM) Scheduler</h2>
          <p className="text-xs text-gray-500">Statutory and manufacturer-mandated maintenance cycles, calibration & checklists</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onCreateSchedule}>+ Schedule PPM Task</Button>
        </div>
      </div>

      {/* Statutory PPM Hard Gate Alert Banner */}
      {overdueSchedules.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
              <span>⛔</span> NABH / AERB Statutory PPM Hard-Gate Lockout Active ({overdueSchedules.length} Device Overdue)
            </span>
            <Badge variant="danger">CLINICAL ALLOCATION QUARANTINED</Badge>
          </div>
          <p className="text-[11px] text-red-700">
            The following equipment has breached statutory calibration/PPM due dates. Automated Hard-Gate has quarantined these units from OT and ICU bed allocation grids until physical calibration pass sign-off:
          </p>
          <div className="flex gap-2 pt-1 flex-wrap">
            {overdueSchedules.map((s) => (
              <span key={s.id} className="text-[11px] px-2 py-0.5 bg-red-200 text-red-900 rounded font-semibold border border-red-300">
                {s.assetName} ({s.assetCode}) - Due: {s.scheduledDueDate}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((schedule) => {
          const isOverdue = schedule.status === 'OVERDUE';
          return (
            <Card
              key={schedule.id}
              className={`p-4 space-y-3 transition-all ${
                isOverdue ? 'border-red-300 bg-red-50/40 ring-1 ring-red-400' : ''
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="text-xs font-bold text-gray-900">{schedule.scheduleCode}</span>
                  <span className="text-xs text-gray-500 block">{schedule.frequency}</span>
                </div>
                <Badge variant={schedule.status === 'COMPLETED_PASS' ? 'success' : isOverdue ? 'danger' : 'warning'}>
                  {isOverdue ? '⛔ OVERDUE - QUARANTINED' : schedule.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{schedule.assetName}</p>
                <p className="text-xs text-gray-500">Tag: {schedule.assetCode} | {schedule.departmentName}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
                <p className={`font-semibold ${isOverdue ? 'text-red-700' : 'text-gray-700'}`}>
                  Due Date: {schedule.scheduledDueDate} {isOverdue && '(Breached)'}
                </p>
                <p className="text-gray-600">Assigned: {schedule.assignedEngineer}</p>
                <p className="text-gray-500 text-[11px] mt-1">{schedule.tasksChecklist.length} inspection tasks in checklist</p>
              </div>
              {schedule.servicingNotes && (
                <p className={`text-xs p-2 rounded ${isOverdue ? 'bg-red-100 text-red-900 font-medium' : 'bg-green-50 text-gray-600 italic'}`}>
                  {schedule.servicingNotes}
                </p>
              )}
              <div className="pt-2 border-t flex justify-end">
                {schedule.status !== 'COMPLETED_PASS' ? (
                  <Button
                    variant={isOverdue ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => onCompletePpm(schedule)}
                  >
                    {isOverdue ? '🛠️ Perform & Clear Hard Gate' : 'Sign & Complete PPM'}
                  </Button>
                ) : (
                  <Badge variant="success">Completed on {schedule.completedDate}</Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
