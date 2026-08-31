import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryProcurementRefDto } from '@docsearch/api-contracts';

interface Props {
  procurementRefs: DietaryProcurementRefDto[];
  onRequestProcurement: () => void;
}

export const DietaryProcurementView: React.FC<Props> = ({ procurementRefs, onRequestProcurement }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Procurement & Supply Chain Requisitions</h1>
          <p className="text-xs text-gray-500">Bridge raw ingredient demand to Procurement & Supply Chain (Requisitions, POs, Vendor Contracts)</p>
        </div>
        <Button variant="primary" size="sm" onClick={onRequestProcurement}>+ Request Raw Ingredients</Button>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="py-2.5 px-3">Requisition #</th>
                <th className="py-2.5 px-3">Ingredient / Item</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Urgency</th>
                <th className="py-2.5 px-3">Vendor Reference</th>
                <th className="py-2.5 px-3">Requested By</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {procurementRefs.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-blue-600">{r.requisitionRefNumber}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">{r.ingredientName}</td>
                  <td className="py-2.5 px-3 text-gray-700">{r.quantityRequested} {r.unit}</td>
                  <td className="py-2.5 px-3"><Badge variant="primary">{r.urgency}</Badge></td>
                  <td className="py-2.5 px-3 text-gray-600">{r.vendorRef || 'Central Store'}</td>
                  <td className="py-2.5 px-3 text-gray-600">{r.requestedBy}</td>
                  <td className="py-2.5 px-3"><Badge variant="primary">{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
