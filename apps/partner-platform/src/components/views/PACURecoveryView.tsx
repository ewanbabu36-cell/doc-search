import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { PACURecoveryRecordDto, OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  pacuRecords: PACURecoveryRecordDto[];
  schedules: OTScheduleDto[];
  onOpenPACUObservation: (schedule: OTScheduleDto) => void;
  onPostOpTransfer: (schedule: OTScheduleDto) => void;
}

export const PACURecoveryView: React.FC<Props> = ({
  pacuRecords,
  schedules,
  onOpenPACUObservation,
  onPostOpTransfer
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post-Anaesthesia Care Unit (PACU)</h1>
          <p className="text-sm text-gray-500">Aldrete scoring, airway recovery, hemodynamics, and step-down readiness</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Admit Post-Op Case to PACU Bay</h2>
        <div className="space-y-2">
          {schedules.filter(s => s.status === 'COMPLETED').map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{s.patientName} — {s.procedureName}</p>
                <p className="text-xs text-gray-500">Primary Surgeon: {s.primarySurgeonName}</p>
              </div>
              <Button variant="primary" onClick={() => onOpenPACUObservation(s)}>Record PACU Assessment</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Active PACU Patients</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Bay #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Aldrete Score</th>
              <th className="py-2">SpO2 / Vitals</th>
              <th className="py-2">Nurse</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {pacuRecords.map(p => {
              const sched = schedules.find(s => s.id === p.scheduleId) || schedules[0];
              return (
                <tr key={p.id}>
                  <td className="py-2 font-bold text-gray-900">{p.recoveryBedNumber}</td>
                  <td className="py-2 font-semibold">{p.patientName}</td>
                  <td className="py-2 font-bold text-emerald-600">{p.currentAldreteScore}/10</td>
                  <td className="py-2 text-xs">{p.spo2Percentage}% SpO2 • {p.systolicBpMmHg}/{p.diastolicBpMmHg}</td>
                  <td className="py-2">{p.pacuNurseName}</td>
                  <td className="py-2"><Badge variant={p.status === 'RECOVERING' ? 'warning' : 'success'}>{p.status}</Badge></td>
                  <td className="py-2 text-right">
                    {sched && p.status === 'RECOVERING' && (
                      <Button variant="primary" onClick={() => onPostOpTransfer(sched)}>Transfer to Ward/ICU</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
