import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodComponentDto } from '@docsearch/api-contracts';

interface Props {
  components: BloodComponentDto[];
  onOpenReturn: (c: BloodComponentDto) => void;
}

export const BloodReturnView: React.FC<Props> = ({ components, onOpenReturn }) => {
  const issued = components.filter((c) => c.status === 'ISSUED_TO_DEPARTMENT');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blood Unit Return & Re-Entry Assessment</h2>
        <p className="text-xs text-gray-500">Enforce strict cold-chain compliance (&lt; 30 mins rule) before stock re-entry</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Component Code</th>
              <th className="p-3">Component Type</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Storage Target</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {issued.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{c.componentCode}</td>
                <td className="p-3 font-semibold text-gray-900">{c.componentType.replace(/_/g, ' ')}</td>
                <td className="p-3 font-black text-red-600">{c.bloodGroup.replace('_', ' ')}</td>
                <td className="p-3 text-xs text-gray-600">{c.storageTemperatureTargetC}</td>
                <td className="p-3">
                  <Badge variant="warning">{c.status.replace(/_/g, ' ')}</Badge>
                </td>
                <td className="p-3 text-right">
                  <Button variant="primary" size="sm" onClick={() => onOpenReturn(c)}>Process Return</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
