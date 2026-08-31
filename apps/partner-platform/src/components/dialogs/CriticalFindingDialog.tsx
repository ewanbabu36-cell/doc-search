import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type {
  RadiologyReportDto,
  RecordCriticalFindingRequest,
  CriticalFindingSeverity
} from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: RadiologyReportDto | null;
  onSubmit: (req: RecordCriticalFindingRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CriticalFindingDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  report,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [desc, setDesc] = useState('Acute intracranial hemorrhage / midline shift > 5mm.');
  const [sev, setSev] = useState<CriticalFindingSeverity>('CRITICAL_IMMEDIATE_LIFE_THREATENING');
  const [doctor, setDoctor] = useState('Dr. Gregory House, MD');
  const [dept, setDept] = useState('Emergency Department (Trauma)');
  const [recipient, setRecipient] = useState('Dr. Gregory House, MD (Direct Phone Call)');
  const [rad, setRad] = useState('Dr. Evelyn Vance, MD, FACR');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        reportId: report.id,
        patientName: report.patientName,
        patientMrn: report.patientMrn,
        orderingDoctorName: doctor,
        orderingDepartment: dept,
        findingDescription: desc,
        severity: sev,
        flaggedByRadiologist: rad,
        notifiedRecipient: recipient
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-red-600 mb-2">Flag & Escalate Critical Imaging Finding</h2>
        <p className="text-xs text-gray-500 mb-4">{report.reportNumber} — {report.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Critical Finding Description</label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Severity Classification</label>
            <select
              value={sev}
              onChange={(e) => setSev(e.target.value as CriticalFindingSeverity)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
            >
              <option value="CRITICAL_IMMEDIATE_LIFE_THREATENING">Critical Immediate (Life Threatening)</option>
              <option value="URGENT_UNEXPECTED_HIGH_RISK">Urgent Unexpected (High Risk)</option>
              <option value="SIGNIFICANT_NON_URGENT">Significant Non-Urgent</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Clinician</label>
              <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Department</label>
              <Input value={dept} onChange={(e) => setDept(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notification Recipient & Channel</label>
            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reporting Radiologist</label>
            <Input value={rad} onChange={(e) => setRad(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Flagging...' : 'Dispatch Critical Alert'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
