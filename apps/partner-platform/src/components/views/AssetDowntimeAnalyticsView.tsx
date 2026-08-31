import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { AssetDowntimeAnalyticsDto } from '@docsearch/api-contracts';

interface Props {
  analytics: AssetDowntimeAnalyticsDto;
}

export const AssetDowntimeAnalyticsView: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Asset Downtime, MTBF & MTTR Analytics</h2>
        <p className="text-xs text-gray-500">Mean Time Between Failures, Mean Time to Repair, and Departmental Downtime</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">Overall Fleet Uptime</p>
          <p className="text-2xl font-bold text-emerald-900">{analytics.fleetUptimePct}%</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">Mean Time To Repair (MTTR)</p>
          <p className="text-2xl font-bold text-blue-900">{analytics.meanTimeToRepairHours} hrs</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">Mean Time Between Failures</p>
          <p className="text-2xl font-bold text-purple-900">{analytics.meanTimeBetweenFailuresHours} hrs</p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700">Total Downtime This Month</p>
          <p className="text-2xl font-bold text-amber-900">{analytics.totalDowntimeHoursMonth} hrs</p>
        </Card>
      </div>

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
