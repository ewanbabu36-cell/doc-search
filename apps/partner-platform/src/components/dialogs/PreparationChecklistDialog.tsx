import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyOrderDto, RecordPreparationRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderDto | null;
  onSubmit: (req: RecordPreparationRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const PreparationChecklistDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [fasting, setFasting] = useState(true);
  const [mriMetal, setMriMetal] = useState(true);
  const [preg, setPreg] = useState(true);
  const [renal, setRenal] = useState(true);
  const [cannula, setCannula] = useState(true);
  const [consent, setConsent] = useState(true);
  const [nurse, setNurse] = useState('Nurse Clara Oswald, RN');
  const [ready, setReady] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        orderId: order.id,
        patientName: order.patientName,
        fastingConfirmed: fasting,
        mriMetalScreeningCleared: mriMetal,
        pregnancyStatusConfirmedNegative: preg,
        renalEgfrAdequate: renal,
        ivCannulaSecured: cannula,
        informedConsentSigned: consent,
        preparationNurseName: nurse,
        isReadyForScan: ready
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pre-Procedure Safety Checklist</h2>
        <p className="text-xs text-gray-500 mb-4">{order.orderNumber} — {order.patientName} ({order.procedureName})</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={fasting} onChange={(e) => setFasting(e.target.checked)} className="rounded" />
              Fasting state verified (NPO &gt;= 4h where required)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={mriMetal} onChange={(e) => setMriMetal(e.target.checked)} className="rounded" />
              MRI metal screening / pacemaker / implant clearance complete
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={preg} onChange={(e) => setPreg(e.target.checked)} className="rounded" />
              Pregnancy status confirmed negative / LMP verified
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={renal} onChange={(e) => setRenal(e.target.checked)} className="rounded" />
              eGFR adequate for IV contrast (&gt; 30 mL/min/1.73m2)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={cannula} onChange={(e) => setCannula(e.target.checked)} className="rounded" />
              IV cannula 18G/20G secured and patent for power-injector
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="rounded" />
              Informed procedural &amp; contrast consent signed
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Preparation Nurse</label>
            <Input value={nurse} onChange={(e) => setNurse(e.target.value)} required />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-green-700">
              <input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} className="rounded" />
              Patient clinically cleared & ready to proceed to scanner
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Save Checklist'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
