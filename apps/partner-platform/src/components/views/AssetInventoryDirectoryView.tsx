import React, { useState } from 'react';
import { Card, Badge, Button, Input } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto } from '@docsearch/api-contracts';

interface Props {
  assets: BiomedicalAssetDto[];
  onSelect: (asset: BiomedicalAssetDto) => void;
  onRegister: () => void;
}

export const AssetInventoryDirectoryView: React.FC<Props> = ({ assets, onSelect, onRegister }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filtered = assets.filter((a) => {
    const matchSearch = a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'ALL' || a.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hospital Asset & Biomedical Equipment Directory</h2>
          <p className="text-xs text-gray-500">Search by asset code, name, department, or classification category</p>
        </div>
        <Button variant="primary" onClick={onRegister}>+ Register New Asset</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Search equipment, S/N, department, manufacturer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 bg-white"
        >
          <option value="ALL">All Asset Categories</option>
          <option value="BIOMEDICAL_LIFE_SUPPORT">Life Support</option>
          <option value="BIOMEDICAL_DIAGNOSTIC">Diagnostic</option>
          <option value="BIOMEDICAL_THERAPEUTIC">Therapeutic</option>
          <option value="IMAGING_RADIOLOGY">Imaging & Radiology</option>
          <option value="SURGICAL_OT">Surgical OT</option>
          <option value="FACILITY_HVAC_MGPS">Facility & MGPS</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100 border-b text-gray-700 font-semibold">
            <tr>
              <th className="p-3">Asset Code</th>
              <th className="p-3">Equipment Name & Model</th>
              <th className="p-3">Category / Risk</th>
              <th className="p-3">Department & Location</th>
              <th className="p-3">Status</th>
              <th className="p-3">Next PPM</th>
              <th className="p-3">Calibration</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">{asset.assetCode}</td>
                <td className="p-3">
                  <p className="font-semibold text-gray-800">{asset.assetName}</p>
                  <p className="text-gray-500">{asset.manufacturer} | {asset.modelNumber}</p>
                </td>
                <td className="p-3">
                  <Badge variant={asset.riskCriticality === 'CRITICAL_LIFE_SUPPORT' ? 'danger' : 'neutral'}>{asset.riskCriticality}</Badge>
                </td>
                <td className="p-3">
                  <p className="font-medium text-gray-800">{asset.departmentName}</p>
                  <p className="text-gray-500">{asset.physicalLocation}</p>
                </td>
                <td className="p-3">
                  <Badge variant={asset.operationalStatus === 'IN_SERVICE' ? 'success' : asset.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN' ? 'danger' : 'warning'}>
                    {asset.operationalStatus}
                  </Badge>
                </td>
                <td className="p-3 text-gray-700">{asset.nextPpmDueDate}</td>
                <td className="p-3">
                  <span className="font-semibold text-emerald-700">{asset.calibrationStatus}</span>
                </td>
                <td className="p-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => onSelect(asset)}>Details</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
