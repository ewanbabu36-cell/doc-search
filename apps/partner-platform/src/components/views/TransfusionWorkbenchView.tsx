import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { TransfusionRecordDto } from '@docsearch/api-contracts';

interface Props {
  transfusions: TransfusionRecordDto[];
  onOpenObservation: (t: TransfusionRecordDto) => void;
  onOpenReaction: (t: TransfusionRecordDto) => void;
  onOpenNewTransfusion: () => void;
}

export const TransfusionWorkbenchView: React.FC<Props> = ({
  transfusions,
  onOpenObservation,
  onOpenReaction,
  onOpenNewTransfusion
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bedside Blood Transfusion Administration</h2>
          <p className="text-xs text-gray-500">Live bedside transfusion monitoring, vital sign observations & adverse reaction capture</p>
        </div>
        <Button variant="primary" onClick={onOpenNewTransfusion}>+ Start Bedside Transfusion</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Transfusion ID</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Component</th>
              <th className="p-3">Administering Nurse</th>
              <th className="p-3">Pre-Vitals</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transfusions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{t.transfusionCode}</td>
                <td className="p-3 font-semibold text-gray-900">{t.patientName} ({t.bloodGroup})</td>
                <td className="p-3 text-xs text-gray-700">{t.componentType.replace(/_/g, ' ')} ({t.componentCode})</td>
                <td className="p-3 text-xs text-gray-700">{t.administeredByNurse}</td>
                <td className="p-3 text-xs text-gray-600">P: {t.preTransfusionPulse} • BP: {t.preTransfusionBp} • T: {t.preTransfusionTempF}°F</td>
                <td className="p-3">
                  <Badge variant={t.status === 'COMPLETED_UNEVENTFUL' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'danger'}>
                    {t.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    {t.status === 'IN_PROGRESS' && (
                      <Button variant="outline" size="sm" onClick={() => onOpenObservation(t)}>Record Post-Vitals</Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => onOpenReaction(t)}>Report Reaction</Button>
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
