import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateAbhaNumberRequest, AbhaAuthMode } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAbhaNumberRequest) => Promise<void>;
}

export const CreateAbhaNumberDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [patientName, setPatientName] = useState('Gopal Krishna');
  const [mobileNumber, setMobileNumber] = useState('+91 9876543210');
  const [aadhaarNumberLast4, setAadhaarNumberLast4] = useState('1234');
  const [preferredAbhaAddress, setPreferredAbhaAddress] = useState('gopal.krishna');
  const [authMode, setAuthMode] = useState<AbhaAuthMode>('AADHAAR_OTP');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientMrn,
        patientName,
        mobileNumber,
        aadhaarNumberLast4,
        preferredAbhaAddress,
        authMode
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-blue-900">🇮🇳 Create & Link ABHA ID (Milestone 1)</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            🟢 NHA Sandbox (dev.abdm.gov.in)
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 bg-slate-50 p-2 rounded border">
          <span>Official National Health Authority (NHA) Sandbox API v0.5</span>
          <button
            type="button"
            onClick={() => {
              setPatientMrn('MRN-2026-' + Math.floor(1000 + Math.random() * 9000));
              setPatientName('Aarav Sharma');
              setMobileNumber('9810123456');
              setAadhaarNumberLast4('8890');
              setPreferredAbhaAddress('aarav.sharma');
            }}
            className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
          >
            ✨ Fill Demo Sandbox Data
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number (10-Digit Mobile)</label>
              <div className="flex items-center">
                <span className="px-2.5 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-xs font-bold text-gray-700">+91</span>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setMobileNumber(digits.slice(0, 10));
                  }}
                  maxLength={10}
                  placeholder="98765 43210"
                  className="w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Aadhaar (Last 4)</label>
              <Input value={aadhaarNumberLast4} maxLength={4} onChange={(e) => setAadhaarNumberLast4(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred ABHA Handle (@abdm)</label>
            <Input value={preferredAbhaAddress} onChange={(e) => setPreferredAbhaAddress(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authentication Mode</label>
            <Select
              value={authMode}
              onChange={(e) => setAuthMode(e.target.value as AbhaAuthMode)}
              options={[
                { value: 'AADHAAR_OTP', label: 'Aadhaar OTP (UIDAI Gateway)' },
                { value: 'MOBILE_OTP', label: 'Mobile SMS OTP' },
                { value: 'DEMOGRAPHICS', label: 'Demographic Match' },
                { value: 'BIOMETRIC_IRIS_FINGERPRINT', label: 'Biometric Iris / Fingerprint' }
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Authorizing NHA Gateway...' : 'Generate 14-Digit ABHA'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
