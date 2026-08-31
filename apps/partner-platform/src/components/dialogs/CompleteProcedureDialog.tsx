import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyOrderDto, CompleteRadiologyProcedureRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderDto | null;
  onSubmit: (req: CompleteRadiologyProcedureRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CompleteProcedureDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [desc, setDesc] = useState('CT Thorax with IV Contrast Pulmonary Embolism Study');
  const [series, setSeries] = useState('4');
  const [instances, setInstances] = useState('480');
  const [dlp, setDlp] = useState('420.5');
  const [contrast, setContrast] = useState('75.0');
  const [tech, setTech] = useState('Arthur Dent, R.T.(R)(CT)');
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
        patientMrn: order.patientMrn,
        modalityType: order.modalityType,
        studyDescription: desc,
        seriesCount: parseInt(series) || 1,
        instancesCount: parseInt(instances) || 1,
        radiationDoseDlpMgyCm: parseFloat(dlp) || 0,
        contrastAdministeredMl: parseFloat(contrast) || 0,
        technologistName: tech
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Scan & Push to PACS</h2>
        <p className="text-xs text-gray-500 mb-4">{order.orderNumber} — {order.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Study Description</label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Series Count</label>
              <Input type="number" value={series} onChange={(e) => setSeries(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Instances / Images</label>
              <Input type="number" value={instances} onChange={(e) => setInstances(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Radiation Dose (DLP mGy-cm)</label>
              <Input type="number" step="0.1" value={dlp} onChange={(e) => setDlp(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contrast Administered (mL)</label>
              <Input type="number" step="0.1" value={contrast} onChange={(e) => setContrast(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Technologist</label>
            <Input value={tech} onChange={(e) => setTech(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Completing...' : 'Complete & Push Study'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
