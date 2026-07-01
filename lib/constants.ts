// GoalMind — Constants
// App-wide constants.

export const COLORS = {
  // Background
  bg: '#0a0a0a',
  bgSecondary: '#141414',
  bgTertiary: '#1e1e1e',
  
  // Text
  text: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textTertiary: '#525252',
  
  // Primary
  primary: '#10b981',
  primaryLight: '#34d399',
  primaryDark: '#059669',
  
  // Secondary
  secondary: '#6366f1',
  secondaryLight: '#818cf8',
  secondaryDark: '#4f46e5',
  
  // Accent
  accent: '#f59e0b',
  accentLight: '#fbbf24',
  accentDark: '#d97706',
  
  // Status
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border
  border: '#262626',
  borderLight: '#404040',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
  hero: 36,
} as const;

export const FONT_WEIGHT = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
