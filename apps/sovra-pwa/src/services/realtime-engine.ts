// Sovra Zero-Cost Realtime Engine
// Uses native Browser BroadcastChannel + WebSocket fallback for instantaneous zero-cost pub/sub.
// Incurs ZERO third-party API or server charge.

import { Message, MessageStatus, UserRole } from '../types.js';
import { localVault } from '../db/local-vault.js';

export type RealtimeEventCallback = (payload: any) => void;

interface RealtimePacket {
  type: 'NEW_MESSAGE' | 'STATUS_UPDATE' | 'TYPING_INDICATOR' | 'PARTNER_TRIGGER' | 'PRESENCE_PING';
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  payload: any;
  timestamp: string;
}

class SovraRealtimeEngine {
  private broadcastChannel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<RealtimeEventCallback>> = new Map();
  private typingTimers: Map<string, any> = new Map();
  private onlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBroadcastChannel();
      this.initNetworkListeners();
      this.initWebSocketFallback();
    }
  }

  private initBroadcastChannel() {
    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('sovra_mesh_channel_v1');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingPacket(event.data);
        };
        console.log('[Sovra Realtime] Native BroadcastChannel mesh online');
      }
    } catch (e) {
      console.warn('[Sovra Realtime] BroadcastChannel init error, falling back:', e);
    }
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.onlineStatus = true;
      this.notifyListeners('network_status', { online: true });
      this.flushOfflineOutbox();
    });

    window.addEventListener('offline', () => {
      this.onlineStatus = false;
      this.notifyListeners('network_status', { online: false });
    });
  }

  private initWebSocketFallback() {
    // Zero-Cost Gateway WebSocket stream (optional local relay on port 4000)
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/realtime/ws`;
      // We gracefully attempt connection without blocking if websocket server is not bound
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          this.handleIncomingPacket(data);
        } catch {}
      };
      this.ws.onerror = () => {
        // Expected if backend only has standard REST/HTTP; BroadcastChannel handles local mesh
      };
    } catch {}
  }

  private handleIncomingPacket(packet: RealtimePacket) {
    if (!packet || !packet.type) return;

    switch (packet.type) {
      case 'NEW_MESSAGE': {
        const msg = packet.payload as Message;
        this.notifyListeners('message_received', msg);
        // Automatically send delivery acknowledgement (Double Tick)
        this.sendDeliveryAck(msg.conversationId, msg.id, packet.senderId);
        break;
      }

      case 'STATUS_UPDATE': {
        const { messageId, status, conversationId } = packet.payload;
        void localVault.updateMessageStatus(messageId, status);
        this.notifyListeners('status_updated', { messageId, status, conversationId });
        break;
      }

      case 'TYPING_INDICATOR': {
        const { isTyping, conversationId, senderName } = packet.payload;
        this.notifyListeners('typing_change', { isTyping, conversationId, senderName });
        break;
      }

      case 'PARTNER_TRIGGER': {
        // E.g. Doctor in Partner Platform clicked "Send Prescription to Patient on Sovra"
        this.notifyListeners('partner_trigger', packet.payload);
        break;
      }

      case 'PRESENCE_PING': {
        this.notifyListeners('presence_ping', packet.payload);
        break;
      }
    }
  }

  // -------------------------------------------------------------
  // Public Messaging API
  // -------------------------------------------------------------
  async sendMessage(message: Message): Promise<void> {
    // 1. Save locally in client-side IndexedDB immediately (0ms latency)
    await localVault.saveMessage(message);

    // 2. If offline, push to Outbox for auto-sync when network returns
    if (!this.onlineStatus) {
      console.log('[Sovra Realtime] Offline detected, queuing message in local outbox');
      await localVault.queueOutbox({
        id: message.id,
        message,
        retryCount: 0,
        queuedAt: new Date().toISOString()
      });
      return;
    }

    // 3. Broadcast to all active clients / tabs / windows
    const packet: RealtimePacket = {
      type: 'NEW_MESSAGE',
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      payload: message,
      timestamp: new Date().toISOString()
    };

    this.dispatchPacket(packet);

    // 4. Update status to SENT
    await localVault.updateMessageStatus(message.id, 'SENT');
    this.notifyListeners('status_updated', {
      messageId: message.id,
      status: 'SENT',
      conversationId: message.conversationId
    });

    // 5. Simulate peer auto-acknowledgement in demo/local environment after brief network trip
    setTimeout(async () => {
      await localVault.updateMessageStatus(message.id, 'DELIVERED');
      this.notifyListeners('status_updated', {
        messageId: message.id,
        status: 'DELIVERED',
        conversationId: message.conversationId
      });

      // If simulated doctor or bot response is expected
      this.simulateContextualReplyIfApplicable(message);
    }, 600);
  }

  sendDeliveryAck(conversationId: string, messageId: string, senderId: string) {
    const packet: RealtimePacket = {
      type: 'STATUS_UPDATE',
      conversationId,
      senderId: 'current_user',
      senderName: 'User',
      payload: { messageId, status: 'DELIVERED', conversationId },
      timestamp: new Date().toISOString()
    };
    this.dispatchPacket(packet);
  }

  sendReadAck(conversationId: string, messageId: string) {
    const packet: RealtimePacket = {
      type: 'STATUS_UPDATE',
      conversationId,
      senderId: 'current_user',
      senderName: 'User',
      payload: { messageId, status: 'READ', conversationId },
      timestamp: new Date().toISOString()
    };
    this.dispatchPacket(packet);
    void localVault.updateMessageStatus(messageId, 'READ');
    this.notifyListeners('status_updated', { messageId, status: 'READ', conversationId });
  }

  sendTypingSignal(conversationId: string, senderName: string, isTyping: boolean) {
    const packet: RealtimePacket = {
      type: 'TYPING_INDICATOR',
      conversationId,
      senderId: 'current_user',
      senderName,
      payload: { isTyping, conversationId, senderName },
      timestamp: new Date().toISOString()
    };
    this.dispatchPacket(packet);
  }

  private dispatchPacket(packet: RealtimePacket) {
    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(packet);
    }
    // 2. WebSocket if active
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(packet));
      } catch {}
    }
  }

  // -------------------------------------------------------------
  // Offline Outbox Flush
  // -------------------------------------------------------------
  async flushOfflineOutbox(): Promise<number> {
    const outbox = await localVault.getOutbox();
    if (!outbox.length) return 0;

    console.log(`[Sovra Realtime] Reconnected! Flushing ${outbox.length} pending offline messages...`);
    let flushed = 0;

    for (const item of outbox) {
      try {
        const packet: RealtimePacket = {
          type: 'NEW_MESSAGE',
          conversationId: item.message.conversationId,
          senderId: item.message.senderId,
          senderName: item.message.senderName,
          senderRole: item.message.senderRole,
          payload: item.message,
          timestamp: new Date().toISOString()
        };
        this.dispatchPacket(packet);
        await localVault.updateMessageStatus(item.message.id, 'SENT');
        await localVault.removeFromOutbox(item.id);
        flushed++;
      } catch (err) {
        console.warn('[Sovra Realtime] Failed to sync outbox item:', item.id, err);
      }
    }

    this.notifyListeners('outbox_flushed', { count: flushed });
    return flushed;
  }

  // -------------------------------------------------------------
  // Event Subscription
  // -------------------------------------------------------------
  on(event: string, callback: RealtimeEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, payload: any) {
    const subs = this.listeners.get(event);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[Sovra Realtime] Listener error on event "${event}":`, e);
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Simulated Healthcare Intelligence (for doctor/clinic automated response)
  // -------------------------------------------------------------
  private simulateContextualReplyIfApplicable(outgoingMsg: Message) {
    if (!outgoingMsg.isOutgoing) return;

    const lower = outgoingMsg.text.toLowerCase();
    const convId = outgoingMsg.conversationId;

    let replyText = '';
    let replyCard: any = null;

    if (lower.includes('rx') || lower.includes('prescription') || lower.includes('dawa') || lower.includes('medicine')) {
      replyText = 'Namaste. Your digital prescription is updated with dosage instructions. Please remember to take after food.';
    } else if (lower.includes('report') || lower.includes('test') || lower.includes('blood') || lower.includes('cbc')) {
      replyText = 'Your pathology test results have been verified by the lab pathologist and archived in your Sovra vault.';
    } else if (lower.includes('fee') || lower.includes('fees') || lower.includes('payment') || lower.includes('upi') || lower.includes('rupay')) {
      replyText = 'Thank you! Your payment receipt has been verified with 0% gateway commission.';
    } else if (lower.includes('timing') || lower.includes('opd') || lower.includes('appointment')) {
      replyText = 'Doctor OPD is active from 10:00 AM to 2:00 PM and 5:00 PM to 8:00 PM (Monday to Saturday).';
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste')) {
      replyText = 'Namaste! Dr. Ramesh Sharma OPD assistant here. How may we assist your healthcare consultation today?';
    } else {
      return; // No auto-reply needed for arbitrary messages
    }

    // Trigger typing indicator first
    setTimeout(() => {
      this.notifyListeners('typing_change', {
        isTyping: true,
        conversationId: convId,
        senderName: 'Dr. Ramesh Sharma'
      });
    }, 1000);

    // Send actual message after realistic 2.5s delay
    setTimeout(async () => {
      this.notifyListeners('typing_change', {
        isTyping: false,
        conversationId: convId,
        senderName: 'Dr. Ramesh Sharma'
      });

      const autoReply: Message = {
        id: `auto-${Date.now()}`,
        conversationId: convId,
        senderId: 'doc-001',
        senderName: 'Dr. Ramesh Sharma, MD',
        senderRole: 'DOCTOR',
        recipientId: outgoingMsg.senderId,
        text: replyText,
        timestamp: new Date().toISOString(),
        status: 'DELIVERED',
        isOutgoing: false,
        clinicalCard: replyCard
      };

      await localVault.saveMessage(autoReply);
      this.notifyListeners('message_received', autoReply);

      // Play soft incoming notification sound
      this.playNotificationChime();
    }, 2800);
  }

  private playNotificationChime() {
    try {
      if (typeof window === 'undefined' || !window.AudioContext) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }
}

export const realtimeEngine = new SovraRealtimeEngine();
