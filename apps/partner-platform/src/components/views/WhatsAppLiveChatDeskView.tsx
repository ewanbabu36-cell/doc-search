import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import type { WhatsAppConversationThreadDto, SendWhatsAppMessageRequest } from '@docsearch/api-contracts';

interface Props {
  conversations: WhatsAppConversationThreadDto[];
  onSendMessage: (data: SendWhatsAppMessageRequest) => Promise<void>;
  onToggleBot: (conversationId: string, botActive: boolean) => Promise<void>;
}

export const WhatsAppLiveChatDeskView: React.FC<Props> = ({
  conversations,
  onSendMessage,
  onToggleBot
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  // Interactive Virtual Patient Messages Simulation
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'PATIENT', text: 'Hi, Dr. Sharma clinic me appointment chahiye', time: '10:15 AM' },
    { id: '2', sender: 'BOT', text: 'Namaste! Dr. Sharma Clinic automated assistant me aapka swagat hai. 🙏\n\nKripya select karein:\n1️⃣ Book OPD Token\n2️⃣ Live Queue Status\n3️⃣ Download Prescription PDF\n4️⃣ Clinic Location & Timings', time: '10:15 AM' },
    { id: '3', sender: 'PATIENT', text: '1', time: '10:16 AM' },
    { id: '4', sender: 'BOT', text: '✅ Appointment Confirmed!\n\n🎫 Token: TKN-012\n👨‍⚕️ Doctor: Dr. Rajesh Sharma, MD\n⏰ Time: Today, 11:30 AM (Morning Session)\n📍 Chamber: Chamber 1\n\nLive queue track karne ke liye reply karein "QUEUE".', time: '10:16 AM' }
  ]);

  const handleQuickReply = (userText: string) => {
    const userMsg = { id: String(Date.now()), sender: 'PATIENT', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let botReply = '';
      if (userText.includes('QUEUE') || userText === '2') {
        botReply = '📊 Live Queue Status for Token #TKN-012:\n\n• Currently Serving: Token #TKN-008\n• Patients Ahead: 4 patients\n• Estimated Wait: ~15 mins\n\nAapka turn aane par hum aapko notification bhejenge.';
      } else if (userText.includes('Prescription') || userText === '3') {
        botReply = '📄 Aapka last prescription ready hai:\n\n• Date: 30 Aug 2026\n• Diagnosis: Acute Bronchitis\n• Rx: Azithromycin 500mg, Levocetirizine 5mg\n\n📥 PDF Download Link: https://docsearch.health/rx/DOC-9041.pdf';
      } else if (userText.includes('Location') || userText === '4') {
        botReply = '📍 Clinic Address:\nDr. Sharma Healthcare Clinic, Main Market, Block B, New Delhi\n⏰ Timings: 10:00 AM - 02:00 PM & 05:00 PM - 08:30 PM\n📞 Phone: +91 98765 43210';
      } else {
        botReply = 'Namaste! Kripya select karein:\n1️⃣ Book OPD Token\n2️⃣ Track Live Queue\n3️⃣ Download Prescription PDF\n4️⃣ Clinic Location';
      }

      const botMsg = { id: String(Date.now() + 1), sender: 'BOT', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const text = replyText;
    setReplyText('');
    handleQuickReply(text);
    if (selectedConvId) {
      void onSendMessage({ conversationId: selectedConvId, messageType: 'TEXT_MESSAGE', textContent: text });
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', minHeight: '620px' }}>
      
      {/* Left: Active WhatsApp Inbound Threads */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
            💬 Inbound WhatsApp Threads
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleBot(selectedConvId, true)}
              style={{ fontSize: '0.6875rem' }}
            >
              Toggle Bot
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: '1 1 auto' }}>
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedConvId(c.id)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: selectedConvId === c.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                border: selectedConvId === c.id ? '1px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#F8FAFC' }}>{c.patientName}</span>
                <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>{c.botActive ? '🤖 AI Bot' : '🧑‍💼 Staff'}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.lastMessageSnippet}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>{c.phoneNumber}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Live Interactive Mobile Phone WhatsApp Simulator */}
      <div style={{
        backgroundColor: '#0B141A',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(6, 182, 212, 0.2)'
      }}>
        {/* WhatsApp Mobile Top Bar */}
        <div style={{
          backgroundColor: '#202C33',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem'
            }}>
              🩺
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E9EDEF' }}>
                Dr. Sharma Clinic Assistant
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#25D366' }}>
                🟢 Verified Healthcare Business • Online
              </div>
            </div>
          </div>

          <Badge variant="success">Auto-Responder</Badge>
        </div>

        {/* Chat Messages Bubble Area */}
        <div style={{
          flex: '1 1 auto',
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          minHeight: '380px'
        }}>
          {chatMessages.map((msg) => {
            const isPatient = msg.sender === 'PATIENT';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isPatient ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  backgroundColor: isPatient ? '#005C4B' : '#202C33',
                  color: '#E9EDEF',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopRightRadius: isPatient ? '2px' : '12px',
                  borderTopLeftRadius: !isPatient ? '2px' : '12px',
                  fontSize: '0.8125rem',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-line',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {msg.text}
                  <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: '4px' }}>
                    {msg.time} {isPatient && '✓✓'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick-Action Trigger Buttons (Patient 1-Click Tap) */}
        <div style={{ padding: '8px 12px', backgroundColor: '#111B21', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => handleQuickReply('1. Book OPD Token')}
            style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: '#202C33', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            🎫 1. Book Token
          </button>
          <button
            onClick={() => handleQuickReply('2. QUEUE Status')}
            style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: '#202C33', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📊 2. Track Queue
          </button>
          <button
            onClick={() => handleQuickReply('3. Download Prescription PDF')}
            style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: '#202C33', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📄 3. Get Rx PDF
          </button>
          <button
            onClick={() => handleQuickReply('4. Clinic Location')}
            style={{ padding: '6px 12px', borderRadius: '9999px', backgroundColor: '#202C33', color: '#C084FC', border: '1px solid rgba(192, 132, 252, 0.3)', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📍 4. Location Map
          </button>
        </div>

        {/* Type Message Input Form */}
        <form onSubmit={handleSendCustom} style={{ display: 'flex', padding: '10px 14px', backgroundColor: '#202C33', gap: '8px' }}>
          <input
            type="text"
            placeholder="Type WhatsApp message (e.g. 1, 2, Queue, Hi)..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={{
              flex: '1 1 auto',
              backgroundColor: '#2A3942',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#E9EDEF',
              fontSize: '0.8125rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#00A884',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            Send ✈️
          </button>
        </form>
      </div>
    </div>
  );
};
