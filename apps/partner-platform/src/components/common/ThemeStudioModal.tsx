import React, { useState } from 'react';
import { useTheme, themes, type ThemeMode } from '@docsearch/ui-kit';

export interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ThemeDescriptor {
  id: ThemeMode;
  name: string;
  category: 'NEXT_GEN' | 'CLASSIC';
  tag: string;
  description: string;
  icon: string;
  bgHex: string;
  surfaceHex: string;
  primaryHex: string;
  glowHex: string;
  borderHex: string;
  isLight?: boolean;
}

export const ALL_THEMES_METADATA: ThemeDescriptor[] = [
  // 6 Next-Gen Advanced Themes
  {
    id: themes.OBSIDIAN_TITANIUM,
    name: 'Obsidian Titanium',
    category: 'NEXT_GEN',
    tag: 'Apple VisionOS / Linear Stealth',
    description: 'Deep space obsidian with brushed titanium borders & cold cyan highlights. Zero eye-strain.',
    icon: '🌌',
    bgHex: '#030712',
    surfaceHex: '#111827',
    primaryHex: '#38BDF8',
    glowHex: '#0EA5E9',
    borderHex: '#1F2937'
  },
  {
    id: themes.IMPERIAL_GOLD,
    name: 'Imperial Gold',
    category: 'NEXT_GEN',
    tag: 'Swiss Private Hospital / 24K Sovereign',
    description: 'Rich velvet obsidian black with 24K champagne gold borders & warm amber under-glow.',
    icon: '👑',
    bgHex: '#08080A',
    surfaceHex: '#18140C',
    primaryHex: '#EAB308',
    glowHex: '#F59E0B',
    borderHex: 'rgba(234, 179, 8, 0.4)'
  },
  {
    id: themes.QUANTUM_BIOLUM,
    name: 'Quantum Biolum',
    category: 'NEXT_GEN',
    tag: 'MIT Genomic Biotech & Oceanic',
    description: 'Deep abyssal navy with bioluminescent radioactive mint & electric cyan cellular energy.',
    icon: '🧬',
    bgHex: '#020B14',
    surfaceHex: '#041A2F',
    primaryHex: '#00FF87',
    glowHex: '#00F0FF',
    borderHex: 'rgba(0, 240, 255, 0.35)'
  },
  {
    id: themes.TOKYO_CYBERPUNK,
    name: 'Tokyo Cyberpunk',
    category: 'NEXT_GEN',
    tag: 'Robotic Surgery & Neuromancer',
    description: 'Deep midnight neural base with high-voltage ultraviolet violet & laser hot-magenta.',
    icon: '⚡',
    bgHex: '#070414',
    surfaceHex: '#1A0C33',
    primaryHex: '#D946EF',
    glowHex: '#8B5CF6',
    borderHex: 'rgba(168, 85, 247, 0.4)'
  },
  {
    id: themes.SOLAR_AMBER,
    name: 'Solar Amber',
    category: 'NEXT_GEN',
    tag: 'Bloomberg Terminal & Solar Flare',
    description: 'Industrial matte carbon cockpit with phosphor warm amber & solar flare telemetry.',
    icon: '🔥',
    bgHex: '#0A0B0E',
    surfaceHex: '#1A140E',
    primaryHex: '#F97316',
    glowHex: '#F59E0B',
    borderHex: 'rgba(249, 115, 22, 0.4)'
  },
  {
    id: themes.SWISS_CLINICAL,
    name: 'Swiss Clinical 2.0',
    category: 'NEXT_GEN',
    tag: 'Dieter Rams / Sapphire Precision',
    description: 'Pure alabaster hospital white with surgical sapphire cobalt & razor-sharp Swiss typography.',
    icon: '🇨🇭',
    bgHex: '#F4F5F8',
    surfaceHex: '#FFFFFF',
    primaryHex: '#0052FF',
    glowHex: '#0EA5E9',
    borderHex: '#CBD5E1',
    isLight: true
  },
  // Classic Healthcare Themes
  {
    id: themes.ADVANCE_PRO,
    name: 'Advance Pro (Default)',
    category: 'CLASSIC',
    tag: 'Cyber-Medical Dark Standard',
    description: 'Original high-contrast cyber-medical dark slate with cyan beam & royal blue accents.',
    icon: '💻',
    bgHex: '#090E17',
    surfaceHex: '#101726',
    primaryHex: '#06B6D4',
    glowHex: '#3B82F6',
    borderHex: '#1E2C45'
  },
  {
    id: themes.AURORA_GLOW,
    name: 'Aurora Glow',
    category: 'CLASSIC',
    tag: 'Northern Lights 3D Glass',
    description: 'Emerald and cyan glowing polar aurora with translucent smoked glassmorphism.',
    icon: '🌲',
    bgHex: '#070C18',
    surfaceHex: '#0F172A',
    primaryHex: '#10B981',
    glowHex: '#06B6D4',
    borderHex: 'rgba(6, 182, 212, 0.3)'
  },
  {
    id: themes.NORDIC_PURE,
    name: 'Nordic Pure',
    category: 'CLASSIC',
    tag: 'Apple Health Minimalist Light',
    description: 'Clean Scandinavian hospital pure white with soft sky-blue and subtle stone borders.',
    icon: '🍏',
    bgHex: '#F8FAFC',
    surfaceHex: '#FFFFFF',
    primaryHex: '#0284C7',
    glowHex: '#6366F1',
    borderHex: '#E2E8F0',
    isLight: true
  },
  {
    id: themes.OCEANIC_NAVY,
    name: 'Oceanic Navy',
    category: 'CLASSIC',
    tag: 'Johns Hopkins Enterprise Navy',
    description: 'Authoritative deep maritime navy blue with sterile ice-cyan and steel borders.',
    icon: '🌊',
    bgHex: '#0B132B',
    surfaceHex: '#1C2541',
    primaryHex: '#48CAE4',
    glowHex: '#0077B6',
    borderHex: '#3A506B'
  },
  {
    id: themes.AYUR_WELLNESS,
    name: 'Ayur Wellness',
    category: 'CLASSIC',
    tag: 'Bio-Botanical Organic Sage',
    description: 'Holistic Ayurvedic deep spruce & sage green with soothing warm botanical accents.',
    icon: '🌿',
    bgHex: '#0B1A12',
    surfaceHex: '#13281E',
    primaryHex: '#10B981',
    glowHex: '#059669',
    borderHex: 'rgba(16, 185, 129, 0.3)'
  },
  {
    id: themes.CYBER_SURGEON,
    name: 'Cyber Surgeon',
    category: 'CLASSIC',
    tag: 'Robotic Surgical Theater',
    description: 'Deep twilight indigo-violet with neon robotic purple & laser precision contrast.',
    icon: '🤖',
    bgHex: '#0D081E',
    surfaceHex: '#1A1238',
    primaryHex: '#8B5CF6',
    glowHex: '#C084FC',
    borderHex: 'rgba(139, 92, 246, 0.35)'
  },
  {
    id: themes.ROSE_CARE,
    name: 'Rose Care',
    category: 'CLASSIC',
    tag: 'Maternity & Pediatrics Soft Rose',
    description: 'Compassionate deep berry wine with soft rose coral highlights for maternal care.',
    icon: '🌸',
    bgHex: '#1A0D15',
    surfaceHex: '#2E1524',
    primaryHex: '#F43F5E',
    glowHex: '#FB7185',
    borderHex: 'rgba(244, 63, 94, 0.35)'
  },
  {
    id: themes.HEALTHCARE_LIGHT,
    name: 'Healthcare Light',
    category: 'CLASSIC',
    tag: 'Classic Light / Hospital Clean',
    description: 'Standard clinical hospital clean light theme with soft slate borders and cerulean blue accents.',
    icon: '🏥',
    bgHex: '#F8FAFC',
    surfaceHex: '#FFFFFF',
    primaryHex: '#0284C7',
    glowHex: '#0369A1',
    borderHex: '#CBD5E1',
    isLight: true
  },
  {
    id: themes.BLACK_WHITE,
    name: 'OLED High Contrast',
    category: 'CLASSIC',
    tag: 'WCAG AAA OLED True Black',
    description: 'Zero battery drain true OLED black with 100% white clinical contrast for accessibility.',
    icon: '🌓',
    bgHex: '#000000',
    surfaceHex: '#121212',
    primaryHex: '#FFFFFF',
    glowHex: '#FFFFFF',
    borderHex: '#444444'
  }
];

