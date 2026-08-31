import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateDietaryBillingReferenceRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDietaryBillingReferenceRequest) => Promise<void>;
}

export const CreateBillingReferenceDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [dietTypeName, setDietTypeName] = useState('Diabetic Low-Glycemic Index (1800 kcal)');
  const [chargeCategory, setChargeCategory] = useState('THERAPEUTIC_DIET_PLAN');
  const [amount, setAmount] = useState(350);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientId: crypto.randomUUID(),
        patientName,
        patientMrn,
        dietTypeName,
        chargeCategory,
        amount
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Post Dietary Charge to Patient Billing</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">MRN</label>
            <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Diet Profile Name</label>
            <Input value={dietTypeName} onChange={(e) => setDietTypeName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Charge Category</label>
            <Select
              value={chargeCategory}
              onChange={(e) => setChargeCategory(e.target.value)}
              options={[
                { value: 'STANDARD_MEAL_PLAN', label: 'Standard Inpatient Meal Plan' },
                { value: 'THERAPEUTIC_DIET_PLAN', label: 'Therapeutic Nutrition Surcharge' },
                { value: 'ENTERAL_NUTRITION', label: 'Enteral Tube Feed Formula' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Charge Amount (₹)</label>
            <Input type="number" value={String(amount)} onChange={(e) => setAmount(Number(e.target.value))} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post Charge to RCM'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
