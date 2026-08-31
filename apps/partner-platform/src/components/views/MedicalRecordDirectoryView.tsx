import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto } from '@docsearch/api-contracts';

interface Props {
  records: MedicalRecordIndexDto[];
  onSelectRecord: (record: MedicalRecordIndexDto) => void;
  onOpenDeficiencyDialog: (record: MedicalRecordIndexDto) => void;
  onOpenCodingDialog: (record: MedicalRecordIndexDto) => void;
  onOpenROIDialog: (record: MedicalRecordIndexDto) => void;
  onOpenLegalDialog: (record: MedicalRecordIndexDto) => void;
}

export const MedicalRecordDirectoryView: React.FC<Props> = ({
  records,
  onSelectRecord,
  onOpenDeficiencyDialog,
  onOpenCodingDialog,
  onOpenROIDialog,
  onOpenLegalDialog
}) => {
  const [search, setSearch] = useState('');

  const filtered = records.filter(
    (r) =>
      r.recordNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      r.encounterNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Medical Record Master Index (MRMI)</h2>
          <p className="text-xs text-gray-500">Longitudinal chart index aggregated across all hospital clinical encounters</p>
        </div>
        <div className="w-72">
          <Input placeholder="Search MRN, Patient, Record #..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-3">Record #</th>
              <th className="p-3">Patient & MRN</th>
              <th className="p-3">Encounter</th>
              <th className="p-3">Attending Doctor</th>
              <th className="p-3">Completion Status</th>
              <th className="p-3">Coding Status</th>
              <th className="p-3">Archive Location</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-blue-600">{r.recordNumber}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-900">{r.patientName}</div>
                  <div className="text-[10px] text-gray-500">{r.patientMrn}</div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-gray-800">{r.encounterNumber}</div>
                  <div className="text-[10px] text-gray-400">{r.encounterType}</div>
                </td>
                <td className="p-3 text-gray-700">{r.primaryAttendingDoctor}</td>
                <td className="p-3">
                  <Badge variant={r.completionStatus === 'COMPLETED' ? 'success' : r.completionStatus === 'INCOMPLETE' ? 'danger' : 'warning'}>
                    {r.completionStatus}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant={r.codingStatus === 'APPROVED_FINALIZED' ? 'success' : 'primary'}>
                    {r.codingStatus}
                  </Badge>
                </td>
                <td className="p-3 text-gray-600">
                  {r.physicalShelfNumber ? `${r.physicalShelfNumber} / ${r.physicalBoxNumber}` : 'Digital EHR Vault'}
                  {r.isLegalHoldActive && <span className="ml-1 text-red-600 font-bold">🔒 HOLD</span>}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => onSelectRecord(r)}>View Chart</Button>
                    <Button size="sm" variant="outline" onClick={() => onOpenCodingDialog(r)}>Code</Button>
                    <Button size="sm" variant="outline" onClick={() => onOpenDeficiencyDialog(r)}>Deficiency</Button>
                    <Button size="sm" variant="outline" onClick={() => onOpenROIDialog(r)}>ROI</Button>
                    <Button size="sm" variant="outline" onClick={() => onOpenLegalDialog(r)}>Legal</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
