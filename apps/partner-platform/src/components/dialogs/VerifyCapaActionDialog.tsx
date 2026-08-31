import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { QualityCapaDto, VerifyQualityCapaRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  capa: QualityCapaDto;
  onClose: () => void;
  onSubmit: (capaId: string, data: VerifyQualityCapaRequest) => Promise<void>;
}

export const VerifyCapaActionDialog: React.FC<Props> = ({ isOpen, capa, onClose, onSubmit }) => {
  const [verifiedBy, setVerifiedBy] = useState('Dr. Radhika Sharma (Quality Chair)');
  const [isEffective, setIsEffective] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(capa.id, { verifiedBy, isEffective });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Verify CAPA Effectiveness ({capa.capaCode})</h2>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
          <p><strong>Title:</strong> {capa.title}</p>
          <p><strong>Metric:</strong> {capa.verificationMetric}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input type="checkbox" id="eff-chk" checked={isEffective} onChange={(e) => setIsEffective(e.target.checked)} className="rounded" />
            <label htmlFor="eff-chk" className="text-xs font-semibold text-gray-700">Action Verified Effective (Metric Met)</label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Verifying Quality Lead</label>
            <Input value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Sign & Close CAPA'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
