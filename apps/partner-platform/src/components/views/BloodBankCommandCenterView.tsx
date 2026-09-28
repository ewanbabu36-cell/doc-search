import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodBankOverviewMetricsDto, BloodRequestDto, BloodCrossmatchDto, BloodStorageTemperatureLogDto, BloodBankFacilityDto } from '@docsearch/api-contracts';

interface Props {
  metrics: BloodBankOverviewMetricsDto;
  requests: BloodRequestDto[];
  crossmatches: BloodCrossmatchDto[];
  temperatureLogs: BloodStorageTemperatureLogDto[];
  facility?: BloodBankFacilityDto;
  onOpenNewRequest: () => void;
  onOpenNewDonor: () => void;
}

export const BloodBankCommandCenterView: React.FC<Props> = ({
  metrics,
  requests,
  crossmatches,
  temperatureLogs,
  facility,
  onOpenNewRequest,
  onOpenNewDonor
}) => {
  const pendingRequests = requests.filter((r) => r.status === 'PENDING_CROSSMATCH');
  const excursions = temperatureLogs.filter((t) => t.isExcursion);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blood Bank & Transfusion Command Center</h1>
          <p className="text-sm text-gray-500">Real-time blood stock levels, emergency requisitions, compatibility testing & cold-chain oversight</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onOpenNewDonor}>+ Register Donor</Button>
          <Button variant="primary" onClick={onOpenNewRequest}>+ Emergency Blood Requisition</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-red-600">
          <span className="text-xs font-bold text-gray-500 uppercase">Available Blood Units</span>
          <div className="mt-1 text-2xl font-black text-red-600">{metrics.totalAvailableUnits}</div>
          <span className="text-xs text-gray-400">RBC: {metrics.prbcStockCount} | PLT: {metrics.plateletStockCount} | FFP: {metrics.ffpStockCount}</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-gray-500 uppercase">Quarantined / Testing</span>
          <div className="mt-1 text-2xl font-black text-amber-600">{metrics.quarantineUnitsCount}</div>
          <span className="text-xs text-gray-400">Awaiting serology sign-off</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <span className="text-xs font-bold text-gray-500 uppercase">Active Requests / XM</span>
          <div className="mt-1 text-2xl font-black text-blue-600">{metrics.pendingRequestsCount} / {metrics.activeCrossmatchesCount}</div>
          <span className="text-xs text-gray-400">Crossmatches in lab</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-700">
          <span className="text-xs font-bold text-gray-500 uppercase">Critical Low Blood Groups</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {metrics.criticalLowBloodGroups.map((bg) => (
              <Badge key={bg} variant="danger">{bg.replace('_', ' ')}</Badge>
            ))}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">Urgent collection needed</span>
        </Card>
      </div>

      {excursions.length > 0 && (
        <Card className="p-4 border border-red-300 bg-red-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <h3 className="text-sm font-bold text-red-900">Cold Chain Storage Excursion Alert</h3>
                <p className="text-xs text-red-700">{excursions.length} storage unit(s) recorded temperatures outside target threshold.</p>
              </div>
            </div>
            <Badge variant="danger">URGENT ACTION</Badge>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Pending Clinical Blood Requisitions</h3>
            <Badge variant="warning">{pendingRequests.length} Pending</Badge>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{r.patientName}</span>
                    <Badge variant={r.urgency === 'STAT_EMERGENCY_IMMEDIATE' ? 'danger' : 'warning'}>{r.urgency.replace('_', ' ')}</Badge>
                  </div>
                  <span className="text-xs text-gray-500">{r.requestingDepartment} • {r.requestedComponentType} ({r.quantityUnits} unit(s)) • BG: {r.patientBloodGroup}</span>
                </div>
                <span className="text-xs font-semibold text-blue-600">{r.requestCode}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Active Compatibility & Crossmatches</h3>
            <Badge variant="primary">{crossmatches.length} Verified</Badge>
          </div>
          <div className="space-y-3">
            {crossmatches.map((x) => (
              <div key={x.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{x.patientName} ({x.patientBloodGroup})</span>
                    <Badge variant={x.overallResult === 'COMPATIBLE' ? 'success' : 'danger'}>{x.overallResult}</Badge>
                  </div>
                  <span className="text-xs text-gray-500">Unit: {x.componentCode} • Coombs: {x.coombsTestResult} • Verified: {x.verifiedByPathologist}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(x.crossmatchedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {facility && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>🏛️ Facility Licensing & Accreditation</span>
              <Badge variant={facility.isActive ? 'success' : 'danger'}>
                {facility.isActive ? 'ACTIVE & LICENSED' : 'SUSPENDED'}
              </Badge>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Facility Name:</span>
                <span className="font-bold text-gray-900">{facility.facilityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Facility Code:</span>
                <span className="font-mono font-bold text-slate-800">{facility.facilityCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Drug & Blood License:</span>
                <span className="font-bold text-green-700">{facility.licenseNumber}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              👨‍⚕️ Responsible Clinical Officers
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Medical Director:</span>
                <span className="font-bold text-gray-900">{facility.medicalDirectorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Head Technologist:</span>
                <span className="font-bold text-gray-900">{facility.headTechnologistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Main Storage Vault:</span>
                <span className="font-bold text-gray-900">{facility.storageLocationName}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
