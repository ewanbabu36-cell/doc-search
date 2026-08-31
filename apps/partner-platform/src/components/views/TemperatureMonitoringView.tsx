import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodStorageTemperatureLogDto } from '@docsearch/api-contracts';

interface Props {
  logs: BloodStorageTemperatureLogDto[];
  onOpenRecordTemp: () => void;
  onOpenResolveExcursion: (log: BloodStorageTemperatureLogDto) => void;
}

export const TemperatureMonitoringView: React.FC<Props> = ({
  logs,
  onOpenRecordTemp,
  onOpenResolveExcursion
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cold Chain Storage & Temperature Monitoring</h2>
          <p className="text-xs text-gray-500">Automated sensor feeds and manual logs for 4°C refrigerators, -40°C freezers & platelet agitators</p>
        </div>
        <Button variant="primary" onClick={onOpenRecordTemp}>+ Log Temperature</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Unit Location</th>
              <th className="p-3">Storage Unit Type</th>
              <th className="p-3">Recorded Temp</th>
              <th className="p-3">Target Range</th>
              <th className="p-3">Status</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-semibold text-gray-900">{l.unitLocation}</td>
                <td className="p-3 text-xs text-gray-600">{l.storageUnitType.replace(/_/g, ' ')}</td>
                <td className="p-3 font-black text-base text-slate-800">{l.recordedTemperatureC}°C</td>
                <td className="p-3 text-xs font-mono text-gray-600">{l.targetMinC}°C to {l.targetMaxC}°C</td>
                <td className="p-3">
                  <Badge variant={l.isExcursion ? 'danger' : 'success'}>
                    {l.isExcursion ? 'TEMPERATURE EXCURSION' : 'NORMAL OPTIMAL'}
                  </Badge>
                </td>
                <td className="p-3 text-xs text-gray-600">{new Date(l.recordedAt).toLocaleString()}</td>
                <td className="p-3 text-right">
                  {l.isExcursion && (
                    <Button variant="danger" size="sm" onClick={() => onOpenResolveExcursion(l)}>Resolve Excursion</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
