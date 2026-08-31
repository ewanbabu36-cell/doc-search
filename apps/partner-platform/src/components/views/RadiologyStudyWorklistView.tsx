import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { RadiologyStudyDto } from '@docsearch/api-contracts';

interface Props {
  studies: RadiologyStudyDto[];
  onOpenReport: (study: RadiologyStudyDto) => void;
  onConfigurePacs: (study: RadiologyStudyDto) => void;
}

export const RadiologyStudyWorklistView: React.FC<Props> = ({
  studies,
  onOpenReport,
  onConfigurePacs
}) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Acquired DICOM Studies & Worklist</h3>
          <p className="text-xs text-gray-500">Studies received from modalities ready for Radiologist interpretation</p>
        </div>
        <Badge variant="primary">{studies.length} Studies</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Accession #</th>
              <th className="py-2.5 px-3">Patient & MRN</th>
              <th className="py-2.5 px-3">Study Description</th>
              <th className="py-2.5 px-3">Modality</th>
              <th className="py-2.5 px-3">Images</th>
              <th className="py-2.5 px-3">Dose / Contrast</th>
              <th className="py-2.5 px-3">PACS Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {studies.map((study) => (
              <tr key={study.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{study.accessionNumber}</td>
                <td className="py-2.5 px-3 font-semibold text-gray-900">{study.patientName}</td>
                <td className="py-2.5 px-3 text-gray-800">{study.studyDescription}</td>
                <td className="py-2.5 px-3 font-semibold">{study.modalityType.split('_')[0]}</td>
                <td className="py-2.5 px-3 font-mono">{study.seriesCount}s / {study.instancesCount}i</td>
                <td className="py-2.5 px-3 text-[11px] text-gray-500 font-mono">
                  {study.radiationDoseDlpMgyCm || 0} mGy • {study.contrastAdministeredMl || 0} mL
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant={study.pacsSyncStatus === 'SYNCED' ? 'success' : 'warning'}>
                    {study.pacsSyncStatus}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                  <a
                    href={study.pacsViewerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-semibold text-xs transition"
                  >
                    PACS ↗
                  </a>
                  <Button variant="primary" size="sm" onClick={() => onOpenReport(study)}>Draft Report</Button>
                  <Button variant="outline" size="sm" onClick={() => onConfigurePacs(study)}>Node</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
