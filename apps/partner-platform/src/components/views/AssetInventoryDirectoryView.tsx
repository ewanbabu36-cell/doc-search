import React, { useState } from 'react';
import { Card, Badge, Button, Input } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto } from '@docsearch/api-contracts';

interface Props {
  assets: BiomedicalAssetDto[];
  onSelect: (asset: BiomedicalAssetDto) => void;
  onRegister: () => void;
  onTransfer?: (asset: BiomedicalAssetDto) => void;
  onEdit?: (asset: BiomedicalAssetDto) => void;
  onCondemn?: (asset: BiomedicalAssetDto) => void;
}

export const AssetInventoryDirectoryView: React.FC<Props> = ({
  assets,
  onSelect,
  onRegister,
  onTransfer,
  onEdit,
  onCondemn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  const filtered = assets.filter((a) => {
    const matchSearch =
      a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'ALL' || a.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hospital Asset & Biomedical Equipment Fleet Directory</h2>
          <p className="text-xs text-gray-500">
            Real-time equipment tracking, preventive maintenance (PPM), and fleet service management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md shadow-sm border border-gray-300 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1 text-xs font-bold rounded ${
                viewMode === 'TABLE' ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ☰ Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`px-3 py-1 text-xs font-bold rounded ${
                viewMode === 'GRID' ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⊞ Fleet Grid
            </button>
          </div>
          <Button variant="primary" onClick={onRegister}>
            + Register New Asset
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search equipment, S/N, department, manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 bg-white"
        >
          <option value="ALL">All Asset Categories ({assets.length})</option>
          <option value="BIOMEDICAL_LIFE_SUPPORT">Life Support</option>
          <option value="BIOMEDICAL_DIAGNOSTIC">Diagnostic</option>
          <option value="BIOMEDICAL_THERAPEUTIC">Therapeutic</option>
          <option value="IMAGING_RADIOLOGY">Imaging & Radiology</option>
          <option value="SURGICAL_OT">Surgical OT</option>
          <option value="FACILITY_HVAC_MGPS">Facility & MGPS</option>
        </select>
      </div>

      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset) => (
            <Card key={asset.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-gray-900">{asset.assetCode}</span>
                <Badge
                  variant={
                    asset.operationalStatus === 'IN_SERVICE'
                      ? 'success'
                      : asset.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {asset.operationalStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{asset.assetName}</p>
                <p className="text-xs text-gray-500">
                  {asset.manufacturer} | Model: {asset.modelNumber}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  📍 <strong>{asset.departmentName}</strong>
                </p>
                <p className="text-xs text-gray-500">{asset.physicalLocation}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Criticality:</span>
                  <span className="font-semibold text-gray-700">{asset.riskCriticality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contract:</span>
                  <span className="font-semibold text-blue-700">{asset.contractType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next PPM:</span>
                  <span className="font-semibold text-gray-700">{asset.nextPpmDueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Calibration:</span>
                  <span className="font-semibold text-emerald-700">{asset.calibrationStatus}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <Button variant="outline" size="sm" onClick={() => onSelect(asset)}>
                  View Details
                </Button>
                <div className="flex items-center gap-1">
                  {onTransfer && (
                    <Button variant="outline" size="sm" onClick={() => onTransfer(asset)}>
                      Transfer
                    </Button>
                  )}
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(asset)}>
                      Edit
                    </Button>
                  )}
                  {onCondemn && (
                    <Button variant="danger" size="sm" onClick={() => onCondemn(asset)}>
                      Scrap
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
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
                    <p className="text-gray-500">
                      {asset.manufacturer} | {asset.modelNumber}
                    </p>
                  </td>
                  <td className="p-3">
                    <Badge variant={asset.riskCriticality === 'CRITICAL_LIFE_SUPPORT' ? 'danger' : 'neutral'}>
                      {asset.riskCriticality}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <p className="font-medium text-gray-800">{asset.departmentName}</p>
                    <p className="text-gray-500">{asset.physicalLocation}</p>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        asset.operationalStatus === 'IN_SERVICE'
                          ? 'success'
                          : asset.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {asset.operationalStatus}
                    </Badge>
                  </td>
                  <td className="p-3 text-gray-700">{asset.nextPpmDueDate}</td>
                  <td className="p-3">
                    <span className="font-semibold text-emerald-700">{asset.calibrationStatus}</span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => onSelect(asset)}>
                        Details
                      </Button>
                      {onTransfer && (
                        <Button variant="outline" size="sm" onClick={() => onTransfer(asset)}>
                          Transfer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
