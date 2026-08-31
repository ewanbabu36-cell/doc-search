import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@docsearch/ui-kit';
import type { RadiologyOrderDto } from '@docsearch/api-contracts';

interface Props {
  orders: RadiologyOrderDto[];
  onOpenOrder: (order: RadiologyOrderDto) => void;
  onSchedule: (order: RadiologyOrderDto) => void;
  onCancel: (order: RadiologyOrderDto) => void;
  onOpenNewOrder: () => void;
}

export const RadiologyOrderDirectoryView: React.FC<Props> = ({
  orders,
  onOpenOrder,
  onSchedule,
  onCancel,
  onOpenNewOrder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.procedureName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Input
            placeholder="Search by Patient Name, MRN, Order #, or Procedure..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="ORDERED">Ordered</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REPORTED">Reported</option>
            <option value="VERIFIED">Verified</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <Button variant="primary" size="sm" onClick={onOpenNewOrder}>+ New Radiology Order</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Order Number</th>
              <th className="py-2.5 px-3">Patient & MRN</th>
              <th className="py-2.5 px-3">Procedure</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Ordering Doctor & Dept</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{order.orderNumber}</td>
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-gray-900">{order.patientName}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{order.patientMrn}</div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-medium text-gray-900">{order.procedureName}</div>
                  <div className="text-[10px] text-gray-500">{order.modalityType}</div>
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant={order.priority === 'STAT_EMERGENCY_IMMEDIATE' ? 'danger' : order.priority === 'URGENT_WITHIN_4_HOURS' ? 'warning' : 'neutral'}>
                    {order.priority}
                  </Badge>
                </td>
                <td className="py-2.5 px-3">
                  <div className="text-gray-800">{order.orderingDoctorName}</div>
                  <div className="text-[10px] text-gray-500">{order.orderingDepartment}</div>
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant={order.status === 'VERIFIED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'primary'}>
                    {order.status}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => onOpenOrder(order)}>View</Button>
                  {order.status === 'ORDERED' && (
                    <Button variant="primary" size="sm" onClick={() => onSchedule(order)}>Schedule</Button>
                  )}
                  {order.status !== 'CANCELLED' && order.status !== 'VERIFIED' && (
                    <Button variant="danger" size="sm" onClick={() => onCancel(order)}>Cancel</Button>
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
