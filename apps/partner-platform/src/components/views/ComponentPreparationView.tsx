import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodComponentDto } from '@docsearch/api-contracts';

interface Props {
  components: BloodComponentDto[];
  onRelease: (c: BloodComponentDto) => void;
  onDiscard: (c: BloodComponentDto) => void;
}

export const ComponentPreparationView: React.FC<Props> = ({ components, onRelease, onDiscard }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blood Component Separation & Inventory</h2>
        <p className="text-xs text-gray-500">PRBC, Platelets, FFP and Cryoprecipitate yield tracking</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Component Code</th>
              <th className="p-3">Type</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Volume</th>
              <th className="p-3">Storage Unit & Target</th>
              <th className="p-3">Expiry Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {components.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{c.componentCode}</td>
                <td className="p-3 font-semibold text-gray-900">{c.componentType.replace(/_/g, ' ')}</td>
                <td className="p-3 font-black text-red-600">{c.bloodGroup.replace('_', ' ')}</td>
                <td className="p-3 text-gray-700">{c.volumeMl} mL</td>
                <td className="p-3 text-xs text-gray-600">{c.storageLocation} ({c.storageTemperatureTargetC})</td>
                <td className="p-3 text-xs text-gray-600">{new Date(c.expiryDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <Badge variant={c.status === 'RELEASED_USABLE' ? 'success' : c.status === 'QUARANTINED' ? 'warning' : 'neutral'}>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    {c.status === 'QUARANTINED' && (
                      <Button variant="primary" size="sm" onClick={() => onRelease(c)}>Authorize Release</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onDiscard(c)}>Discard</Button>
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
