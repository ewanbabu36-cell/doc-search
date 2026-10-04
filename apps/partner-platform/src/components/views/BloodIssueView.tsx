import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { BloodIssueDto } from '@docsearch/api-contracts';

interface Props {
  issues: BloodIssueDto[];
}

export const BloodIssueView: React.FC<Props> = ({ issues }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Blood Unit Dispatch & Issue Manifest</h2>
            <Badge variant="primary">Chain of Custody</Badge>
          </div>
          <p className="text-xs text-gray-500">Chain-of-custody transfer logs with cold-box transport temperature verification & 30-minute bedside hang tracking</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="success">Total Dispatched: {issues.length}</Badge>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Issue No.</th>
              <th className="p-3">Patient Name / MRN</th>
              <th className="p-3">Unit Barcode</th>
              <th className="p-3">Destination Ward</th>
              <th className="p-3">Issuing Tech & Nurse</th>
              <th className="p-3">Cold-Box Temp</th>
              <th className="p-3">Issued Time</th>
              <th className="p-3">Cold-Chain Transit (30m Rule)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {issues.map((i) => {
              const elapsedMinutes = Math.max(1, Math.round((Date.now() - new Date(i.issuedAt).getTime()) / 60000));
              const isBreached = elapsedMinutes > 30;
              const isWarning = elapsedMinutes >= 20 && elapsedMinutes <= 30;

              return (
                <tr key={i.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-800">{i.issueCode}</td>
                  <td className="p-3">
                    <span className="font-semibold text-gray-900">{i.patientName}</span>
                    <span className="text-xs text-gray-500 block font-mono">{i.patientMrn}</span>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-700">{i.componentCode}</td>
                  <td className="p-3 text-xs text-gray-600 font-semibold">{i.destinationDepartment}</td>
                  <td className="p-3 text-xs text-gray-700">
                    <div>Out: {i.issuingTechnicianName}</div>
                    <div className="text-gray-500">In: {i.receivingNurseName}</div>
                  </td>
                  <td className="p-3 font-semibold text-green-800">{i.transportBoxTemperatureC}</td>
                  <td className="p-3 text-xs text-gray-600">{new Date(i.issuedAt).toLocaleTimeString()}</td>
                  <td className="p-3">
                    <Badge variant={isBreached ? 'danger' : isWarning ? 'warning' : 'success'}>
                      {isBreached ? `BREACH: ${elapsedMinutes}m (>30m)` : `${elapsedMinutes}m elapsed (Safe)`}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

