import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { ReportHospitalIncidentRequest, IncidentCategory, SacScore } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportHospitalIncidentRequest) => Promise<void>;
}

export const ReportIncidentDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [category, setCategory] = useState<IncidentCategory>('MEDICATION_ERROR');
  const [sacScore, setSacScore] = useState<SacScore>('SAC_3_MODERATE');
  const [patientInvolved, setPatientInvolved] = useState(true);
  const [patientMrn, setPatientMrn] = useState('');
  const [patientName, setPatientName] = useState('');
  const [departmentName, setDepartmentName] = useState('Inpatient Medical Ward 3');
  const [locationDetail, setLocationDetail] = useState('Bed 308-A');
  const [incidentDateTime] = useState(new Date().toISOString());
  const [reportedByStaff, setReportedByStaff] = useState('Staff Nurse Anjali Shinde');
  const [reportedByRole] = useState('WARD_NURSE');
  const [briefSummary, setBriefSummary] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [immediateActionTaken, setImmediateActionTaken] = useState('');
  const [patientHarmLevel, setPatientHarmLevel] = useState<'NO_HARM_NEAR_MISS' | 'MILD_TRANSIENT_HARM' | 'MODERATE_PROLONGED_HOSPITALIZATION' | 'SEVERE_PERMANENT_HARM' | 'SENTINEL_DEATH'>('MILD_TRANSIENT_HARM');
  const [isSentinelEvent, setIsSentinelEvent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        category,
        sacScore,
        patientInvolved,
        patientMrn: patientInvolved ? patientMrn : undefined,
        patientName: patientInvolved ? patientName : undefined,
        departmentName,
        locationDetail,
        incidentDateTime,
        reportedByStaff,
        reportedByRole,
        briefSummary,
        detailedDescription,
        immediateActionTaken,
        patientHarmLevel,
        isSentinelEvent
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-red-700">🚨 Log Hospital Incident / Safety Event (NABH / JCI)</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Incident Category</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                options={[
                  { value: 'MEDICATION_ERROR', label: 'Medication Error / LASA' },
                  { value: 'PATIENT_FALL', label: 'Patient Fall' },
                  { value: 'SURGICAL_COMPLICATION_NEVER_EVENT', label: 'Surgical Complication / Never Event' },
                  { value: 'NEEDLE_STICK_SHARPS', label: 'Needle Stick / Sharps Injury' },
                  { value: 'TRANSFUSION_REACTION', label: 'Blood Transfusion Reaction' },
                  { value: 'DIAGNOSTIC_DELAY', label: 'Diagnostic Delay / Misdiagnosis' },
                  { value: 'PRESSURE_ULCER', label: 'Hospital-Acquired Pressure Ulcer' },
                  { value: 'EQUIPMENT_FAILURE', label: 'Biomedical Equipment Failure' },
                  { value: 'STAFF_VIOLENCE_SECURITY', label: 'Staff Violence / Security Hazard' },
                  { value: 'HEALTHCARE_ASSOCIATED_INFECTION', label: 'Healthcare-Associated Infection' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Severity Assessment Code (SAC)</label>
              <Select
                value={sacScore}
                onChange={(e) => {
                  const val = e.target.value as SacScore;
                  setSacScore(val);
                  if (val === 'SAC_1_EXTREME_SENTINEL') setIsSentinelEvent(true);
                }}
                options={[
                  { value: 'SAC_1_EXTREME_SENTINEL', label: 'SAC 1: Extreme / Sentinel Event (Death / Permanent Harm)' },
                  { value: 'SAC_2_MAJOR', label: 'SAC 2: Major (Prolonged Hospitalization)' },
                  { value: 'SAC_3_MODERATE', label: 'SAC 3: Moderate (Transient Harm)' },
                  { value: 'SAC_4_MINOR_NEAR_MISS', label: 'SAC 4: Minor / Near-Miss (No Harm)' }
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" checked={patientInvolved} onChange={(e) => setPatientInvolved(e.target.checked)} className="rounded" />
              Patient Directly Involved
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-red-700 cursor-pointer">
              <input type="checkbox" checked={isSentinelEvent} onChange={(e) => setIsSentinelEvent(e.target.checked)} className="rounded" />
              Flag as Sentinel Event (Immediate 24h RCA)
            </label>
          </div>

          {patientInvolved && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
                <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. MRN-2026-4401" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
                <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Kavita Joshi" required />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Bed / Location Detail</label>
              <Input value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Brief Incident Summary</label>
            <Input value={briefSummary} onChange={(e) => setBriefSummary(e.target.value)} placeholder="One-line summary of what occurred..." required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description of Event</label>
            <Input value={detailedDescription} onChange={(e) => setDetailedDescription(e.target.value)} placeholder="Chronological narrative of sequence of events..." required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Immediate Clinical & Safety Action Taken</label>
            <Input value={immediateActionTaken} onChange={(e) => setImmediateActionTaken(e.target.value)} placeholder="First aid, physician alert, vitals check, rescue..." required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Harm Level</label>
              <Select
                value={patientHarmLevel}
                onChange={(e) => setPatientHarmLevel(e.target.value as 'NO_HARM_NEAR_MISS' | 'MILD_TRANSIENT_HARM' | 'MODERATE_PROLONGED_HOSPITALIZATION' | 'SEVERE_PERMANENT_HARM' | 'SENTINEL_DEATH')}
                options={[
                  { value: 'NO_HARM_NEAR_MISS', label: 'No Harm / Near Miss' },
                  { value: 'MILD_TRANSIENT_HARM', label: 'Mild Transient Harm' },
                  { value: 'MODERATE_PROLONGED_HOSPITALIZATION', label: 'Moderate Harm (Extended Stay)' },
                  { value: 'SEVERE_PERMANENT_HARM', label: 'Severe Permanent Harm' },
                  { value: 'SENTINEL_DEATH', label: 'Sentinel Event (Death)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reported By Staff</label>
              <Input value={reportedByStaff} onChange={(e) => setReportedByStaff(e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Incident Report'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
