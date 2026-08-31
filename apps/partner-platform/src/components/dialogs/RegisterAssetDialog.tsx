import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateBiomedicalAssetRequest, AssetCategory, AssetRiskCriticality, MaintenanceContractType, PpmFrequency } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBiomedicalAssetRequest) => Promise<void>;
}

export const RegisterAssetDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState<AssetCategory>('BIOMEDICAL_LIFE_SUPPORT');
  const [riskCriticality, setRiskCriticality] = useState<AssetRiskCriticality>('CRITICAL_LIFE_SUPPORT');
  const [departmentName, setDepartmentName] = useState('Intensive Care Unit (ICU-A)');
  const [physicalLocation, setPhysicalLocation] = useState('Floor 3, ICU Bed 01');
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [purchaseCost, setPurchaseCost] = useState(1500000);
  const [contractType, setContractType] = useState<MaintenanceContractType>('COMPREHENSIVE_CMC');
  const [contractVendorName, setContractVendorName] = useState('');
  const [ppmFrequency, setPpmFrequency] = useState<PpmFrequency>('QUARTERLY');
  const [calibrationFrequencyMonths, setCalibrationFrequencyMonths] = useState(12);
  const [responsibleBiomedicalEngineer, setResponsibleBiomedicalEngineer] = useState('Er. Rajesh Nair (Sr. BME)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetCode,
        assetName,
        modelNumber,
        serialNumber,
        manufacturer,
        category,
        riskCriticality,
        departmentName,
        physicalLocation,
        installationDate,
        purchaseDate,
        purchaseCost,
        contractType,
        contractVendorName,
        ppmFrequency,
        calibrationFrequencyMonths,
        responsibleBiomedicalEngineer
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Commission & Tag Biomedical Asset</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Asset Tag / Code</label>
              <Input value={assetCode} onChange={(e) => setAssetCode(e.target.value)} placeholder="e.g. ASSET-VENT-012" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Name</label>
              <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g. Servo-u Mechanical Ventilator" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Model #</label>
              <Input value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} placeholder="e.g. Servo-u" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Serial #</label>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="e.g. SN-88219" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturer</label>
              <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="e.g. Getinge Group" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Asset Category</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                options={[
                  { value: 'BIOMEDICAL_LIFE_SUPPORT', label: 'Life Support / Critical Care' },
                  { value: 'BIOMEDICAL_DIAGNOSTIC', label: 'Biomedical Diagnostic' },
                  { value: 'BIOMEDICAL_THERAPEUTIC', label: 'Biomedical Therapeutic' },
                  { value: 'IMAGING_RADIOLOGY', label: 'Imaging & Radiology' },
                  { value: 'SURGICAL_OT', label: 'Surgical / OT Suite' },
                  { value: 'LABORATORY', label: 'Clinical Laboratory' },
                  { value: 'FACILITY_HVAC_MGPS', label: 'Facility & Gas Plant (MGPS)' },
                  { value: 'ELECTRICAL_UPS', label: 'Electrical & UPS' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Risk Criticality (HTM)</label>
              <Select
                value={riskCriticality}
                onChange={(e) => setRiskCriticality(e.target.value as AssetRiskCriticality)}
                options={[
                  { value: 'CRITICAL_LIFE_SUPPORT', label: 'Class A: Critical Life-Support' },
                  { value: 'HIGH_RISK', label: 'Class B: High Risk' },
                  { value: 'MEDIUM_RISK', label: 'Class C: Medium Risk' },
                  { value: 'LOW_RISK_GENERAL', label: 'Class D: Low Risk / General' }
                ]}
              />
            </div>
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
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Installation Date</label>
              <Input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Date</label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Cost (₹)</label>
              <Input type="number" value={String(purchaseCost)} onChange={(e) => setPurchaseCost(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contract Type</label>
              <Select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as MaintenanceContractType)}
                options={[
                  { value: 'WARRANTY_OEM', label: 'OEM Manufacturer Warranty' },
                  { value: 'COMPREHENSIVE_CMC', label: 'Comprehensive CMC' },
                  { value: 'ANNUAL_MAINTENANCE_AMC', label: 'Non-Comprehensive AMC' },
                  { value: 'IN_HOUSE_BIOMEDICAL', label: 'In-House Biomedical Engineering' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contract Vendor / OEM</label>
              <Input value={contractVendorName} onChange={(e) => setContractVendorName(e.target.value)} placeholder="e.g. Getinge Medical India" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">PPM Frequency</label>
              <Select
                value={ppmFrequency}
                onChange={(e) => setPpmFrequency(e.target.value as PpmFrequency)}
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'QUARTERLY', label: 'Quarterly' },
                  { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
                  { value: 'ANNUAL', label: 'Annual' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Calibration Interval</label>
              <Input type="number" value={String(calibrationFrequencyMonths)} onChange={(e) => setCalibrationFrequencyMonths(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible BME</label>
              <Input value={responsibleBiomedicalEngineer} onChange={(e) => setResponsibleBiomedicalEngineer(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register & Generate QR Tag'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
