import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { CodingReviewDto, MedicalRecordIndexDto } from '@docsearch/api-contracts';

interface Props {
  reviews: CodingReviewDto[];
  records: MedicalRecordIndexDto[];
  onOpenSubmitReview: (record: MedicalRecordIndexDto) => void;
}

export const CodingReviewView: React.FC<Props> = ({ reviews, records, onOpenSubmitReview }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Coding Quality & Audit Reviews</h2>
          <p className="text-xs text-gray-500">1st & 2nd level senior coding audits and accuracy verifications</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Records Ready for Senior Audit</h3>
          <div className="space-y-2">
            {records.filter((r) => r.codingStatus === 'CODED_AWAITING_REVIEW').map((r) => (
              <div key={r.id} className="p-3 bg-white border rounded-lg flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-blue-600">{r.recordNumber}</div>
                  <div className="font-semibold text-gray-900">{r.patientName}</div>
                </div>
                <Button size="sm" variant="primary" onClick={() => onOpenSubmitReview(r)}>Start Audit</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Completed Audit Log</h3>
          <div className="space-y-2">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{rev.reviewNumber}</span>
                  <Badge variant="success">Accuracy: {rev.codingAccuracyScorePercent}%</Badge>
                </div>
                <div className="text-[11px] text-gray-600">{rev.findingsAndErrorsNotes}</div>
                <div className="text-[10px] text-gray-400">Auditor: {rev.reviewerName} ({rev.reviewLevel})</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
