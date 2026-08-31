import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { SurgeryRequestDto } from '@docsearch/api-contracts';

interface Props {
  request: SurgeryRequestDto | null;
  onBack: () => void;
  onApprove: (req: SurgeryRequestDto) => void;
}

export const SurgeryRequestDetailView: React.FC<Props> = ({ request, onBack, onApprove }) => {
  if (!request) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack}>← Back to Requests</Button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{request.requestNumber} — {request.patientName}</h1>
        </div>
        {request.status === 'SUBMITTED' && (
          <Button variant="primary" onClick={() => onApprove(request)}>Approve Request</Button>
        )}
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Procedure:</span> <strong className="text-gray-900">{request.procedureName}</strong></div>
          <div><span className="text-gray-500">Specialty:</span> <strong className="text-gray-900">{request.specialty}</strong></div>
          <div><span className="text-gray-500">Operating Surgeon:</span> <strong className="text-gray-900">{request.primarySurgeonName}</strong></div>
          <div><span className="text-gray-500">PAC Clearance:</span> <Badge variant={request.pacClearanceStatus === 'CLEARED' ? 'success' : 'warning'}>{request.pacClearanceStatus}</Badge></div>
          <div className="col-span-2"><span className="text-gray-500">Pre-Operative Diagnosis:</span> <p className="text-gray-800 mt-1">{request.preOperativeDiagnosis}</p></div>
          <div className="col-span-2"><span className="text-gray-500">Clinical Indication:</span> <p className="text-gray-800 mt-1">{request.clinicalIndication}</p></div>
        </div>
      </Card>
    </div>
  );
};
