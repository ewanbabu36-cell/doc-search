export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem' // 80px
} as const;

export const radius = {
  none: '0px',
  xs: '0.125rem', // 2px
  sm: '0.25rem', // 4px
  base: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem', // 24px
  full: '9999px'
} as const;

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultraWide: '1536px'
} as const;

export const layoutPresets = {
  pagePadding: {
    mobile: spacing[4], // 16px
    desktop: spacing[6] // 24px
  },
  sectionGap: spacing[6], // 24px
  cardPadding: {
    sm: spacing[3], // 12px
    md: spacing[5], // 20px
    lg: '1.75rem' // 28px
  },
  formGap: spacing[4], // 16px
  buttonGap: spacing[2], // 8px
  modalPadding: spacing[6], // 24px
  tableCellPadding: {
    comfortable: '14px 16px',
    compact: '10px 12px',
    ultraDense: '6px 8px'
  }
} as const;
