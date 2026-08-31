import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { RadiologyStudyDto } from '@docsearch/api-contracts';

interface Props {
  studies: RadiologyStudyDto[];
}

export const RadiologyPacsView: React.FC<Props> = ({ studies }) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">PACS / DICOM Web Nodes & WADO Endpoints</h3>
          <p className="text-xs text-gray-500">Storage commitment, image count & direct DICOM web viewer hyperlinks</p>
        </div>
        <Badge variant="success">All PACS Nodes Online</Badge>
      </div>

      <div className="space-y-3">
        {studies.map((study) => (
          <div key={study.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-700 text-xs">{study.accessionNumber}</span>
                <span className="font-semibold text-gray-900 text-xs">{study.patientName}</span>
                <Badge variant="neutral">{study.modalityType.split('_')[0]}</Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1 font-mono text-[11px]">UID: {study.studyInstanceUid}</p>
              <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-1">
                <span>Series: {study.seriesCount}</span>
                <span>Instances: {study.instancesCount}</span>
                <span>Acquired: {new Date(study.studyDateTime).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <Badge variant={study.pacsSyncStatus === 'SYNCED' ? 'success' : 'warning'}>{study.pacsSyncStatus}</Badge>
              <div>
                <a href={study.pacsViewerUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">
                  Open DICOM Viewer ↗
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
