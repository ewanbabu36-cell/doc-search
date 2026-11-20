import React, { useState, useRef, useEffect } from 'react';
import { type Language } from '../i18n.js';
import { type DoctorReelDto, type ReelCategory } from '@docsearch/api-contracts';
import { doctorReelsService, REEL_CATEGORY_CONFIG } from '../services/doctor-reels-data.js';
import { nativeBridge } from '../services/native-bridge.js';

interface Props {
  language: Language;
  onBack: () => void;
  onBookDoctor: (doctorName: string, specialty: string) => void;
  initialReelId?: string | undefined;
}

export const DoctorHealthReelsScreen: React.FC<Props> = ({
  language,
  onBack,
  onBookDoctor,
  initialReelId
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReelCategory | 'ALL'>('ALL');
  const [reels, setReels] = useState<DoctorReelDto[]>(() => doctorReelsService.getReels(selectedCategory));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showDosDontsModal, setShowDosDontsModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Reload reels when category changes
  useEffect(() => {
    const list = doctorReelsService.getReels(selectedCategory);
    setReels(list);
    setCurrentIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  // Jump to initial reel if passed
  useEffect(() => {
    if (initialReelId && reels.length > 0) {
      const idx = reels.findIndex((r) => r.id === initialReelId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: idx * window.innerHeight,
            behavior: 'auto'
          });
        }
      }
    }
  }, [initialReelId]);

  // Handle scroll snap detection
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== currentIndex && index >= 0 && index < reels.length) {
      setCurrentIndex(index);
      setExpandedSummary(false);
      void nativeBridge.triggerHaptic(15);
    }
  };

  // Autoplay current active video and pause others
  useEffect(() => {
    videoRefs.current.forEach((videoEl, reelId) => {
      const isCurrent = reels[currentIndex]?.id === reelId;
      if (videoEl) {
        if (isCurrent && isPlaying) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      }
    });
  }, [currentIndex, isPlaying, reels]);

  const activeReel = reels[currentIndex] || reels[0];

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
    void nativeBridge.triggerHaptic(10);
  };

  const handleToggleLike = (reelId: string) => {
    const { isLiked } = doctorReelsService.toggleLike(reelId);
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          return {
            ...r,
            isLikedByPatient: isLiked,
            likesCount: r.likesCount + (isLiked ? 1 : -1)
          };
        }
        return r;
      })
    );
    void nativeBridge.triggerHaptic(isLiked ? 35 : 10);
  };

  const handleToggleSave = (reelId: string) => {
    const saved = doctorReelsService.toggleSave(reelId);
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          return { ...r, isSavedByPatient: saved };
        }
        return r;
      })
    );
    void nativeBridge.triggerHaptic(20);
  };

  const handleShare = (reel: DoctorReelDto) => {
    doctorReelsService.incrementShares(reel.id);
    const text = `🩺 *डॉक्टर स्वास्थ्य सलाह — ${reel.doctorName}*\n\n"${reel.title}"\n\n📌 मुख्य सुझाव:\n${reel.clinicalDos.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n👉 DocSearch ऐप पर डॉक्टर से परामर्श बुक करें: https://docsearch.health/reels/${reel.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text,
        url: `https://docsearch.health/reels/${reel.id}`
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3500);
    }
    void nativeBridge.triggerHaptic(25);
  };

  const handleBookFromReel = (reel: DoctorReelDto) => {
    doctorReelsService.recordConsultationBooking(reel.id);
    void nativeBridge.triggerHaptic(30);
    onBookDoctor(reel.doctorName, reel.doctorSpecialty);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* 1. TOP HEADER & CATEGORY CHIPS */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          padding: '12px 14px 18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                border: 'none',
                color: '#FFFFFF',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
              }}
              aria-label="Back to home"
            >
              ◂
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                  स्वास्थ्य शॉर्ट्स
                </span>
                <span style={{ backgroundColor: '#2563EB', color: '#FFF', fontSize: '0.625rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                  ✓ 100% DOCTOR VERIFIED
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                {language === 'hi' ? 'विशेषज्ञ डॉक्टरों द्वारा प्रमाणित सलाह' : 'Evidence-based Clinical Awareness'}
              </div>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Category Pills (Horizontal Scrolling) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: '2px'
          }}
        >
          {(Object.keys(REEL_CATEGORY_CONFIG) as Array<ReelCategory | 'ALL'>).map((catKey) => {
            const config = REEL_CATEGORY_CONFIG[catKey];
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: isSelected ? '#0284C7' : 'rgba(15, 23, 42, 0.75)',
                  color: isSelected ? '#FFFFFF' : '#CBD5E1',
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(6px)'
                }}
              >
                <span>{config.icon}</span>
                <span>{language === 'hi' ? config.labelHi : config.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. VERTICAL SNAP CONTAINER */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none'
        }}
      >
        {reels.map((reel, idx) => {
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={reel.id}
              onClick={handleTogglePlay}
              style={{
                position: 'relative',
                width: '100vw',
                height: '100dvh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                overflow: 'hidden',
                backgroundColor: '#070C16'
              }}
            >
              {/* Video Element */}
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(reel.id, el);
                  else videoRefs.current.delete(reel.id);
                }}
                src={reel.videoUrl}
                poster={reel.thumbnailUrl}
                playsInline
                loop
                muted={isMuted}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Pause Indicator Overlay */}
              {!isPlaying && isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    color: '#FFFFFF',
                    pointerEvents: 'none'
                  }}
                >
                  ▶
                </div>
              )}

              {/* Bottom Vignette Gradient */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.92) 100%)',
                  pointerEvents: 'none'
                }}
              />

              {/* RIGHT ENGAGEMENT ACTION COLUMN */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  right: '12px',
                  bottom: '120px',
                  zIndex: 35,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => handleToggleLike(reel.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    color: '#FFFFFF'
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: reel.isLikedByPatient ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.55)',
                      border: reel.isLikedByPatient ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}
                  >
                    {reel.isLikedByPatient ? '❤️' : '🤍'}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                    {reel.likesCount.toLocaleString()}
                  </span>
                </button>

                {/* Save to Vault */}
                <button
                  type="button"
                  onClick={() => handleToggleSave(reel.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    color: '#FFFFFF'
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: reel.isSavedByPatient ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.55)',
                      border: reel.isSavedByPatient ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem'
                    }}
                  >
                    {reel.isSavedByPatient ? '🔖' : '📑'}
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700 }}>
                    {reel.isSavedByPatient ? 'Saved' : 'Save'}
                  </span>
                </button>

                {/* WhatsApp Share Button */}
                <button
                  type="button"
                  onClick={() => handleShare(reel)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    color: '#FFFFFF'
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(37, 211, 102, 0.2)',
                      border: '1px solid rgba(37, 211, 102, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem'
                    }}
                  >
                    💬
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700 }}>
                    Share
                  </span>
                </button>

                {/* Clinical Do's & Don'ts Checklist Trigger */}
                <button
                  type="button"
                  onClick={() => setShowDosDontsModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    color: '#FFFFFF'
                  }}
                  title="View Doctor Rules"
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(56, 189, 248, 0.25)',
                      border: '1.5px solid #38BDF8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}
                  >
                    📋
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#38BDF8' }}>
                    Rules
                  </span>
                </button>
              </div>

              {/* LEFT BOTTOM METADATA & DOCTOR PROFILE */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: '14px',
                  right: '72px',
                  bottom: '72px',
                  zIndex: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Doctor Avatar & Identity Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={reel.doctorAvatarUrl}
                    alt={reel.doctorName}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '2px solid #38BDF8',
                      objectFit: 'cover'
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 900 }}>
                        {reel.doctorName}
                      </strong>
                      <span style={{ color: '#38BDF8', fontSize: '0.8rem' }} title="NMC Verified Specialist">
                        ✓
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>
                      {reel.doctorDegree} • <span style={{ color: '#93C5FD' }}>{reel.doctorSpecialty}</span>
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>
                      Reg: {reel.nmcRegistrationNumber} • {reel.hospitalName}
                    </div>
                  </div>
                </div>

                {/* Video Title */}
                <h2
                  style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#F8FAFC',
                    lineHeight: 1.35,
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                  }}
                >
                  {reel.title}
                </h2>

                {/* Expandable Clinical Summary */}
                <div style={{ fontSize: '0.78rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                  {expandedSummary ? (
                    <div>
                      <p style={{ margin: '0 0 4px 0' }}>{reel.summaryHindi}</p>
                      <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.72rem' }}>{reel.summaryEnglish}</p>
                      <button
                        type="button"
                        onClick={() => setExpandedSummary(false)}
                        style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.7rem', fontWeight: 700, padding: 0, marginTop: '2px', cursor: 'pointer' }}
                      >
                        कम देखें (Show less)
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span>{reel.summaryHindi.slice(0, 95)}... </span>
                      <button
                        type="button"
                        onClick={() => setExpandedSummary(true)}
                        style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.72rem', fontWeight: 800, padding: 0, cursor: 'pointer' }}
                      >
                        और पढ़ें (Read more)
                      </button>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {reel.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: '#67E8F9',
                        textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. HIGH-CONVERSION 1-TAP OPD BOOKING CTA BAR (BOTTOM OF SCREEN) */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: '12px',
                  right: '12px',
                  bottom: '12px',
                  zIndex: 35
                }}
              >
                <button
                  type="button"
                  onClick={() => handleBookFromReel(reel)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    backgroundColor: '#059669',
                    border: '1.5px solid #34D399',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 24px rgba(5, 150, 105, 0.45)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎟️</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ lineHeight: 1.2 }}>
                        {language === 'hi' ? `${reel.doctorName} से परामर्श लें` : `Consult with ${reel.doctorName}`}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#A7F3D0', fontWeight: 700 }}>
                        {reel.nextAvailableSlot} • OPD Fee: ₹{reel.opdConsultationFee}
                      </div>
                    </div>
                  </div>
                  <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {language === 'hi' ? 'टोकन बुक करें ➔' : 'Book OPD ➔'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. DO'S & DON'TS CLINICAL CHECKLIST BOTTOM SHEET MODAL */}
      {showDosDontsModal && activeReel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setShowDosDontsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0F172A',
              borderTop: '2px solid #38BDF8',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 32px 20px',
              color: '#F8FAFC',
              maxHeight: '80dvh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>📋</span>
                <strong style={{ fontSize: '1rem', color: '#38BDF8' }}>
                  {activeReel.doctorName} के 3 क्लिनिकल नियम
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setShowDosDontsModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            {/* DO's Section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span>✅</span>
                <span>क्या करें (CLINICAL DO'S):</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeReel.clinicalDos.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      fontSize: '0.8rem',
                      lineHeight: 1.45,
                      color: '#E2E8F0'
                    }}
                  >
                    • {item}
                  </div>
                ))}
              </div>
            </div>

            {/* DON'Ts Section */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F87171', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span>❌</span>
                <span>क्या न करें (CLINICAL DON'TS):</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeReel.clinicalDonts.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '0.8rem',
                      lineHeight: 1.45,
                      color: '#E2E8F0'
                    }}
                  >
                    • {item}
                  </div>
                ))}
              </div>
            </div>

            {/* NMC Advisory Note */}
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#1E293B', fontSize: '0.6875rem', color: '#94A3B8', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              🛡️ यह जानकारी केवल सार्वजनिक स्वास्थ्य जागरूकता के लिए है। आपातकालीन स्थिति में तुरंत अस्पताल पहुंचें।
            </div>
          </div>
        </div>
      )}

      {/* Share Toast */}
      {showShareToast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 800,
            zIndex: 150,
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
          }}
        >
          ✓ डॉक्टर का वीडियो लिंक कॉपी हो गया! WhatsApp पर शेयर करें।
        </div>
      )}
    </div>
  );
};
