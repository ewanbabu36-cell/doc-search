import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { RadiologyModalityDto } from '@docsearch/api-contracts';

interface Props {
  modalities: RadiologyModalityDto[];
}

export const RadiologyModalityBoardView: React.FC<Props> = ({ modalities }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Modality Hardware & DICOM Station Board</h3>
          <p className="text-xs text-gray-500">Equipment telemetry, AE titles, IP addresses & daily calibrations</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {modalities.map((mod) => (
          <Card key={mod.id} className="p-4 bg-white border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-sm">{mod.modalityCode}</span>
                <div className="text-xs text-gray-500 font-mono">{mod.manufacturerAndModel}</div>
              </div>
              <Badge variant={mod.status === 'AVAILABLE' ? 'success' : mod.status === 'BUSY' ? 'warning' : 'danger'}>
                {mod.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded border border-gray-100 font-mono">
              <div>Room: <strong className="text-gray-800 font-sans">{mod.roomNumber}</strong></div>
              <div>AE Title: <strong className="text-blue-700">{mod.aetitle}</strong></div>
              <div>IP: <strong className="text-gray-700">{mod.ipAddress}</strong></div>
              <div>Port: <strong className="text-gray-700">{mod.dicomPort}</strong></div>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1">
              <span>Last Calibration: {mod.lastCalibrationDate ? new Date(mod.lastCalibrationDate).toLocaleDateString() : 'N/A'}</span>
              <span className={mod.isAvailable ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}>
                {mod.isAvailable ? '✓ In Service' : '⚠ Maintenance / Busy'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
