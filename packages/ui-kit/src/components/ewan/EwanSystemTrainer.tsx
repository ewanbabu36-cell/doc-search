import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button } from '../primitives/index.js';
import {
  getTopicsForPlatform,
  searchEwanKnowledge,
  type EwanKnowledgeTopic,
  type EwanPlatform
} from './ewanKnowledgeBase.js';
import {
  evaluateEwanRoleScope,
  normalizeRoleCategory,
  type EwanUserContext,
  type EwanRoleScopeEvaluation
} from './EwanRoleScopeResolver.js';
import { EwanZenMusicWidget } from './EwanZenMusicWidget.js';

export type EwanCornerPreset = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type EwanLauncherMode = 'icon' | 'pill';
export type EwanWindowSize = 'compact' | 'standard' | 'large';

export interface EwanPositionConfig {
  preset: EwanCornerPreset | 'custom';
  x?: number | undefined;
  y?: number | undefined;
  winX?: number | undefined;
  winY?: number | undefined;
}

export interface EwanSystemTrainerProps {
  currentPlatform?: 'COMPANY_HQ' | 'PARTNER_PLATFORM' | 'LANDING_PAGE' | 'UNIVERSAL';
  activeModule?: string;
  activeTab?: string;
  activePatient?: { id: string; name: string; uhid?: string; status?: string } | undefined;
  currentUser?: EwanUserContext | undefined;
  onNavigate?: (destination: string) => void;
  onOpenQuickRegister?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'EWAN';
  text: string;
  topic?: EwanKnowledgeTopic | undefined;
  evaluation?: EwanRoleScopeEvaluation | undefined;
  timestamp: string;
}

const EWAN_POSITION_KEY = 'docsearch_ewan_position_v2';
const EWAN_LAUNCHER_MODE_KEY = 'docsearch_ewan_launcher_mode_v2';
const EWAN_WIN_SIZE_KEY = 'docsearch_ewan_win_size_v2';

const getStoredLauncherMode = (): EwanLauncherMode => {
  if (typeof window === 'undefined') return 'icon';
  const saved = localStorage.getItem(EWAN_LAUNCHER_MODE_KEY);
  return saved === 'pill' ? 'pill' : 'icon';
};

const getStoredWindowSize = (): EwanWindowSize => {
  if (typeof window === 'undefined') return 'compact';
  const saved = localStorage.getItem(EWAN_WIN_SIZE_KEY);
  if (saved === 'standard' || saved === 'large') return saved;
  return 'compact';
};

