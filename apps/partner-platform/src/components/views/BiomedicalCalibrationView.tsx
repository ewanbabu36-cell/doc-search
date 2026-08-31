import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { CalibrationRecordDto } from '@docsearch/api-contracts';

interface Props {
  records: CalibrationRecordDto[];
  onRecordCalibration: () => void;
}

export const BiomedicalCalibrationView: React.FC<Props> = ({ records, onRecordCalibration }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Biomedical Metrology & Calibration Vault</h2>
          <p className="text-xs text-gray-500">ISO/IEC 17025 accredited calibration records, traceable standards & certificates</p>
        </div>
        <Button variant="primary" onClick={onRecordCalibration}>+ Record Calibration Certificate</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((rec) => (
          <Card key={rec.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-gray-900">{rec.certificateNumber}</span>
              <Badge variant={rec.status === 'CALIBRATED_PASS' ? 'success' : 'danger'}>
                {rec.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{rec.assetName}</p>
              <p className="text-xs text-gray-500">Asset Code: {rec.assetCode}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="text-gray-700"><strong>Calibrating Agency:</strong> {rec.calibratedByAgency}</p>
              <p className="text-gray-700"><strong>Metrologist:</strong> {rec.leadMetrologistName}</p>
              <p className="text-gray-600"><strong>Standards Used:</strong> {rec.traceableStandardsUsed}</p>
              <p className="text-gray-600"><strong>Tolerances:</strong> {rec.tolerancesObserved}</p>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
              <span>Calibrated: {rec.calibrationDate}</span>
              <span className="font-semibold text-emerald-700">Valid Until: {rec.validUntilDate}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
