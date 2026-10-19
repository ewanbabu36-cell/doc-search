// Sovra Zero-Cost Healthcare PWA Messenger — Main Application Shell

import React, { useState, useEffect } from 'react';
import { Conversation, Message, UserRole, ClinicalCardPayload } from './types.js';
import { localVault } from './db/local-vault.js';
import { realtimeEngine } from './services/realtime-engine.js';
import { pushService } from './services/push-service.js';
import { InstallBanner } from './components/InstallBanner.js';
import { ConversationList } from './components/ConversationList.js';
import { ChatWindow } from './components/ChatWindow.js';
import { OpdTokenLiveCard } from './components/OpdTokenLiveCard.js';
import { VaultBackupModal } from './components/VaultBackupModal.js';
import { BatteryOptimizationModal } from './components/BatteryOptimizationModal.js';
import { IosInstallPromptModal } from './components/IosInstallPromptModal.js';
import { MultiDeviceSyncModal } from './components/MultiDeviceSyncModal.js';
import { storeForwardRelay } from './services/store-forward-relay.js';
import './styles.css';

export const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv-dr-sharma');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('PATIENT');
  const [currentUserName, setCurrentUserName] = useState<string>('Mohit Kumar');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(pushService.getPermission());
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showLiveToken, setShowLiveToken] = useState<boolean>(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState<boolean>(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Initialize Local Vault & Seed Data
  useEffect(() => {
    const initVault = async () => {
      try {
        await localVault.seedDemoDataIfEmpty();
        const convs = await localVault.getConversations();
        setConversations(convs);

        if (convs.length > 0 && !activeConversationId) {
          setActiveConversationId(convs[0].id);
        }
      } catch (err) {
        console.error('[Sovra] Vault init error:', err);
      }
    };

    void initVault();
  }, []);

  // 2. Load Messages when Active Conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const loadMsgs = async () => {
      try {
        const list = await localVault.getMessages(activeConversationId);
        setMessages(list);

        // Mark conversation as read in IndexedDB
        await localVault.markConversationAsRead(activeConversationId);

        // Update local conversation list unread counter
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
        );

        // Send Read Acknowledgement to peers for any unread incoming messages
        const unreadIncoming = list.filter((m) => !m.isOutgoing && m.status !== 'READ');
        unreadIncoming.forEach((m) => {
          realtimeEngine.sendReadAck(activeConversationId, m.id);
        });
      } catch (err) {
        console.error('[Sovra] Failed to load messages:', err);
      }
    };

    void loadMsgs();
  }, [activeConversationId]);

  // 3. Setup Realtime Engine Subscriptions
  useEffect(() => {
    // A. Incoming New Message
    const unsubMsg = realtimeEngine.on('message_received', async (incoming: Message) => {
      // If incoming message belongs to the currently open chat
      if (incoming.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        realtimeEngine.sendReadAck(incoming.conversationId, incoming.id);
      } else {
        // Send push notification if chat is not in focus
        void pushService.sendLocalNotification({
          title: `New message from ${incoming.senderName}`,
          body: incoming.clinicalCard ? `Sent a ${incoming.clinicalCard.type}` : incoming.text,
          url: `/?conv=${incoming.conversationId}`
        });
      }

      // Refresh conversation list from IndexedDB
      const updatedConvs = await localVault.getConversations();
      setConversations(updatedConvs);
    });

    // B. Status Update (Delivered / Read ticks)
    const unsubStatus = realtimeEngine.on('status_updated', ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status } : m))
      );
      setConversations((prev) =>
        prev.map((c) => {
          if (c.lastMessage) {
            return {
              ...c,
              lastMessage: { ...c.lastMessage, status }
            };
          }
          return c;
        })
      );
    });

    // C. Typing Indicator
    const unsubTyping = realtimeEngine.on('typing_change', ({ conversationId, isTyping }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isTyping } : c))
      );
    });

    // D. Network Status (Online / Offline)
    const unsubNet = realtimeEngine.on('network_status', ({ online }) => {
      setIsOnline(online);
    });

    return () => {
      unsubMsg();
      unsubStatus();
      unsubTyping();
      unsubNet();
    };
  }, [activeConversationId]);

  // 4. Drain Ephemeral Async Mailbox (Store & Forward Relay) upon Reconnect
  useEffect(() => {
    if (!isOnline) return;

    const drainOfflineMailbox = async () => {
      try {
        const recovered = await storeForwardRelay.fetchAndDrainMailbox(currentUserName);
        if (recovered && recovered.length > 0) {
          const updatedConvs = await localVault.getConversations();
          setConversations(updatedConvs);
          if (activeConversationId) {
            const updatedMsgs = await localVault.getMessages(activeConversationId);
            setMessages(updatedMsgs);
          }
        }
      } catch (e) {
        console.warn('[Sovra] Error draining offline mailbox:', e);
      }
    };

    void drainOfflineMailbox();
  }, [isOnline, currentUserName, activeConversationId]);

  // Handle Send Message (Text, Clinical Cards, or Voice Notes)
  const handleSendMessage = async (text: string, clinicalCard?: ClinicalCardPayload, voiceNote?: any) => {
    if (!activeConversationId) return;

    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (!activeConv) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: activeConversationId,
      senderId: currentRole === 'DOCTOR' ? 'doc-001' : currentRole === 'ADMIN' ? 'bill-001' : 'active_user',
      senderName: currentUserName,
      senderRole: currentRole,
      recipientId: activeConv.participantId,
      text,
      timestamp: new Date().toISOString(),
      status: isOnline ? 'SENT' : 'QUEUED',
      isOutgoing: true,
      clinicalCard,
      voiceNote
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, newMsg]);

    // Send through realtime engine
    await realtimeEngine.sendMessage(newMsg);

    // Deposit to Ephemeral Store & Forward Mailbox in background (for async offline recipient delivery)
    void storeForwardRelay.depositMessage(
      newMsg,
      activeConv.participantPhone || activeConv.participantId,
      currentUserName
    );

    // Refresh conversation list
    const updatedConvs = await localVault.getConversations();
    setConversations(updatedConvs);
  };

  // Persona Switcher
  const handleSwitchPersona = (role: UserRole, name: string) => {
    setCurrentRole(role);
    setCurrentUserName(name);
  };

  // Request Notification Permissions
  const handleRequestNotifications = async () => {
    const res = await pushService.requestPermission();
    setNotifPermission(res);
  };

  // Create New Clinical Chat
  const handleNewChat = async () => {
    const patientName = prompt('Enter Patient or Doctor Name for new Sovra chat:', 'Pooja Verma');
    if (!patientName) return;

    const newConvId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      participantId: `usr-${Date.now()}`,
      participantName: patientName,
      participantRole: 'PATIENT',
      participantSubtitle: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      participantAvatar: '👤',
      unreadCount: 0,
      isOnline: true,
      updatedAt: new Date().toISOString(),
      lastMessage: {
        text: 'New clinical consultation chat initialized.',
        timestamp: new Date().toISOString(),
        status: 'DELIVERED',
        isOutgoing: false
      }
    };

    await localVault.saveConversation(newConv);
    const updated = await localVault.getConversations();
    setConversations(updated);
    setActiveConversationId(newConvId);
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 1-Click PWA Install Banner */}
      <InstallBanner />

      {/* Offline Alert Badge Banner */}
      {!isOnline && (
        <div className="offline-banner">
          <span>📡</span>
          <span>
            <strong>Basement Offline Mode Active</strong> — Messages saved in local IndexedDB vault. Will auto-sync when network returns.
          </span>
        </div>
      )}

      {/* OPD Live Token Queue Hook (Solves Weakness #1: User Onboarding Friction) */}
      {showLiveToken && (
        <OpdTokenLiveCard
          onDismiss={() => setShowLiveToken(false)}
          onInstallClick={() => {
            const btn = document.querySelector('.install-banner button') as HTMLElement | null;
            if (btn) btn.click();
            else alert('To pin to home screen: Tap your browser menu (⋮ / ⎋) and select "Add to Home Screen".');
          }}
        />
      )}

      {/* Health Vault Cloud Backup Modal (Solves Weakness #3: Data Loss) */}
      <VaultBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestoreSuccess={async () => {
          setIsBackupModalOpen(false);
          const reloaded = await localVault.getConversations();
          setConversations(reloaded);
          if (activeConversationId) {
            const msgs = await localVault.getMessages(activeConversationId);
            setMessages(msgs);
          }
        }}
      />

      {/* Android Battery Optimization Whitelist Guard (Solves Weakness #2: OEM Killers) */}
      <BatteryOptimizationModal
        isOpen={isBatteryModalOpen}
        onClose={() => setIsBatteryModalOpen(false)}
      />

      {/* Apple iOS Visual Onboarding Modal (Solves Weakness #3: Safari Web Push restrictions) */}
      <IosInstallPromptModal
        isOpen={isIosModalOpen}
        onClose={() => setIsIosModalOpen(false)}
      />

      {/* Multi-Device QR Peer Sync Modal (Solves Weakness #6: Cross-Device Sync) */}
      <MultiDeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={async () => {
          setIsSyncModalOpen(false);
          const reloaded = await localVault.getConversations();
          setConversations(reloaded);
          if (activeConversationId) {
            const msgs = await localVault.getMessages(activeConversationId);
            setMessages(msgs);
          }
        }}
      />

      {/* Main Split Layout */}
      <div className="sovra-container" style={{ flex: 1, position: 'relative' }}>
        {/* Sidebar / Conversation Stream */}
        {(!isMobile || !activeConversationId) && (
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => setActiveConversationId(id)}
            currentRole={currentRole}
            currentUserName={currentUserName}
            onSwitchPersona={handleSwitchPersona}
            isOnline={isOnline}
            notificationPermission={notifPermission}
            onRequestNotifications={handleRequestNotifications}
            onNewChat={handleNewChat}
            onOpenBackup={() => setIsBackupModalOpen(true)}
            onToggleToken={() => setShowLiveToken(!showLiveToken)}
            onOpenSync={() => setIsSyncModalOpen(true)}
            onOpenBattery={() => setIsBatteryModalOpen(true)}
            onOpenIosModal={() => setIsIosModalOpen(true)}
          />
        )}

        {/* Chat Window */}
        {(!isMobile || activeConversationId) && (
          activeConv ? (
            <ChatWindow
              conversation={activeConv}
              messages={messages}
              currentUserId={currentRole === 'DOCTOR' ? 'doc-001' : 'active_user'}
              currentUserName={currentUserName}
              currentUserRole={currentRole}
              onSendMessage={handleSendMessage}
              onBack={() => setActiveConversationId(null)}
              isOnline={isOnline}
              onToggleMute={async (convId, isMuted) => {
                setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, isMuted } : c)));
                const convs = await localVault.getConversations();
                const target = convs.find((c) => c.id === convId);
                if (target) {
                  target.isMuted = isMuted;
                  await localVault.saveConversation(target);
                }
              }}
              onToggleBlock={async (convId, isBlocked) => {
                setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, isBlocked } : c)));
                const convs = await localVault.getConversations();
                const target = convs.find((c) => c.id === convId);
                if (target) {
                  target.isBlocked = isBlocked;
                  await localVault.saveConversation(target);
                }
              }}
              onArchive={async (convId) => {
                setConversations((prev) => prev.filter((c) => c.id !== convId));
                setActiveConversationId(null);
                const convs = await localVault.getConversations();
                const target = convs.find((c) => c.id === convId);
                if (target) {
                  target.isArchived = true;
                  await localVault.saveConversation(target);
                }
              }}
            />
          ) : (
            <div
              className="sovra-chat-area"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '32px'
              }}
            >
              <div style={{ maxWidth: '420px' }}>
                <img
                  src="/icon.svg"
                  alt="Sovra"
                  style={{ width: '80px', height: '80px', borderRadius: '20px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(15, 118, 110, 0.4)' }}
                />
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#5EEAD4', marginBottom: '8px' }}>
                  SOVRA HEALTH MESSENGER
                </h2>
                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '20px' }}>
                  A 100% lifetime free, zero-cost WhatsApp alternative designed exclusively for hospitals, doctors, and patients.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={handleNewChat}
                    style={{
                      background: '#0F766E',
                      color: 'white',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ＋ Start Clinical Chat
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
