import React, { useState } from 'react';
import { Card, Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, MedicalDiagnosisCodeDto, ICDCodeItemDto } from '@docsearch/api-contracts';

interface Props {
  records: MedicalRecordIndexDto[];
  diagnoses: MedicalDiagnosisCodeDto[];
  catalog: ICDCodeItemDto[];
  onOpenAssignDialog: (record: MedicalRecordIndexDto) => void;
  onOpenEditDialog: (diagnosis: MedicalDiagnosisCodeDto) => void;
  onOpenQueryDialog: (record: MedicalRecordIndexDto) => void;
}

export const ICD10CodingWorkbenchView: React.FC<Props> = ({
  records,
  diagnoses,
  catalog,
  onOpenAssignDialog,
  onOpenEditDialog,
  onOpenQueryDialog
}) => {
  const [filter, setFilter] = useState('');

  const filteredCatalog = catalog.filter(
    (c) =>
      c.code.toLowerCase().includes(filter.toLowerCase()) ||
      c.shortDescription.toLowerCase().includes(filter.toLowerCase()) ||
      c.chapter.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">ICD-10 Clinical Coding Workbench</h2>
          <p className="text-xs text-gray-500">Assign primary/secondary diagnoses, POA indicators, and manage coding backlog</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Active Coding Queue</h3>
          <div className="space-y-3">
            {records.map((r) => {
              const recCodes = diagnoses.filter((d) => d.recordId === r.id);
              return (
                <div key={r.id} className="p-4 bg-white border rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-600 text-sm">{r.recordNumber}</span>
                      <span className="font-semibold text-gray-900 ml-2">{r.patientName}</span>
                      <span className="text-xs text-gray-400 ml-1">({r.patientMrn})</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onOpenQueryDialog(r)}>Query Doctor</Button>
                      <Button size="sm" variant="primary" onClick={() => onOpenAssignDialog(r)}>+ Assign Code</Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {recCodes.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-xs">
                        <div>
                          <span className="font-bold text-blue-800">[{c.icdCode}]</span> {c.icdDescription}
                          <span className="text-[10px] text-gray-500 ml-2">({c.codeType})</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onOpenEditDialog(c)}>Edit</Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase">ICD-10 Reference Catalog</h3>
          <Input placeholder="Search ICD-10 code or disease..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredCatalog.map((c) => (
              <div key={c.id} className="p-2.5 bg-slate-50 border rounded text-xs">
                <div className="font-bold text-blue-700">[{c.code}] {c.shortDescription}</div>
                <div className="text-[10px] text-gray-500 mt-1">{c.chapter} • {c.category}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
