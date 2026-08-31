import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyOverviewMetricsDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  metrics: EmergencyOverviewMetricsDto;
  encounters: EmergencyEncounterDto[];
  onOpenQueue: () => void;
  onOpenTriage: () => void;
}

export const EmergencyDashboardView: React.FC<Props> = ({ metrics, encounters, onOpenQueue, onOpenTriage }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Department Executive Dashboard</h1>
          <p className="text-sm text-gray-500">Live acuity tracking, door-to-needle/doctor metrics, and department capacity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onOpenQueue}>Emergency Queue</Button>
          <Button variant="primary" onClick={onOpenTriage}>Triage Desk</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Pending Triage</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.waitingForTriageCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">MLC Cases Today</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.mlcCasesToday}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">In Observation</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.observationPatientsCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Disaster Mode Status</p>
          <p className="text-2xl font-bold mt-1">
            <Badge variant={metrics.isDisasterModeActive ? 'danger' : 'success'}>
              {metrics.isDisasterModeActive ? 'ACTIVE DISASTER' : 'Normal Operations'}
            </Badge>
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">Live Emergency Patient Register</h2>
        <div className="space-y-2">
          {encounters.map(e => (
            <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{e.patientName}</span>
                  <span className="text-xs text-gray-500">({e.patientMrn})</span>
                  {e.isMLC && <Badge variant="warning">MLC</Badge>}
                  {e.isTraumaAlert && <Badge variant="danger">TRAUMA</Badge>}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{e.chiefComplaint}</p>
              </div>
              <div>
                <Badge variant={e.triageEsiLevel === 'ESI_1_IMMEDIATE_RESUSCITATION' ? 'danger' : 'primary'}>
                  {e.currentStatus}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
