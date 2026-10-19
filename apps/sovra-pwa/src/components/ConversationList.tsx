import React, { useState, useEffect } from 'react';
import { Conversation, UserRole } from '../types.js';
import { i18n, LanguageCode } from '../services/i18n.js';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  currentRole: UserRole;
  currentUserName: string;
  onSwitchPersona: (role: UserRole, name: string) => void;
  isOnline: boolean;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
  onNewChat: () => void;
  onOpenBackup?: () => void;
  onToggleToken?: () => void;
  onOpenSync?: () => void;
  onOpenBattery?: () => void;
  onOpenIosModal?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentRole,
  currentUserName,
  onSwitchPersona,
  isOnline,
  notificationPermission,
  onRequestNotifications,
  onNewChat,
  onOpenBackup,
  onToggleToken,
  onOpenSync,
  onOpenBattery,
  onOpenIosModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RX' | 'LAB' | 'UNREAD'>('ALL');
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe((lang) => setCurrentLang(lang));
  }, []);

  // Filter conversations based on search and selected tab
  const filtered = conversations.filter((c) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.participantName.toLowerCase().includes(q);
      const matchSub = (c.participantSubtitle || '').toLowerCase().includes(q);
      const matchMsg = (c.lastMessage?.text || '').toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchMsg) return false;
    }

    // Filter tab
    if (activeFilter === 'UNREAD') return c.unreadCount > 0;
    if (activeFilter === 'RX') return c.lastMessage?.cardType === 'PRESCRIPTION';
    if (activeFilter === 'LAB') return c.lastMessage?.cardType === 'LAB_REPORT';
    return true;
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="sovra-sidebar" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="sovra-header" style={{ background: '#0F172A', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/icon.svg"
            alt="Sovra"
            style={{ width: '32px', height: '32px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#5EEAD4', letterSpacing: '-0.02em' }}>
                SOVRA
              </span>
              <span
                style={{
                  fontSize: '9px',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}
              >
                PWA
              </span>

              {/* 1-Click Bilingual Language Toggle */}
              <button
                onClick={() => {
                  const next = i18n.toggleLanguage();
                  setCurrentLang(next);
                }}
                title="Switch Language / भाषा बदलें"
                style={{
                  background: 'rgba(15, 118, 110, 0.25)',
                  border: '1px solid #14B8A6',
                  color: '#5EEAD4',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {currentLang === 'hi' ? '🇮🇳 हिंदी' : '🇬🇧 EN'}
              </button>
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>
              {i18n.t('tagline')}
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Live Token Queue Hook Button */}
          {onToggleToken && (
            <button
              onClick={onToggleToken}
              title="Toggle Live OPD Queue Token Tracker"
              style={{
                background: 'rgba(15, 118, 110, 0.25)',
                border: '1px solid #14B8A6',
                color: '#5EEAD4',
                borderRadius: '8px',
                padding: '6px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              🎫 Token
            </button>
          )}

          {/* Cloud Vault Backup Button */}
          {onOpenBackup && (
            <button
              onClick={onOpenBackup}
              title="Cloud & Google Drive Health Vault Backup"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '6px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              ☁️ Backup
            </button>
          )}

          {/* Multi-Device QR Peer Sync Button */}
          {onOpenSync && (
            <button
              onClick={onOpenSync}
              title="Instant Multi-Device Sync (Phone <-> Laptop)"
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#C084FC',
                borderRadius: '8px',
                padding: '6px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              🔄 Sync
            </button>
          )}

          {/* Android Battery Whitelist Guard Button */}
          {onOpenBattery && (
            <button
              onClick={onOpenBattery}
              title="Whitelist Sovra in Phone Battery Saver (MIUI/Vivo/Oppo)"
              style={{
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                color: '#FBBF24',
                borderRadius: '8px',
                padding: '6px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              ⚡ Battery
            </button>
          )}

          {/* Notification Alert Bell */}
          <button
            onClick={onRequestNotifications}
            title={notificationPermission === 'granted' ? 'Push Notifications Active' : 'Enable Push Notifications'}
            style={{
              background: notificationPermission === 'granted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${notificationPermission === 'granted' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              color: notificationPermission === 'granted' ? '#34D399' : '#FBBF24',
              borderRadius: '8px',
              padding: '6px 8px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {notificationPermission === 'granted' ? '🔔' : '🔕'}
          </button>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            title="Start New Clinical Chat"
            style={{
              background: '#0F766E',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            ＋
          </button>
        </div>
      </div>

      {/* Role / Persona Switcher Bar */}
      <div
        style={{
          background: '#1E293B',
          padding: '8px 12px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ color: '#94A3B8' }}>Active Role:</span>
          <span style={{ fontWeight: 700, color: '#38BDF8' }}>
            {currentRole === 'PATIENT' ? '👤 Patient' : currentRole === 'DOCTOR' ? '👨‍⚕️ Doctor' : '🏥 Hospital Staff'}
          </span>
          <span style={{ color: '#E2E8F0', fontSize: '11px' }}>({currentUserName.split(' ')[0]})</span>
        </div>

        <button
          onClick={() => setShowPersonaMenu(!showPersonaMenu)}
          style={{
            background: '#334155',
            color: '#F8FAFC',
            border: 'none',
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Switch ▾
        </button>
      </div>

      {/* Persona Selection Dropdown Modal */}
      {showPersonaMenu && (
        <div
          style={{
            position: 'absolute',
            top: '105px',
            left: '12px',
            right: '12px',
            background: '#1F2937',
            border: '1px solid #4B5563',
            borderRadius: '8px',
            padding: '8px',
            zIndex: 100,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
            TEST MULTI-PERSONA INTERACTION:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => {
                onSwitchPersona('PATIENT', 'Mohit Kumar');
                setShowPersonaMenu(false);
              }}
              style={{
                textAlign: 'left',
                background: currentRole === 'PATIENT' ? '#0F766E' : '#374151',
                color: 'white',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              👤 <strong>Mohit Kumar (Patient)</strong> — View Prescriptions & Reports
            </button>
            <button
              onClick={() => {
                onSwitchPersona('DOCTOR', 'Dr. Ramesh Sharma, MD');
                setShowPersonaMenu(false);
              }}
              style={{
                textAlign: 'left',
                background: currentRole === 'DOCTOR' ? '#0F766E' : '#374151',
                color: 'white',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              👨‍⚕️ <strong>Dr. Ramesh Sharma (Doctor)</strong> — Issue Digital Rx
            </button>
            <button
              onClick={() => {
                onSwitchPersona('ADMIN', 'OPD Receptionist Aarti');
                setShowPersonaMenu(false);
              }}
              style={{
                textAlign: 'left',
                background: currentRole === 'ADMIN' ? '#0F766E' : '#374151',
                color: 'white',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🏥 <strong>OPD Reception / Cashier</strong> — Send UPI Bill Cards
            </button>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div style={{ padding: '10px 12px 6px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#1F2937',
            borderRadius: '8px',
            padding: '6px 10px',
            border: '1px solid #374151'
          }}
        >
          <span style={{ color: '#94A3B8', marginRight: '6px', fontSize: '13px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search patient, doctor, or Rx..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: '12px',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '6px 12px 10px 12px',
          borderBottom: '1px solid #1F2937',
          overflowX: 'auto'
        }}
      >
        {(['ALL', 'RX', 'LAB', 'UNREAD'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            style={{
              background: activeFilter === tab ? '#0F766E' : '#1F2937',
              color: activeFilter === tab ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab === 'ALL' && (currentLang === 'hi' ? 'सभी' : 'All Chats')}
            {tab === 'RX' && (currentLang === 'hi' ? '🩺 पर्चे' : '🩺 Prescriptions')}
            {tab === 'LAB' && (currentLang === 'hi' ? '🔬 रिपोर्ट' : '🔬 Lab Reports')}
            {tab === 'UNREAD' && (currentLang === 'hi' ? '🔴 अपठित' : '🔴 Unread')}
          </button>
        ))}
      </div>

      {/* Conversation Item List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
            No conversations matching your criteria.
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderBottom: '1px solid #1F2937',
                  background: isSelected ? 'rgba(15, 118, 110, 0.2)' : 'transparent',
                  cursor: 'pointer',
                  borderLeft: isSelected ? '3px solid #14B8A6' : '3px solid transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                {/* Avatar with Online Dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#1F2937',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      border: '1px solid #374151'
                    }}
                  >
                    {conv.participantAvatar || (conv.participantRole === 'DOCTOR' ? '👨‍⚕️' : conv.participantRole === 'LAB_TECH' ? '🔬' : '👤')}
                  </div>
                  {conv.isOnline && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: '#10B981',
                        border: '2px solid #111827'
                      }}
                      title="Online"
                    />
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: isSelected ? '#5EEAD4' : '#F9FAFB',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{conv.participantName}</span>
                      {conv.isMuted && <span title="Muted" style={{ fontSize: '10px' }}>🔕</span>}
                      {conv.isBlocked && <span style={{ fontSize: '9px', background: '#EF4444', color: 'white', padding: '0 4px', borderRadius: '4px' }}>Blocked</span>}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', flexShrink: 0, marginLeft: '6px' }}>
                      {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                    </div>
                  </div>

                  {conv.participantSubtitle && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#38BDF8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px'
                      }}
                    >
                      {conv.participantSubtitle}
                    </div>
                  )}

                  {/* Last message preview / typing indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {conv.isTyping ? (
                      <div style={{ fontSize: '12px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>typing</span>
                        <div className="typing-dots">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#9CA3AF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {conv.lastMessage?.isOutgoing && (
                          <span
                            className={
                              conv.lastMessage.status === 'READ'
                                ? 'tick-blue'
                                : conv.lastMessage.status === 'DELIVERED'
                                ? 'tick-double'
                                : 'tick-single'
                            }
                          >
                            {conv.lastMessage.status === 'READ' ? '✓✓' : conv.lastMessage.status === 'DELIVERED' ? '✓✓' : '✓'}
                          </span>
                        )}
                        <span>
                          {conv.lastMessage?.cardType === 'PRESCRIPTION'
                            ? '🩺 [Digital Rx]'
                            : conv.lastMessage?.cardType === 'LAB_REPORT'
                            ? '🔬 [Lab Report]'
                            : conv.lastMessage?.cardType === 'OPD_PAYMENT'
                            ? '💳 [OPD Fee Bill]'
                            : conv.lastMessage?.text || 'No messages yet'}
                        </span>
                      </div>
                    )}

                    {conv.unreadCount > 0 && (
                      <span
                        style={{
                          background: '#0F766E',
                          color: 'white',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          minWidth: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 4px',
                          flexShrink: 0
                        }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info: Zero-Cost Cloudflare & IndexedDB Badge */}
      <div
        style={{
          padding: '8px 12px',
          background: '#0B0F19',
          borderTop: '1px solid #1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#6B7280'
        }}
      >
        <span>🔒 Zero-Cost Local-First Vault</span>
        <span style={{ color: isOnline ? '#10B981' : '#F59E0B' }}>
          {isOnline ? '● Online Mesh' : '○ Offline Outbox Active'}
        </span>
      </div>
    </div>
  );
};
