import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { BirthRegistryRecordDto } from '@docsearch/api-contracts';

interface Props {
  birthRecords: BirthRegistryRecordDto[];
  onOpenRegisterBirth: () => void;
}

export const BirthRegistryView: React.FC<Props> = ({ birthRecords, onOpenRegisterBirth }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">👶 Statutory Institutional Birth Registry</h2>
          <p className="text-xs text-gray-500">Institutional birth registration and municipal civil registry synchronization</p>
        </div>
        <Button variant="primary" size="sm" onClick={onOpenRegisterBirth}>+ Register Birth Certificate</Button>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-pink-50 border-b text-pink-900 uppercase font-semibold">
            <tr>
              <th className="p-3">Registration #</th>
              <th className="p-3">Mother Name & MRN</th>
              <th className="p-3">Baby Identifier</th>
              <th className="p-3">Gender & Weight</th>
              <th className="p-3">Delivery Type</th>
              <th className="p-3">Attending OB/GYN</th>
              <th className="p-3">Govt Notified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {birthRecords.map((b) => (
              <tr key={b.id} className="hover:bg-pink-50/50 transition">
                <td className="p-3 font-bold text-pink-700">{b.birthRegistrationNumber}</td>
                <td className="p-3 font-semibold text-gray-900">{b.motherPatientName} ({b.motherMrn})</td>
                <td className="p-3 font-bold text-gray-800">{b.babyNameOrIdentifier}</td>
                <td className="p-3 text-gray-700">{b.gender} • {b.birthWeightKg} kg</td>
                <td className="p-3 text-gray-600">{b.deliveryType}</td>
                <td className="p-3 text-gray-600">{b.attendingObstetrician}</td>
                <td className="p-3">
                  <Badge variant={b.governmentPortalNotified ? 'success' : 'warning'}>
                    {b.governmentPortalNotified ? 'CIVIL REGISTRY SYNCED' : 'PENDING'}
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
