import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryBillingRefDto } from '@docsearch/api-contracts';

interface Props {
  billingRefs: DietaryBillingRefDto[];
  onPostCharge: () => void;
}

export const DietaryBillingView: React.FC<Props> = ({ billingRefs, onPostCharge }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dietary Charges & RCM Billing Integration</h1>
          <p className="text-xs text-gray-500">Post billable therapeutic meal plans, enteral feeds, and dietary surcharges to Revenue Cycle Management (RCM)</p>
        </div>
        <Button variant="primary" size="sm" onClick={onPostCharge}>+ Post Dietary Charge</Button>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="py-2.5 px-3">Charge Code</th>
                <th className="py-2.5 px-3">Patient Name / MRN</th>
                <th className="py-2.5 px-3">Diet Profile</th>
                <th className="py-2.5 px-3">Charge Category</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Billing Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billingRefs.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-blue-600">{b.chargeCode}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">{b.patientName} ({b.patientMrn})</td>
                  <td className="py-2.5 px-3 text-gray-700">{b.dietTypeName}</td>
                  <td className="py-2.5 px-3 text-gray-600">{b.chargeCategory}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">₹{b.amount}</td>
                  <td className="py-2.5 px-3"><Badge variant="primary">{b.billingStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
