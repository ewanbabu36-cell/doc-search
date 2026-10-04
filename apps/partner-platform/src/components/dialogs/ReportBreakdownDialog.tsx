import React, { useState } from 'react';
import { Button, Input, Select, Badge } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, CreateWorkOrderRequest, WorkOrderPriority } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  isOpen: boolean;
  assets: BiomedicalAssetDto[];
  onClose: () => void;
  onSubmit: (data: CreateWorkOrderRequest) => Promise<void>;
}

export const ReportBreakdownDialog: React.FC<Props> = ({ isOpen, assets, onClose, onSubmit }) => {
  const [scannedQrCode, setScannedQrCode] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [problemDescription, setProblemDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('EMERGENCY_STAT');
  const [clinicalImpactLevel, setClinicalImpactLevel] = useState<'CRITICAL_PATIENT_SAFETY' | 'PROCEDURE_HALTED' | 'SUB_OPTIMAL_BACKUP_AVAILABLE' | 'ROUTINE_NO_IMPACT'>('PROCEDURE_HALTED');
  const [reportedByClinician, setReportedByClinician] = useState('Dr. Vivek Mehra (Surgeon) / Sr. Nurse Mary');
  const [departmentName, setDepartmentName] = useState(assets[0]?.departmentName || 'Operation Theatre Complex');
  const [roomBedLocation, setRoomBedLocation] = useState(assets[0]?.physicalLocation || 'OT Room 02');
  const [scannerActive, setScannerActive] = useState(false);
  const [alarmDispatched, setAlarmDispatched] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  const handleQrLookup = (qr: string) => {
    setScannedQrCode(qr);
    const matched = assets.find((a) => a.qrCodeIdentifier.toLowerCase() === qr.trim().toLowerCase());
    if (matched) {
      setSelectedAssetId(matched.id);
      setDepartmentName(matched.departmentName);
      setRoomBedLocation(matched.physicalLocation);
    }
  };

  const handleSimulateCameraScan = () => {
    setScannerActive(true);
    setTimeout(() => {
      // Simulate rapid camera QR recognition
      const sampleAsset = assets.find((a) => a.assetCode === 'BME-ANES-02') || assets[0];
      if (sampleAsset) {
        handleQrLookup(sampleAsset.qrCodeIdentifier);
      }
      setScannerActive(false);
    }, 600);
  };

  const failureTemplates = [
    { label: '💨 Pneumatic Leak / Pressure Drop', text: 'Pneumatic manifold pressure decay alarm >20mbar during delivery. Circuit integrity breached.' },
    { label: '🫁 Sensor Calibration Mismatch', text: 'Flow sensor O2/air volume calibration failure during automated pre-use checkout.' },
    { label: '⚡ Power / Battery Fault', text: 'Mains AC disconnection fault and backup battery discharge alarm under load.' },
    { label: '🛑 Vaporizer Lock Failure', text: 'Selectatec vaporizer interlock seating failure causing anesthetic gas bypass.' },
    { label: '📟 Display Freeze / UI Crash', text: 'Touchscreen unresponsive, waveforms frozen during active patient ventilation.' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: selectedAssetId,
        problemDescription,
        priority,
        clinicalImpactLevel,
        reportedByClinician,
        departmentName,
        roomBedLocation
      });

      // Dispatch real-time emergency BME alarm telemetry
      setAlarmDispatched(true);
      hospitalEventBus.publish(
        'BIOMEDICAL_BREAKDOWN_DISPATCHED',
        'MachineQrIncidentDesk',
        {
          assetCode: currentAsset?.assetCode,
          assetName: currentAsset?.assetName,
          qrCode: currentAsset?.qrCodeIdentifier,
          location: roomBedLocation,
          department: departmentName,
          priority,
          clinicalImpact: clinicalImpactLevel,
          assignedEngineer: currentAsset?.responsibleBiomedicalEngineer,
          reportedBy: reportedByClinician,
          reportedAt: new Date().toISOString()
        },
        `🚨 STAT BME Pager: Breakdown ticket dispatched for ${currentAsset?.assetName} (${currentAsset?.assetCode}) at ${roomBedLocation}. On-duty engineer alert sounding!`
      );

      setTimeout(() => {
        onClose();
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Machine QR-Code Incident Desk & Breakdown Dispatch</h2>
              <p className="text-xs text-gray-500">1-Tap bedside medical asset breakdown ticketing with audible BME pager paging</p>
            </div>
          </div>
          <Badge variant={priority === 'EMERGENCY_STAT' ? 'danger' : 'warning'}>
            {priority}
          </Badge>
        </div>

        {alarmDispatched && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-900 font-semibold flex items-center gap-2 animate-pulse">
            <span>🚨</span>
            <span>AUDIBLE ALARM DISPATCHED: On-Duty BME Engineer Pager Triggered! Response ETA: &lt;10 Mins.</span>
          </div>
        )}

        {/* QR Scanner Strip */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span>📷</span> Bedside Machine QR Scan
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulateCameraScan}
              disabled={scannerActive}
            >
              {scannerActive ? 'Scanning Device Sticker...' : '📸 1-Tap Camera Scan'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={scannedQrCode}
              onChange={(e) => handleQrLookup(e.target.value)}
              placeholder="Scan or type device QR (e.g. QR-BME-ANES-02)..."
              className="text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-blue-700">Quick QR Chips:</span>
            {assets.slice(0, 5).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handleQrLookup(a.qrCodeIdentifier)}
                className={`text-[11px] px-2 py-0.5 rounded font-mono border transition-all ${
                  currentAsset?.id === a.id
                    ? 'bg-blue-600 text-white border-blue-700 font-bold'
                    : 'bg-white text-blue-800 border-blue-300 hover:bg-blue-100'
                }`}
              >
                {a.qrCodeIdentifier}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Asset Verified Profile */}
        {currentAsset && (
          <div className="p-3 bg-gray-50 border rounded-lg grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500 font-medium">Scanned Equipment</p>
              <p className="font-bold text-gray-900 text-sm">{currentAsset.assetName}</p>
              <p className="text-gray-600 font-mono text-[11px]">Tag: {currentAsset.assetCode} | S/N: {currentAsset.serialNumber}</p>
              <p className="text-gray-500">{currentAsset.manufacturer}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Location:</span>
                <span className="font-semibold text-gray-800">{currentAsset.physicalLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status:</span>
                <Badge variant={currentAsset.operationalStatus === 'IN_SERVICE' ? 'success' : 'danger'}>
                  {currentAsset.operationalStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-gray-500">BME On-Duty Lead:</span>
                <span className="font-bold text-blue-700">{currentAsset.responsibleBiomedicalEngineer}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Selection (Manual Fallback)</label>
            <Select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                const a = assets.find((x) => x.id === e.target.value);
                if (a) {
                  setDepartmentName(a.departmentName);
                  setRoomBedLocation(a.physicalLocation);
                  setScannedQrCode(a.qrCodeIdentifier);
                }
              }}
              options={assets.map((a) => ({ value: a.id, label: `${a.qrCodeIdentifier} | ${a.assetCode} - ${a.assetName} (${a.physicalLocation})` }))}
            />
          </div>

          {/* Quick Problem Templates */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">1-Tap Symptom / Problem Templates</label>
            <div className="flex flex-wrap gap-1.5">
              {failureTemplates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setProblemDescription(t.text)}
                  className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border rounded-md text-gray-800 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Malfunction / Error Description</label>
            <Input
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Describe symptoms, alarms, error codes, error tone..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Urgency Priority</label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                options={[
                  { value: 'EMERGENCY_STAT', label: '🚨 STAT Emergency (Patient on Table / Life Support)' },
                  { value: 'URGENT', label: '⚠️ Urgent (Critical Ward / ICU Bed Block)' },
                  { value: 'ROUTINE', label: 'Routine (Non-critical / Standby Unit)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Impact Level</label>
              <Select
                value={clinicalImpactLevel}
                onChange={(e) => setClinicalImpactLevel(e.target.value as 'CRITICAL_PATIENT_SAFETY' | 'PROCEDURE_HALTED' | 'SUB_OPTIMAL_BACKUP_AVAILABLE' | 'ROUTINE_NO_IMPACT')}
                options={[
                  { value: 'CRITICAL_PATIENT_SAFETY', label: 'Critical Patient Safety Threat (Life Support)' },
                  { value: 'PROCEDURE_HALTED', label: 'Surgical / Clinical Procedure Halted' },
                  { value: 'SUB_OPTIMAL_BACKUP_AVAILABLE', label: 'Backup Unit Deployed to Bed' },
                  { value: 'ROUTINE_NO_IMPACT', label: 'Routine No Direct Patient Impact' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reporting Clinician / Staff Nurse</label>
              <Input value={reportedByClinician} onChange={(e) => setReportedByClinician(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ward / Room / Bed Location</label>
              <Input value={roomBedLocation} onChange={(e) => setRoomBedLocation(e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <span>🔔</span> Automated alarm notification sent to BME on-duty pager.
            </span>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button variant="danger" type="submit" disabled={loading || !problemDescription.trim()}>
                {loading ? 'Dispatching...' : '🚨 Dispatch 1-Tap Breakdown Ticket'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
