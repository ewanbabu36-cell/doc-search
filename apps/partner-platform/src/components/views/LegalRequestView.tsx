import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { LegalRecordRequestDto, MedicalRecordLegalHoldDto } from '@docsearch/api-contracts';

interface Props {
  legalRequests: LegalRecordRequestDto[];
  legalHolds: MedicalRecordLegalHoldDto[];
}

export const LegalRequestView: React.FC<Props> = ({ legalRequests, legalHolds }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Legal Subpoenas & Mandatory Preservation Holds</h2>
        <p className="text-xs text-gray-500">Court orders, police requests, and statutory legal holds</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Subpoena & Production of Documents</h3>
          <div className="space-y-3">
            {legalRequests.map((l) => (
              <div key={l.id} className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-700">{l.legalRequestNumber}</span>
                  <Badge variant="danger">SUBPOENA</Badge>
                </div>
                <div className="font-semibold text-gray-900">{l.courtOrAgencyName}</div>
                <div className="text-gray-600">{l.subpoenaDetails}</div>
                <div className="text-[10px] text-gray-400">Officer: {l.officerInChargeName}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4 border-2 border-red-200">
          <h3 className="text-sm font-bold text-red-900 uppercase">Active Legal Holds</h3>
          <div className="space-y-3">
            {legalHolds.map((h) => (
              <div key={h.id} className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-800">{h.holdCode}</span>
                  <Badge variant="danger">{h.status}</Badge>
                </div>
                <div className="font-bold text-gray-900">{h.legalMatterTitle}</div>
                <div className="text-red-900">{h.reasonForHold}</div>
                <div className="text-[10px] text-gray-500">Counsel: {h.authorizedByLegalCounsel}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
