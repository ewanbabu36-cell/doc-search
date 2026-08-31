import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { RadiologyOrderDto, RadiologyPreparationRecordDto, RadiologyStudyDto } from '@docsearch/api-contracts';

interface Props {
  order: RadiologyOrderDto;
  preparation?: RadiologyPreparationRecordDto | undefined;
  study?: RadiologyStudyDto | undefined;
  onBack: () => void;
  onStartProcedure: () => void;
  onPreparation: () => void;
}

export const RadiologyOrderDetailView: React.FC<Props> = ({
  order,
  preparation,
  study,
  onBack,
  onStartProcedure,
  onPreparation
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>← Back to Orders</Button>
        <div className="flex items-center gap-2">
          {order.status === 'SCHEDULED' && !preparation && (
            <Button variant="primary" size="sm" onClick={onPreparation}>Conduct Pre-Op Checklist</Button>
          )}
          {order.status === 'SCHEDULED' && preparation && preparation.isReadyForScan && (
            <Button variant="primary" size="sm" onClick={onStartProcedure}>Start Scan</Button>
          )}
        </div>
      </div>

      <Card className="p-6 bg-white border border-gray-200 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{order.orderNumber}</h2>
              <Badge variant="primary">{order.status}</Badge>
              <Badge variant={order.priority === 'STAT_EMERGENCY_IMMEDIATE' ? 'danger' : 'neutral'}>{order.priority}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Ordered on {new Date(order.orderedAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">{order.patientName}</div>
            <div className="text-xs text-gray-500 font-mono">{order.patientMrn}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-gray-500">Procedure:</span>
            <div className="font-bold text-gray-800 mt-0.5">{order.procedureName} ({order.modalityType})</div>
          </div>
          <div>
            <span className="font-semibold text-gray-500">Ordering Clinician:</span>
            <div className="font-bold text-gray-800 mt-0.5">{order.orderingDoctorName} ({order.orderingDepartment})</div>
          </div>
          <div>
            <span className="font-semibold text-gray-500">Clinical Indication:</span>
            <div className="text-gray-800 mt-0.5">{order.clinicalIndication}</div>
          </div>
          <div>
            <span className="font-semibold text-gray-500">Contrast & Screenings:</span>
            <div className="text-gray-800 mt-0.5">
              Requires Contrast: <strong>{order.requiresContrast ? 'Yes' : 'No'}</strong> • eGFR: {order.renalEgfrResult || 'N/A'} • Allergies: {order.knownAllergies || 'NKDA'}
            </div>
          </div>
        </div>

        {preparation && (
          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-blue-900">
              <span>Pre-Procedure Safety Checklist ({preparation.preparationCode})</span>
              <Badge variant={preparation.isReadyForScan ? 'success' : 'danger'}>
                {preparation.isReadyForScan ? 'CLEARED FOR SCAN' : 'NOT READY'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-blue-800">
              <div>Fasting: {preparation.fastingConfirmed ? '✓ Yes' : '✗ No'}</div>
              <div>MRI Metal Cleared: {preparation.mriMetalScreeningCleared ? '✓ Yes' : '✗ No'}</div>
              <div>IV Cannula: {preparation.ivCannulaSecured ? '✓ Yes' : '✗ No'}</div>
            </div>
            <div className="text-[11px] text-blue-600">Verified by {preparation.preparationNurseName} on {new Date(preparation.checkedAt).toLocaleString()}</div>
          </div>
        )}

        {study && (
          <div className="bg-green-50/50 p-4 rounded-lg border border-green-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-green-900">
              <span>PACS Acquired Study ({study.accessionNumber})</span>
              <Badge variant="success">{study.pacsSyncStatus}</Badge>
            </div>
            <p className="text-green-800">{study.studyDescription} ({study.seriesCount} Series, {study.instancesCount} Instances)</p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-green-700 font-mono">DLP: {study.radiationDoseDlpMgyCm || 0} mGy-cm • Contrast: {study.contrastAdministeredMl || 0} mL</span>
              <a href={study.pacsViewerUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">
                Launch DICOM Viewer ↗
              </a>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
