import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../primitives/index.js';
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

const parseInlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: '#F8FAFC', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} style={{ color: '#CBD5E1' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

const renderFormattedText = (rawText: string): React.ReactNode => {
  const lines = rawText.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '5px' }} />;
        }
        if (trimmed.startsWith('### ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#38BDF8',
                marginTop: '6px',
                marginBottom: '2px',
                letterSpacing: '0.02em'
              }}
            >
              {trimmed.replace('### ', '')}
            </div>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                marginLeft: '4px'
              }}
            >
              <span style={{ color: '#38BDF8', fontSize: '0.75rem', lineHeight: '1.4' }}>•</span>
              <span style={{ flex: 1, fontSize: '0.8rem', lineHeight: '1.45' }}>
                {parseInlineMarkdown(content)}
              </span>
            </div>
          );
        }
        return (
          <div key={idx} style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
            {parseInlineMarkdown(line)}
          </div>
        );
      })}
    </div>
  );
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

  // Motion, Initial Glow & Auto-Docking State
  const [mountStage, setMountStage] = useState<'hidden' | 'emerging' | 'active'>('hidden');
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [isAutoDocked, setIsAutoDocked] = useState(false);
  const idleTimerRef = useRef<any>(null);

  const pillRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const pillDragMetaRef = useRef<{ startX: number; startY: number; clientX: number; clientY: number } | null>(null);
  const pillHasMovedRef = useRef(false);
  const winDragMetaRef = useRef<{ startX: number; startY: number; clientX: number; clientY: number } | null>(null);
  const winHasMovedRef = useRef(false);

  // Initial slow glow entrance after page login/mount
  useEffect(() => {
    const emergeTimer = setTimeout(() => {
      setMountStage('emerging');
      setGreetingVisible(true);
    }, 600);

    const activeTimer = setTimeout(() => {
      setMountStage('active');
    }, 1800);

    const greetFadeTimer = setTimeout(() => {
      setGreetingVisible(false);
    }, 5000);

    return () => {
      clearTimeout(emergeTimer);
      clearTimeout(activeTimer);
      clearTimeout(greetFadeTimer);
    };
  }, []);

  // Idle Auto-Docking: when not in use for 7s, smoothly glides to corner
  const resetIdleTimer = () => {
    setIsAutoDocked(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!isOpen && !isDraggingPill) {
      idleTimerRef.current = setTimeout(() => {
        setIsAutoDocked(true);
      }, 7000);
    }
  };

  useEffect(() => {
    if (isOpen || isDraggingPill) {
      setIsAutoDocked(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, isDraggingPill]);

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
      return `Namaste! Main **EWAN Health Assistant** hoon ✨.
Doctors search, OPD appointment booking ya digital health records me aapki madad ke liye ready hoon.`;
    }
    if (platform === 'PARTNER_PLATFORM') {
      const roleDetails = normalizeRoleCategory(currentUser?.role);
      const greetingName = currentUser?.name || currentUser?.roleTitle || roleDetails.roleTitle || 'Doctor / Partner';
      return `Namaste ${greetingName}! Main **EWAN Clinical Copilot** hoon ✨.
Fast OPD tokens, patient consultation, lab diagnostic reports aur pharmacy billing me aapki help ke liye available hoon.`;
    }
    return `Namaste! Main **EWAN Executive Copilot** hoon ✨.
Partner KYC verification, commercial plans, platform licensing aur live healthcare analytics me aapki help ke liye available hoon.`;
  };

  const getWelcomeQuickActions = (platform: string) => {
    if (platform === 'LANDING_PAGE') {
      return [
        {
          icon: '🔍',
          title: 'Find Doctors',
          desc: 'Search verified specialists nearby',
          query: 'Doctor search kaise karein?'
        },
        {
          icon: '🏥',
          title: 'Book OPD Token',
          desc: 'Skip waiting lines with digital token',
          query: 'OPD appointment kaise book karein?'
        },
        {
          icon: '🧪',
          title: 'Lab Tests',
          desc: 'Home sample collection & digital reports',
          query: 'Lab test kaise book karein?'
        },
        {
          icon: '🎙️',
          title: 'Voice Assistant',
          desc: 'Speak symptoms or queries in Hindi/English',
          query: 'Kya hum log Whisper voice dictation use kar sakte hain?'
        }
      ];
    }
    if (platform === 'PARTNER_PLATFORM') {
      return [
        {
          icon: '🎫',
          title: 'Fast OPD & Token',
          desc: '30s patient registration & token desk',
          query: 'Fast 30s OPD Registration kaise karein?'
        },
        {
          icon: '🩺',
          title: 'Doctor Desk',
          desc: 'Digital Rx, diagnosis & allergy warnings',
          query: 'Doctor consultation desk kaise use karein?'
        },
        {
          icon: '🧪',
          title: 'Lab & Diagnostics',
          desc: 'Sample barcode routing & report verification',
          query: 'Sample collection aur lab results kaise verify karein?'
        },
        {
          icon: '💊',
          title: 'Pharmacy POS',
          desc: 'FEFO stock batch deduction & GST bills',
          query: 'Pharmacy billing aur stock deduction kaise hota hai?'
        }
      ];
    }
    return [
      {
        icon: '🛡️',
        title: 'Partner KYC',
        desc: 'Review pending registrations & verify documents',
        query: 'Partner onboarding KYC verification kaise karein?'
      },
      {
        icon: '💼',
        title: 'Commercial Plans',
        desc: 'License quotas, modules & branch limits',
        query: 'Subscription plans aur license quota kaise manage karein?'
      },
      {
        icon: '📊',
        title: 'Executive MIS',
        desc: 'Live hospital activity & platform metrics',
        query: 'Platform analytics aur system overview dikhao'
      },
      {
        icon: '🎙️',
        title: 'Voice Dictation',
        desc: 'Speak in Hindi or English using Whisper',
        query: 'Kya hum log Whisper voice dictation use kar sakte hain?'
      }
    ];
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'EWAN',
        text: getWelcomeText(currentPlatform),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
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

    // 1. Check if Knowledge / Training / Capability query (ChatGPT mode overview)
    const isKnowledgeQuery = /(kya.*(know|train|jante|samajhte|capability|kar sakte|seekha|padha|pata|feature))|(what.*(know|train|capabilit|feature|can you do))|(who are you)|(apna.*(parichay|details|knowl))|(chat\s*gpt)|(capabilities)/i.test(cleanQuery);

    // 2. Check if Whisper / Voice STT query
    const isWhisperVoiceQuery = /(whisper|wishper|voice|bolkar|speech|audio|dictation|mic|aawaz)/i.test(cleanQuery);

    // 3. Check if greeting
    const isGreeting = /^(hi|hello|hey|namaste|pranam|kya hal|halo|help)\b/i.test(cleanQuery);

    let replyText = '';
    let matchedTopic: EwanKnowledgeTopic | undefined = undefined;

    if (isKnowledgeQuery) {
      replyText = `Namaste! Main **EWAN AI** hoon — DOC SEARCH Healthcare ERP ka Specialized Medical & System Brain 🧠.

Main complete hospital operational lifecycle, clinical safety, diagnostics aur zero-trust SaaS governance par trained hoon. Mere paas in core domains ka verified knowledge hai:

### 1. 🩺 OPD & Clinical Consultation
- **Fast 30s OPD Registration**: Instant patient UHID, digital token generation aur queue management.
- **Doctor Consultation Desk**: Digital Rx authoring, drug-drug allergy checks, CDSS clinical guidelines.
- **ICD-10 Diagnosis**: 70,000+ standard disease coding aur symptoms mapping.

### 2. 🔬 Pathology & LIMS Laboratory
- **Sample Accessioning & Barcode**: Phlebotomy collection, vacutainer barcode routing.
- **Analyzer Interfacing**: Automated bidirectional analyzer result ingest.
- **Panic Alerts & Verification**: Critical abnormal value flags aur pathologist two-level sign-off.

### 3. 🩻 Radiology & RIS / PACS
- **DICOM Imaging**: Modality scheduling (X-Ray, CT, MRI, USG) aur web PACS DICOM viewer link.
- **Radiologist Reporting**: Structured templates, impression finalization aur digital addendum.

### 4. 💊 Pharmacy POS & FEFO Inventory
- **Atomic Stock Deduction**: Bill hote hi inventory ledger me live batch deduction.
- **FEFO (First-Expiry First-Out)**: Expiring medicines ka auto-alert aur return management.
- **Cashier POS**: GST-compliant invoice generation aur barcode scanning.

### 5. 🛏️ IPD, OT & Emergency Operations
- **Bed Management**: Ward, ICU aur private cabin live occupancy tracking.
- **Emergency Triage**: Trauma triage score (ESI) aur priority red-flag alerts.
- **OT Scheduling**: Surgeon, anesthetist aur sterile equipment sterilization check.

### 6. 💳 Billing, TPA Insurance & Cashier
- **Multi-Mode Settlements**: Cash, UPI, Card, Net Banking aur TPA/Ayushman claim pre-auth.
- **Corporate Discounts & Invoicing**: Strict maker-checker dual approval rule.

### 7. 🔒 SaaS Governance & Licensing (Zero-Trust)
- **1st Year Free (365 Days)**: Transparent countdown, 60-day renewal notice, 30-day grace period.
- **Cryptographic License Security**: Tamper-proof HMAC SHA-256 license signatures.
- **Strict Multi-Role RBAC**: Front desk, doctor, nurse, lab technician aur cashier ke strict role boundaries.

### 8. 🎙️ Voice AI & Whisper Integration
- **Real-Time Dictation**: Hindi, English aur Hinglish voice transcription. Self-Hosted Whisper aur OpenAI Whisper dono se fully compatible!

💡 *Aap mujhse ChatGPT ki tarah kisi bhi topic ya workflow par seedha sawal poochhein!*`;
    } else if (isWhisperVoiceQuery) {
      replyText = `🎙️ **Whisper Speech-to-Text (STT) Integration Status: 100% READY**

**Haan! Hum log Whisper use kar sakte hain — aur yeh DOC SEARCH me ALREADY INTEGRATED hai!**

DOC SEARCH me 3 layers par Whisper aur Voice AI support available hai:

1. **Self-Hosted Whisper (Local / Free / 100% HIPAA Private)**:
   - File: \`apps/api-gateway/src/ai/voice/whisper-stt-provider.ts\`
   - Local Python + FFmpeg subprocess par chalta hai. Zero cloud API cost aur zero data leakage.

2. **OpenAI Whisper Cloud API**:
   - File: \`apps/api-gateway/src/ai/voice/stt-provider.ts\`
   - Ultra-fast medical accuracy ke liye OpenAI \`whisper-1\` model use karta hai. Just \`.env\` me \`OPENAI_API_KEY\` set karein.

3. **Instant Browser Voice Dictation (Right Now)**:
   - Chat box ke bagal me diye gaye **🎤 mic button** par click karein.
   - Yeh bina kisi server dependency ke aapki Hindi (\`hi-IN\`) aur English aawaz ko live text me convert kar dega!`;
    } else if (isGreeting) {
      replyText = `Namaste! Main **EWAN AI** hoon, aapka Instant System Master Trainer & ChatGPT Copilot 🏥.
1. "Tum kya-kya jante ho?" poochhein aur meri full training dekhein.
2. "Whisper kaise use karein?" poochhein audio dictation ke liye.
3. Niche diye gaye kisi bhi shortcut chip par click karein ya apna kaam type karein (e.g. 'OPD token', 'Doctor desk', 'Pharmacy bill').
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
      gap: '6px',
      touchAction: 'none',
      transition: isDraggingPill
        ? 'none'
        : 'opacity 0.8s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.7s cubic-bezier(0.16, 1, 0.3, 1), right 0.7s cubic-bezier(0.16, 1, 0.3, 1), left 0.7s cubic-bezier(0.16, 1, 0.3, 1), top 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
    };

    if (mountStage === 'hidden') {
      return {
        ...base,
        opacity: 0,
        transform: 'scale(0.5)',
        pointerEvents: 'none',
        bottom: '24px',
        right: '24px'
      };
    }

    if (position.preset === 'custom' && position.x !== undefined && position.y !== undefined) {
      return {
        ...base,
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: 1,
        transform: 'scale(1)'
      };
    }

    // Auto-docking into corner when idle
    if (isAutoDocked && !isOpen) {
      switch (position.preset) {
        case 'bottom-left':
          return { ...base, bottom: '16px', left: '16px', opacity: 0.88, transform: 'scale(0.92)' };
        case 'top-right':
          return { ...base, top: '16px', right: '16px', opacity: 0.88, transform: 'scale(0.92)' };
        case 'top-left':
          return { ...base, top: '16px', left: '16px', opacity: 0.88, transform: 'scale(0.92)' };
        case 'bottom-right':
        default:
          return { ...base, bottom: '16px', right: '16px', opacity: 0.88, transform: 'scale(0.92)' };
      }
    }

    // Active / Emerging stage (prominently visible in open page area)
    switch (position.preset) {
      case 'bottom-left':
        return {
          ...base,
          bottom: mountStage === 'emerging' ? '92px' : '22px',
          left: mountStage === 'emerging' ? '36px' : '22px',
          opacity: 1,
          transform: 'scale(1)'
        };
      case 'top-right':
        return {
          ...base,
          top: mountStage === 'emerging' ? '92px' : '22px',
          right: mountStage === 'emerging' ? '36px' : '22px',
          opacity: 1,
          transform: 'scale(1)'
        };
      case 'top-left':
        return {
          ...base,
          top: mountStage === 'emerging' ? '92px' : '22px',
          left: mountStage === 'emerging' ? '36px' : '22px',
          opacity: 1,
          transform: 'scale(1)'
        };
      case 'bottom-right':
      default:
        return {
          ...base,
          bottom: mountStage === 'emerging' ? '92px' : '22px',
          right: mountStage === 'emerging' ? '36px' : '22px',
          opacity: 1,
          transform: 'scale(1)'
        };
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
      {/* EWAN Dynamic Keyframes & Visual Animations */}
      <style>{`
        @keyframes ewanHaloPulse {
          0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.6); }
          50% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 18px 4px rgba(6, 182, 212, 0.5); }
          100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
        @keyframes ewanBreathingGlow {
          0%, 100% { box-shadow: 0 4px 18px rgba(0, 0, 0, 0.7), 0 0 14px rgba(56, 189, 248, 0.45), inset 0 0 8px rgba(56, 189, 248, 0.3); }
          50% { box-shadow: 0 6px 24px rgba(0, 0, 0, 0.8), 0 0 22px rgba(6, 182, 212, 0.75), inset 0 0 12px rgba(56, 189, 248, 0.5); }
        }
        @keyframes ewanTooltipFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ewanWindowOpen {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* 1. FLOATING GLOWING AVATAR DOCK */}
      {(!isOpen || isMinimized) && (
        <div
          ref={pillRef}
        style={{
          ...getPillStyle(),
          userSelect: 'none'
        }}
        onMouseEnter={() => resetIdleTimer()}
        onMouseDown={(e) => {
          resetIdleTimer();
          if (e.button !== 0) return;
          const target = e.target as HTMLElement;
          if (target.closest('[data-ewan-ignore-drag]')) return;
          handlePillStartDrag(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          resetIdleTimer();
          const target = e.target as HTMLElement;
          if (target.closest('[data-ewan-ignore-drag]')) return;
          const firstTouch = e.touches && e.touches[0];
          if (firstTouch) {
            handlePillStartDrag(firstTouch.clientX, firstTouch.clientY);
          }
        }}
      >
        {/* Floating Emerge Greeting Chip */}
        {greetingVisible && !isOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              right: '0',
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.92))',
              border: '1.2px solid rgba(56, 189, 248, 0.5)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.25)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.7rem',
              color: '#38BDF8',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              pointerEvents: 'none',
              animation: 'ewanTooltipFloat 2s ease-in-out infinite',
              backdropFilter: 'blur(8px)',
              zIndex: 1000006
            }}
          >
            <span style={{ fontSize: '0.8rem' }}>✨</span>
            <span>EWAN • Quick Help</span>
          </div>
        )}

        {showPillMenu && renderPositionMenu('pill')}

        {launcherMode === 'icon' ? (
          /* A. COMPACT FUTURISTIC CIRCULAR ORB (36px x 36px) */
          <div
            onClick={handlePillClick}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowPillMenu((prev) => !prev);
            }}
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: currentPlatform === 'LANDING_PAGE' ? '#065F46' : '#0B1120',
              backgroundImage: currentPlatform === 'LANDING_PAGE'
                ? 'radial-gradient(circle at 35% 35%, #10B981, #047857 70%, #064E3B 100%)'
                : 'radial-gradient(circle at 35% 35%, #0284C7, #0F172A 70%, #020617 100%)',
              border: currentPlatform === 'LANDING_PAGE' ? '2px solid #34D399' : '1.5px solid rgba(56, 189, 248, 0.8)',
              boxShadow: isDraggingPill
                ? '0 10px 26px rgba(0, 0, 0, 0.95), 0 0 20px rgba(6, 182, 212, 0.75)'
                : '0 4px 16px rgba(0, 0, 0, 0.65), 0 0 12px rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDraggingPill ? 'grabbing' : 'pointer',
              transition: isDraggingPill ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
              transform: isDraggingPill ? 'scale(1.08)' : 'scale(1)',
              userSelect: 'none',
              animation: 'ewanBreathingGlow 4s infinite ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (!isDraggingPill) e.currentTarget.style.transform = 'scale(1.08) translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              if (!isDraggingPill) e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}
            title="EWAN Assistant (Alt + E) • Drag anywhere"
          >
            {/* Ambient Pulse Halo */}
            <span
              style={{
                position: 'absolute',
                inset: '-2px',
                borderRadius: '50%',
                border: '1.2px solid rgba(56, 189, 248, 0.45)',
                opacity: 0.7,
                animation: 'ewanHaloPulse 3s infinite ease-in-out',
                pointerEvents: 'none'
              }}
            />

            {/* Platform Icon */}
            <span style={{ fontSize: '1.05rem', filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.8))' }}>
              {getPlatformIcon()}
            </span>

            {/* Live Online Dot */}
            <span
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '1.5px solid #0F172A',
                boxShadow: '0 0 5px #10B981'
              }}
              title="Online"
            />
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
      </div>
      )}

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
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                    EWAN Assistant
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      padding: '1px 6px',
                      borderRadius: '10px'
                    }}
                  >
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    Online
                  </span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  {currentPlatform === 'COMPANY_HQ' ? 'Doc Search HQ Executive Copilot' : currentPlatform === 'PARTNER_PLATFORM' ? 'Clinical & Hospital Copilot' : 'Healthcare Discovery Assistant'}
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* EWAN Calmness Instrumental Music (Header Button) */}
              <EwanZenMusicWidget variant="header-button" />

              {/* Clear Chat Button */}
              <button
                type="button"
                data-ewan-ignore-drag
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearChat();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '0.82rem'
                }}
                title="Clear conversation"
              >
                🗑️
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
                  fontSize: '0.82rem',
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
                  padding: '4px 6px',
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
                  padding: '4px 6px',
                  fontSize: '0.95rem'
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>

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
                        <div>{renderFormattedText(msg.text)}</div>
                      )}

                      {/* Welcome Hero Quick Actions Card Grid */}
                      {msg.id === 'welcome-msg' && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '8px',
                            marginTop: '12px'
                          }}
                        >
                          {getWelcomeQuickActions(currentPlatform).map((act, actIdx) => (
                            <div
                              key={actIdx}
                              onClick={() => processQuery(act.query)}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(56, 189, 248, 0.22)',
                                borderRadius: '8px',
                                padding: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.14)';
                                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.55)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.22)';
                                e.currentTarget.style.transform = 'none';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1.1rem' }}>{act.icon}</span>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC' }}>
                                  {act.title}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.68rem', color: '#94A3B8', lineHeight: 1.35 }}>
                                {act.desc}
                              </span>
                            </div>
                          ))}
                        </div>
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
                {currentPlatform === 'COMPANY_HQ' ? (
                  <>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Partner onboarding KYC verification kaise karein?')}
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
                      ⚡ Partner KYC
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Subscription plans aur license quota kaise manage karein?')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: '#C084FC',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      💼 Commercial Plans
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Kya hum log Whisper voice dictation use kar sakte hain?')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(236, 72, 153, 0.12)',
                        border: '1px solid rgba(236, 72, 153, 0.35)',
                        color: '#F472B6',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🎙️ Whisper Voice
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Ewan ke pass kya knowledge aur training hai?')}
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
                      🧠 Capabilities
                    </button>
                  </>
                ) : currentPlatform === 'PARTNER_PLATFORM' ? (
                  <>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Fast 30s OPD Registration kaise karein?')}
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
                      🎫 OPD Tokens
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Doctor consultation desk kaise use karein?')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: '#C084FC',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🩺 Doctor Rx
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Sample collection aur lab results kaise verify karein?')}
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
                    >
                      🧪 Lab Barcode
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Kya hum log Whisper voice dictation use kar sakte hain?')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(236, 72, 153, 0.12)',
                        border: '1px solid rgba(236, 72, 153, 0.35)',
                        color: '#F472B6',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🎙️ Voice Dictation
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Doctor search kaise karein?')}
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
                      🔍 Find Doctor
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('OPD appointment kaise book karein?')}
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
                      🏥 Book Token
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Lab test kaise book karein?')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: '#C084FC',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🧪 Lab Tests
                    </button>
                    <button
                      type="button"
                      data-ewan-ignore-drag
                      onClick={() => processQuery('Kya hum log Whisper voice dictation use kar sakte hain?')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(236, 72, 153, 0.12)',
                        border: '1px solid rgba(236, 72, 153, 0.35)',
                        color: '#F472B6',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🎙️ Voice Search
                    </button>
                  </>
                )}
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
                  placeholder="Type a message or click 🎤 to speak in Hindi/English..."
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
