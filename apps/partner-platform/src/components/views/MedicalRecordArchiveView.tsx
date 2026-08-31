import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, MRDepartmentDto } from '@docsearch/api-contracts';

interface Props {
  records: MedicalRecordIndexDto[];
  department: MRDepartmentDto | null;
  onOpenRetrieveDialog: (record: MedicalRecordIndexDto) => void;
}

export const MedicalRecordArchiveView: React.FC<Props> = ({ records, department, onOpenRetrieveDialog }) => {
  return (
    <div className="space-y-6">
      <div className="p-5 bg-slate-800 text-white rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">🏛 Central Medical Record Physical & Digital Vault</h2>
          <p className="text-xs text-slate-300">Vault Location: {department?.physicalVaultLocation}</p>
        </div>
        <Badge variant="primary">Total Archival Records: {records.length}</Badge>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-3">Record #</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Storage Type</th>
              <th className="p-3">Shelf & Box Location</th>
              <th className="p-3">Legal Hold</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-blue-600">{r.recordNumber}</td>
                <td className="p-3 font-semibold text-gray-900">{r.patientName}</td>
                <td className="p-3">{r.storageType}</td>
                <td className="p-3 text-gray-700">{r.physicalShelfNumber ? `${r.physicalShelfNumber} / ${r.physicalBoxNumber}` : 'Digital EHR Vault'}</td>
                <td className="p-3">
                  {r.isLegalHoldActive ? <Badge variant="danger">🔒 HOLD</Badge> : <Badge variant="neutral">NONE</Badge>}
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => onOpenRetrieveDialog(r)}>Request Chart Retrieval</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
