import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, UserRole, ClinicalCardPayload, MedicineItem, PacsStudyData, AudioVoiceNote } from '../types.js';
import { ClinicalCard } from './ClinicalCards.js';
import { ClinicHoursLockoutBanner } from './ClinicHoursLockoutBanner.js';
import { VoiceNoteRecorder } from './VoiceNoteRecorder.js';
import { AudioVoiceNotePlayer } from './AudioVoiceNotePlayer.js';
import { DoctorVerificationBadge } from './DoctorVerificationBadge.js';
import { DoctorChatControls } from './DoctorChatControls.js';
import { DoctorQrStandeeModal } from './DoctorQrStandeeModal.js';
import { i18n } from '../services/i18n.js';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRole;
  onSendMessage: (text: string, card?: ClinicalCardPayload, voiceNote?: AudioVoiceNote) => void;
  onBack: () => void;
  isOnline: boolean;
  onToggleMute?: (conversationId: string, isMuted: boolean) => void;
  onToggleBlock?: (conversationId: string, isBlocked: boolean) => void;
  onArchive?: (conversationId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  currentUserName,
  currentUserRole,
  onSendMessage,
  onBack,
  isOnline,
  onToggleMute,
  onToggleBlock,
  onArchive
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [callAlert, setCallAlert] = useState<string | null>(null);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe((lang) => setCurrentLang(lang));
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversation.isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Custom Quick Actions
  const handleQuickRxSend = (medicines: MedicineItem[], diagnosis: string) => {
    const rxPayload: ClinicalCardPayload = {
      type: 'PRESCRIPTION',
      prescription: {
        rxId: `RX-${Date.now().toString().slice(-6)}`,
        uhid: 'UHID-2026-8819',
        patientName: conversation.participantName,
        patientAge: 46,
        patientGender: 'M',
        doctorName: currentUserName,
        doctorSpecialty: 'Cardiology & General Medicine',
        doctorRegNo: 'MCI-99410',
        clinicOrHospitalName: 'DocSearch Apex Super Specialty Hospital',
        prescribedAt: new Date().toISOString(),
        diagnosis: [diagnosis || 'Acute Bronchitis & Cough'],
        vitals: { bp: '128/84', pulse: '76', temp: '98.6' },
        medicines,
        generalAdvice: 'Complete full course. Drink warm water.',
        isSigned: true,
        signatureStamp: `SHA256:${Date.now()}...DOCSEARCH-ABDM-SIGNATURE`
      }
    };
    onSendMessage(`Official Digital Prescription (Rx) issued for ${conversation.participantName}`, rxPayload);
    setShowRxModal(false);
  };

  const handleQuickBillSend = (amount: number, serviceName: string) => {
    const billPayload: ClinicalCardPayload = {
      type: 'OPD_PAYMENT',
      opdPayment: {
        paymentId: `BILL-${Date.now().toString().slice(-6)}`,
        appointmentId: `APP-${Date.now().toString().slice(-5)}`,
        tokenNumber: 'B-12',
        uhid: 'UHID-2026-8819',
        patientName: conversation.participantName,
        doctorName: 'Dr. Ramesh Sharma',
        doctorSpecialty: 'Cardiology OPD',
        clinicName: 'DocSearch Apex Super Specialty Hospital',
        department: 'OPD Suite 204',
        feeAmount: amount,
        currency: 'INR',
        upiId: 'docsearch.hospital@icici',
        payeeName: 'DocSearch Apex Super Specialty Hospital',
        qrPayload: `upi://pay?pa=docsearch.hospital@icici&pn=ApexHospital&am=${amount}&cu=INR&tn=${encodeURIComponent(serviceName)}`,
        upiIntentUrl: `upi://pay?pa=docsearch.hospital@icici&pn=ApexHospital&am=${amount}&cu=INR&tn=${encodeURIComponent(serviceName)}`,
        paymentStatus: 'PENDING'
      }
    };
    onSendMessage(`Consultation Fee Bill for ${serviceName} — ₹${amount}`, billPayload);
    setShowBillModal(false);
  };

  return (
    <div className="sovra-chat-area">
      {/* Top Header */}
      <div className="sovra-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Back button for mobile */}
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ←
          </button>

          {/* Participant Avatar */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                border: '1px solid #4B5563'
              }}
            >
              {conversation.participantAvatar || (conversation.participantRole === 'DOCTOR' ? '👨‍⚕️' : '👤')}
            </div>
            {conversation.isOnline && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #111827'
                }}
              />
            )}
          </div>

          {/* Participant Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>
                {conversation.participantName}
              </span>
              {(conversation.participantRole === 'DOCTOR' || conversation.doctorVerification) && (
                <DoctorVerificationBadge doctorName={conversation.participantName} compact={true} />
              )}
              {conversation.isMuted && (
                <span title="Notifications Muted" style={{ fontSize: '12px' }}>🔕</span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: conversation.isOnline ? '#34D399' : '#94A3B8' }}>
              {conversation.isTyping ? 'typing...' : conversation.isOnline ? 'Online (Sovra PWA)' : 'Offline'}
              {conversation.participantSubtitle ? ` • ${conversation.participantSubtitle}` : ''}
            </div>
          </div>
        </div>

        {/* Right Action Icons (Calls & Menu) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Doctor Governance Tools if Doctor or Admin */}
          {(currentUserRole === 'DOCTOR' || currentUserRole === 'ADMIN') && (
            <DoctorChatControls
              conversation={conversation}
              onToggleMute={(isMuted) => onToggleMute && onToggleMute(conversation.id, isMuted)}
              onToggleBlock={(isBlocked) => onToggleBlock && onToggleBlock(conversation.id, isBlocked)}
              onArchive={() => onArchive && onArchive(conversation.id)}
              onOpenStandee={() => setShowStandeeModal(true)}
            />
          )}

          <button
            onClick={() => {
              setCallAlert('Encrypted WebRTC Audio Call initializing with doctor...');
              setTimeout(() => setCallAlert(null), 3500);
            }}
            title="Start Zero-Cost Audio Call"
            style={{
              background: 'rgba(15, 118, 110, 0.2)',
              border: '1px solid rgba(15, 118, 110, 0.4)',
              color: '#2DD4BF',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📞
          </button>

          <button
            onClick={() => {
              setCallAlert('Encrypted WebRTC HD Video Consultation initializing...');
              setTimeout(() => setCallAlert(null), 3500);
            }}
            title="Start Zero-Cost Video Consultation"
            style={{
              background: 'rgba(15, 118, 110, 0.2)',
              border: '1px solid rgba(15, 118, 110, 0.4)',
              color: '#2DD4BF',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📹
          </button>
        </div>
      </div>

      {/* Blocked Patient Alert Banner */}
      {conversation.isBlocked && (
        <div
          style={{
            background: 'linear-gradient(90deg, #7F1D1D 0%, #991B1B 100%)',
            borderBottom: '1px solid #DC2626',
            padding: '8px 16px',
            color: '#FEE2E2',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>🚫 This patient has been restricted. Further messages are blocked.</span>
          {onToggleBlock && (
            <button
              onClick={() => onToggleBlock(conversation.id, false)}
              style={{
                background: '#FFFFFF',
                color: '#7F1D1D',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Unblock
            </button>
          )}
        </div>
      )}

      {/* OPD Clinic Hours Lockout & Medico-Legal Emergency Banner */}
      <ClinicHoursLockoutBanner
        currentUserRole={currentUserRole}
        onLockStatusChange={(locked) => setIsChatLocked(locked)}
      />

      {/* Call Alert Toast */}
      {callAlert && (
        <div
          style={{
            position: 'absolute',
            top: '68px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0F766E',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⚡</span>
          <span>{callAlert}</span>
        </div>
      )}

      {/* Encryption & ABDM Notice */}
      <div
        style={{
          padding: '6px 12px',
          background: 'rgba(15, 23, 42, 0.7)',
          textAlign: 'center',
          fontSize: '10px',
          color: '#94A3B8',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        <span>🔒</span>
        <span>Messages and clinical documents are stored client-side in your local IndexedDB vault. Zero server bloat.</span>
      </div>

      {/* Message Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {messages.map((msg) => {
          const isOutgoing = msg.isOutgoing;
          return (
            <div
              key={msg.id}
              className={`msg-bubble ${isOutgoing ? 'msg-outgoing' : 'msg-incoming'}`}
            >
              {/* Sender Name if incoming & not active user */}
              {!isOutgoing && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', marginBottom: '2px' }}>
                  {msg.senderName}
                </div>
              )}

              {/* Message Text (if not just voice note indicator) */}
              {(!msg.voiceNote || msg.text !== '🎙️ Voice Note') && (
                <div style={{ fontSize: '13px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>
              )}

              {/* Audio Voice Note Player if attached */}
              {msg.voiceNote && (
                <AudioVoiceNotePlayer
                  voiceNote={msg.voiceNote}
                  isOutgoing={isOutgoing}
                />
              )}

              {/* Embedded Clinical Action Card if attached */}
              {msg.clinicalCard && (
                <ClinicalCard
                  card={msg.clinicalCard}
                  onPaymentSuccess={(payId) => {
                    onSendMessage(`Payment of ₹500 verified successfully via UPI! Txn: UPI/AUTO-REC-${payId}`);
                  }}
                />
              )}

              {/* Timestamp & Delivery Ticks */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  marginTop: '4px',
                  fontSize: '10px',
                  color: isOutgoing ? '#A7F3D0' : '#94A3B8'
                }}
              >
                <span>{formatTimestamp(msg.timestamp)}</span>
                {isOutgoing && (
                  <span
                    className={
                      msg.status === 'READ'
                        ? 'tick-blue'
                        : msg.status === 'DELIVERED'
                        ? 'tick-double'
                        : 'tick-single'
                    }
                    title={msg.status}
                  >
                    {msg.status === 'READ' ? '✓✓' : msg.status === 'DELIVERED' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Typing Indicator */}
        {conversation.isTyping && (
          <div
            className="msg-bubble msg-incoming"
            style={{ maxWidth: '140px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>Doctor is typing</span>
            <div className="typing-dots">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        style={{
          background: '#1F2937',
          padding: '10px 14px',
          borderTop: '1px solid #374151',
          position: 'relative'
        }}
      >
        {/* Attach Menu Popover */}
        {showAttachMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '64px',
              left: '14px',
              background: '#111827',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '220px',
              zIndex: 100
            }}
          >
            <div style={{ fontSize: '11px', color: '#94A3B8', padding: '4px 8px', fontWeight: 700 }}>
              HEALTHCARE ATTACHMENTS:
            </div>
            <button
              onClick={() => {
                setShowRxModal(true);
                setShowAttachMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1F2937',
                color: '#5EEAD4',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 600
              }}
            >
              <span>🩺</span>
              <span>Issue Digital Prescription (Rx)</span>
            </button>
            <button
              onClick={() => {
                setShowBillModal(true);
                setShowAttachMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1F2937',
                color: '#FBBF24',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 600
              }}
            >
              <span>💳</span>
              <span>Send OPD Consultation Bill (UPI)</span>
            </button>
            <button
              onClick={() => {
                const labPayload: ClinicalCardPayload = {
                  type: 'LAB_REPORT',
                  labReport: {
                    reportId: `REP-${Date.now().toString().slice(-6)}-LIPID`,
                    accessionNumber: `ACC-${Date.now().toString().slice(-5)}`,
                    uhid: 'UHID-2026-8819',
                    patientName: conversation.participantName,
                    testName: 'Lipid Profile Comprehensive Screen',
                    testCategory: 'Clinical Biochemistry',
                    sampleCollectedAt: new Date(Date.now() - 3600000).toISOString(),
                    reportedAt: new Date().toISOString(),
                    hospitalName: 'DocSearch Diagnostic Excellence Hub',
                    pathologistName: 'Dr. Sunita Mehta, MD',
                    pathologistDegrees: 'NABL Technical Signatory',
                    parameters: [
                      { name: 'Total Cholesterol', observedValue: '185', unit: 'mg/dL', biologicalReferenceRange: '< 200', status: 'NORMAL' },
                      { name: 'Triglycerides', observedValue: '142', unit: 'mg/dL', biologicalReferenceRange: '< 150', status: 'NORMAL' },
                      { name: 'HDL Cholesterol', observedValue: '48', unit: 'mg/dL', biologicalReferenceRange: '> 40', status: 'NORMAL' },
                      { name: 'LDL Cholesterol', observedValue: '108', unit: 'mg/dL', biologicalReferenceRange: '< 100', status: 'HIGH' }
                    ],
                    overallInterpretation: 'Borderline elevated LDL cholesterol. Dietary lifestyle advice recommended.',
                    isAbnormal: true,
                    verificationHash: 'SHA256:4b912c40e1f37...OK'
                  }
                };
                onSendMessage(`Verified LIMS Diagnostic Report — Lipid Profile Screen`, labPayload);
                setShowAttachMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1F2937',
                color: '#38BDF8',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 600
              }}
            >
              <span>🔬</span>
              <span>Send Pathology Lab Report</span>
            </button>

            {/* Attach PACS Radiology Study */}
            <button
              type="button"
              onClick={() => {
                const pacsPayload: ClinicalCardPayload = {
                  type: 'RADIOLOGY_PACS',
                  pacsStudy: {
                    studyInstanceUid: `1.2.840.113619.2.${Date.now()}`,
                    accessionNumber: `RAD-${Date.now().toString().slice(-5)}`,
                    uhid: 'UHID-2026-8819',
                    patientName: conversation.participantName,
                    modality: 'CT',
                    bodyPart: 'Chest / Thorax',
                    studyDescription: 'HRCT Chest High-Resolution Helical Screen',
                    studyDate: new Date().toISOString().slice(0, 10),
                    sliceCount: 120,
                    referringDoctor: currentUserName,
                    institutionName: 'DocSearch Diagnostic Excellence Hub',
                    keyFindings: 'Bilateral mild subpleural ground-glass opacities in lower lobes. No acute consolidation or pleural effusion.'
                  }
                };
                onSendMessage(`Verified Multi-Slice CT Scan (Zero-Storage PACS Stream)`, pacsPayload);
                setShowAttachMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1F2937',
                color: '#A855F7',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 600
              }}
            >
              <span>🩻</span>
              <span>Send CT / MRI Scan (PACS Stream)</span>
            </button>
          </div>
        )}

        {isRecordingVoiceNote ? (
          <VoiceNoteRecorder
            onSendVoiceNote={(audioBase64, durationSeconds, mimeType) => {
              setIsRecordingVoiceNote(false);
              onSendMessage('🎙️ Voice Note', undefined, { audioBase64, durationSeconds, mimeType });
            }}
            onCancel={() => setIsRecordingVoiceNote(false)}
          />
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Attachment Toggle */}
            <button
              type="button"
              disabled={isChatLocked || !!conversation.isBlocked}
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              title={isChatLocked ? 'Consultation Closed' : 'Attach Clinical Action Card (Rx, Lab, UPI, PACS)'}
              style={{
                background: isChatLocked || conversation.isBlocked ? '#1F2937' : showAttachMenu ? '#0F766E' : '#374151',
                color: isChatLocked || conversation.isBlocked ? '#64748B' : 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isChatLocked || conversation.isBlocked ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                flexShrink: 0
              }}
            >
              {isChatLocked || conversation.isBlocked ? '🔒' : '＋'}
            </button>

            {/* Text Input */}
            <input
              type="text"
              disabled={isChatLocked || !!conversation.isBlocked}
              placeholder={
                conversation.isBlocked
                  ? '🚫 Patient has been blocked. Consultation restricted.'
                  : isChatLocked
                  ? i18n.t('clinicClosedPlaceholder')
                  : i18n.t('typeMessagePlaceholder')
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                background: isChatLocked || conversation.isBlocked ? '#1E293B' : '#111827',
                border: `1px solid ${isChatLocked || conversation.isBlocked ? '#475569' : '#374151'}`,
                borderRadius: '24px',
                padding: '10px 16px',
                color: isChatLocked || conversation.isBlocked ? '#94A3B8' : '#F8FAFC',
                fontSize: '13px',
                outline: 'none',
                cursor: isChatLocked || conversation.isBlocked ? 'not-allowed' : 'text'
              }}
            />

            {/* 1-Click Mic Voice Note Button */}
            <button
              type="button"
              disabled={isChatLocked || !!conversation.isBlocked}
              onClick={() => setIsRecordingVoiceNote(true)}
              title="Record Voice Note (Audio Memo)"
              style={{
                background: isChatLocked || conversation.isBlocked ? '#1E293B' : 'rgba(15, 118, 110, 0.25)',
                border: `1px solid ${isChatLocked || conversation.isBlocked ? '#334155' : '#14B8A6'}`,
                color: isChatLocked || conversation.isBlocked ? '#64748B' : '#5EEAD4',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isChatLocked || conversation.isBlocked ? 'not-allowed' : 'pointer',
                fontSize: '17px',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              🎙️
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isChatLocked || !!conversation.isBlocked || !inputText.trim()}
              style={{
                background: isChatLocked || conversation.isBlocked ? '#374151' : inputText.trim() ? '#0F766E' : '#374151',
                color: isChatLocked || conversation.isBlocked ? '#64748B' : inputText.trim() ? 'white' : '#94A3B8',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isChatLocked || conversation.isBlocked || !inputText.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                flexShrink: 0,
                boxShadow: !isChatLocked && !conversation.isBlocked && inputText.trim() ? '0 2px 8px rgba(15, 118, 110, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              ➤
            </button>
          </form>
        )}
      </div>

      {/* Modal: Quick Digital Rx Builder */}
      {showRxModal && (
        <div className="modal-overlay" onClick={() => setShowRxModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
            <h3 style={{ color: '#5EEAD4', margin: '0 0 12px 0' }}>🩺 Issue Digital Prescription (Rx)</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
              Add medicines with dosage and timing to generate a cryptographically signed e-Prescription.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Clinical Diagnosis:</label>
                <input
                  id="rx-diag-input"
                  defaultValue="Acute Upper Respiratory Tract Infection & Mild Fever"
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', padding: '8px', borderRadius: '6px', color: 'white', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Medicine 1:</label>
                <input
                  id="rx-med1-name"
                  defaultValue="Amoxicillin & Potassium Clavulanate (Augmentin 625)"
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', padding: '8px', borderRadius: '6px', color: 'white', fontSize: '12px', marginBottom: '4px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input id="rx-med1-dose" defaultValue="625 mg" style={{ flex: 1, background: '#111827', border: '1px solid #374151', padding: '6px', borderRadius: '6px', color: 'white', fontSize: '11px' }} />
                  <input id="rx-med1-freq" defaultValue="1-0-1 (Twice daily)" style={{ flex: 1, background: '#111827', border: '1px solid #374151', padding: '6px', borderRadius: '6px', color: 'white', fontSize: '11px' }} />
                  <input id="rx-med1-dur" defaultValue="5 Days" style={{ flex: 1, background: '#111827', border: '1px solid #374151', padding: '6px', borderRadius: '6px', color: 'white', fontSize: '11px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Medicine 2 (SOS):</label>
                <input
                  id="rx-med2-name"
                  defaultValue="Paracetamol Tablets IP (Dolo 650)"
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', padding: '8px', borderRadius: '6px', color: 'white', fontSize: '12px', marginBottom: '4px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input id="rx-med2-dose" defaultValue="650 mg" style={{ flex: 1, background: '#111827', border: '1px solid #374151', padding: '6px', borderRadius: '6px', color: 'white', fontSize: '11px' }} />
                  <input id="rx-med2-freq" defaultValue="1-0-1 (When needed for fever)" style={{ flex: 1, background: '#111827', border: '1px solid #374151', padding: '6px', borderRadius: '6px', color: 'white', fontSize: '11px' }} />
                  <input id="rx-med2-dur" defaultValue="3 Days" style={{ flex: 1, background: '#111827', border: '1px solid #374151', padding: '6px', borderRadius: '6px', color: 'white', fontSize: '11px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowRxModal(false)}
                  style={{ flex: 1, background: '#374151', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const diag = (document.getElementById('rx-diag-input') as HTMLInputElement)?.value || '';
                    const m1Name = (document.getElementById('rx-med1-name') as HTMLInputElement)?.value || 'Augmentin 625';
                    const m1Dose = (document.getElementById('rx-med1-dose') as HTMLInputElement)?.value || '625 mg';
                    const m1Freq = (document.getElementById('rx-med1-freq') as HTMLInputElement)?.value || '1-0-1';
                    const m1Dur = (document.getElementById('rx-med1-dur') as HTMLInputElement)?.value || '5 Days';

                    const m2Name = (document.getElementById('rx-med2-name') as HTMLInputElement)?.value || 'Dolo 650';
                    const m2Dose = (document.getElementById('rx-med2-dose') as HTMLInputElement)?.value || '650 mg';
                    const m2Freq = (document.getElementById('rx-med2-freq') as HTMLInputElement)?.value || 'SOS';
                    const m2Dur = (document.getElementById('rx-med2-dur') as HTMLInputElement)?.value || '3 Days';

                    const meds: MedicineItem[] = [
                      { id: '1', name: m1Name, dosage: m1Dose, frequency: m1Freq, duration: m1Dur, instructions: 'After meals' },
                      { id: '2', name: m2Name, dosage: m2Dose, frequency: m2Freq, duration: m2Dur, instructions: 'For fever > 100 F' }
                    ];

                    handleQuickRxSend(meds, diag);
                  }}
                  style={{ flex: 1, background: '#0F766E', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓ Sign & Dispatch Rx
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick OPD Consultation Bill Builder */}
      {showBillModal && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '20px' }}>
            <h3 style={{ color: '#FBBF24', margin: '0 0 12px 0' }}>💳 Request OPD Consultation Fee</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
              Create a zero-commission 1-click UPI payment card for this patient.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Consultation / Service Name:</label>
                <input
                  id="bill-service-input"
                  defaultValue="Specialist OPD Doctor Consultation"
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', padding: '8px', borderRadius: '6px', color: 'white', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Fee Amount (INR ₹):</label>
                <input
                  id="bill-amount-input"
                  type="number"
                  defaultValue="500"
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', padding: '8px', borderRadius: '6px', color: 'white', fontSize: '14px', fontWeight: 'bold' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  style={{ flex: 1, background: '#374151', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sName = (document.getElementById('bill-service-input') as HTMLInputElement)?.value || 'Doctor OPD Consultation';
                    const amt = Number((document.getElementById('bill-amount-input') as HTMLInputElement)?.value) || 500;
                    handleQuickBillSend(amt, sName);
                  }}
                  style={{ flex: 1, background: '#D97706', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ⚡ Send UPI Bill Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Clinic Desk QR Standee Modal */}
      <DoctorQrStandeeModal
        isOpen={showStandeeModal}
        onClose={() => setShowStandeeModal(false)}
        doctorName={currentUserRole === 'DOCTOR' ? currentUserName : conversation.participantName}
      />
    </div>
  );
};
