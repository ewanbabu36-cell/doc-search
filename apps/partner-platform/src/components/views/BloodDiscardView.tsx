import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { BloodDiscardRecordDto } from '@docsearch/api-contracts';

interface Props {
  discards: BloodDiscardRecordDto[];
}

export const BloodDiscardView: React.FC<Props> = ({ discards }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Biohazard Blood Discard & Wastage Log</h2>
        <p className="text-xs text-gray-500">Audited disposal records with pathologist authorization</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Discard ID</th>
              <th className="p-3">Component Unit</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Discard Reason</th>
              <th className="p-3">Authorizing Pathologist</th>
              <th className="p-3">Disposal Method</th>
              <th className="p-3">Discard Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {discards.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{d.discardCode}</td>
                <td className="p-3 font-semibold text-gray-900">{d.componentCode} ({d.componentType.replace(/_/g, ' ')})</td>
                <td className="p-3 font-black text-red-600">{d.bloodGroup.replace('_', ' ')}</td>
                <td className="p-3">
                  <Badge variant="danger">{d.reason.replace(/_/g, ' ')}</Badge>
                </td>
                <td className="p-3 text-xs font-semibold text-gray-700">{d.authorizedByPathologist}</td>
                <td className="p-3 text-xs text-gray-600">{d.disposalMethod}</td>
                <td className="p-3 text-xs text-gray-600">{new Date(d.discardedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
