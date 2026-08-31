import React, { useState } from 'react';
import { Card, Table, Badge, Button, Input } from '@docsearch/ui-kit';
import type { SurgeryRequestDto } from '@docsearch/api-contracts';

interface Props {
  requests: SurgeryRequestDto[];
  onCreateRequest: () => void;
  onApprove: (req: SurgeryRequestDto) => void;
  onReject: (req: SurgeryRequestDto) => void;
}

export const SurgeryRequestView: React.FC<Props> = ({
  requests,
  onCreateRequest,
  onApprove,
  onReject
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = requests.filter(
    (r) =>
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.procedureName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surgery Requests & Triage</h1>
          <p className="text-sm text-gray-500">Elective and emergency surgical requisitions awaiting PAC and approval</p>
        </div>
        <Button variant="primary" onClick={onCreateRequest}>+ Create Surgery Request</Button>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, request number or procedure..."
          />
        </div>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Request #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Procedure</th>
              <th className="py-2">Surgeon</th>
              <th className="py-2">PAC Clearance</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="py-2 font-bold text-gray-900">{r.requestNumber}</td>
                <td className="py-2">
                  <div className="font-semibold">{r.patientName}</div>
                  <div className="text-xs text-gray-500">{r.patientMrn}</div>
                </td>
                <td className="py-2">
                  <div>{r.procedureName}</div>
                  <div className="text-xs text-gray-500">{r.specialty}</div>
                </td>
                <td className="py-2">{r.primarySurgeonName}</td>
                <td className="py-2">
                  <Badge variant={r.pacClearanceStatus === 'CLEARED' ? 'success' : 'warning'}>
                    {r.pacClearanceStatus}
                  </Badge>
                </td>
                <td className="py-2">
                  <Badge variant={r.status === 'APPROVED' ? 'success' : r.status === 'SUBMITTED' ? 'warning' : 'neutral'}>
                    {r.status}
                  </Badge>
                </td>
                <td className="py-2 text-right space-x-2">
                  {r.status === 'SUBMITTED' && (
                    <>
                      <Button variant="outline" onClick={() => onApprove(r)}>Approve</Button>
                      <Button variant="danger" onClick={() => onReject(r)}>Reject</Button>
                    </>
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
