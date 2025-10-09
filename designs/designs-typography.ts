import { TEXT_COLORS } from './designs-colors';

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
