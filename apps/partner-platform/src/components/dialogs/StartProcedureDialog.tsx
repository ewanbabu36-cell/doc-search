import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyOrderDto, StartRadiologyProcedureRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderDto | null;
  onSubmit: (req: StartRadiologyProcedureRequest) => Promise<void>;
  tenantId: string;
}

export const StartProcedureDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
  tenantId
}) => {
  const [tech, setTech] = useState('Arthur Dent, R.T.(R)(CT)');
  const [modCode, setModCode] = useState('CT-SCANNER-01');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        orderId: order.id,
        technologistName: tech,
        modalityCode: modCode
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Initiate Image Acquisition</h2>
        <p className="text-xs text-gray-500 mb-4">{order.orderNumber} — {order.patientName} ({order.procedureName})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Acquiring Technologist</label>
            <Input value={tech} onChange={(e) => setTech(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Modality Station Code</label>
            <Input value={modCode} onChange={(e) => setModCode(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Starting...' : 'Start Procedure'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
