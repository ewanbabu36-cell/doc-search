import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { HaiSurveillanceDto, HaiDeviceDaysDto } from '@docsearch/api-contracts';

interface Props {
  surveillances: HaiSurveillanceDto[];
  deviceDays: HaiDeviceDaysDto;
  onLogHai: () => void;
}

export const HaiSurveillanceView: React.FC<Props> = ({ surveillances, deviceDays, onLogHai }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hospital-Acquired Infection (HAI) Active Surveillance</h2>
          <p className="text-xs text-gray-500">CLABSI, CAUTI, VAP, SSI rates per 1,000 device-days & antibiogram tracking</p>
        </div>
        <Button variant="danger" onClick={onLogHai}>+ Log HAI Case</Button>
      </div>

      {/* Device Days Benchmark Banner */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 bg-red-50 border-red-200">
          <p className="text-xs font-semibold text-red-700">CLABSI Rate</p>
          <p className="text-xl font-bold text-red-900">{deviceDays.clabsiRatePer1000Days} / 1000 days</p>
          <p className="text-[11px] text-red-600 mt-1">{deviceDays.clabsiCount} cases ({deviceDays.centralLineDays} line-days)</p>
        </Card>
        <Card className="p-3 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">CAUTI Rate</p>
          <p className="text-xl font-bold text-amber-900">{deviceDays.cautiRatePer1000Days} / 1000 days</p>
          <p className="text-[11px] text-amber-600 mt-1">{deviceDays.cautiCount} cases ({deviceDays.urinaryCatheterDays} catheter-days)</p>
        </Card>
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">VAP Rate</p>
          <p className="text-xl font-bold text-blue-900">{deviceDays.vapRatePer1000Days} / 1000 days</p>
          <p className="text-[11px] text-blue-600 mt-1">{deviceDays.vapCount} cases ({deviceDays.ventilatorDays} vent-days)</p>
        </Card>
        <Card className="p-3 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">SSI Rate</p>
          <p className="text-xl font-bold text-purple-900">{deviceDays.ssiPercentage}%</p>
          <p className="text-[11px] text-purple-600 mt-1">{deviceDays.ssiCount} cases in {deviceDays.surgicalProceduresCount} surgeries</p>
        </Card>
      </div>

      <div className="space-y-3">
        {surveillances.map((hai) => (
          <Card key={hai.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{hai.surveillanceCode}</span>
                <Badge variant="danger">{hai.haiType}</Badge>
                <span className="text-xs font-semibold text-gray-800">{hai.patientName} (MRN: {hai.patientMrn})</span>
              </div>
              <Badge variant="neutral">{hai.outcomeStatus}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500">Pathogen Isolated</p>
                <p className="font-bold text-red-900">{hai.pathogenIsolated}</p>
                <p className="text-gray-500 mt-1">Antibiogram: {hai.antibioticSensitivity}</p>
              </div>
              <div>
                <p className="text-gray-500">Invasive Device & Day of Onset</p>
                <p className="font-semibold text-gray-800">{hai.invasiveDeviceName} (Day {hai.deviceDaysAtInfection})</p>
                <p className="text-gray-500 mt-1">Intervention: {hai.hicInterventionTaken}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
