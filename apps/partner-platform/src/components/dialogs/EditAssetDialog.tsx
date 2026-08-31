import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, UpdateBiomedicalAssetRequest, AssetOperationalStatus, MaintenanceContractType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  asset: BiomedicalAssetDto;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateBiomedicalAssetRequest) => Promise<void>;
}

export const EditAssetDialog: React.FC<Props> = ({ isOpen, asset, onClose, onSubmit }) => {
  const [assetName, setAssetName] = useState(asset.assetName);
  const [departmentName, setDepartmentName] = useState(asset.departmentName);
  const [physicalLocation, setPhysicalLocation] = useState(asset.physicalLocation);
  const [operationalStatus, setOperationalStatus] = useState<AssetOperationalStatus>(asset.operationalStatus);
  const [contractType, setContractType] = useState<MaintenanceContractType>(asset.contractType);
  const [contractVendorName, setContractVendorName] = useState(asset.contractVendorName);
  const [responsibleBiomedicalEngineer, setResponsibleBiomedicalEngineer] = useState(asset.responsibleBiomedicalEngineer);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(asset.id, {
        assetName,
        departmentName,
        physicalLocation,
        operationalStatus,
        contractType,
        contractVendorName,
        responsibleBiomedicalEngineer
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Update Asset Parameters ({asset.assetCode})</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Asset Name</label>
            <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Physical Location</label>
              <Input value={physicalLocation} onChange={(e) => setPhysicalLocation(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Operational Status</label>
            <Select
              value={operationalStatus}
              onChange={(e) => setOperationalStatus(e.target.value as AssetOperationalStatus)}
              options={[
                { value: 'IN_SERVICE', label: 'In Service / Active' },
                { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
                { value: 'OUT_OF_SERVICE_BREAKDOWN', label: 'Out of Service (Breakdown)' },
                { value: 'STANDBY_READY', label: 'Standby / Backup Ready' },
                { value: 'CALIBRATION_OVERDUE', label: 'Calibration Overdue' },
                { value: 'DECOMMISSIONED_CONDEMNED', label: 'Decommissioned / Condemned' }
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contract Type</label>
              <Select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as MaintenanceContractType)}
                options={[
                  { value: 'WARRANTY_OEM', label: 'OEM Warranty' },
                  { value: 'COMPREHENSIVE_CMC', label: 'Comprehensive CMC' },
                  { value: 'ANNUAL_MAINTENANCE_AMC', label: 'Annual AMC' },
                  { value: 'IN_HOUSE_BIOMEDICAL', label: 'In-House' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contract Vendor</label>
              <Input value={contractVendorName} onChange={(e) => setContractVendorName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible Biomedical Engineer</label>
            <Input value={responsibleBiomedicalEngineer} onChange={(e) => setResponsibleBiomedicalEngineer(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
