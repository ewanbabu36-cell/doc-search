export const elevation = {
  none: 'none',
  0: 'none',
  sm: 'var(--ds-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
  1: 'var(--ds-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
  base: 'var(--ds-shadow-base, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1))',
  2: 'var(--ds-shadow-base, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1))',
  md: 'var(--ds-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1))',
  3: 'var(--ds-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1))',
  lg: 'var(--ds-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1))',
  4: 'var(--ds-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1))',
  xl: 'var(--ds-shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1))',
  5: 'var(--ds-shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1))',
  modal: 'var(--ds-shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.5))'
} as const;

export const effectTokens = {
  focusRing: '0 0 0 3px var(--ds-color-focus-ring, rgba(14, 165, 233, 0.45))',
  activePress: 'scale(0.98)',
  specularEdge: 'var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.12))',
  specularEdgeSubtle: 'var(--ds-specular-edge-subtle, inset 0 0.5px 0 0 rgba(255, 255, 255, 0.08))',
  glassBlur: 'var(--ds-glass-blur, blur(24px) saturate(180%))',
  glowHalo: 'var(--ds-glow-halo, 0 4px 24px -2px rgba(2, 132, 199, 0.2))'
} as const;

export const motion = {
  durationFast: '120ms',
  durationNormal: '200ms',
  durationSlow: '350ms',
  easingStandard: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easingEmphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  transitionDurationDefault: '150ms',
  transitionTimingDefault: 'cubic-bezier(0.4, 0, 0.2, 1)'
} as const;

export const surfaceLevels = {
  l1: 'var(--ds-surface-l1, var(--ds-color-bg))',
  l2: 'var(--ds-surface-l2, var(--ds-color-surface-subtle))',
  l3: 'var(--ds-surface-l3, var(--ds-color-surface))',
  l4: 'var(--ds-surface-l4, rgba(24, 34, 52, 0.88))',
  l5: 'var(--ds-surface-l5, rgba(239, 68, 68, 0.12))'
} as const;

export const zIndexTokens = {
  background: 'var(--ds-z-background, -1)',
  ambient: 'var(--ds-z-ambient, 0)',
  shell: 'var(--ds-z-shell, 10)',
  content: 'var(--ds-z-content, 20)',
  dropdown: 'var(--ds-z-dropdown, 50)',
  popover: 'var(--ds-z-popover, 55)',
  fab: 'var(--ds-z-fab, 60)',
  drawer: 'var(--ds-z-drawer, 70)',
  modal: 'var(--ds-z-modal, 80)',
  criticalOverlay: 'var(--ds-z-critical-overlay, 100)'
} as const;


