import React from 'react';
import { Card, Button } from '@docsearch/ui-kit';
import type { VendorServiceVisitDto } from '@docsearch/api-contracts';

interface Props {
  visits: VendorServiceVisitDto[];
  onLogVisit: () => void;
}

export const VendorOemManagementView: React.FC<Props> = ({ visits, onLogVisit }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">OEM & Third-Party Vendor Service Management</h2>
          <p className="text-xs text-gray-500">Field service engineer visit logs, service reports, vendor ratings & invoices</p>
        </div>
        <Button variant="primary" onClick={onLogVisit}>+ Log Vendor Service Visit</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visits.map((v) => (
          <Card key={v.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <span className="text-xs font-bold text-gray-900">{v.visitCode}</span>
                <span className="text-xs text-blue-700 block">{v.vendorName}</span>
              </div>
              <span className="text-xs font-bold text-amber-600">⭐ {v.vendorPerformanceRating}/5</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{v.assetName} ({v.assetCode})</p>
              <p className="text-xs text-gray-500">Engineer: {v.serviceEngineerName} ({v.contactPhone})</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="text-gray-700"><strong>Report #:</strong> {v.serviceReportNumber}</p>
              <p className="text-gray-600"><strong>Summary:</strong> {v.serviceSummary}</p>
              <p className="text-gray-700 font-semibold">Service Charge: ₹{v.serviceCost.toLocaleString()}</p>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
              <span>Date: {v.visitDate}</span>
              <span>Witnessed by: {v.hospitalSupervisorName}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