export const ThemeStudioModal: React.FC<ThemeStudioModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [filter, setFilter] = useState<'ALL' | 'NEXT_GEN' | 'CLASSIC'>('NEXT_GEN');

  if (!isOpen) return null;

  const currentMeta = ALL_THEMES_METADATA.find((t) => t.id === theme) || ALL_THEMES_METADATA[0];

  const filteredThemes = ALL_THEMES_METADATA.filter((t) => {
    if (filter === 'ALL') return true;
    return t.category === filter;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0B1120',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '18px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.25)',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              🎨
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Enterprise Theme Studio
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.18)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  14 Visual Engines
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Currently Active: <strong style={{ color: currentMeta?.primaryHex }}>{currentMeta?.name}</strong> ({currentMeta?.tag})
              </p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="ds-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Cycle to next theme"
            >
              <span>↺</span>
              <span>Next Theme</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#0B132B',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={() => setFilter('NEXT_GEN')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: filter === 'NEXT_GEN' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: filter === 'NEXT_GEN' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: filter === 'NEXT_GEN' ? '#FFFFFF' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>✨ 6 Next-Gen Advance Themes</span>
            <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>(New)</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('CLASSIC')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: filter === 'CLASSIC' ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: filter === 'CLASSIC' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: filter === 'CLASSIC' ? '#FFFFFF' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🏥 Classic Healthcare</span>
            <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>(8)</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('ALL')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: filter === 'ALL' ? '1.5px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: filter === 'ALL' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: filter === 'ALL' ? '#FFFFFF' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>⚡ View All (14)</span>
          </button>
        </div>

        {/* Scrollable Theme Grid */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
            flex: 1
          }}
        >
          {filteredThemes.map((item) => {
            const isActive = theme === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setTheme(item.id)}
                className="ds-spotlight-card"
                data-card="true"
                style={{
                  backgroundColor: item.surfaceHex,
                  border: isActive ? `2px solid ${item.primaryHex}` : `1px solid ${item.borderHex}`,
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isActive ? `0 0 24px ${item.glowHex}40` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Conic Border Beam when Active */}
                {isActive && (
                  <div className="ds-border-beam-container">
                    <div className="ds-border-beam" />
                  </div>
                )}

                {/* Holographic Specular Sheen */}
                <span className="ds-holo-sheen" />

                {/* Top Row: Icon, Name & Active Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: item.bgHex,
                        border: `1px solid ${item.borderHex}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '0.925rem',
                          fontWeight: 800,
                          color: item.isLight ? '#0F172A' : '#F8FAFC'
                        }}
                      >
                        {item.name}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: item.primaryHex,
                          display: 'block',
                          marginTop: '2px'
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <span
                      style={{
                        backgroundColor: `${item.primaryHex}20`,
                        border: `1.5px solid ${item.primaryHex}`,
                        color: item.primaryHex,
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: item.primaryHex,
                          boxShadow: `0 0 6px ${item.primaryHex}`
                        }}
                      />
                      ACTIVE
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: '#64748B',
                        padding: '3px 6px'
                      }}
                    >
                      Select ➔
                    </span>
                  )}
                </div>

                {/* Description */}
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: item.isLight ? '#475569' : '#94A3B8',
                    lineHeight: 1.45,
                    zIndex: 2
                  }}
                >
                  {item.description}
                </p>

                {/* Palette Swatches & Live Preview Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: `1px solid ${item.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    zIndex: 2
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>PALETTE:</span>
                    <div
                      title="Background"
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: item.bgHex,
                        border: '1px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                      }}
                    />
                    <div
                      title="Surface Glass"
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: item.surfaceHex,
                        border: '1px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                      }}
                    />
                    <div
                      title="Primary Accent"
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: item.primaryHex,
                        boxShadow: `0 0 6px ${item.primaryHex}`
                      }}
                    />
                    <div
                      title="Neon Spotlight Glow"
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: item.glowHex,
                        boxShadow: `0 0 8px ${item.glowHex}`
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: item.primaryHex
                    }}
                  >
                    1-Click Apply
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#0F172A',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <span>
            💡 <strong>Pro Tip:</strong> Har theme hamare <strong>8-Layer Interaction Suite</strong> (3D Parallax Tilt, Laser Border Beam & Click Shockwaves) ke sath seamlessly blend hoti hai.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 18px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
