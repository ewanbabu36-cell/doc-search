import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, LogVendorVisitRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  assets: BiomedicalAssetDto[];
  onClose: () => void;
  onSubmit: (data: LogVendorVisitRequest) => Promise<void>;
}

export const LogVendorVisitDialog: React.FC<Props> = ({ isOpen, assets, onClose, onSubmit }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [vendorName, setVendorName] = useState('Siemens Healthcare Private Limited');
  const [serviceEngineerName, setServiceEngineerName] = useState('Mr. Arvind Saxena (OEM Specialist)');
  const [contactPhone, setContactPhone] = useState('+91 98200 44123');
  const [visitType, setVisitType] = useState<'PPM_SERVICE' | 'BREAKDOWN_CALL' | 'INSTALLATION_COMMISSIONING' | 'CALIBRATION_AUDIT' | 'SAFETY_UPGRADE'>('BREAKDOWN_CALL');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [serviceReportNumber, setServiceReportNumber] = useState('');
  const [serviceSummary, setServiceSummary] = useState('');
  const [serviceCost, setServiceCost] = useState(0);
  const [vendorPerformanceRating, setVendorPerformanceRating] = useState(5);
  const [hospitalSupervisorName, setHospitalSupervisorName] = useState('Er. Rajesh Nair');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: selectedAssetId,
        vendorName,
        serviceEngineerName,
        contactPhone,
        visitType,
        visitDate,
        serviceReportNumber,
        serviceSummary,
        serviceCost,
        vendorPerformanceRating,
        hospitalSupervisorName
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Log OEM / Vendor Service Engineer Visit</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Asset</label>
            <Select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              options={assets.map((a) => ({ value: a.id, label: `${a.assetCode} - ${a.assetName}` }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vendor / OEM Name</label>
              <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Service Engineer</label>
              <Input value={serviceEngineerName} onChange={(e) => setServiceEngineerName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Visit Type</label>
              <Select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as 'PPM_SERVICE' | 'BREAKDOWN_CALL' | 'INSTALLATION_COMMISSIONING' | 'CALIBRATION_AUDIT' | 'SAFETY_UPGRADE')}
                options={[
                  { value: 'PPM_SERVICE', label: 'Scheduled PPM Service' },
                  { value: 'BREAKDOWN_CALL', label: 'Emergency Breakdown Call' },
                  { value: 'INSTALLATION_COMMISSIONING', label: 'Installation & Commissioning' },
                  { value: 'CALIBRATION_AUDIT', label: 'Calibration & Metrology Audit' }
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Service Report #</label>
              <Input value={serviceReportNumber} onChange={(e) => setServiceReportNumber(e.target.value)} placeholder="e.g. SR-OEM-2026-99" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Visit Date</label>
              <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Service Summary & Replaced Parts</label>
            <Input value={serviceSummary} onChange={(e) => setServiceSummary(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Service Invoice / Charge (₹)</label>
              <Input type="number" value={String(serviceCost)} onChange={(e) => setServiceCost(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rating (1 to 5 Stars)</label>
              <Input type="number" min="1" max="5" value={String(vendorPerformanceRating)} onChange={(e) => setVendorPerformanceRating(Number(e.target.value))} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital Supervisor / Witness</label>
            <Input value={hospitalSupervisorName} onChange={(e) => setHospitalSupervisorName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Record Service Visit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