const getStoredEwanPosition = (): EwanPositionConfig => {
  if (typeof window === 'undefined') return { preset: 'bottom-right' };
  try {
    const raw = localStorage.getItem(EWAN_POSITION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EwanPositionConfig;
      if (parsed.preset === 'custom' && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        const maxX = Math.max(12, window.innerWidth - 60);
        const maxY = Math.max(12, window.innerHeight - 60);
        return {
          ...parsed,
          x: Math.max(12, Math.min(maxX, parsed.x)),
          y: Math.max(12, Math.min(maxY, parsed.y))
        };
      }
      if (['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(parsed.preset)) {
        return parsed;
      }
    }
  } catch (e) {
    // fallback
  }
  return { preset: 'bottom-right' };
};

export const EwanSystemTrainer: React.FC<EwanSystemTrainerProps> = ({
  currentPlatform = 'UNIVERSAL',
  activeModule,
  activeTab,
  activePatient,
  currentUser,
  onNavigate,
  onOpenQuickRegister
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState('');

  // Repositionable / Launcher / Window Size State
  const [position, setPosition] = useState<EwanPositionConfig>(getStoredEwanPosition);
  const [launcherMode, setLauncherMode] = useState<EwanLauncherMode>(getStoredLauncherMode);
  const [windowSize, setWindowSize] = useState<EwanWindowSize>(getStoredWindowSize);
  const [showPillMenu, setShowPillMenu] = useState(false);
  const [showWinMenu, setShowWinMenu] = useState(false);
  const [isDraggingPill, setIsDraggingPill] = useState(false);
  const [isDraggingWin, setIsDraggingWin] = useState(false);

  // New Advancements: Voice Dictation, Text-to-Speech & 1-Click Copy
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const pillRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const pillDragMetaRef = useRef<{ startX: number; startY: number; clientX: number; clientY: number } | null>(null);
  const pillHasMovedRef = useRef(false);
  const winDragMetaRef = useRef<{ startX: number; startY: number; clientX: number; clientY: number } | null>(null);
  const winHasMovedRef = useRef(false);

  const updateLauncherMode = (mode: EwanLauncherMode) => {
    setLauncherMode(mode);
    try {
      localStorage.setItem(EWAN_LAUNCHER_MODE_KEY, mode);
    } catch (e) {}
  };

  const cycleWindowSize = () => {
    setWindowSize((prev) => {
      const next: EwanWindowSize = prev === 'compact' ? 'standard' : prev === 'standard' ? 'large' : 'compact';
      try {
        localStorage.setItem(EWAN_WIN_SIZE_KEY, next);
      } catch (e) {}
      return next;
    });
  };

  const toggleVoiceInput = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Voice dictation is supported in Google Chrome, Microsoft Edge, and modern Chromium browsers.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'hi-IN';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (evt: any) => {
        const transcript = evt.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`💡📋⚡🩺🏥🧠]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.05;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (msgId: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  // Save position helper
  const updatePosition = (newConfig: EwanPositionConfig) => {
    setPosition(newConfig);
    try {
      localStorage.setItem(EWAN_POSITION_KEY, JSON.stringify(newConfig));
    } catch (e) {}
  };

  // Close position menus on outside click
  useEffect(() => {
    if (!showPillMenu && !showWinMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-ewan-position-menu]') && !target.closest('[data-ewan-position-btn]')) {
        setShowPillMenu(false);
        setShowWinMenu(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [showPillMenu, showWinMenu]);

  // Keep coordinates clamped on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (prev.preset !== 'custom' || prev.x === undefined || prev.y === undefined) return prev;
        const pillW = pillRef.current?.offsetWidth || 180;
        const pillH = pillRef.current?.offsetHeight || 50;
        const maxX = Math.max(12, window.innerWidth - pillW - 12);
        const maxY = Math.max(12, window.innerHeight - pillH - 12);
        const clampedX = Math.max(12, Math.min(maxX, prev.x));
        const clampedY = Math.max(12, Math.min(maxY, prev.y));

        let nextWinX = prev.winX;
        let nextWinY = prev.winY;
        if (nextWinX !== undefined && nextWinY !== undefined) {
          const winW = windowRef.current?.offsetWidth || 460;
          const winH = windowRef.current?.offsetHeight || 620;
          nextWinX = Math.max(12, Math.min(Math.max(12, window.innerWidth - winW - 12), nextWinX));
          nextWinY = Math.max(12, Math.min(Math.max(12, window.innerHeight - winH - 12), nextWinY));
        }

        if (clampedX === prev.x && clampedY === prev.y && nextWinX === prev.winX && nextWinY === prev.winY) {
          return prev;
        }
        return { ...prev, x: clampedX, y: clampedY, winX: nextWinX, winY: nextWinY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePillStartDrag = (clientX: number, clientY: number) => {
    const rect = pillRef.current?.getBoundingClientRect();
    const startX = rect ? rect.left : window.innerWidth - 180;
    const startY = rect ? rect.top : window.innerHeight - 60;

    pillDragMetaRef.current = { startX, startY, clientX, clientY };
    pillHasMovedRef.current = false;
    setIsDraggingPill(true);

    const onMove = (moveEvt: MouseEvent | TouchEvent) => {
      if (!pillDragMetaRef.current) return;
      const touch = 'touches' in moveEvt && moveEvt.touches ? moveEvt.touches[0] : null;
      const curX = touch ? touch.clientX : ('clientX' in moveEvt ? (moveEvt as MouseEvent).clientX : 0);
      const curY = touch ? touch.clientY : ('clientY' in moveEvt ? (moveEvt as MouseEvent).clientY : 0);
      const deltaX = curX - pillDragMetaRef.current.clientX;
      const deltaY = curY - pillDragMetaRef.current.clientY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        pillHasMovedRef.current = true;
      }

      const pillW = pillRef.current?.offsetWidth || 180;
      const pillH = pillRef.current?.offsetHeight || 50;
      const minX = 10;
      const maxX = Math.max(10, window.innerWidth - pillW - 10);
      const minY = 10;
      const maxY = Math.max(10, window.innerHeight - pillH - 10);

      const nextX = Math.max(minX, Math.min(maxX, pillDragMetaRef.current.startX + deltaX));
      const nextY = Math.max(minY, Math.min(maxY, pillDragMetaRef.current.startY + deltaY));

      setPosition((prev) => ({
        ...prev,
        preset: 'custom',
        x: Math.round(nextX),
        y: Math.round(nextY)
      }));
    };

    const onEnd = () => {
      setIsDraggingPill(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);

      if (pillHasMovedRef.current) {
        setPosition((latest) => {
          try {
            localStorage.setItem(EWAN_POSITION_KEY, JSON.stringify(latest));
          } catch (e) {}
          return latest;
        });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const handleWinStartDrag = (clientX: number, clientY: number) => {
    const rect = windowRef.current?.getBoundingClientRect();
    const startX = rect ? rect.left : 100;
    const startY = rect ? rect.top : 100;

    winDragMetaRef.current = { startX, startY, clientX, clientY };
    winHasMovedRef.current = false;
    setIsDraggingWin(true);

    const onMove = (moveEvt: MouseEvent | TouchEvent) => {
      if (!winDragMetaRef.current) return;
      const touch = 'touches' in moveEvt && moveEvt.touches ? moveEvt.touches[0] : null;
      const curX = touch ? touch.clientX : ('clientX' in moveEvt ? (moveEvt as MouseEvent).clientX : 0);
      const curY = touch ? touch.clientY : ('clientY' in moveEvt ? (moveEvt as MouseEvent).clientY : 0);
      const deltaX = curX - winDragMetaRef.current.clientX;
      const deltaY = curY - winDragMetaRef.current.clientY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        winHasMovedRef.current = true;
      }

      const winW = windowRef.current?.offsetWidth || 460;
      const winH = windowRef.current?.offsetHeight || 620;
      const minX = 10;
      const maxX = Math.max(10, window.innerWidth - winW - 10);
      const minY = 10;
      const maxY = Math.max(10, window.innerHeight - winH - 10);

      const nextX = Math.max(minX, Math.min(maxX, winDragMetaRef.current.startX + deltaX));
      const nextY = Math.max(minY, Math.min(maxY, winDragMetaRef.current.startY + deltaY));

      setPosition((prev) => ({
        ...prev,
        winX: Math.round(nextX),
        winY: Math.round(nextY)
      }));
    };

    const onEnd = () => {
      setIsDraggingWin(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);

      if (winHasMovedRef.current) {
        setPosition((latest) => {
          try {
            localStorage.setItem(EWAN_POSITION_KEY, JSON.stringify(latest));
          } catch (e) {}
          return latest;
        });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const handlePillClick = () => {
    if (pillHasMovedRef.current) {
      pillHasMovedRef.current = false;
      return;
    }
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
  };

  const getWelcomeText = (platform: string) => {
    if (platform === 'LANDING_PAGE') {
      return `Namaste! Main **EWAN Health Guide** hoon 🩺.
1. Doctor ya Hospital search karein
2. Live OPD Token book karein
3. ABHA Card & Digital Reports download karein
Niche diye gaye topic par click karein ya sawal poochhein!`;
    }
    if (platform === 'PARTNER_PLATFORM') {
      const roleDetails = normalizeRoleCategory(currentUser?.role);
      return `Namaste ${currentUser?.name || currentUser?.roleTitle || roleDetails.roleTitle}! Main **EWAN Hospital Master Trainer** hoon 🏥.
Aapka Active Role: **${currentUser?.roleTitle || roleDetails.roleTitle}** (${roleDetails.categoryLabel})

✨ *Quick Shortcuts:*
- Type **"Ab kya karna hai?"** (Next Step)
- Type **"Main kya-kya kar sakta hoon?"** (My Permissions)
- Niche diye gaye topics se verified workflow dekhein!`;
    }
    return `Namaste Super Admin! Main **EWAN Master Brain & System Architect** hoon 🧠.
1. SaaS Subscription Plans & Quotas
2. 1-Click Partner KYC Verification
3. Safe CRUD & Database Integrity Rules
4. Monorepo Architecture & Ports (4000, 5173, 5174, 5175)
Niche diye gaye topic par tap karein ya sawal poochhein!`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'EWAN',
      text: getWelcomeText(currentPlatform),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const availableTopics = getTopicsForPlatform(currentPlatform as EwanPlatform);

  // Global Hotkey Listener: Alt + E to toggle EWAN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setIsMinimized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Event Listener: docsearch:ask_ewan to trigger EWAN externally
  useEffect(() => {
    const handleAskEwan = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string; topicId?: string }>;
      setIsOpen(true);
      setIsMinimized(false);
      if (customEvent.detail?.topicId) {
        const topic = availableTopics.find((t) => t.id === customEvent.detail.topicId);
        if (topic) {
          handleAskTopic(topic);
          return;
        }
      }
      if (customEvent.detail?.query) {
        processQuery(customEvent.detail.query);
      }
    };
    window.addEventListener('docsearch:ask_ewan', handleAskEwan);
    return () => window.removeEventListener('docsearch:ask_ewan', handleAskEwan);
  }, [availableTopics]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleAskTopic = (topic: EwanKnowledgeTopic) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: topic.title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const ewanMsg: ChatMessage = {
      id: `ewan-${Date.now() + 1}`,
      sender: 'EWAN',
      text: '', // Topic is rendered through clean structured step cards
      topic,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg, ewanMsg]);
  };

  const processQuery = (rawQuery: string) => {
    if (!rawQuery.trim()) return;

    const cleanQuery = rawQuery.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: cleanQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Evaluate Role Scope & Context via EwanRoleScopeResolver
    const evalResult = evaluateEwanRoleScope(
      cleanQuery,
      currentUser,
      currentPlatform,
      activeModule,
      activeTab,
      activePatient
    );

    if (evalResult.mode !== 'NORMAL') {
      let replyText = evalResult.rawResponseText || '';
      let matchedTopic: EwanKnowledgeTopic | undefined = undefined;

      if (evalResult.mode === 'BOUNDARY_REDIRECT' && evalResult.handoffGuidance) {
        matchedTopic = {
          id: `boundary-redirect-${Date.now()}`,
          title: '🛡️ Role Scope Boundary Enforced (Verified Handoff)',
          category: 'HOSPITAL_OPERATIONS',
          allowedPlatforms: ['PARTNER_PLATFORM'],
          summary: evalResult.handoffGuidance.boundaryNote,
          keywords: [],
          steps: evalResult.handoffGuidance.steps,
          hinglishGuide: evalResult.handoffGuidance.boundaryNote,
          technicalDetails: {
            actionKey: evalResult.handoffGuidance.nextActionUrl || activeModule
          }
        };
        replyText = ''; // Render via structured topic card
      } else if (evalResult.verifiedGuidance) {
        matchedTopic = {
          id: `guidance-${Date.now()}`,
          title: evalResult.verifiedGuidance.title,
          category: 'HOSPITAL_OPERATIONS',
          allowedPlatforms: ['PARTNER_PLATFORM'],
          summary: evalResult.verifiedGuidance.summary,
          keywords: [],
          steps: evalResult.verifiedGuidance.steps,
          hinglishGuide: evalResult.verifiedGuidance.summary,
          technicalDetails: {
            actionKey: evalResult.verifiedGuidance.actionKey || activeModule
          }
        };
        replyText = '';
      }

      const ewanMsg: ChatMessage = {
        id: `ewan-${Date.now() + 1}`,
        sender: 'EWAN',
        text: replyText,
        topic: matchedTopic,
        evaluation: evalResult,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, userMsg, ewanMsg]);
      return;
    }

    if (evalResult.verifiedGuidance) {
      const matchedTopic: EwanKnowledgeTopic = {
        id: `verified-${Date.now()}`,
        title: evalResult.verifiedGuidance.title,
        category: 'HOSPITAL_OPERATIONS',
        allowedPlatforms: ['PARTNER_PLATFORM'],
        summary: evalResult.verifiedGuidance.summary,
        keywords: [],
        steps: evalResult.verifiedGuidance.steps,
        hinglishGuide: evalResult.verifiedGuidance.summary,
        technicalDetails: {
          actionKey: evalResult.verifiedGuidance.actionKey || activeModule
        }
      };

      const ewanMsg: ChatMessage = {
        id: `ewan-${Date.now() + 1}`,
        sender: 'EWAN',
        text: '',
        topic: matchedTopic,
        evaluation: evalResult,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, userMsg, ewanMsg]);
      return;
    }

    // Check if greeting
    const isGreeting = /^(hi|hello|hey|namaste|pranam|kya hal|halo|help)\b/i.test(cleanQuery);

    let replyText = '';
    let matchedTopic: EwanKnowledgeTopic | undefined = undefined;

    if (isGreeting) {
      replyText = `Namaste! Main EWAN hoon, aapka Instant System Master Trainer.
1. Niche diye gaye kisi bhi topic button ya shortcut chip par click karein.
2. "Ab kya karna hai?" ya "Main kya-kya kar sakta hoon?" poochhein.
3. Ya apna kaam type karein (e.g. 'OPD token', 'Doctor desk', 'Pharmacy bill').
Main aapko role-verified steps aur direct action button doonga!`;
    } else {
      // Search knowledge base strictly within current platform permissions and role affinity
      const matches = searchEwanKnowledge(cleanQuery, currentPlatform as EwanPlatform, currentUser?.role);

      if (matches.length > 0 && matches[0]) {
        matchedTopic = matches[0];
        replyText = '';
      } else {
        if (currentPlatform === 'LANDING_PAGE') {
          replyText = `Aapke sawal ke anusaar in topics me se chunein:
1. 🩺 Doctor Ya Hospital Search
2. 🎫 Online OPD Token & Live Line
3. 🇮🇳 ABHA Health ID & Reports
4. 🏥 Hospital / Clinic Partner Onboarding
5. 🚨 24x7 Emergency SOS Ambulance`;
        } else if (currentPlatform === 'PARTNER_PLATFORM') {
          replyText = `Aapke sawal ke anusaar in verified topics me se chunein:
1. ⚡ 30s Fast OPD Token & Print
2. 🩺 Doctor OPD Desk & Digital Rx
3. 💊 Pharmacy POS & Expiry Check
4. 💳 Cashier Desk & UPI Billing
5. ⚠️ Hospital Profile Update Rule
6. 🛏️ IPD Bed Allocation & Discharge
7. 🔬 Pathology Lab Investigation
8. 🚨 Emergency Trauma Triage`;
        } else {
          replyText = `Aapke sawal ke anusaar in topics me se chunein:
1. 💳 SaaS Subscription Plans & Pricing
2. ✅ Partner KYC 1-Click Approval
3. 🤖 EWAN AI Document Screener (Valid vs Invalid)
4. ⚙️ Hospital Modules (IPD, Lab, OT) On/Off
5. 📢 Pan-India WhatsApp & SMS Broadcast
6. 👑 Care Pass & Commission Split
7. 🧾 Partner Recurring Billing & GST Ledger
8. 🛡️ Staff RBAC Security & Forensic Leak Trace
9. 🖥️ Cluster Health & Infrastructure Telemetry`;
        }
      }
    }

    const ewanMsg: ChatMessage = {
      id: `ewan-${Date.now() + 1}`,
      sender: 'EWAN',
      text: replyText,
      topic: matchedTopic,
      evaluation: evalResult,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg, ewanMsg]);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;
    processQuery(inputQuery);
    setInputQuery('');
  };

  const handleActionClick = (actionKey?: string) => {
    if (!actionKey) return;

    // 1. Fast OPD Drawer
    if (actionKey === 'open-fast-opd-drawer' && onOpenQuickRegister) {
      onOpenQuickRegister();
      setIsOpen(false);
      return;
    }

    // 2. Settings Modal triggers (via custom events caught by shells)
    if (actionKey === 'open-partner-profile-settings') {
      window.dispatchEvent(new CustomEvent('docsearch:open_settings', { detail: { tab: 'ADDRESS' } }));
      setIsOpen(false);
      return;
    }
    if (actionKey === 'open-bank-settings') {
      window.dispatchEvent(new CustomEvent('docsearch:open_settings', { detail: { tab: 'BANK' } }));
      setIsOpen(false);
      return;
    }
    if (actionKey === 'open-hospital-subscription') {
      window.dispatchEvent(new CustomEvent('docsearch:open_settings', { detail: { tab: 'KYC' } }));
      setIsOpen(false);
      return;
    }

    // 3. Landing page actions
    if (actionKey === 'scroll-to-search') {
      const el = document.querySelector('input') || document.getElementById('search-section');
      el?.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
      return;
    }
    if (actionKey === 'open-patient-booking') {
      const el = document.querySelector('[data-action="book-token"]') || document.querySelector('input');
      el?.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
      return;
    }
    if (actionKey === 'open-abha-linker') {
      const el = document.querySelector('[data-action="abha-link"]') || document.querySelector('button');
      el?.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
      return;
    }
    if (actionKey === 'open-partner-registration') {
      if (typeof window !== 'undefined') {
        window.location.href = '/partner-register';
      }
      setIsOpen(false);
      return;
    }
    if (actionKey === 'open-emergency-sos') {
      alert('🚨 24x7 Emergency SOS: Please call National Ambulance 108 or 112 directly. Nearest Trauma Center alerted.');
      setIsOpen(false);
      return;
    }

    // 4. Partner Platform Module Navigation
    if (currentPlatform === 'PARTNER_PLATFORM' && onNavigate) {
      const partnerMap: Record<string, string> = {
        'open-doctor-desk': 'clinical-consultation',
        'open-pharmacy-pos': 'pharmacy-medication',
        'open-billing-desk': 'billing-revenue-cycle',
        'open-inpatient-ipd': 'inpatient-management',
        'open-lab-investigation': 'clinical-investigation',
        'open-emergency-trauma': 'emergency-trauma',
        'open-ot-management': 'operation-theatre-management',
        'open-abdm-gateway': 'abdm-fhir-gateway',
        'open-ai-scribe': 'ai-clinical-cdss',
        'open-whatsapp-desk': 'whatsapp-patient-portal',
        'open-staff-directory': 'staff-administration'
      };
      if (partnerMap[actionKey]) {
        onNavigate(partnerMap[actionKey]!);
        setIsOpen(false);
        return;
      }
    }

    // 5. Company HQ Domain Navigation & Modals
    if (currentPlatform === 'COMPANY_HQ') {
      if (actionKey === 'open-theme-studio') {
        window.dispatchEvent(new CustomEvent('docsearch:open_theme_studio'));
        setIsOpen(false);
        return;
      }
      if (actionKey === 'open-founder-approvals') {
        window.dispatchEvent(new CustomEvent('docsearch:open_founder_approvals'));
        setIsOpen(false);
        return;
      }

      if (onNavigate) {
        const hqMap: Record<string, string> = {
          'open-product-plans': 'product-plans-entitlements',
          'open-partner-lifecycle': 'crm-partner-lifecycle',
          'open-partner-verification': 'crm-partner-lifecycle',
          'open-partner-cockpit': 'crm-partner-lifecycle',
          'open-broadcast-hub': 'communication-content',
          'open-growth-engine': 'growth-engine',
          'open-finance-billing': 'subscription-billing-finance',
          'open-abdm-compliance': 'compliance-data-governance',
          'open-rbac-security': 'security-rbac-policy-audit',
          'open-leak-investigation': 'security-rbac-policy-audit',
          'open-ai-governance': 'ai-platform-governance',
          'open-infrastructure-monitoring': 'infrastructure-monitoring-dr',
          'open-founder-governance': 'company-admin-governance',
          'open-audit-trace': 'security-rbac-policy-audit',
          'open-architecture-overview': 'infrastructure-monitoring-dr'
        };
        if (hqMap[actionKey]) {
          onNavigate(hqMap[actionKey]!);
          setIsOpen(false);
          return;
        }
      }
    }

    // Fallback if onNavigate provided
    if (onNavigate) {
      onNavigate(actionKey);
      setIsOpen(false);
    }
  };

  const getPlatformLabel = () => {
    if (currentPlatform === 'LANDING_PAGE') return 'Patient & Health Guide';
    if (currentPlatform === 'PARTNER_PLATFORM') return 'Hospital Operations Trainer';
    return 'Master Brain & System Architect';
  };

  useEffect(() => {
    const handleOpenEwanRecovery = () => {
      setIsOpen(true);
      setIsMinimized(false);
      setMessages((prev: ChatMessage[]) => [
        ...prev,
        {
          id: `ewan-lock-rec-${Date.now()}`,
          sender: 'EWAN',
          text: '🔒 Locked-Account Recovery & Renewal Assistant: Your operational modules (OPD, LIMS, Radiology, Pharmacy) are currently locked because your license term and 30-day grace period have ended. All your historical clinical and billing data is 100% preserved. Click "Renew License" or ask me about your current plan, renewal pricing, or payment status to restore full access immediately.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('docsearch:open-ewan-recovery', handleOpenEwanRecovery);
      return () => window.removeEventListener('docsearch:open-ewan-recovery', handleOpenEwanRecovery);
    }
    return undefined;
  }, []);

  const getPlatformIcon = () => {
    if (currentPlatform === 'LANDING_PAGE') return '🩺';
    if (currentPlatform === 'PARTNER_PLATFORM') return '🏥';
    return '🧠';
  };

  const getPillStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000005,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      touchAction: 'none'
    };

    if (position.preset === 'custom' && position.x !== undefined && position.y !== undefined) {
      return {
        ...base,
        left: `${position.x}px`,
        top: `${position.y}px`
      };
    }

    switch (position.preset) {
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...base, bottom: '20px', right: '20px' };
    }
  };

  const getWindowDimensions = () => {
    if (isMinimized) {
      return {
        width: windowSize === 'compact' ? 360 : windowSize === 'large' ? 520 : 420,
        height: 52
      };
    }
    switch (windowSize) {
      case 'large':
        return { width: 540, height: 680 };
      case 'standard':
        return { width: 440, height: 580 };
      case 'compact':
      default:
        return { width: 380, height: 490 };
    }
  };

  const getWindowStyle = (): React.CSSProperties => {
    const { width: winWidth, height: winHeight } = getWindowDimensions();

    const base: React.CSSProperties = {
      position: 'fixed',
      width: `${winWidth}px`,
      maxWidth: 'calc(100vw - 24px)',
      height: isMinimized ? '52px' : `${winHeight}px`,
      maxHeight: 'calc(100vh - 80px)',
      backgroundColor: 'var(--ds-color-surface, #0B1120)',
      border: '1.5px solid var(--ds-color-border-strong, rgba(6, 182, 212, 0.5))',
      borderRadius: '16px',
      boxShadow: 'var(--ds-shadow-xl)',
      zIndex: 1000010,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'var(--ds-color-text-primary, #F8FAFC)',
      transition: isDraggingWin ? 'none' : 'width 0.2s ease, height 0.2s ease'
    };

    if (position.winX !== undefined && position.winY !== undefined) {
      return {
        ...base,
        left: `${position.winX}px`,
        top: `${position.winY}px`
      };
    }

    if (position.preset === 'custom' && position.x !== undefined && position.y !== undefined) {
      const isBottomHalf = position.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
      const isRightHalf = position.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);

      const pillW = pillRef.current?.offsetWidth || (launcherMode === 'icon' ? 52 : 180);
      const pillH = pillRef.current?.offsetHeight || (launcherMode === 'icon' ? 52 : 48);

      const calcWinX = isRightHalf
        ? Math.max(12, position.x + pillW - winWidth)
        : Math.min(typeof window !== 'undefined' ? window.innerWidth - winWidth - 12 : 500, position.x);

      const calcWinY = isBottomHalf
        ? Math.max(12, position.y - winHeight - 12)
        : Math.min(typeof window !== 'undefined' ? window.innerHeight - winHeight - 12 : 500, position.y + pillH + 12);

      return {
        ...base,
        left: `${calcWinX}px`,
        top: `${calcWinY}px`
      };
    }

    switch (position.preset) {
      case 'bottom-left':
        return { ...base, bottom: '80px', left: '20px' };
      case 'top-right':
        return { ...base, top: '80px', right: '20px' };
      case 'top-left':
        return { ...base, top: '80px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...base, bottom: '80px', right: '20px' };
    }
  };

  const renderPositionMenu = (anchor: 'pill' | 'header') => {
    const isTop = position.preset === 'top-left' || position.preset === 'top-right' || (position.preset === 'custom' && (position.y ?? 0) < 300);
    const isLeft = position.preset === 'bottom-left' || position.preset === 'top-left' || (position.preset === 'custom' && (position.x ?? 0) < (typeof window !== 'undefined' ? window.innerWidth / 2 : 500));

    const menuStyle: React.CSSProperties = anchor === 'pill' ? {
      position: 'absolute',
      bottom: isTop ? 'auto' : 'calc(100% + 12px)',
      top: isTop ? 'calc(100% + 12px)' : 'auto',
      right: isLeft ? 'auto' : '0px',
      left: isLeft ? '0px' : 'auto',
      width: '270px',
      backgroundColor: 'var(--ds-color-surface, #0F172A)',
      border: '1.5px solid var(--ds-color-border-strong, rgba(56, 189, 248, 0.4))',
      borderRadius: '14px',
      padding: '12px 14px',
      boxShadow: 'var(--ds-shadow-xl)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
      backdropFilter: 'blur(16px)'
    } : {
      position: 'absolute',
      top: '52px',
      right: '12px',
      width: '270px',
      backgroundColor: 'var(--ds-color-surface, #0B1120)',
      border: '1.5px solid var(--ds-color-border-strong, rgba(56, 189, 248, 0.4))',
      borderRadius: '14px',
      padding: '12px 14px',
      boxShadow: 'var(--ds-shadow-xl)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
      backdropFilter: 'blur(16px)'
    };

    return (
      <div
        data-ewan-position-menu
        onClick={(e) => e.stopPropagation()}
        style={menuStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚙️</span> EWAN Settings / सेटिंग्स
          </span>
          <button
            type="button"
            data-ewan-ignore-drag
            onClick={(e) => {
              e.stopPropagation();
              setShowPillMenu(false);
              setShowWinMenu(false);
            }}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px' }}
            title="Close menu"
          >
            ✕
          </button>
        </div>

        {/* 1. Launcher Display Mode Switcher */}
        <div>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Launcher Mode (आकार)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <button
              type="button"
              data-ewan-ignore-drag
              onClick={() => updateLauncherMode('icon')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: launcherMode === 'icon' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: launcherMode === 'icon' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                color: launcherMode === 'icon' ? '#38BDF8' : '#F1F5F9',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>🔘</span> Icon Orb (52px)
            </button>
            <button
              type="button"
              data-ewan-ignore-drag
              onClick={() => updateLauncherMode('pill')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: launcherMode === 'pill' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: launcherMode === 'pill' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                color: launcherMode === 'pill' ? '#38BDF8' : '#F1F5F9',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>💊</span> Full Pill
            </button>
          </div>
        </div>

        {/* 2. Window Size Switcher */}
        <div>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Window Size (चैट विंडो साइज)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            {(['compact', 'standard', 'large'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                data-ewan-ignore-drag
                onClick={() => {
                  setWindowSize(sz);
                  try { localStorage.setItem(EWAN_WIN_SIZE_KEY, sz); } catch (e) {}
                }}
                style={{
                  padding: '5px 4px',
                  borderRadius: '6px',
                  border: windowSize === sz ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: windowSize === sz ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: windowSize === sz ? '#38BDF8' : '#CBD5E1',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  textTransform: 'capitalize'
                }}
              >
                {sz === 'compact' ? '🔹 380px' : sz === 'standard' ? '📱 440px' : '🖥️ 540px'}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 4 Corner Presets */}
        <div>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Corner Snap (कोने में स्नैप करें)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <button
              type="button"
              data-ewan-ignore-drag
              onClick={() => {
                updatePosition({ preset: 'top-left' });
                setShowPillMenu(false);
                setShowWinMenu(false);
              }}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: position.preset === 'top-left' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: position.preset === 'top-left' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                color: position.preset === 'top-left' ? '#38BDF8' : '#F1F5F9',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              ↖ Top-Left
            </button>

            <button
              type="button"
              data-ewan-ignore-drag
              onClick={() => {
                updatePosition({ preset: 'top-right' });
                setShowPillMenu(false);
                setShowWinMenu(false);
              }}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: position.preset === 'top-right' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: position.preset === 'top-right' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                color: position.preset === 'top-right' ? '#38BDF8' : '#F1F5F9',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              ↗ Top-Right
            </button>

            <button
              type="button"
              data-ewan-ignore-drag
              onClick={() => {
                updatePosition({ preset: 'bottom-left' });
                setShowPillMenu(false);
                setShowWinMenu(false);
              }}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: position.preset === 'bottom-left' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: position.preset === 'bottom-left' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                color: position.preset === 'bottom-left' ? '#38BDF8' : '#F1F5F9',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              ↙ Bottom-Left
            </button>

            <button
              type="button"
              data-ewan-ignore-drag
              onClick={() => {
                updatePosition({ preset: 'bottom-right' });
                setShowPillMenu(false);
                setShowWinMenu(false);
              }}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: position.preset === 'bottom-right' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: position.preset === 'bottom-right' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                color: position.preset === 'bottom-right' ? '#38BDF8' : '#F1F5F9',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              ↘ Bottom-Right
            </button>
          </div>
        </div>

        {position.preset === 'custom' && (
          <div style={{ fontSize: '0.65rem', color: '#10B981', textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px', borderRadius: '4px' }}>
            ✓ Custom dragged: {position.x}px, {position.y}px
          </div>
        )}

        <button
          type="button"
          data-ewan-ignore-drag
          onClick={() => {
            updatePosition({ preset: 'bottom-right' });
            updateLauncherMode('icon');
            setWindowSize('compact');
            setShowPillMenu(false);
            setShowWinMenu(false);
          }}
          style={{
            marginTop: '2px',
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px dashed rgba(255,255,255,0.2)',
            backgroundColor: 'transparent',
            color: '#94A3B8',
            fontSize: '0.6875rem',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.borderColor = '#38BDF8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        >
          ↺ Reset to Default (Icon + Bottom-Right)
        </button>
      </div>
    );
  };

  return (
    <>
      {/* 1. FLOATING GLOWING AVATAR DOCK */}
      <div
        ref={pillRef}
        style={{
          ...getPillStyle(),
          userSelect: 'none'
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          const target = e.target as HTMLElement;
          if (target.closest('[data-ewan-ignore-drag]')) return;
          handlePillStartDrag(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-ewan-ignore-drag]')) return;
          const firstTouch = e.touches && e.touches[0];
          if (firstTouch) {
            handlePillStartDrag(firstTouch.clientX, firstTouch.clientY);
          }
        }}
      >
        {showPillMenu && renderPositionMenu('pill')}

        {launcherMode === 'icon' ? (
          /* A. COMPACT FUTURISTIC CIRCULAR AI ORB (52px x 52px) */
          <div
            onClick={handlePillClick}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowPillMenu((prev) => !prev);
            }}
            style={{
              position: 'relative',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: currentPlatform === 'LANDING_PAGE' ? '#065F46' : '#0B1120',
              backgroundImage: currentPlatform === 'LANDING_PAGE'
                ? 'radial-gradient(circle at 35% 35%, #10B981, #047857 70%, #064E3B 100%)'
                : 'radial-gradient(circle at 35% 35%, #0284C7, #0F172A 70%, #020617 100%)',
              border: currentPlatform === 'LANDING_PAGE' ? '2px solid #34D399' : '2px solid rgba(56, 189, 248, 0.8)',
              boxShadow: isDraggingPill
                ? '0 16px 40px rgba(0, 0, 0, 0.95), 0 0 30px rgba(6, 182, 212, 0.8)'
                : '0 8px 25px rgba(0, 0, 0, 0.7), 0 0 18px rgba(6, 182, 212, 0.4), inset 0 0 12px rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDraggingPill ? 'grabbing' : 'pointer',
              transition: isDraggingPill ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
              transform: isDraggingPill ? 'scale(1.1)' : 'scale(1)',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isDraggingPill) e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              if (!isDraggingPill) e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}
            title="EWAN AI (Alt + E) • Drag anywhere • Right-click for settings"
          >
            {/* Ambient Pulse Halo */}
            <span
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                opacity: 0.7,
                pointerEvents: 'none'
              }}
            />

            {/* Platform AI Icon */}
            <span style={{ fontSize: '1.45rem', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.9))' }}>
              {getPlatformIcon()}
            </span>

            {/* Live Online AI Dot */}
            <span
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2px solid #0F172A',
                boxShadow: '0 0 8px #10B981'
              }}
              title="EWAN AI Online"
            />

            {/* Micro AI badge */}
            <span
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-4px',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                fontSize: '0.55rem',
                fontWeight: 900,
                borderRadius: '4px',
                padding: '1px 3px',
                letterSpacing: '0.04em',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
              }}
            >
              AI
            </span>
          </div>
        ) : (
          /* B. EXPANDED PILL MODE (Available via settings toggle) */
          <div
            onClick={handlePillClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: currentPlatform === 'LANDING_PAGE' ? '#059669' : '#0F172A',
              color: '#FFFFFF',
              border: currentPlatform === 'LANDING_PAGE' ? '2px solid #10B981' : '2px solid rgba(6, 182, 212, 0.7)',
              borderRadius: '50px',
              padding: '8px 14px',
              boxShadow: isDraggingPill
                ? '0 16px 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(6, 182, 212, 0.6)'
                : '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.3)',
              cursor: isDraggingPill ? 'grabbing' : 'pointer',
              transition: isDraggingPill ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(12px)',
              transform: isDraggingPill ? 'scale(1.04)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!isDraggingPill) e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            }}
            onMouseLeave={(e) => {
              if (!isDraggingPill) e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
            title="Click to open EWAN (Alt + E) • Drag anywhere on screen"
          >
            <span
              style={{
                fontSize: '0.85rem',
                color: 'rgba(56, 189, 248, 0.7)',
                cursor: isDraggingPill ? 'grabbing' : 'grab',
                paddingRight: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Drag to move anywhere"
            >
              ⠿
            </span>

            <span style={{ fontSize: '1.25rem', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))' }}>
              {getPlatformIcon()}
            </span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 900, letterSpacing: '0.05em', color: '#F8FAFC' }}>
                EWAN
              </div>
              <div style={{ fontSize: '0.625rem', color: '#38BDF8', fontWeight: 600 }}>
                {getPlatformLabel().split(' ')[0]} AI
              </div>
            </div>
            <kbd
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#38BDF8',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '0.625rem',
                fontFamily: 'monospace'
              }}
            >
              Alt+E
            </kbd>

            <button
              type="button"
              data-ewan-ignore-drag
              data-ewan-position-btn
              onClick={(e) => {
                e.stopPropagation();
                setShowPillMenu((prev) => !prev);
              }}
              style={{
                background: showPillMenu ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: showPillMenu ? '#38BDF8' : '#94A3B8',
                padding: '3px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                lineHeight: 1,
                transition: 'all 0.15s ease'
              }}
              title="Reposition EWAN (Move corner / drag)"
            >
              ⛶
            </button>
          </div>
        )}

        {/* EWAN Calmness Instrumental Music (Zen Soundscape) */}
        <EwanZenMusicWidget variant="floating-dock" />
      </div>

      {/* 2. EWAN WINDOW */}
      {isOpen && (
        <div
          ref={windowRef}
          style={getWindowStyle()}
        >
          {showWinMenu && renderPositionMenu('header')}

          {/* Header (Draggable) */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--ds-color-surface-subtle, #0F172A)',
              borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isDraggingWin ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              const target = e.target as HTMLElement;
              if (target.closest('[data-ewan-ignore-drag]')) return;
              handleWinStartDrag(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('[data-ewan-ignore-drag]')) return;
              const firstTouch = e.touches && e.touches[0];
              if (firstTouch) {
                handleWinStartDrag(firstTouch.clientX, firstTouch.clientY);
              }
            }}
            title="Drag header to move window anywhere on screen"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '0.9rem',
                  color: 'rgba(56, 189, 248, 0.7)',
                  cursor: isDraggingWin ? 'grabbing' : 'grab',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Drag to reposition window"
              >
                ⠿
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(6, 182, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}
              >
                {getPlatformIcon()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38BDF8' }}>
                    EWAN • {getPlatformLabel()}
                  </span>
                  <Badge variant="info" size="sm">
                    v2.1
                  </Badge>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Scope: {currentPlatform === 'COMPANY_HQ' ? 'Super Admin HQ' : currentPlatform === 'PARTNER_PLATFORM' ? 'Hospital OS' : 'Public Health Portal'}{activeModule ? ` • ${activeModule}` : ''}
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* EWAN Calmness Instrumental Music (Header Button) */}
              <EwanZenMusicWidget variant="header-button" />

              {/* Reposition & Settings Button */}
              <button
                type="button"
                data-ewan-ignore-drag
                data-ewan-position-btn
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWinMenu((prev) => !prev);
                }}
                style={{
                  background: showWinMenu ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  border: showWinMenu ? '1px solid #38BDF8' : 'none',
                  borderRadius: '4px',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px 7px',
                  fontSize: '0.85rem'
                }}
                title="Settings & Corner Snap"
              >
                ⛶
              </button>

              {/* Window Size Switcher Button (Compact / Standard / Studio) */}
              <button
                type="button"
                data-ewan-ignore-drag
                onClick={(e) => {
                  e.stopPropagation();
                  cycleWindowSize();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
                title={`Window Size: ${windowSize.toUpperCase()} (Click to toggle: Compact ⇄ Standard ⇄ Studio)`}
              >
                <span>⤢</span>
                <span style={{ fontSize: '0.625rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
                  {windowSize === 'compact' ? 'SM' : windowSize === 'standard' ? 'MD' : 'LG'}
                </span>
              </button>

              <button
                type="button"
                data-ewan-ignore-drag
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '0.9rem'
                }}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? '🗖' : '🗕'}
              </button>
              <button
                type="button"
                data-ewan-ignore-drag
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '1rem'
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Knowledge Chips Deck (Filtered strictly for this persona) */}
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--ds-color-surface, #070C16)',
                  borderBottom: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.06))',
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none'
                }}
              >
                {availableTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleAskTopic(topic)}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '5px 10px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38BDF8',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.22)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)')}
                  >
                    {topic.title.split(' ').slice(0, 4).join(' ')}
                  </button>
                ))}
              </div>

              {/* Chat Messages Body */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  backgroundColor: 'var(--ds-color-surface-subtle, #0F172A)'
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'USER' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '92%',
                        padding: '12px 14px',
                        borderRadius: msg.sender === 'USER' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        backgroundColor: msg.sender === 'USER' ? '#0284C7' : '#1E293B',
                        color: '#F8FAFC',
                        fontSize: '0.8125rem',
                        lineHeight: '1.5',
                        border: msg.sender === 'USER' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      {/* Plain text / fallback / user text */}
                      {msg.text && (
                        <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                      )}

                      {/* Topic Step-by-Step Breakdown (Concise & Numbered) */}
                      {msg.topic && (
                        <div style={{ marginTop: msg.text ? '10px' : '0' }}>
                          {/* Topic Title Header */}
                          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                            {msg.topic.title}
                          </div>

                          {/* Short 1-Sentence Summary Pill */}
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#94A3B8',
                              marginBottom: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.25)',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              borderLeft: '2px solid #38BDF8'
                            }}
                          >
                            💡 <strong>Summary:</strong> {msg.topic.summary}
                          </div>

                          {/* Step-by-Step Guide Label */}
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7DD3FC', marginBottom: '6px' }}>
                            📋 Step-by-Step Instructions:
                          </div>

                          {/* Clean Numbered Step Cards */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {msg.topic.steps.map((st, idx) => {
                              const cleanStep = st.replace(/^\d+\.\s*(Step\s*\d+\s*(\([^)]*\))?:\s*)?/i, '');
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    fontSize: '0.75rem',
                                    color: '#F1F5F9',
                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                    padding: '7px 9px',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid #0EA5E9'
                                  }}
                                >
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      backgroundColor: '#0284C7',
                                      color: '#FFFFFF',
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      flexShrink: 0,
                                      marginTop: '1px'
                                    }}
                                  >
                                    {idx + 1}
                                  </span>
                                  <span style={{ lineHeight: 1.45 }}>{cleanStep}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Technical metadata (Only for Admin HQ) */}
                          {currentPlatform === 'COMPANY_HQ' && msg.topic.technicalDetails && (
                            <div
                              style={{
                                marginTop: '10px',
                                padding: '8px',
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                borderRadius: '6px',
                                fontSize: '0.6875rem',
                                color: '#94A3B8'
                              }}
                            >
                              {msg.topic.technicalDetails.routes && (
                                <div>
                                  <span style={{ color: '#E2E8F0', fontWeight: 700 }}>Routes: </span>
                                  {msg.topic.technicalDetails.routes.join(', ')}
                                </div>
                              )}
                              {msg.topic.technicalDetails.dbTables && (
                                <div>
                                  <span style={{ color: '#E2E8F0', fontWeight: 700 }}>Tables: </span>
                                  {msg.topic.technicalDetails.dbTables.join(', ')}
                                </div>
                              )}
                              {msg.topic.technicalDetails.ports && (
                                <div>
                                  <span style={{ color: '#E2E8F0', fontWeight: 700 }}>Ports: </span>
                                  {msg.topic.technicalDetails.ports.join(', ')}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Interactive 1-Click Action Shortcut */}
                          {msg.topic.technicalDetails?.actionKey && (
                            <div style={{ marginTop: '10px' }}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleActionClick(msg.topic?.technicalDetails?.actionKey)}
                              >
                                ⚡ Open / Execute Action
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      {/* EWAN Voice Readout & 1-Click Copy Controls */}
                      {msg.sender === 'EWAN' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            paddingTop: '6px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const speakContent = msg.topic
                                ? `${msg.topic.title}. ${msg.topic.summary}. ${msg.topic.steps.join('. ')}`
                                : msg.text;
                              handleSpeak(msg.id, speakContent);
                            }}
                            style={{
                              background: speakingMsgId === msg.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              border: speakingMsgId === msg.id ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              color: speakingMsgId === msg.id ? '#38BDF8' : '#94A3B8',
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Listen to EWAN voice instructions (आवाज में सुनें)"
                          >
                            <span>{speakingMsgId === msg.id ? '⏹️' : '🔊'}</span>
                            <span>{speakingMsgId === msg.id ? 'Stop' : 'Listen'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const copyContent = msg.topic
                                ? `${msg.topic.title}\n\nSummary: ${msg.topic.summary}\n\nSteps:\n${msg.topic.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`
                                : msg.text;
                              handleCopyText(msg.id, copyContent);
                            }}
                            style={{
                              background: copiedMsgId === msg.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: copiedMsgId === msg.id ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              color: copiedMsgId === msg.id ? '#10B981' : '#94A3B8',
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Copy instructions to clipboard"
                          >
                            <span>{copiedMsgId === msg.id ? '✓' : '📋'}</span>
                            <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.625rem', color: '#64748B', marginTop: '4px', padding: '0 4px' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Action Suggestion Chips Dock */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#0B132B',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <button
                  type="button"
                  data-ewan-ignore-drag
                  onClick={() => processQuery('Ab kya karna hai?')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38BDF8',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ✨ Ab kya karna hai?
                </button>
                <button
                  type="button"
                  data-ewan-ignore-drag
                  onClick={() => processQuery('Main kya-kya kar sakta hoon?')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#10B981',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  📋 Main kya-kya kar sakta hoon?
                </button>
                {normalizeRoleCategory(currentUser?.role).category === 'FRONT_DESK' && (
                  <button
                    type="button"
                    data-ewan-ignore-drag
                    onClick={() => processQuery('Doctor consultation kaise complete karte hain?')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#F59E0B',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Test role boundary handoff redirection"
                  >
                    🩺 Doctor Consultation (Handoff)
                  </button>
                )}
                {normalizeRoleCategory(currentUser?.role).category === 'CLINICAL' && (
                  <button
                    type="button"
                    data-ewan-ignore-drag
                    onClick={() => processQuery('Patient consultation kaise complete karun?')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(168, 85, 247, 0.12)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      color: '#A855F7',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🩺 Patient Consultation Desk
                  </button>
                )}
                <button
                  type="button"
                  data-ewan-ignore-drag
                  onClick={() => processQuery('Kaam nahi kar raha?')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#F87171',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⚠️ Kaam nahi kar raha?
                </button>
              </div>

              {/* Chat Input Dock */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--ds-color-surface-subtle, #0F172A)',
                  borderTop: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.1))',
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={
                    currentPlatform === 'LANDING_PAGE'
                      ? 'Doctor search ya OPD token ke baare me poochhein...'
                      : currentPlatform === 'PARTNER_PLATFORM'
                      ? 'Fast OPD, Doctor EMR ya POS ke baare me poochhein...'
                      : 'Plans, KYC approval ya architecture ke baare me poochhein...'
                  }
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--ds-color-surface, #070C16)',
                    border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.15))',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--ds-color-text-primary, #F8FAFC)',
                    fontSize: '0.8125rem',
                    outline: 'none'
                  }}
                />

                {/* Voice Dictation Button (Microphone) */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  style={{
                    backgroundColor: isListening ? '#EF4444' : 'rgba(56, 189, 248, 0.15)',
                    border: isListening ? '1px solid #DC2626' : '1px solid rgba(56, 189, 248, 0.3)',
                    color: isListening ? '#FFFFFF' : '#38BDF8',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title={isListening ? 'Listening... click to stop' : 'Voice Dictation (बोलकर लिखें)'}
                >
                  <span>{isListening ? '🔴' : '🎤'}</span>
                  {isListening && <span style={{ fontSize: '0.7rem' }}>Listening...</span>}
                </button>

                <Button type="submit" variant="primary" size="sm">
                  Send
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
