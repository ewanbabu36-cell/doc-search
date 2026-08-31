import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto } from '@docsearch/api-contracts';

interface Props {
  assets: BiomedicalAssetDto[];
  onTransfer: (asset: BiomedicalAssetDto) => void;
  onEdit: (asset: BiomedicalAssetDto) => void;
  onCondemn: (asset: BiomedicalAssetDto) => void;
  onSelect: (asset: BiomedicalAssetDto) => void;
}

export const AssetControlCenterView: React.FC<Props> = ({ assets, onTransfer, onEdit, onCondemn, onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Healthcare Technology Management (HTM) Asset Fleet Registry</h2>
          <p className="text-xs text-gray-500">Real-time status, preventive maintenance tracking, QR identifier, and contract SLAs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-gray-900">{asset.assetCode}</span>
              <Badge variant={asset.operationalStatus === 'IN_SERVICE' ? 'success' : asset.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN' ? 'danger' : 'warning'}>
                {asset.operationalStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 line-clamp-1">{asset.assetName}</p>
              <p className="text-xs text-gray-500">{asset.manufacturer} | Model: {asset.modelNumber}</p>
              <p className="text-xs text-gray-600 mt-1">📍 <strong>{asset.departmentName}</strong></p>
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
              <Button variant="outline" size="sm" onClick={() => onSelect(asset)}>View Details</Button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => onTransfer(asset)}>Transfer</Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(asset)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => onCondemn(asset)}>Scrap</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
