import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { ReleaseOfInformationRequestDto } from '@docsearch/api-contracts';

interface Props {
  requests: ReleaseOfInformationRequestDto[];
  onApprove: (req: ReleaseOfInformationRequestDto) => void;
  onRelease: (req: ReleaseOfInformationRequestDto) => void;
}

export const ROIWorkbenchView: React.FC<Props> = ({ requests, onApprove, onRelease }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Release of Information (ROI) Compliance Workbench</h2>
        <p className="text-xs text-gray-500">Statutory and patient authorization requests for medical record disclosure</p>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-3">Request #</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Requestor & Type</th>
              <th className="p-3">Purpose</th>
              <th className="p-3">Delivery</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-purple-700">{r.requestNumber}</td>
                <td className="p-3 font-semibold text-gray-900">{r.patientName}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-800">{r.requestorName}</div>
                  <div className="text-[10px] text-gray-500">{r.requestType}</div>
                </td>
                <td className="p-3 text-gray-600">{r.purposeOfRequest}</td>
                <td className="p-3 text-gray-500">{r.deliveryMethod}</td>
                <td className="p-3">
                  <Badge variant={r.status === 'DISCLOSED_AND_RELEASED' ? 'success' : r.status === 'APPROVED' ? 'primary' : 'warning'}>
                    {r.status}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {r.status === 'REQUESTED' && (
                      <Button size="sm" variant="outline" onClick={() => onApprove(r)}>Approve</Button>
                    )}
                    {r.status === 'APPROVED' && (
                      <Button size="sm" variant="primary" onClick={() => onRelease(r)}>Release Record</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
