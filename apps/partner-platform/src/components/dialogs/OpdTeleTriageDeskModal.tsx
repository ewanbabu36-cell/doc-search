import React, { useState } from 'react';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface TeleTriageMessage {
  id: string;
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  receivedTime: string;
  reportTitle: string;
  reportThumbnail: string;
  patientQueryText: string;
  suggestedAction: string;
  status: 'PENDING' | 'REPLIED';
}

export const SAMPLE_TELE_QUERIES: TeleTriageMessage[] = [
  {
    id: 'tq-1',
    patientName: 'Sunita Sharma',
    patientMrn: 'UHID-8821',
    patientPhone: '+91 98765 43210',
    receivedTime: '18 mins ago via WhatsApp QR',
    reportTitle: 'Complete Blood Count (CBC) & Dengue NS1 Antigen',
    reportThumbnail: 'Dengue NS1: NEGATIVE • Platelet Count: 1.85 Lakhs/mcL (Normal)',
    patientQueryText: 'Doctor sahab bukhar to utar gaya hai par kamzori hai. Kya Paracetamol band kar dein?',
    suggestedAction: 'Platelets normal. Advised stopping Paracetamol, maintain oral ORS hydration.',
    status: 'PENDING'
  },
  {
    id: 'tq-2',
    patientName: 'Mohd Irfan',
    patientMrn: 'UHID-9410',
    patientPhone: '+91 98112 34567',
    receivedTime: '45 mins ago via WhatsApp QR',
    reportTitle: 'Fasting Blood Sugar & Serum Creatinine',
    reportThumbnail: 'FBS: 242 mg/dL (High) • S. Creatinine: 1.4 mg/dL',
    patientQueryText: 'Sir sugar 242 aayi hai. Purani dawai Telma aur Metformin continue karein?',
    suggestedAction: 'Sugar uncontrolled. Advise OPD clinic revisit for anti-hyperglycemic dose titration.',
    status: 'PENDING'
  },
  {
    id: 'tq-3',
    patientName: 'Aarav Gupta (5y)',
    patientMrn: 'UHID-1052',
    patientPhone: '+91 99887 76655',
    receivedTime: '1 hr ago via WhatsApp QR',
    reportTitle: 'Chest X-Ray & Stool Routine',
    reportThumbnail: 'Chest X-ray: Clear lung fields • Stool: No cysts / ova',
    patientQueryText: 'Bache ko ab ulti nahi ho rahi. Dawa khatam ho gayi hai.',
    suggestedAction: 'Child recovered. Advise stopping anti-emetics, continue normal diet.',
    status: 'PENDING'
  }
];

export interface OpdTeleTriageDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName?: string;
}

export const OpdTeleTriageDeskModal: React.FC<OpdTeleTriageDeskModalProps> = ({
  isOpen,
  onClose,
  doctorName = 'Dr. Verified Physician'
}) => {
  const [queries, setQueries] = useState<TeleTriageMessage[]>(SAMPLE_TELE_QUERIES);
  const [selectedQueryId, setSelectedQueryId] = useState<string>(SAMPLE_TELE_QUERIES[0]?.id || 'tq-1');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentQuery = queries.find((q) => q.id === selectedQueryId) || queries[0] || SAMPLE_TELE_QUERIES[0];

  const handleCannedReply = (text: string) => {
    setReplyText(text);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !currentQuery) return;

    setIsSending(true);

    hospitalEventBus.publish(
      'TELE_TRIAGE_REPLY_SENT',
      'OpdTeleTriageDeskModal',
      {
        queryId: currentQuery.id,
        patientName: currentQuery.patientName,
        patientPhone: currentQuery.patientPhone,
        replyText,
        doctorName
      },
      `WhatsApp Tele-Triage sent to ${currentQuery.patientName} (${currentQuery.patientPhone})`
    );

    setTimeout(() => {
      setIsSending(false);
      setQueries((prev) =>
        prev.map((q) => (q.id === currentQuery.id ? { ...q, status: 'REPLIED' } : q))
      );
      setStatusNotification(`✓ Official WhatsApp intimation dispatched to ${currentQuery.patientPhone}`);
      setReplyText('');
      setTimeout(() => setStatusNotification(null), 3000);
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(37, 211, 102, 0.4)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(37, 211, 102, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📱</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#4ADE80' }}>
                  Post-OPD WhatsApp Tele-Triage Desk
                </h3>
                <span style={{ fontSize: '0.65rem', backgroundColor: '#15803D', color: '#DCFCE7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  Doctor Privacy Shield Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1' }}>
                Patients scan prescription QR code to send reports • Replies delivered via official hospital channel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Split: Left List, Right Review */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Queries List */}
          <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.1)', overflowY: 'auto', backgroundColor: '#070C16' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>
              PENDING ASYNC REVIEWS ({queries.filter((q) => q.status === 'PENDING').length})
            </div>
            {queries.map((q) => {
              const isSelected = q.id === selectedQueryId;
              const isReplied = q.status === 'REPLIED';
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQueryId(q.id)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    backgroundColor: isSelected ? 'rgba(37, 211, 102, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#86EFAC' : '#F8FAFC' }}>
                      {q.patientName}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: isReplied ? '#34D399' : '#FBBF24', fontWeight: 700 }}>
                      {isReplied ? '✓ Replied' : q.receivedTime}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 600, marginBottom: '2px' }}>
                    {q.reportTitle}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{q.patientQueryText}"
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Detailed Review & 1-Click Action */}
          {currentQuery && (
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {statusNotification && (
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22C55E', color: '#86EFAC', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {statusNotification}
                </div>
              )}

              {/* Patient Query Header */}
              <div style={{ backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {currentQuery.patientName} ({currentQuery.patientMrn})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#34D399' }}>
                    📱 {currentQuery.patientPhone}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', marginBottom: '8px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '4px' }}>
                  "{currentQuery.patientQueryText}"
                </div>
                <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8' }}>
                    📑 Uploaded Diagnostic Summary:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#F8FAFC', marginTop: '2px' }}>
                    {currentQuery.reportThumbnail}
                  </div>
                </div>
              </div>

              {/* 1-Tap Canned Replies (30-Second Doctor Action) */}
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                  ⚡ 1-Tap Quick Clinical Advices:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleCannedReply('✓ Reports are within normal limits. Please continue prescribed medications as advised.')}
                    style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    ✓ Normal Reports: Continue same meds as advised
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCannedReply('⚠️ Infection noted in report. Added Tab Cefixime 200mg (1-0-1) for 5 days. Revisit if fever persists.')}
                    style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    ⚠️ Mild Infection: Add Oral Antibiotic for 5 days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCannedReply('🚨 Blood parameters require physical evaluation. Please visit OPD clinic tomorrow morning for dose titration.')}
                    style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    🚨 Abnormal Value: Require in-person OPD visit
                  </button>
                </div>
              </div>

              {/* Reply Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#4ADE80', marginBottom: '4px' }}>
                  Doctor Reply (Delivered via Official Clinic WhatsApp Bot):
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type advice or select a quick option above..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#070C16',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    color: '#F8FAFC',
                    fontSize: '0.78rem'
                  }}
                />
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  disabled={!replyText.trim() || isSending}
                  onClick={handleSendReply}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: '#22C55E',
                    border: 'none',
                    color: '#070C16',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: !replyText.trim() || isSending ? 'not-allowed' : 'pointer',
                    opacity: !replyText.trim() || isSending ? 0.5 : 1
                  }}
                >
                  {isSending ? 'Sending WhatsApp...' : 'Send Official WhatsApp Advice 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
