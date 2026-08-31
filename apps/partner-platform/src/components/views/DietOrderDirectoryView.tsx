import React, { useState } from 'react';
import { Card, Button, Badge, Input, Select } from '@docsearch/ui-kit';
import type { DietaryOrderDto } from '@docsearch/api-contracts';

interface Props {
  orders: DietaryOrderDto[];
  onOpenOrder: (order: DietaryOrderDto) => void;
  onNewOrder: () => void;
  onApproveOrder: (order: DietaryOrderDto) => void;
  onModifyOrder: (order: DietaryOrderDto) => void;
}

export const DietOrderDirectoryView: React.FC<Props> = ({
  orders,
  onOpenOrder,
  onNewOrder,
  onApproveOrder,
  onModifyOrder
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.patientName.toLowerCase().includes(search.toLowerCase()) ||
      o.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.wardName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inpatient Clinical Diet Orders Directory</h1>
          <p className="text-xs text-gray-500">Active medical diet orders, therapeutic restrictions, NPO status, and dietitian reviews</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewOrder}>+ Prescribe Diet Order</Button>
      </div>

      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Input placeholder="Search orders by patient, MRN, order #, ward..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'ACTIVE', label: 'Active Orders' },
            { value: 'APPROVED', label: 'Approved by Dietitian' },
            { value: 'ORDERED', label: 'Ordered / Pending Review' },
            { value: 'MODIFIED', label: 'Modified' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]}
        />
      </Card>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Patient / MRN</th>
                <th className="py-2.5 px-3">Ward & Bed</th>
                <th className="py-2.5 px-3">Diet Prescription</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Doctor</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-blue-600 cursor-pointer" onClick={() => onOpenOrder(o)}>{o.orderNumber}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-gray-900">{o.patientName}</p>
                    <p className="text-[11px] text-gray-500">{o.patientMrn}</p>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-700">{o.wardName} - {o.roomBedNumber}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-gray-900">{o.dietTypeName}</span>
                    {o.isNpo && <Badge variant="danger" className="ml-1">NPO</Badge>}
                  </td>
                  <td className="py-2.5 px-3"><Badge variant={o.priority === 'STAT_EMERGENCY' ? 'danger' : 'primary'}>{o.priority}</Badge></td>
                  <td className="py-2.5 px-3 text-gray-600">{o.orderingDoctor}</td>
                  <td className="py-2.5 px-3"><Badge variant={o.status === 'ACTIVE' ? 'primary' : 'neutral'}>{o.status}</Badge></td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    {o.status === 'ORDERED' && (
                      <Button variant="primary" size="sm" onClick={() => onApproveOrder(o)}>Approve</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onModifyOrder(o)}>Modify</Button>
                    <Button variant="subtle" size="sm" onClick={() => onOpenOrder(o)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
