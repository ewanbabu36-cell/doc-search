import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodRequestDto } from '@docsearch/api-contracts';

interface Props {
  requests: BloodRequestDto[];
  onOpenCrossmatch: (r: BloodRequestDto) => void;
  onOpenNewRequest: () => void;
}

export const BloodRequestWorkbenchView: React.FC<Props> = ({ requests, onOpenCrossmatch, onOpenNewRequest }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clinical Blood Requisition Workbench</h2>
          <p className="text-xs text-gray-500">Process incoming emergency, surgical OT & inpatient blood orders</p>
        </div>
        <Button variant="primary" onClick={onOpenNewRequest}>+ New Requisition</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Requisition No.</th>
              <th className="p-3">Patient Name / MRN</th>
              <th className="p-3">Department</th>
              <th className="p-3">Component & Qty</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Urgency</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{r.requestCode}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-900">{r.patientName}</div>
                  <div className="text-xs text-gray-400">{r.patientMrn}</div>
                </td>
                <td className="p-3 text-xs text-gray-600">{r.requestingDepartment}</td>
                <td className="p-3 text-gray-800 font-medium">{r.requestedComponentType.replace(/_/g, ' ')} ({r.quantityUnits} unit(s))</td>
                <td className="p-3 font-black text-red-600">{r.patientBloodGroup.replace('_', ' ')}</td>
                <td className="p-3">
                  <Badge variant={r.urgency === 'STAT_EMERGENCY_IMMEDIATE' ? 'danger' : 'warning'}>
                    {r.urgency.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant={r.status === 'COMPLETED' ? 'success' : r.status === 'RESERVED' ? 'primary' : 'neutral'}>
                    {r.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <Button variant="primary" size="sm" onClick={() => onOpenCrossmatch(r)}>Perform Crossmatch</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
