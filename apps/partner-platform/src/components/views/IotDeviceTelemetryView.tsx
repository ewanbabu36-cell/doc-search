import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { IotConnectedDeviceDto, RpmTelemetryObservationDto } from '@docsearch/api-contracts';

interface Props {
  devices: IotConnectedDeviceDto[];
  telemetry: RpmTelemetryObservationDto[];
  onRegisterDevice: () => void;
}

export const IotDeviceTelemetryView: React.FC<Props> = ({ devices, telemetry, onRegisterDevice }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Connected Medical IoT Devices & Remote Telemetry Stream</h2>
          <p className="text-xs text-gray-500">Live Bluetooth BLE 5.2, WiFi, and Cellular 4G gateway telemetry ingest from home medical devices</p>
        </div>
        <Button variant="primary" onClick={onRegisterDevice}>📡 Register & Pair Device</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Device Directory */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Registered IoT Device Fleet ({devices.length})</h3>
          <div className="space-y-2 text-xs">
            {devices.map((d) => (
              <div key={d.id} className="p-3 bg-gray-50 rounded border space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">{d.deviceModel}</span>
                  <Badge variant="success">{d.syncStatus}</Badge>
                </div>
                <p className="text-gray-600">Assigned: {d.patientName} ({d.patientMrn})</p>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>Protocol: {d.connectionProtocol}</span>
                  <span>Battery: {d.batteryLevelPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Ingested Telemetry Feed */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Live Ingested Telemetry Feed</h3>
          <div className="space-y-2 text-xs">
            {telemetry.map((t) => (
              <div key={t.id} className="p-3 bg-gray-50 rounded border space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">{t.patientName} — {t.deviceType}</span>
                  <Badge variant={t.breachSeverity === 'NORMAL_BASELINE' ? 'success' : 'warning'}>{t.breachSeverity}</Badge>
                </div>
                <div className="text-gray-700 font-mono text-[11px]">
                  {t.readings.systolicBp && `NIBP: ${t.readings.systolicBp}/${t.readings.diastolicBp} mmHg (Pulse: ${t.readings.pulseRateBpm} bpm) `}
                  {t.readings.spO2Pct && `SpO2: ${t.readings.spO2Pct}% `}
                  {t.readings.glucoseMgDl && `Blood Glucose: ${t.readings.glucoseMgDl} mg/dL `}
                </div>
                <span className="text-gray-400 text-[10px]">{t.timestamp.replace('T', ' ').substring(0, 19)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
