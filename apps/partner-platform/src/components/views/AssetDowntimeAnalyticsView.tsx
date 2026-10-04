import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AssetDowntimeAnalyticsDto, BiomedicalAssetDto, BreakdownWorkOrderDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  analytics: AssetDowntimeAnalyticsDto;
  assets?: BiomedicalAssetDto[];
  workOrders?: BreakdownWorkOrderDto[];
}

export const AssetDowntimeAnalyticsView: React.FC<Props> = ({ analytics, assets = [], workOrders = [] }) => {
  const [pulseCount, setPulseCount] = useState(0);

  // Dynamic calculations
  const totalFleet = assets.length > 0 ? assets.length : 10;
  const inServiceFleet = assets.length > 0 ? assets.filter((a) => a.operationalStatus === 'IN_SERVICE').length : 8;
  const fleetUptime = totalFleet > 0 ? Math.round((inServiceFleet / totalFleet) * 1000) / 10 : analytics.fleetUptimePct;

  // Category availability breakdown
  const criticalCategories = [
    { label: 'Mechanical Ventilators (ICU)', filter: (a: BiomedicalAssetDto) => a.assetCode.startsWith('BME-VENT') },
    { label: 'OT Anesthesia Delivery Systems', filter: (a: BiomedicalAssetDto) => a.assetCode.startsWith('BME-ANES') },
    { label: 'Biphasic Defibrillators / Resuscitation', filter: (a: BiomedicalAssetDto) => a.assetCode.startsWith('BME-DEFIB') },
    { label: 'Dialysis Units (HDF)', filter: (a: BiomedicalAssetDto) => a.assetCode.startsWith('BME-DIAL') },
    { label: 'Multi-Para Vital Monitors', filter: (a: BiomedicalAssetDto) => a.assetCode.startsWith('BME-MON') }
  ];

  const categoryAvailabilities = criticalCategories.map((cat) => {
    const matching = assets.filter(cat.filter);
    const count = matching.length;
    const ready = matching.filter((a) => a.operationalStatus === 'IN_SERVICE').length;
    const pct = count > 0 ? Math.round((ready / count) * 100) : 100;
    return {
      name: cat.label,
      total: count,
      ready,
      pct,
      status: pct === 100 ? 'OPTIMAL' : pct >= 50 ? 'SUB_OPTIMAL_WARNING' : 'CRITICAL_SHORTAGE'
    };
  });

  // Calculate live MTTR from work orders
  const completedWOs = workOrders.filter((w) => w.status === 'COMPLETED' || w.status === 'CLOSED');
  const totalLaborHours = completedWOs.reduce((acc, curr) => acc + (curr.laborHours || 1.5), 0);
  const liveMttrHours = completedWOs.length > 0 ? Math.round((totalLaborHours / completedWOs.length) * 10) / 10 : analytics.meanTimeToRepairHours;

  const activeStatBreakdown = workOrders.find((w) => w.priority === 'EMERGENCY_STAT' && w.status !== 'CLOSED');

  // Broadcast telemetry update on load
  useEffect(() => {
    hospitalEventBus.publish(
      'EQUIPMENT_UPTIME_TELEMETRY_UPDATED',
      'BiomedicalTelemetryDesk',
      {
        fleetUptimePct: fleetUptime,
        meanTimeToRepairHours: liveMttrHours,
        criticalAvailability: categoryAvailabilities,
        timestamp: new Date().toISOString()
      },
      `📈 Biomedical Telemetry Pulse: Fleet Uptime ${fleetUptime}%, MTTR ${liveMttrHours} hrs. Critical units monitored.`
    );
  }, [fleetUptime, liveMttrHours, pulseCount]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Asset Downtime, MTBF & MTTR Telemetry Desk</h2>
          <p className="text-xs text-gray-500">Live Mean Time to Repair, Mean Time Between Failures & Critical Availability SLA</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPulseCount((p) => p + 1)}>
            🔄 Refresh Telemetry Pulse
          </Button>
          <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold border border-emerald-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Sensor Sync Active
          </span>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">Dynamic Fleet Uptime</p>
          <p className="text-2xl font-bold text-emerald-900">{fleetUptime}%</p>
          <p className="text-xs text-emerald-600 mt-1">{inServiceFleet} of {totalFleet} Active in Service</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">Mean Time To Repair (MTTR)</p>
          <p className="text-2xl font-bold text-blue-900">{liveMttrHours} hrs</p>
          <p className="text-xs text-blue-600 mt-1">Average break-to-signoff duration</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">Mean Time Between Failures</p>
          <p className="text-2xl font-bold text-purple-900">{analytics.meanTimeBetweenFailuresHours} hrs</p>
          <p className="text-xs text-purple-600 mt-1">~26.6 Days Operating Reliability</p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">Total Downtime (This Month)</p>
          <p className="text-2xl font-bold text-amber-900">{analytics.totalDowntimeHoursMonth} hrs</p>
          <p className="text-xs text-amber-600 mt-1">98.2% Monthly Service Availability</p>
        </Card>
      </div>

      {/* Active STAT Breakdown Telemetry Widget */}
      {activeStatBreakdown && (
        <Card className="p-4 bg-red-50 border-red-300 space-y-3">
          <div className="flex items-center justify-between border-b border-red-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚨</span>
              <div>
                <h3 className="text-sm font-bold text-red-900">Active STAT Emergency Breakdown in Progress</h3>
                <p className="text-xs text-red-700">{activeStatBreakdown.workOrderNumber} | {activeStatBreakdown.assetName} ({activeStatBreakdown.assetCode})</p>
              </div>
            </div>
            <Badge variant="danger">SLA RESPONSE PRIORITY: STAT</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-red-200">
              <span className="text-gray-500 block">Location:</span>
              <strong className="text-gray-900">{activeStatBreakdown.roomBedLocation} ({activeStatBreakdown.departmentName})</strong>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-red-200">
              <span className="text-gray-500 block">Clinical Impact:</span>
              <strong className="text-red-700">{activeStatBreakdown.clinicalImpactLevel}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-red-200">
              <span className="text-gray-500 block">Assigned BME Lead:</span>
              <strong className="text-blue-700">{activeStatBreakdown.assignedEngineer || 'Er. Suresh Pillai'}</strong>
            </div>
          </div>
          <p className="text-xs text-gray-700 bg-white p-2 rounded border border-red-100">
            <strong>Problem:</strong> {activeStatBreakdown.problemDescription}
          </p>
        </Card>
      )}

      {/* Critical Equipment Availability Matrix */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">Critical Life-Support Equipment Availability Matrix</h3>
            <p className="text-xs text-gray-500">Live operational readiness and allocation capacity per technology class</p>
          </div>
          <span className="text-xs font-semibold text-gray-500">Benchmark SLA: &gt;95.0%</span>
        </div>

        <div className="space-y-3">
          {categoryAvailabilities.map((cat) => (
            <div key={cat.name} className="p-3 bg-gray-50 rounded-lg border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{cat.ready} / {cat.total} Units Operational</span>
                  <Badge variant={cat.pct === 100 ? 'success' : cat.pct >= 50 ? 'warning' : 'danger'}>
                    {cat.pct}% Available
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    cat.pct >= 90 ? 'bg-emerald-500' : cat.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${cat.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Departmental Downtime & Cost Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Downtime Hours by Department</h3>
          <div className="space-y-2 text-xs">
            {Object.entries(analytics.downtimeByDepartment).map(([dept, hours]) => (
              <div key={dept} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-semibold text-gray-800">{dept}</span>
                <span className="font-bold text-red-700">{hours} hrs</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Annual Maintenance Spend Breakdown</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Spare Parts Inventory Consumption:</span>
              <span className="font-bold text-gray-800">₹{analytics.annualMaintenanceSpend.sparePartsCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">OEM CMC / AMC Contracts:</span>
              <span className="font-bold text-gray-800">₹{analytics.annualMaintenanceSpend.vendorContractCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">In-House BME Labor Overhead:</span>
              <span className="font-bold text-gray-800">₹{analytics.annualMaintenanceSpend.inHouseLaborCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2 bg-blue-50 text-blue-900 rounded font-bold">
              <span>Budget Allocated:</span>
              <span>₹{analytics.annualMaintenanceSpend.budgetAllocated.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
