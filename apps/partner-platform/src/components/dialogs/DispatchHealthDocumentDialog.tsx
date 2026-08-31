import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { DispatchHealthDocumentRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DispatchHealthDocumentRequest) => Promise<void>;
}

export const DispatchHealthDocumentDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [patientName, setPatientName] = useState('Gopal Krishna');
  const [phoneNumber, setPhoneNumber] = useState('+91 98201 54321');
  const [documentType, setDocumentType] = useState<'PRESCRIPTION_E_RX' | 'DIAGNOSTIC_LAB_REPORT' | 'RADIOLOGY_IMAGING_REPORT' | 'DISCHARGE_SUMMARY' | 'TAX_INVOICE_RECEIPT'>('PRESCRIPTION_E_RX');
  const [documentNumber, setDocumentNumber] = useState('RX-2026-08819');
  const [fileName, setFileName] = useState('Digital_Prescription_Dr_Sanjay_Gupta.pdf');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientMrn,
        patientName,
        phoneNumber,
        documentType,
        documentNumber,
        fileName
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-teal-900">📄 Automated WhatsApp Health Document Dispatch</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Phone Number</label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Document Category</label>
            <Select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as 'PRESCRIPTION_E_RX' | 'DIAGNOSTIC_LAB_REPORT' | 'RADIOLOGY_IMAGING_REPORT' | 'DISCHARGE_SUMMARY' | 'TAX_INVOICE_RECEIPT')}
              options={[
                { value: 'PRESCRIPTION_E_RX', label: 'Digital e-Prescription (e-Rx PDF)' },
                { value: 'DIAGNOSTIC_LAB_REPORT', label: 'Laboratory Diagnostic Test Report' },
                { value: 'RADIOLOGY_IMAGING_REPORT', label: 'Radiology MRI/CT Study Report' },
                { value: 'DISCHARGE_SUMMARY', label: 'Inpatient Signed Discharge Summary' },
                { value: 'TAX_INVOICE_RECEIPT', label: 'Itemized Hospital Tax Invoice Receipt' }
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Document #</label>
              <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attachment File Name</label>
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Dispatching PDF...' : 'Dispatch via WhatsApp'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
