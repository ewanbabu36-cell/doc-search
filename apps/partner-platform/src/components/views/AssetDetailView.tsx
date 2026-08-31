import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, PpmScheduleDto, BreakdownWorkOrderDto, CalibrationRecordDto } from '@docsearch/api-contracts';

interface Props {
  asset: BiomedicalAssetDto;
  ppmSchedules: PpmScheduleDto[];
  workOrders: BreakdownWorkOrderDto[];
  calibrations: CalibrationRecordDto[];
  onBack: () => void;
  onEdit: (asset: BiomedicalAssetDto) => void;
  onTransfer: (asset: BiomedicalAssetDto) => void;
  onReportBreakdown: () => void;
}

export const AssetDetailView: React.FC<Props> = ({
  asset,
  ppmSchedules,
  workOrders,
  calibrations,
  onBack,
  onEdit,
  onTransfer,
  onReportBreakdown
}) => {
  const assetPpm = ppmSchedules.filter((p) => p.assetId === asset.id);
  const assetWo = workOrders.filter((w) => w.assetId === asset.id);
  const assetCal = calibrations.filter((c) => c.assetId === asset.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>← Back to Fleet</Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{asset.assetName}</h2>
            <p className="text-xs text-gray-500">Asset Tag: {asset.assetCode} | S/N: {asset.serialNumber} | QR: {asset.qrCodeIdentifier}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onTransfer(asset)}>Transfer Location</Button>
          <Button variant="outline" onClick={() => onEdit(asset)}>Edit Specifications</Button>
          <Button variant="danger" onClick={onReportBreakdown}>🚨 Log Breakdown</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-3 col-span-2">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Technical & Operational Specifications</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-500">Manufacturer</p>
              <p className="font-bold text-gray-800">{asset.manufacturer}</p>
            </div>
            <div>
              <p className="text-gray-500">Model Number</p>
              <p className="font-bold text-gray-800">{asset.modelNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-semibold text-gray-800">{asset.category}</p>
            </div>
            <div>
              <p className="text-gray-500">Risk Criticality</p>
              <Badge variant={asset.riskCriticality === 'CRITICAL_LIFE_SUPPORT' ? 'danger' : 'neutral'}>{asset.riskCriticality}</Badge>
            </div>
            <div>
              <p className="text-gray-500">Department</p>
              <p className="font-semibold text-gray-800">{asset.departmentName}</p>
            </div>
            <div>
              <p className="text-gray-500">Physical Location</p>
              <p className="font-semibold text-gray-800">{asset.physicalLocation}</p>
            </div>
            <div>
              <p className="text-gray-500">Installation Date</p>
              <p className="font-semibold text-gray-800">{asset.installationDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Purchase Cost / Current Book Value</p>
              <p className="font-semibold text-gray-800">₹{asset.purchaseCost.toLocaleString()} / ₹{asset.currentValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Contract SLA</p>
              <p className="font-semibold text-blue-700">{asset.contractType} ({asset.contractVendorName})</p>
            </div>
            <div>
              <p className="text-gray-500">Lead Biomedical Engineer</p>
              <p className="font-semibold text-gray-800">{asset.responsibleBiomedicalEngineer}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Safety & Metrology Status</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Operational State:</span>
              <Badge variant={asset.operationalStatus === 'IN_SERVICE' ? 'success' : 'danger'}>{asset.operationalStatus}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Fleet Uptime:</span>
              <span className="font-bold text-emerald-700">{asset.uptimePercentage}%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">IEC 62353 Safety Test:</span>
              <Badge variant="success">Certified Safe</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Calibration Status:</span>
              <Badge variant="success">{asset.calibrationStatus} ({assetCal.length} certs)</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Next PPM Due:</span>
              <span className="font-bold text-gray-800">{asset.nextPpmDueDate}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* History Tabs */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Preventive Maintenance Tasks ({assetPpm.length})</h3>
          {assetPpm.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">No PPM tasks recorded for this asset.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {assetPpm.map((p) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900">{p.scheduleCode}</span> ({p.frequency})
                    <p className="text-gray-500">Due: {p.scheduledDueDate} | Assigned: {p.assignedEngineer}</p>
                  </div>
                  <Badge variant={p.status === 'COMPLETED_PASS' ? 'success' : p.status === 'OVERDUE' ? 'danger' : 'neutral'}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Corrective Work Orders ({assetWo.length})</h3>
          {assetWo.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">No breakdown work orders on record.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {assetWo.map((w) => (
                <div key={w.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900">{w.workOrderNumber}</span>
                    <p className="text-gray-600 line-clamp-1">{w.problemDescription}</p>
                    <p className="text-gray-500">{w.reportedTime.split('T')[0]} | Labor: {w.laborHours}h</p>
                  </div>
                  <Badge variant={w.status === 'CLOSED' ? 'success' : 'danger'}>{w.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
