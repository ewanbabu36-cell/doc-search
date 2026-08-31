import React from 'react';
import { Card, Button } from '@docsearch/ui-kit';
import type { BiomedicalWasteLogDto } from '@docsearch/api-contracts';

interface Props {
  logs: BiomedicalWasteLogDto[];
  onRecordBmw: () => void;
}

export const BiomedicalWasteView: React.FC<Props> = ({ logs, onRecordBmw }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Biomedical Waste (BMW) Management & Segregation Logs</h2>
          <p className="text-xs text-gray-500">Daily color-coded weighments (Yellow, Red, White, Blue) and Pollution Control Board manifests</p>
        </div>
        <Button variant="primary" onClick={onRecordBmw}>+ Log Daily Waste Manifest</Button>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} className="p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-gray-900">{log.pcbManifestBarcode}</span>
              <span className="text-xs text-gray-500">Date: {log.logDate}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-yellow-50 text-yellow-900 rounded font-bold">🟡 Yellow: {log.yellowBagWeightKg} kg</div>
              <div className="p-2 bg-red-50 text-red-900 rounded font-bold">🔴 Red: {log.redBagWeightKg} kg</div>
              <div className="p-2 bg-gray-100 text-gray-900 rounded font-bold">⚪ White: {log.whiteTranslucentWeightKg} kg</div>
              <div className="p-2 bg-blue-50 text-blue-900 rounded font-bold">🔵 Blue: {log.blueBagWeightKg} kg</div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
              <span>Total: <strong>{log.totalDailyWeightKg} kg</strong></span>
              <span>Authorized Vendor: {log.handedOverToVendorName}</span>
              <span>Supervisor: {log.hospitalSupervisorName}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
