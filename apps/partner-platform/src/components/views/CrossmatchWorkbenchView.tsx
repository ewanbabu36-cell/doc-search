import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { BloodCrossmatchDto } from '@docsearch/api-contracts';

interface Props {
  crossmatches: BloodCrossmatchDto[];
}

export const CrossmatchWorkbenchView: React.FC<Props> = ({ crossmatches }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Serological Compatibility & Crossmatch Log</h2>
        <p className="text-xs text-gray-500">Major, minor and indirect antiglobulin test (IAT) compatibility validations</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Crossmatch ID</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Donor Unit</th>
              <th className="p-3">Major XM</th>
              <th className="p-3">Minor XM</th>
              <th className="p-3">Coombs (IAT)</th>
              <th className="p-3">Overall Decision</th>
              <th className="p-3">Valid Until</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {crossmatches.map((x) => (
              <tr key={x.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{x.crossmatchCode}</td>
                <td className="p-3 font-semibold text-gray-900">{x.patientName} ({x.patientBloodGroup})</td>
                <td className="p-3 font-bold text-slate-700">{x.componentCode} ({x.donorBloodGroup})</td>
                <td className="p-3 font-semibold text-gray-700">{x.majorCrossmatchResult}</td>
                <td className="p-3 font-semibold text-gray-700">{x.minorCrossmatchResult}</td>
                <td className="p-3 font-semibold text-gray-700">{x.coombsTestResult}</td>
                <td className="p-3">
                  <Badge variant={x.overallResult === 'COMPATIBLE' ? 'success' : 'danger'}>
                    {x.overallResult}
                  </Badge>
                </td>
                <td className="p-3 text-xs text-gray-600">{new Date(x.expiresAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
