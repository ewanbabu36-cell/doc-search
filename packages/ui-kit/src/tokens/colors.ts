export const themes = {
  ADVANCE_PRO: 'theme-advance-pro',
  AURORA_GLOW: 'theme-aurora-glow',
  NORDIC_PURE: 'theme-nordic-pure',
  OCEANIC_NAVY: 'theme-oceanic-navy',
  AYUR_WELLNESS: 'theme-ayur-wellness',
  CYBER_SURGEON: 'theme-cyber-surgeon',
  ROSE_CARE: 'theme-rose-care',
  HEALTHCARE_LIGHT: 'theme-healthcare-light',
  BLACK_WHITE: 'theme-black-white'
} as const;

export type ThemeMode = (typeof themes)[keyof typeof themes];

export const colorVariables = {
  background: 'var(--ds-color-bg)',
  surface: 'var(--ds-color-surface)',
  surfaceSubtle: 'var(--ds-color-surface-subtle)',
  surfaceHover: 'var(--ds-color-surface-hover)',
  border: 'var(--ds-color-border)',
  borderStrong: 'var(--ds-color-border-strong)',
  textPrimary: 'var(--ds-color-text-primary)',
  textSecondary: 'var(--ds-color-text-secondary)',
  textMuted: 'var(--ds-color-text-muted)',
  primary: 'var(--ds-color-primary)',
  primaryHover: 'var(--ds-color-primary-hover)',
  primaryForeground: 'var(--ds-color-primary-foreground)',
  accent: 'var(--ds-color-accent)',
  accentHover: 'var(--ds-color-accent-hover)',
  accentForeground: 'var(--ds-color-accent-foreground)',
  danger: 'var(--ds-color-danger)',
  dangerForeground: 'var(--ds-color-danger-foreground)',
  warning: 'var(--ds-color-warning)',
  warningForeground: 'var(--ds-color-warning-foreground)',
  success: 'var(--ds-color-success)',
  successForeground: 'var(--ds-color-success-foreground)'
} as const;
