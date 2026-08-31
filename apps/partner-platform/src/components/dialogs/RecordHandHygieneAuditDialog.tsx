import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { RecordHandHygieneAuditRequest, HandHygieneMoment } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecordHandHygieneAuditRequest) => Promise<void>;
}

export const RecordHandHygieneAuditDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [departmentName, setDepartmentName] = useState('Intensive Care Unit (ICU-A)');
  const [staffCategory, setStaffCategory] = useState<'DOCTOR' | 'NURSE' | 'ALLIED_HEALTH' | 'HOUSEKEEPING' | 'WARD_ASSISTANT'>('DOCTOR');
  const [whoMoment, setWhoMoment] = useState<HandHygieneMoment>('BEFORE_PATIENT_CONTACT');
  const [actionTaken, setActionTaken] = useState<'RUB_PERFORMED' | 'WASH_PERFORMED' | 'MISSED_OPPORTUNITY'>('RUB_PERFORMED');
  const [auditedByOfficer, setAuditedByOfficer] = useState('Sister Preeti Varma (ICN)');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        departmentName,
        staffCategory,
        whoMoment,
        actionTaken,
        auditedByOfficer,
        notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Record WHO 5-Moments Hand Hygiene Observation</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ward / Unit</label>
            <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Category Observed</label>
            <Select
              value={staffCategory}
              onChange={(e) => setStaffCategory(e.target.value as 'DOCTOR' | 'NURSE' | 'ALLIED_HEALTH' | 'HOUSEKEEPING' | 'WARD_ASSISTANT')}
              options={[
                { value: 'DOCTOR', label: 'Doctor / Physician / Consultant' },
                { value: 'NURSE', label: 'Nursing Staff' },
                { value: 'ALLIED_HEALTH', label: 'Allied Health / Tech' },
                { value: 'HOUSEKEEPING', label: 'Housekeeping & Sanitation' },
                { value: 'WARD_ASSISTANT', label: 'Ward Assistant / Porter' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">WHO 5-Moment Opportunity</label>
            <Select
              value={whoMoment}
              onChange={(e) => setWhoMoment(e.target.value as HandHygieneMoment)}
              options={[
                { value: 'BEFORE_PATIENT_CONTACT', label: '1. Before Touching a Patient' },
                { value: 'BEFORE_CLEAN_ASEPTIC_PROCEDURE', label: '2. Before Clean / Aseptic Procedure' },
                { value: 'AFTER_BODY_FLUID_EXPOSURE', label: '3. After Body Fluid Exposure Risk' },
                { value: 'AFTER_PATIENT_CONTACT', label: '4. After Touching a Patient' },
                { value: 'AFTER_TOUCHING_PATIENT_SURROUNDINGS', label: '5. After Touching Patient Surroundings' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Observed Action</label>
            <Select
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value as 'RUB_PERFORMED' | 'WASH_PERFORMED' | 'MISSED_OPPORTUNITY')}
              options={[
                { value: 'RUB_PERFORMED', label: '✅ Alcohol Hand Rub Performed' },
                { value: 'WASH_PERFORMED', label: '✅ Soap & Water Hand Wash Performed' },
                { value: 'MISSED_OPPORTUNITY', label: '❌ Missed Opportunity' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Auditing Officer</label>
            <Input value={auditedByOfficer} onChange={(e) => setAuditedByOfficer(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Coaching Provided</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Log Observation'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
