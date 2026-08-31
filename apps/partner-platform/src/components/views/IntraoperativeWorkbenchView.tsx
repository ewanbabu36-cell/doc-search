import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { IntraoperativeRecordDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  records: IntraoperativeRecordDto[];
  schedules: OTScheduleDto[];
  onCompleteSurgery: (schedule: OTScheduleDto) => void;
}

export const IntraoperativeWorkbenchView: React.FC<Props> = ({ records, schedules, onCompleteSurgery }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Intraoperative Surgical Workbench</h1>
        <p className="text-sm text-gray-500">Live procedure tracking, surgical counts verification, and wound closure logging</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map(r => {
          const sched = schedules.find(s => s.id === r.scheduleId) || schedules[0];
          return (
            <Card key={r.id} className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-base text-gray-900">{r.procedureName}</span>
                <Badge variant={r.status === 'IN_PROGRESS' ? 'danger' : 'success'}>{r.status}</Badge>
              </div>
              <p className="text-xs text-gray-600">Patient: <strong>{r.patientName}</strong> | Surgeon: <strong>{r.primarySurgeon}</strong></p>
              <div className="text-xs p-3 rounded bg-gray-50 border space-y-1">
                <div><span className="text-gray-500">Incision Time:</span> <strong>{new Date(r.incisionTime).toLocaleTimeString()}</strong></div>
                <div><span className="text-gray-500">Surgical Approach:</span> <span>{r.surgicalApproach}</span></div>
                <div><span className="text-gray-500">Findings:</span> <span>{r.intraoperativeFindings}</span></div>
              </div>
              {sched && r.status === 'IN_PROGRESS' && (
                <div className="flex justify-end pt-2">
                  <Button variant="primary" onClick={() => onCompleteSurgery(sched)}>Complete Surgery & Close</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
