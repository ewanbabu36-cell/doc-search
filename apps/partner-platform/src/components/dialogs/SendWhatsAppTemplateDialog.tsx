import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { SendWhatsAppMessageRequest, WhatsAppMessageType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  conversationId: string;
  patientName: string;
  onClose: () => void;
  onSubmit: (data: SendWhatsAppMessageRequest) => Promise<void>;
}

export const SendWhatsAppTemplateDialog: React.FC<Props> = ({
  isOpen,
  conversationId,
  patientName,
  onClose,
  onSubmit
}) => {
  const [messageType, setMessageType] = useState<WhatsAppMessageType>('TEXT_MESSAGE');
  const [textContent, setTextContent] = useState(`Namaste ${patientName}, your appointment with Dr. Sanjay Gupta is confirmed for tomorrow at 10:30 AM in Room 204. Please arrive 15 minutes prior for vitals pre-check.`);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        conversationId,
        messageType,
        textContent,
        mediaUrl: null
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-emerald-900">💬 Send WhatsApp Message / Template</h2>
        <p className="text-xs text-gray-500">Recipient: <strong>{patientName}</strong> (Meta Verified WhatsApp Account)</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Message Format</label>
            <Select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as WhatsAppMessageType)}
              options={[
                { value: 'TEXT_MESSAGE', label: 'Plain Text Message' },
                { value: 'INTERACTIVE_BUTTONS', label: 'Interactive Quick Reply Buttons' },
                { value: 'INTERACTIVE_LIST', label: 'Interactive Menu List' },
                { value: 'MEDIA_DOCUMENT_PDF', label: 'PDF Document Template' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Message Body</label>
            <Input value={textContent} onChange={(e) => setTextContent(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Dispatching...' : 'Send WhatsApp Message'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
