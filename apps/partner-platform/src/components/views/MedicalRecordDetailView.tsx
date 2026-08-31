import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, MedicalDiagnosisCodeDto, MedicalRecordCompletionTaskDto } from '@docsearch/api-contracts';

interface Props {
  record: MedicalRecordIndexDto | null;
  diagnoses: MedicalDiagnosisCodeDto[];
  tasks: MedicalRecordCompletionTaskDto[];
  onBack: () => void;
  onOpenCodingDialog: () => void;
  onOpenTaskDialog: () => void;
}

export const MedicalRecordDetailView: React.FC<Props> = ({
  record,
  diagnoses,
  tasks,
  onBack,
  onOpenCodingDialog,
  onOpenTaskDialog
}) => {
  if (!record) return null;

  const recordDiagnoses = diagnoses.filter((d) => d.recordId === record.id);
  const recordTasks = tasks.filter((t) => t.recordId === record.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={onBack}>← Back to Master Index</Button>
          <div className="flex items-center gap-3 mt-2">
            <h2 className="text-xl font-black text-gray-900">{record.recordNumber}</h2>
            <Badge variant="primary">{record.encounterType}</Badge>
            {record.isLegalHoldActive && <Badge variant="danger">🔒 ACTIVE LEGAL HOLD</Badge>}
          </div>
          <p className="text-xs text-gray-500">{record.patientName} ({record.patientMrn}) — Attending: {record.primaryAttendingDoctor}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onOpenTaskDialog}>+ Log Deficiency</Button>
          <Button size="sm" variant="primary" onClick={onOpenCodingDialog}>+ Assign ICD-10 Code</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Assigned ICD-10 Diagnosis Codes</h3>
          {recordDiagnoses.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No diagnosis codes assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {recordDiagnoses.map((d) => (
                <div key={d.id} className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">[{d.icdCode}]</span>
                      <span className="font-semibold text-gray-900">{d.icdDescription}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Type: <span className="font-semibold">{d.codeType}</span> | POA: <span className="font-semibold">{d.poaIndicator}</span> | Assigned by: {d.assignedByCoder}
                    </div>
                  </div>
                  <Badge variant="neutral">Seq: #{d.sequencingOrder}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Record Deficiencies & Signatures</h3>
          {recordTasks.length === 0 ? (
            <p className="text-xs text-emerald-600 font-semibold">✓ No active deficiencies on chart.</p>
          ) : (
            <div className="space-y-2">
              {recordTasks.map((t) => (
                <div key={t.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                  <div className="font-bold text-amber-900">{t.deficiencyType}</div>
                  <div className="text-[11px] text-amber-800 mt-1">{t.description}</div>
                  <div className="text-[10px] text-gray-500 mt-2">
                    Responsible: <span className="font-semibold">{t.responsibleStaffName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
