import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { RadiologyCriticalFindingDto } from '@docsearch/api-contracts';

interface Props {
  findings: RadiologyCriticalFindingDto[];
  onAcknowledge: (finding: RadiologyCriticalFindingDto) => void;
}

export const RadiologyCriticalFindingsView: React.FC<Props> = ({ findings, onAcknowledge }) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
            <span>🚨</span> Critical Imaging Findings & Escalation Log
          </h3>
          <p className="text-xs text-gray-500">Urgent life-threatening findings requiring verified direct clinician communication</p>
        </div>
        <Badge variant="danger">{findings.filter((f) => f.status !== 'ACKNOWLEDGED_BY_CLINICIAN').length} Pending Acknowledgement</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Alert Code</th>
              <th className="py-2.5 px-3">Patient & MRN</th>
              <th className="py-2.5 px-3">Critical Finding</th>
              <th className="py-2.5 px-3">Severity</th>
              <th className="py-2.5 px-3">Ordering Clinician</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {findings.map((f) => (
              <tr key={f.id} className="hover:bg-red-50/40 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-red-700">{f.alertCode}</td>
                <td className="py-2.5 px-3 font-semibold text-gray-900">{f.patientName}</td>
                <td className="py-2.5 px-3 text-red-900 font-medium">{f.findingDescription}</td>
                <td className="py-2.5 px-3">
                  <Badge variant="danger">{f.severity}</Badge>
                </td>
                <td className="py-2.5 px-3">
                  <div>{f.orderingDoctorName}</div>
                  <div className="text-[10px] text-gray-500">{f.orderingDepartment}</div>
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant={f.status === 'ACKNOWLEDGED_BY_CLINICIAN' ? 'success' : 'danger'}>
                    {f.status}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {f.status !== 'ACKNOWLEDGED_BY_CLINICIAN' && (
                    <Button variant="primary" size="sm" onClick={() => onAcknowledge(f)}>Acknowledge Alert</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
