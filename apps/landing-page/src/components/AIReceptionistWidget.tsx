import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  options?: string[] | undefined;
  appointmentCard?: {
    patientName: string;
    doctorName: string;
    specialty: string;
    slot: string;
    tokenNumber: string;
    branch: string;
    fee: string;
  } | undefined;
  time: string;
}

export const AIReceptionistWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: 'Namaste! 🙏 Main DocSearch 24x7 Smart AI Receptionist hoon. Main aapki kya sahayata kar sakti hoon?',
          options: [
            '📅 Book Doctor Appointment',
            '🛏️ Check Live ICU / Bed Availability',
            '🧪 Book Home Lab Test (Blood/Sugar)',
            '💰 Check Surgery & Treatment Cost',
            '🩺 Doctor Sign-up: Free Clinic Demo'
          ],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      processAIResponse(text);
      setIsTyping(false);
    }, 800);
  };

  const processAIResponse = (query: string) => {
    const q = query.toLowerCase();
    let replyText = '';
    let options: string[] | undefined = undefined;
    let appointmentCard = undefined;

    if (q.includes('book') || q.includes('appointment') || q.includes('doctor') || q.includes('milna')) {
      replyText = 'Kripya batayein aapko kis samasya ya doctor ke liye consult karna hai? Aap neeche di gayi specialty choose kar sakte hain:';
      options = [
        '❤️ Cardiologist (Dil ke doctor)',
        '👶 Pediatrician (Bachhon ke doctor)',
        '🦴 Orthopedic (Haddi & Joint)',
        '🤰 Gynecologist (Maternity & Mahila Rog)',
        '🩺 General Physician (Bukhar, Khansi)'
      ];
    } else if (q.includes('cardio') || q.includes('dil') || q.includes('heart')) {
      replyText = 'Apex Heart Institute me Dr. Vikram Malhotra (Senior Cardiologist) ke available slots:';
      options = [
        '⏰ Aaj Shaam 4:30 PM (Token #14)',
        '⏰ Kal Subah 10:30 AM (Token #04)',
        '⏰ Kal Dopahar 1:00 PM (Token #08)'
      ];
    } else if (q.includes('token') || q.includes('pm') || q.includes('am') || q.includes('4:30') || q.includes('10:30')) {
      replyText = '🎉 Bahut badiya! Aapka appointment confirm ho gaya hai. Aapka digital token aur WhatsApp confirmation pass niche generate ho chuka hai:';
      appointmentCard = {
        patientName: 'Aapka / Patient Profile',
        doctorName: 'Dr. Vikram Malhotra (MD, DM Cardiology)',
        specialty: 'Department of Cardiovascular Sciences',
        slot: 'Aaj Shaam 4:30 PM - 5:00 PM',
        tokenNumber: 'DOC-TK-014',
        branch: 'Metro Health Alliance / Apex Hospital (South Delhi)',
        fee: '₹799 (Direct UPI / Cashless TPA Covered)'
      };
      options = ['📲 Send WhatsApp Confirmation Pass', '🧪 Add Home ECG / Lipid Test (+₹399)', '🚗 Get Google Maps Route'];
    } else if (q.includes('bed') || q.includes('icu') || q.includes('admit')) {
      replyText = '🏥 Live Central Hospital Bed Matrix Status:\n\n• ICU Ventilator Beds: 4 Available (Floor 3)\n• HDU Cardiac Beds: 7 Available (Floor 2)\n• Single Deluxe Private: 12 Available\n• General Ward Beds: 28 Available\n\nKya aapko emergency reservation karni hai?';
      options = ['🚨 Reserve ICU Bed Instantly', '📞 Connect to Emergency Triage Counter', '📄 Check TPA Cashless Pre-Auth'];
    } else if (q.includes('lab') || q.includes('blood') || q.includes('test')) {
      replyText = '🧪 DocSearch Smart Home Lab Service:\n\nHamare NABL-certified phlebotomist aapke ghar aakar sample collect karenge. Free Home Collection available hai! Kaunsa test chahiye?';
      options = ['Full Body Health Checkup (64 Tests) - ₹899', 'Diabetes Package (HbA1c + Fasting Sugar) - ₹349', 'Thyroid Profile (T3, T4, TSH) - ₹299'];
    } else if (q.includes('cost') || q.includes('price') || q.includes('surgery')) {
      replyText = '💰 Transparent Hospital Pricing & PM-JAY/TPA Estimates:\n\n• Normal Delivery: ₹35,000 - ₹50,000 (TPA 100% Cashless)\n• Cataract Eye Surgery (Phaco): ₹22,000 / Eye\n• Knee Replacement (Single): ₹1,40,000\n\nSabhi major insurance companies (Star Health, Niva Bupa, ICICI Lombard, Ayushman Bharat) accepted hain.';
      options = ['📝 Verify My Insurance Policy', '📅 Book Free Pre-Surgery Counseling'];
    } else if (q.includes('clinic') || q.includes('demo') || q.includes('doctor sign-up')) {
      replyText = '👨‍⚕️ Doctor / Clinic Partner Onboarding:\n\nDocSearch Clinic Platform ke sath aapko milta hai:\n• 1-Click Hinglish Voice Scribe\n• Instant WhatsApp Rx & Dynamic UPI QR\n• Zero-driver ABHA Kiosk\n\nHamara executive aapke clinic chamber me 15-minute ka live demo dega.';
      options = ['🚀 Schedule Free Chamber Demo', '📞 Talk to Sales Lead Motu Sharma'];
    } else {
      replyText = 'Dhanyawad! Main aapki request par hospital team ko alert kar rahi hoon. Aap niche diye gaye options se 1-click me aage badh sakte hain:';
      options = ['📅 Book Doctor Appointment', '🛏️ Check Live Bed Availability', '🧪 Book Home Lab Test'];
    }

    const aiMsg: ChatMessage = {
      id: 'ai-' + Date.now(),
      sender: 'ai',
      text: replyText,
      options: options,
      appointmentCard: appointmentCard,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#06B6D4',
            color: '#070C16',
            border: 'none',
            borderRadius: '50px',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 10px 30px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3)',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.9375rem',
            transition: 'all 0.3s ease'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🤖</span>
          <span>24x7 AI Receptionist</span>
          <span style={{ backgroundColor: '#10B981', color: '#FFF', borderRadius: '10px', padding: '2px 6px', fontSize: '0.6875rem' }}>
            ONLINE
          </span>
        </button>
      )}

      {/* Interactive Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '400px',
            maxWidth: '92vw',
            height: '620px',
            maxHeight: '85vh',
            backgroundColor: '#0B132B',
            border: '2px solid #06B6D4',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 70px rgba(0,0,0,0.85), 0 0 40px rgba(6, 182, 212, 0.25)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#0F172A',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: '2rem' }}>👩‍⚕️</span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '2px solid #0F172A'
                  }}
                />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Dr. Aanya (AI Receptionist)
                </h3>
                <span style={{ fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 600 }}>
                  ⚡ 24x7 Smart Hospital & Clinic Concierge
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setIsOpen(false)}
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
          </div>

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    backgroundColor: m.sender === 'user' ? '#06B6D4' : 'rgba(30, 41, 59, 0.8)',
                    color: m.sender === 'user' ? '#070C16' : '#F1F5F9',
                    borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    padding: '12px 14px',
                    fontSize: '0.8125rem',
                    lineHeight: '1.4',
                    fontWeight: m.sender === 'user' ? 600 : 400,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {m.text}

                  {/* Confirmed Appointment Pass Card */}
                  {m.appointmentCard && (
                    <div
                      style={{
                        marginTop: '10px',
                        backgroundColor: '#0F172A',
                        border: '1.5px solid #10B981',
                        borderRadius: '12px',
                        padding: '12px',
                        color: '#FFF'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>✓ CONFIRMED OPD PASS</span>
                        <span style={{ fontSize: '0.6875rem', backgroundColor: '#10B981', color: '#070C16', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                          {m.appointmentCard.tokenNumber}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>
                        {m.appointmentCard.doctorName}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                        {m.appointmentCard.specialty}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700, marginTop: '6px' }}>
                        🕒 {m.appointmentCard.slot}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '2px' }}>
                        🏥 {m.appointmentCard.branch}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#A7F3D0', fontWeight: 700, marginTop: '4px' }}>
                        💳 Fee: {m.appointmentCard.fee}
                      </div>
                    </div>
                  )}
                </div>

                <span style={{ fontSize: '0.625rem', color: '#64748B', marginTop: '4px' }}>
                  {m.time}
                </span>

                {/* Interactive Quick Options Chips */}
                {m.options && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '8px',
                      maxWidth: '95%'
                    }}
                  >
                    {m.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSend(opt)}
                        style={{
                          backgroundColor: 'rgba(6, 182, 212, 0.12)',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          color: '#38BDF8',
                          borderRadius: '12px',
                          padding: '6px 10px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06B6D4', fontSize: '0.75rem', fontStyle: 'italic' }}>
                <span>👩‍⚕️ Dr. Aanya is typing...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px 16px',
              backgroundColor: '#0F172A',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. Doctor milna hai, ICU bed...)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '20px',
                padding: '10px 14px',
                color: '#FFF',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#06B6D4',
                color: '#070C16',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '1rem'
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};
