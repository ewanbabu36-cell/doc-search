import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { SendMedicationReminderRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SendMedicationReminderRequest) => Promise<void>;
}

export const SendMedicationReminderDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [phoneNumber, setPhoneNumber] = useState('+91 98201 54321');
  const [drugName, setDrugName] = useState('Telmisartan 40mg + Atorvastatin 20mg');
  const [dosageInstructions, setDosageInstructions] = useState('1 Tablet morning with water. Your current 30-day supply has 3 days remaining. Tap below to order home delivery refill.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientMrn,
        phoneNumber,
        drugName,
        dosageInstructions
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-purple-900">⏰ Medication Refill & Adherence Reminder</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Mobile (10-Digit)</label>
              <div className="flex items-center">
                <span className="px-2 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-xs font-bold text-gray-700">+91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(digits.slice(0, 10));
                  }}
                  maxLength={10}
                  placeholder="98765 43210"
                  className="w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Medication Name(s)</label>
            <Input value={drugName} onChange={(e) => setDrugName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reminder Instructions & 1-Click Refill Action</label>
            <Input value={dosageInstructions} onChange={(e) => setDosageInstructions(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule WhatsApp Refill Alert'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
