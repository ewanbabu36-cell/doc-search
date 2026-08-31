import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { ExecutiveCommandSnapshotDto } from '@docsearch/api-contracts';

interface Props {
  snapshot: ExecutiveCommandSnapshotDto;
}

export const RealtimeHospitalCommandWallView: React.FC<Props> = ({ snapshot }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Hospital Real-Time Operating System (HOS) Situational Command Wall</h2>
        <p className="text-xs text-gray-500">Live operational telemetry across census, emergency codes, diagnostics, and surgical suites</p>
      </div>

      {snapshot.activeEmergencyCodes.length > 0 && (
        <div className="p-3 bg-red-600 text-white rounded-xl shadow flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-lg">🚨</span>
            <div>
              <span className="font-bold block uppercase">{snapshot.activeEmergencyCodes[0]?.codeType}</span>
              <span>{snapshot.activeEmergencyCodes[0]?.location} — Declared at {snapshot.activeEmergencyCodes[0]?.declaredAt.replace('T', ' ').substring(0, 16)}</span>
            </div>
          </div>
          <Badge variant="danger">{snapshot.activeEmergencyCodes[0]?.status}</Badge>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase border-b pb-2">Inpatient & ICU Bed Census</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Total Inpatient Beds:</span> <strong className="text-gray-900">{snapshot.totalBeds}</strong></div>
            <div className="flex justify-between"><span>Occupied Beds:</span> <strong className="text-blue-700">{snapshot.occupiedBeds} ({snapshot.bedOccupancyPct}%)</strong></div>
            <div className="flex justify-between"><span>Available Open Beds:</span> <strong className="text-emerald-700">{snapshot.availableBedsCount}</strong></div>
            <div className="flex justify-between pt-2 border-t"><span>ICU Beds Occupied:</span> <strong className="text-red-700">{snapshot.icuBedsOccupied} / {snapshot.icuBedsTotal} ({snapshot.icuOccupancyPct}%)</strong></div>
            <div className="flex justify-between"><span>Ventilators in Use:</span> <strong className="text-red-700">{snapshot.ventilatorsInUse} / {snapshot.ventilatorsTotal} ({snapshot.ventilatorUtilizationPct}%)</strong></div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase border-b pb-2">Emergency Department (ED) Surge</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>ED Triage Waiting:</span> <strong className="text-gray-900">{snapshot.edTriageWaitingCount} patients</strong></div>
            <div className="flex justify-between"><span>ED Admission Holds:</span> <strong className="text-amber-700">{snapshot.edHoldForAdmissionCount} waiting bed</strong></div>
            <div className="flex justify-between"><span>NEDOCS Index:</span> <strong className="text-red-700">{snapshot.edNedocsScore} ({snapshot.edNedocsStatus})</strong></div>
            <div className="flex justify-between pt-2 border-t"><span>STAT Lab Orders Pending:</span> <strong className="text-blue-700">{snapshot.statLabOrdersPending}</strong></div>
            <div className="flex justify-between"><span>STAT Radiology Pending:</span> <strong className="text-blue-700">{snapshot.statRadiologyOrdersPending}</strong></div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase border-b pb-2">OT Surgical Suites & Supply Buffer</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Active Operating Suites:</span> <strong className="text-gray-900">{snapshot.otSuitesActive} / {snapshot.otSuitesTotal}</strong></div>
            <div className="flex justify-between"><span>Surgeries In Progress:</span> <strong className="text-purple-700">{snapshot.surgeriesInProgressCount}</strong></div>
            <div className="flex justify-between"><span>Delayed Case Overruns:</span> <strong className="text-amber-700">{snapshot.surgeriesDelayedCount}</strong></div>
            <div className="flex justify-between pt-2 border-t"><span>Critical Blood Shortages:</span> <strong className="text-red-700">{snapshot.criticalBloodUnitsAlertCount} alert</strong></div>
            <div className="flex justify-between"><span>Consumable Stockout Risks:</span> <strong className="text-red-700">{snapshot.criticalConsumablesStockoutRiskCount} alerts</strong></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
