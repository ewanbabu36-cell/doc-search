import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { RegisterIotDeviceRequest, IotDeviceType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RegisterIotDeviceRequest) => Promise<void>;
}

export const RegisterIotDeviceDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [deviceSerial, setDeviceSerial] = useState('SN-OX-BLE-8820');
  const [deviceModel, setDeviceModel] = useState('Masimo MightySat BLE Pulse Oximeter');
  const [deviceType, setDeviceType] = useState<IotDeviceType>('PULSE_OXIMETER');
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [patientName, setPatientName] = useState('Gopal Krishna');
  const [connectionProtocol, setConnectionProtocol] = useState<'BLUETOOTH_BLE' | 'WIFI_DIRECT' | 'CELLULAR_4G_GATEWAY'>('BLUETOOTH_BLE');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        deviceSerial,
        deviceModel,
        deviceType,
        patientMrn,
        patientName,
        connectionProtocol
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-blue-900">📡 Register & Pair IoT Medical Device</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Device Serial #</label>
              <Input value={deviceSerial} onChange={(e) => setDeviceSerial(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Device Model</label>
              <Input value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Device Category</label>
            <Select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as IotDeviceType)}
              options={[
                { value: 'PULSE_OXIMETER', label: 'Pulse Oximeter (SpO2 / Pulse)' },
                { value: 'BLOOD_PRESSURE_MONITOR', label: 'Smart BP Monitor (NIBP)' },
                { value: 'GLUCOMETER_CGM', label: 'Continuous Glucose Monitor (CGM)' },
                { value: 'ECG_PATCH_MONITOR', label: 'Wireless ECG Patch / Holter' },
                { value: 'SMART_WEIGHT_SCALE', label: 'Smart Weight Scale (CHF Tracking)' },
                { value: 'DIGITAL_SPIROMETER', label: 'Digital Spirometer (FEV1 / PEFR)' }
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Gateway Protocol</label>
            <Select
              value={connectionProtocol}
              onChange={(e) => setConnectionProtocol(e.target.value as 'BLUETOOTH_BLE' | 'WIFI_DIRECT' | 'CELLULAR_4G_GATEWAY')}
              options={[
                { value: 'BLUETOOTH_BLE', label: 'Bluetooth Low Energy (BLE 5.2)' },
                { value: 'WIFI_DIRECT', label: 'Direct Secure WiFi (WPA3 Enterprise)' },
                { value: 'CELLULAR_4G_GATEWAY', label: 'Standalone 4G/LTE Smart Hub' }
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Pairing Device...' : 'Pair & Connect IoT Device'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
