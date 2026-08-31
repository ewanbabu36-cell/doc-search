import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { BloodComponentDto } from '@docsearch/api-contracts';

interface Props {
  components: BloodComponentDto[];
}

export const BloodInventoryView: React.FC<Props> = ({ components }) => {
  const usable = components.filter((c) => c.status === 'RELEASED_USABLE');
  const quarantined = components.filter((c) => c.status === 'QUARANTINED');
  const reserved = components.filter((c) => c.status === 'RESERVED_FOR_PATIENT');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blood Bank Master Inventory</h2>
          <p className="text-xs text-gray-500">Live breakdown by component type, blood group & cold-chain storage location</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="success">{usable.length} Usable Stock</Badge>
          <Badge variant="warning">{quarantined.length} Quarantined</Badge>
          <Badge variant="primary">{reserved.length} Reserved</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-bold text-red-900 mb-2">PRBC / Red Blood Cells (2°C - 6°C)</h3>
          <div className="text-2xl font-black text-red-700">{components.filter((c) => c.componentType.includes('PRBC')).length} Units</div>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-bold text-amber-900 mb-2">Platelet Units (20°C - 24°C Agitated)</h3>
          <div className="text-2xl font-black text-amber-700">{components.filter((c) => c.componentType.includes('PLATELET')).length} Units</div>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2">Fresh Frozen Plasma (-40°C)</h3>
          <div className="text-2xl font-black text-blue-700">{components.filter((c) => c.componentType.includes('PLASMA')).length} Units</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Unit Code</th>
              <th className="p-3">Component Type</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Storage Unit</th>
              <th className="p-3">Volume</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {components.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{c.componentCode}</td>
                <td className="p-3 font-semibold text-gray-900">{c.componentType.replace(/_/g, ' ')}</td>
                <td className="p-3 font-black text-red-600">{c.bloodGroup.replace('_', ' ')}</td>
                <td className="p-3 text-xs text-gray-600">{c.storageLocation}</td>
                <td className="p-3 text-gray-700">{c.volumeMl} mL</td>
                <td className="p-3 text-xs text-gray-600">{new Date(c.expiryDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <Badge variant={c.status === 'RELEASED_USABLE' ? 'success' : c.status === 'QUARANTINED' ? 'warning' : 'neutral'}>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
