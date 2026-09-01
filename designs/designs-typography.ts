import { TEXT_COLORS } from './designs-colors';

// General Sans, used on the reminder carousel's cards. React Native picks a
// custom font by family name rather than by weight, so every weight is its own
// family, and a style that names one leaves fontWeight off: setting both makes
// Android synthesise a bold on top of an already-bold file.
export const BRAND_FONTS = {
  regular: 'GeneralSans-Regular',
  medium: 'GeneralSans-Medium',
  semibold: 'GeneralSans-Semibold',
  bold: 'GeneralSans-Bold',
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: TEXT_COLORS.primary,
    lineHeight: 24,
  },
  h2: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 24,
    color: TEXT_COLORS.primary,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: TEXT_COLORS.primary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: TEXT_COLORS.secondary,
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: TEXT_COLORS.secondary,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: TEXT_COLORS.secondary,
  },
} as const;
