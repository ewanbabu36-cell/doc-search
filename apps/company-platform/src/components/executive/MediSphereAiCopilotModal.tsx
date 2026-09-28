import React, { useState } from 'react';
import { AICore, AIOperationalPipeline } from '@docsearch/ui-kit';

export interface MediSphereAiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string | undefined;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionButtons?: Array<{ label: string; action: string }> | undefined;
}

export const MediSphereAiCopilotModal: React.FC<MediSphereAiCopilotModalProps> = ({
  isOpen,
  onClose,
  initialTopic
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: "Hello Super Admin! I'm your AI Copilot. I continuously monitor platform MRR, hospital operations, and doctor adoption across all connected branches. How can I assist your executive decisions today?",
      timestamp: 'Just now',
      actionButtons: [
        { label: 'Analyze 23 Churn Risk Partners', action: 'churn' },
        { label: 'Forecast Next Month Revenue', action: 'forecast' },
        { label: 'Review CityCare Enterprise Upgrade', action: 'upgrade' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  React.useEffect(() => {
    if (initialTopic) {
      handleSendMessage(initialTopic);
    }
  }, [initialTopic]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    setTimeout(() => {
      let aiReply = "I have analyzed platform telemetry across all connected hospitals. All systems are operating normally with 99.98% uptime.";
      let buttons: Array<{ label: string; action: string }> | undefined = undefined;

      const lower = query.toLowerCase();
      if (lower.includes('churn') || lower.includes('renewal') || lower.includes('risk') || lower.includes('23')) {
        aiReply = "⚠️ **Churn Risk Analysis (23 Partners)**:\n• 14 partners have expiring annual licenses within 15 days without auto-renew enabled.\n• 9 clinics have shown a 28% decrease in OPD token volume due to recent staff rotations.\n\n**Recommended Executive Action**: Trigger automated 15% renewal loyalty incentives and dispatch customer success account managers to CarePlus Hospital & MetroCare Clinics.";
        buttons = [
          { label: '📧 Dispatch Auto-Renewal Incentives', action: 'dispatch_incentive' },
          { label: '📞 Schedule Account Manager Review', action: 'schedule_review' }
        ];
      } else if (lower.includes('forecast') || lower.includes('revenue') || lower.includes('mrr') || lower.includes('arr')) {
        aiReply = "📈 **Revenue Forecast (Q4 / Next Month)**:\n• Expected MRR: ₹ 6.4 Cr (▲ 13.0% growth vs this month's ₹ 5.68 Cr).\n• Projected ARR: ₹ 72.8 Cr by year-end.\n• Key growth drivers: 7 hospitals scaling Bed IoT + Smart Counter AI Add-ons (+₹ 48L MRR).";
        buttons = [
          { label: '📊 Download Executive Board Slide PDF', action: 'download_pdf' }
        ];
      } else if (lower.includes('upgrade') || lower.includes('citycare')) {
        aiReply = "🚀 **CityCare Clinic Upgrade Dossier**:\n• Upgraded from Starter to Enterprise Plan (₹ 1.74 Cr tier).\n• Added 12 branch licenses + LIMS HL7 bi-directional analyzer integration.\n• LTV impact: +₹ 14.2 Lakhs annualized.";
      } else if (lower.includes('failure') || lower.includes('payment') || lower.includes('14')) {
        aiReply = "🔴 **Payment Failures Alert (14 Transactions)**:\n• 9 UPI mandate timeout failures from ICICI Bank gateway spike.\n• 5 corporate credit card expiration declines.\n• Automated dunning retry scheduled for tonight at 23:00 IST.";
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}-${Math.random()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButtons: buttons
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '760px',
          maxWidth: '100%',
          height: '680px',
          maxHeight: '94vh',
          backgroundColor: '#0D1326',
          border: '1.5px solid #8B5CF6',
          borderRadius: '18px',
          boxShadow: '0 24px 64px rgba(139, 92, 246, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#131B36',
            borderBottom: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AICore state={isThinking ? 'PROCESSING' : 'IDLE'} size={44} showStatusBadge={false} showWaveform={false} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: '#F8FAFC', fontSize: '1.05rem' }}>
                  AI Copilot
                </strong>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}
                >
                  ● Active Telemetry Connected
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Ask, Analyze, Act - Deep analytics across 1,248 Healthcare Partners
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '10px'
              }}
            >
              {msg.sender === 'ai' && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0
                  }}
                >
                  🤖
                </div>
              )}

              <div
                style={{
                  maxWidth: '82%',
                  backgroundColor: msg.sender === 'user' ? '#4F46E5' : '#172242',
                  border: msg.sender === 'user' ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  padding: '12px 16px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: msg.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : '#94A3B8',
                    marginTop: '6px',
                    textAlign: 'right'
                  }}
                >
                  {msg.timestamp}
                </div>

                {msg.actionButtons && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {msg.actionButtons.map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleSendMessage(btn.label)}
                        style={{
                          backgroundColor: 'rgba(139, 92, 246, 0.25)',
                          border: '1px solid #A855F7',
                          color: '#E9D5FF',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        ⚡ {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div style={{ margin: '8px 0' }}>
              <AIOperationalPipeline currentStage="PROCESSING" userRole="SUPER_ADMIN" compact />
            </div>
          )}
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div
          style={{
            padding: '8px 20px',
            backgroundColor: '#0B1020',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto'
          }}
        >
          {[
            'Explain 23 Churn Risk Partners',
            'Forecast Next Month Revenue',
            'What is our ARR growth rate?',
            'Check payment failures (14)'
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSendMessage(chip)}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                color: '#CBD5E1',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              💡 {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#131B36',
            borderTop: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Ask AI Copilot about partners, revenue, churn, or platform operations..."
            style={{
              flex: 1,
              backgroundColor: '#0B1120',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#FFF',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            style={{
              backgroundColor: '#7C3AED',
              color: '#FFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}
          >
            <span>Send</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
