import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type {
  TelemedicineOverviewMetricsDto,
  TeleconsultationSessionDto,
  IotConnectedDeviceDto,
  RpmVitalBreachAlertDto
} from '@docsearch/api-contracts';

interface Props {
  metrics: TelemedicineOverviewMetricsDto;
  sessions: TeleconsultationSessionDto[];
  devices: IotConnectedDeviceDto[];
  breachAlerts: RpmVitalBreachAlertDto[];
  onScheduleTeleconsult: () => void;
  onRegisterDevice: () => void;
  onEnrollRpm: () => void;
}

export const TelemedicineOverviewView: React.FC<Props> = ({
  metrics,
  sessions,
  devices,
  breachAlerts,
  onScheduleTeleconsult,
  onRegisterDevice,
  onEnrollRpm
}) => {
  const activeCalls = sessions.filter((s) => s.status === 'CALL_IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-900 via-sky-950 to-blue-950 text-white rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📹</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Telemedicine, Virtual Clinics & IoT Remote Patient Monitoring (RPM)</h2>
              <Badge variant="success">WebRTC HD Active</Badge>
            </div>
            <p className="text-xs text-sky-200">End-to-End Encrypted DTLS-SRTP Consultations, Virtual Waiting Rooms & Connected IoT Telemetry Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onScheduleTeleconsult}>📅 Schedule Teleconsult</Button>
          <Button variant="outline" onClick={onRegisterDevice}>📡 Pair IoT Device</Button>
          <Button variant="outline" onClick={onEnrollRpm}>🩺 Enroll RPM Patient</Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 bg-teal-50 border-teal-200">
          <span className="text-xs font-semibold text-teal-700">Virtual Consults Today</span>
          <p className="text-2xl font-bold text-teal-900">{metrics.activeTeleconsultationsToday}</p>
          <p className="text-xs text-teal-600 mt-1">Avg Call Duration: {metrics.averageCallDurationMins} mins</p>
        </Card>

        <Card className="p-4 bg-sky-50 border-sky-200">
          <span className="text-xs font-semibold text-sky-700">Patients in Waiting Room</span>
          <p className="text-2xl font-bold text-sky-900">{metrics.patientsInVirtualWaitingRoom}</p>
          <p className="text-xs text-sky-600 mt-1">Live Queue & Pre-check Done</p>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <span className="text-xs font-semibold text-purple-700">Active Enrolled RPM Patients</span>
          <p className="text-2xl font-bold text-purple-900">{metrics.activeEnrolledRpmPatients}</p>
          <p className="text-xs text-purple-600 mt-1">Remote Adherence: {metrics.remoteAdherenceRatePct}%</p>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <span className="text-xs font-semibold text-red-700">Vital Threshold Breaches</span>
          <p className="text-2xl font-bold text-red-900">{metrics.vitalBreachesAlertsToday}</p>
          <p className="text-xs text-red-600 mt-1">Direct Tele-Triage Alert Active</p>
        </Card>
      </div>

      {/* Active Consultations & Breaches */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Virtual Sessions */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              Live Teleconsultation Rooms ({activeCalls.length} In Progress)
            </h3>
            <span className="text-xs text-gray-500">Encrypted WebRTC</span>
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="p-3 bg-gray-50 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{s.patientName} (MRN: {s.patientMrn})</span>
                  <Badge variant={s.status === 'CALL_IN_PROGRESS' ? 'success' : 'neutral'}>{s.status}</Badge>
                </div>
                <p className="text-gray-600">{s.doctorName} ({s.specialtyName}) | Room: <span className="font-mono text-blue-700">{s.webrtcRoomId}</span></p>
                <p className="text-gray-500 text-[11px]">Fee: ₹{s.consultationFeeInr} ({s.paymentStatus}) {s.ePrescriptionGenerated && '• e-Rx Generated'}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Vital Breaches Radar */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Out-of-Range Vital Threshold Alerts ({breachAlerts.length} Active)
            </h3>
            <span className="text-xs text-gray-500">RPM Continuous Stream</span>
          </div>
          <div className="space-y-2">
            {breachAlerts.map((b) => (
              <div key={b.id} className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-900">{b.patientName} — {b.vitalParameter}</span>
                  <Badge variant="danger">{b.measuredValue}</Badge>
                </div>
                <p className="text-red-700 font-medium">⚠️ {b.thresholdRule}</p>
                <p className="text-gray-600 text-[11px]">Assigned: {b.assignedClinician} | Status: {b.status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Connected IoT Devices Feed */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-gray-900">Connected Medical IoT Devices ({devices.length} Live Gateways)</h3>
          <span className="text-xs text-gray-500">BLE 5.2 / WiFi Direct / 4G Hub</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          {devices.map((d) => (
            <div key={d.id} className="p-3 bg-gray-50 rounded-lg border space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">{d.deviceModel}</span>
                <Badge variant="success">{d.syncStatus}</Badge>
              </div>
              <p className="text-gray-600">Assigned: <strong>{d.patientName}</strong> ({d.patientMrn})</p>
              <p className="text-gray-500 text-[11px]">Serial: <span className="font-mono">{d.deviceSerial}</span> | Protocol: {d.connectionProtocol}</p>
              <div className="flex justify-between text-[11px] pt-1 text-emerald-800 font-semibold">
                <span>🔋 Battery: {d.batteryLevelPct}%</span>
                <span>Synced: Just now</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
