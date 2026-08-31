import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { BloodBankAnalyticsDto } from '@docsearch/api-contracts';

interface Props {
  analytics: BloodBankAnalyticsDto;
}

export const BloodBankAnalyticsView: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blood Bank & Transfusion Medicine Analytics</h2>
        <p className="text-xs text-gray-500">Utilization trends, blood-group distribution, collection volumes & wastage metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Inventory Distribution by Blood Group</h3>
          <div className="space-y-3">
            {analytics.inventoryByBloodGroup.map((item) => (
              <div key={item.group} className="flex justify-between items-center text-sm border-b pb-2">
                <span className="font-semibold text-gray-700">{item.group}</span>
                <span className="font-black text-red-600">{item.count} units</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Transfusion Demand by Department</h3>
          <div className="space-y-3">
            {analytics.transfusionsByDepartment.map((item) => (
              <div key={item.department} className="flex justify-between items-center text-sm border-b pb-2">
                <span className="font-semibold text-gray-700">{item.department}</span>
                <span className="font-black text-blue-600">{item.count} transfusions</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Monthly Voluntary Donation Growth</h3>
          <div className="space-y-3">
            {analytics.monthlyDonationTrends.map((item) => (
              <div key={item.month} className="flex justify-between items-center text-sm border-b pb-2">
                <span className="font-semibold text-gray-700">{item.month}</span>
                <span className="font-black text-green-700">{item.count} donors</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Component Discard & Wastage Analysis</h3>
          <div className="space-y-3">
            {analytics.wastageReasons.map((item) => (
              <div key={item.reason} className="flex justify-between items-center text-sm border-b pb-2">
                <span className="font-semibold text-gray-700">{item.reason}</span>
                <span className="font-black text-amber-700">{item.count} units</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
