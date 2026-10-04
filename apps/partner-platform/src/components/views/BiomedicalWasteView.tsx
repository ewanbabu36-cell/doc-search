import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { BiomedicalWasteLogDto } from '@docsearch/api-contracts';

interface Props {
  logs: BiomedicalWasteLogDto[];
  onRecordBmw: () => void;
}

export const BiomedicalWasteView: React.FC<Props> = ({ logs, onRecordBmw }) => {
  const totalWeight = logs.reduce((acc, l) => acc + l.totalDailyWeightKg, 0);
  const totalYellow = logs.reduce((acc, l) => acc + l.yellowBagWeightKg, 0);
  const totalRed = logs.reduce((acc, l) => acc + l.redBagWeightKg, 0);
  const totalWhite = logs.reduce((acc, l) => acc + l.whiteTranslucentWeightKg, 0);
  const totalBlue = logs.reduce((acc, l) => acc + l.blueBagWeightKg, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Biomedical Waste (BMW) Barcode Weight Reconciliation & Manifest Desk</h2>
          <p className="text-xs text-gray-500">
            Daily color-coded weighments (Yellow, Red, White, Blue), gate scale reconciliation & Pollution Control Board (PCB) compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onRecordBmw}>
            ⚖️ + IoT Scale Weighment & Manifest
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="p-3 bg-gray-50 border-gray-200">
          <p className="text-xs font-semibold text-gray-700">Total Waste Dispatched</p>
          <p className="text-2xl font-bold text-gray-900">{Math.round(totalWeight * 10) / 10} kg</p>
          <p className="text-[11px] text-gray-500 mt-1">{logs.length} Daily Manifests</p>
        </Card>
        <Card className="p-3 bg-yellow-50 border-yellow-200">
          <p className="text-xs font-semibold text-yellow-800">🟡 Yellow (Anatomical)</p>
          <p className="text-2xl font-bold text-yellow-950">{Math.round(totalYellow * 10) / 10} kg</p>
          <p className="text-[11px] text-yellow-700 mt-1">Incineration Category</p>
        </Card>
        <Card className="p-3 bg-red-50 border-red-200">
          <p className="text-xs font-semibold text-red-800">🔴 Red (Contaminated Plastic)</p>
          <p className="text-2xl font-bold text-red-950">{Math.round(totalRed * 10) / 10} kg</p>
          <p className="text-[11px] text-red-700 mt-1">Autoclave / Shredding</p>
        </Card>
        <Card className="p-3 bg-gray-100 border-gray-300">
          <p className="text-xs font-semibold text-gray-800">⚪ White (Sharps)</p>
          <p className="text-2xl font-bold text-gray-950">{Math.round(totalWhite * 10) / 10} kg</p>
          <p className="text-[11px] text-gray-600 mt-1">Encapsulation / Sharp Pit</p>
        </Card>
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-800">🔵 Blue (Glass / Metal)</p>
          <p className="text-2xl font-bold text-blue-950">{Math.round(totalBlue * 10) / 10} kg</p>
          <p className="text-[11px] text-blue-700 mt-1">Disinfection & Recycling</p>
        </Card>
      </div>

      {/* Manifest Entries List */}
      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} className="p-4 space-y-3 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 font-mono">{log.pcbManifestBarcode}</span>
                <Badge variant="success">✓ RECONCILED WITH GATE SCALE</Badge>
              </div>
              <span className="text-xs text-gray-600 font-medium">Log Date: <strong>{log.logDate}</strong></span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-yellow-50 text-yellow-950 border border-yellow-200 rounded-lg">
                <span className="block text-gray-500 text-[10px]">🟡 Yellow Anatomical</span>
                <strong className="text-sm">{log.yellowBagWeightKg} kg</strong>
              </div>
              <div className="p-2.5 bg-red-50 text-red-950 border border-red-200 rounded-lg">
                <span className="block text-gray-500 text-[10px]">🔴 Red Contaminated</span>
                <strong className="text-sm">{log.redBagWeightKg} kg</strong>
              </div>
              <div className="p-2.5 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg">
                <span className="block text-gray-500 text-[10px]">⚪ White Sharps</span>
                <strong className="text-sm">{log.whiteTranslucentWeightKg} kg</strong>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-950 border border-blue-200 rounded-lg">
                <span className="block text-gray-500 text-[10px]">🔵 Blue Glass/Metal</span>
                <strong className="text-sm">{log.blueBagWeightKg} kg</strong>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t">
              <div>
                Total Handover: <strong className="text-gray-900 font-mono text-sm">{log.totalDailyWeightKg} kg</strong>
                <span className="text-emerald-700 font-semibold ml-2">(Variance: &lt;0.5% — PCB Compliant)</span>
              </div>
              <div>
                <span>Authorized CBMWTF: <strong className="text-gray-800">{log.handedOverToVendorName}</strong></span>
                <span className="ml-3">Supervisor: <strong className="text-gray-800">{log.hospitalSupervisorName}</strong></span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
