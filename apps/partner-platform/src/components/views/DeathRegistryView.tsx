import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DeathRegistryRecordDto } from '@docsearch/api-contracts';

interface Props {
  deathRecords: DeathRegistryRecordDto[];
  onOpenRegisterDeath: () => void;
}

export const DeathRegistryView: React.FC<Props> = ({ deathRecords, onOpenRegisterDeath }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">⚰ Statutory Institutional Death Registry</h2>
          <p className="text-xs text-gray-500">Official medical certification of cause of death and statutory registry integration</p>
        </div>
        <Button variant="danger" size="sm" onClick={onOpenRegisterDeath}>+ Register Death Certificate</Button>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b text-slate-800 uppercase font-semibold">
            <tr>
              <th className="p-3">Registry #</th>
              <th className="p-3">Deceased Patient</th>
              <th className="p-3">Date / Time Declared</th>
              <th className="p-3">Declaring Physician</th>
              <th className="p-3">Immediate Cause of Death</th>
              <th className="p-3">MLC / Police</th>
              <th className="p-3">Statutory Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deathRecords.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{d.deathRegistrationNumber}</td>
                <td className="p-3 font-semibold text-gray-900">{d.patientName} ({d.patientMrn})</td>
                <td className="p-3 text-gray-600">{new Date(d.declaredDeadTimestamp).toLocaleString()}</td>
                <td className="p-3 text-gray-700">{d.declaringPhysician}</td>
                <td className="p-3 font-medium text-red-900">{d.primaryCauseOfDeath}</td>
                <td className="p-3">
                  <Badge variant={d.coronerPoliceInformed ? 'danger' : 'neutral'}>
                    {d.coronerPoliceInformed ? 'MLC INFORMED' : 'NON-MLC'}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant={d.statutoryDeathPortalNotified ? 'success' : 'warning'}>
                    {d.statutoryDeathPortalNotified ? 'MUNICIPAL SYNCED' : 'PENDING'}
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
