import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { RadiologyOrderDto } from '@docsearch/api-contracts';

interface Props {
  orders: RadiologyOrderDto[];
  onStartProcedure: (order: RadiologyOrderDto) => void;
  onCompleteProcedure: (order: RadiologyOrderDto) => void;
}

export const RadiologyTechnologistWorklistView: React.FC<Props> = ({
  orders,
  onStartProcedure,
  onCompleteProcedure
}) => {
  const activeOrders = orders.filter((o) => o.status === 'SCHEDULED' || o.status === 'IN_PROGRESS');

  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Technologist Acquisition Worklist</h3>
          <p className="text-xs text-gray-500">Active scanner queue for scanning, contrast tracking & PACS push</p>
        </div>
        <Badge variant="primary">{activeOrders.length} Active Queue</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Order #</th>
              <th className="py-2.5 px-3">Patient & MRN</th>
              <th className="py-2.5 px-3">Procedure</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Contrast</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{order.orderNumber}</td>
                <td className="py-2.5 px-3 font-semibold text-gray-900">{order.patientName}</td>
                <td className="py-2.5 px-3 text-gray-800">{order.procedureName}</td>
                <td className="py-2.5 px-3">
                  <Badge variant={order.priority === 'STAT_EMERGENCY_IMMEDIATE' ? 'danger' : 'neutral'}>
                    {order.priority}
                  </Badge>
                </td>
                <td className="py-2.5 px-3">{order.requiresContrast ? '⚠️ Required' : 'None'}</td>
                <td className="py-2.5 px-3">
                  <Badge variant={order.status === 'IN_PROGRESS' ? 'warning' : 'primary'}>
                    {order.status}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right space-x-2">
                  {order.status === 'SCHEDULED' && (
                    <Button variant="primary" size="sm" onClick={() => onStartProcedure(order)}>Start Scan</Button>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <Button variant="primary" size="sm" onClick={() => onCompleteProcedure(order)}>Complete &amp; Push</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
