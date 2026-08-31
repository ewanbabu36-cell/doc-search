import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto } from '@docsearch/api-contracts';

interface Props {
  assets: BiomedicalAssetDto[];
}

export const AssetFinancialsView: React.FC<Props> = ({ assets }) => {
  const totalPurchase = assets.reduce((sum, a) => sum + a.purchaseCost, 0);
  const totalCurrent = assets.reduce((sum, a) => sum + a.currentValue, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Biomedical Asset Valuation & Depreciation Financials</h2>
        <p className="text-xs text-gray-500">Book value, straight-line depreciation, and maintenance cost of ownership (TCO)</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700">Gross Acquisition Cost</p>
          <p className="text-2xl font-bold text-blue-900">₹{totalPurchase.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">Current Net Book Value</p>
          <p className="text-2xl font-bold text-emerald-900">₹{totalCurrent.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-xs font-semibold text-purple-700">Total Accumulated Depreciation</p>
          <p className="text-2xl font-bold text-purple-900">₹{(totalPurchase - totalCurrent).toLocaleString()}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100 border-b font-semibold text-gray-700">
            <tr>
              <th className="p-3">Asset Code</th>
              <th className="p-3">Equipment</th>
              <th className="p-3">Purchase Date</th>
              <th className="p-3">Acquisition Cost</th>
              <th className="p-3">Current Book Value</th>
              <th className="p-3">Contract SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assets.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">{a.assetCode}</td>
                <td className="p-3 font-medium text-gray-800">{a.assetName}</td>
                <td className="p-3 text-gray-600">{a.purchaseDate}</td>
                <td className="p-3 font-semibold text-gray-900">₹{a.purchaseCost.toLocaleString()}</td>
                <td className="p-3 font-semibold text-emerald-700">₹{a.currentValue.toLocaleString()}</td>
                <td className="p-3 text-blue-700">{a.contractType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
