import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { BloodIssueDto } from '@docsearch/api-contracts';

interface Props {
  issues: BloodIssueDto[];
}

export const BloodIssueView: React.FC<Props> = ({ issues }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blood Unit Dispatch & Issue Manifest</h2>
        <p className="text-xs text-gray-500">Chain-of-custody transfer logs with cold-box transport temperature verification</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Issue No.</th>
              <th className="p-3">Patient Name / MRN</th>
              <th className="p-3">Unit Barcode</th>
              <th className="p-3">Destination Ward</th>
              <th className="p-3">Issuing Tech</th>
              <th className="p-3">Receiving Nurse</th>
              <th className="p-3">Transport Temp</th>
              <th className="p-3">Issued Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {issues.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{i.issueCode}</td>
                <td className="p-3 font-semibold text-gray-900">{i.patientName} ({i.patientMrn})</td>
                <td className="p-3 font-mono text-xs text-slate-700">{i.componentCode}</td>
                <td className="p-3 text-xs text-gray-600">{i.destinationDepartment}</td>
                <td className="p-3 text-xs text-gray-700">{i.issuingTechnicianName}</td>
                <td className="p-3 text-xs text-gray-700">{i.receivingNurseName}</td>
                <td className="p-3 font-semibold text-green-800">{i.transportBoxTemperatureC}</td>
                <td className="p-3 text-xs text-gray-600">{new Date(i.issuedAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
