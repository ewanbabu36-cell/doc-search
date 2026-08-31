import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { PreOperativeAssessmentDto, SurgeryRequestDto } from '@docsearch/api-contracts';

interface Props {
  assessments: PreOperativeAssessmentDto[];
  requests: SurgeryRequestDto[];
  onOpenPAC: (request: SurgeryRequestDto) => void;
}

export const PreOperativeWorkbenchView: React.FC<Props> = ({
  assessments,
  requests,
  onOpenPAC
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Anaesthesia Checkup (PAC) Workbench</h1>
          <p className="text-sm text-gray-500">Airway assessment, ASA classification, cardiac clearances, and anaesthesia plans</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Pending PAC Evaluations</h2>
        <div className="space-y-2">
          {requests.filter(r => r.pacClearanceStatus === 'PENDING').map(r => (
            <div key={r.id} className="flex justify-between items-center p-3 rounded-lg border bg-amber-50/50">
              <div>
                <p className="font-bold text-gray-900">{r.patientName} ({r.patientMrn})</p>
                <p className="text-xs text-gray-600">{r.procedureName} • Proposed: {new Date(r.proposedSurgeryDate).toLocaleDateString()}</p>
              </div>
              <Button variant="primary" onClick={() => onOpenPAC(r)}>Perform PAC Assessment</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Completed PAC Clearances</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Patient</th>
              <th className="py-2">Anaesthetist</th>
              <th className="py-2">ASA Class</th>
              <th className="py-2">Mallampati</th>
              <th className="py-2">Fitness Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {assessments.map(a => (
              <tr key={a.id}>
                <td className="py-2 font-semibold">{a.patientName}</td>
                <td className="py-2">{a.assessedByAnaesthetist}</td>
                <td className="py-2"><Badge variant="neutral">{a.asaClassification}</Badge></td>
                <td className="py-2">Class {a.airwayMallampatiScore}</td>
                <td className="py-2"><Badge variant="success">{a.fitnessStatus}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
