import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyOverviewMetricsDto, EmergencyEncounterDto, EmergencyZoneDto } from '@docsearch/api-contracts';

interface Props {
  metrics: EmergencyOverviewMetricsDto;
  encounters: EmergencyEncounterDto[];
  zones: EmergencyZoneDto[];
  onRegisterArrival: () => void;
  onActivateDisaster: () => void;
}

export const EmergencyCommandCenterView: React.FC<Props> = ({
  metrics,
  encounters,
  zones,
  onRegisterArrival,
  onActivateDisaster
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight">Emergency Department Live Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time acute triage acuity, trauma bays, Code Blue resuscitation telemetry, and ED bed census</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={onRegisterArrival}>+ New Emergency Arrival</Button>
          <Button variant="danger" onClick={onActivateDisaster}>🚨 Disaster / MCI Mode</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-l-4 border-l-red-600">
          <p className="text-xs font-bold text-gray-500 uppercase">ESI 1 Resuscitation</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{metrics.esi1Count}</p>
          <p className="text-xs text-red-700 font-medium mt-1">Immediate</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase">ESI 2 Emergent</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.esi2Count}</p>
          <p className="text-xs text-gray-500 mt-1">High Risk</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <p className="text-xs font-bold text-gray-500 uppercase">ESI 3 Urgent</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{metrics.esi3Count}</p>
          <p className="text-xs text-gray-500 mt-1">Multi-Resource</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Active ED Census</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{metrics.activeEDCensus}</p>
          <p className="text-xs text-gray-500 mt-1">Total in ED</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Trauma Alerts</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.activeTraumaAlerts}</p>
          <p className="text-xs text-purple-700 font-medium mt-1">Level 1/2 Shock</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Avg Door-to-Doc</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.averageDoorToDoctorMinutes}m</p>
          <p className="text-xs text-gray-500 mt-1">Triage: {metrics.averageDoorToTriageMinutes}m</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Zone Capacity & Occupancy</h2>
          <div className="space-y-3">
            {zones.map((z) => (
              <div key={z.id} className="p-3 rounded-lg border bg-gray-50/50 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-gray-900">{z.zoneName}</p>
                  <p className="text-xs text-gray-500">{z.zoneType} • ₹{z.chargePerHour}/hr</p>
                </div>
                <div className="text-right">
                  <Badge variant={z.occupiedCount >= z.capacity ? 'danger' : 'success'}>
                    {z.occupiedCount} / {z.capacity} Beds
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Active High-Acuity Cases</h2>
          <div className="space-y-3">
            {encounters.filter(e => e.triageEsiLevel === 'ESI_1_IMMEDIATE_RESUSCITATION' || e.triageEsiLevel === 'ESI_2_EMERGENT_HIGH_RISK').map((e) => (
              <div key={e.id} className="p-3 rounded-lg border border-red-200 bg-red-50/30">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-red-900">{e.patientName}</span>
                  <Badge variant="danger">{e.triageEsiLevel?.replace('_', ' ')}</Badge>
                </div>
                <p className="text-xs text-gray-700 mt-1">{e.chiefComplaint}</p>
                <p className="text-xs text-gray-500 mt-1">Zone: <strong>{e.currentZoneName || 'Triage'}</strong> • MD: <strong>{e.assignedPhysicianName || 'Unassigned'}</strong></p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
