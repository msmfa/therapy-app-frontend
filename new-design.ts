const hue = {
  primary: 220,   // Blue
  success: 142,   // Green
  warning: 38,    // Orange
  error: 0,       // Red
};

const APP_GRADIENT = [
  'hsl(357.79, 100%, 73.33%)',
  'hsl(358.10, 77.78%, 84.12%)',
  'hsl(355.61, 57.75%, 86.08%)',
  'hsl(206.67, 17.65%, 90.00%)',
  'hsl(206.67, 17.65%, 90.00%)',
  'hsl(206.67, 17.65%, 90.00%)',
] as const;

const gradientStops = {
  top: APP_GRADIENT[0],
  mid: APP_GRADIENT[1],
  soft: APP_GRADIENT[2],
  bottom: APP_GRADIENT[APP_GRADIENT.length - 1],
} as const;

export const colors = {
  bg: 'hsl(0, 0%, 95%)',
  bgLight: 'hsl(0, 0%, 100%)',

  text: 'hsl(0, 0%, 5%)',
  textMuted: 'hsl(0, 0%, 30%)',

  borderLight: 'hsl(0, 0%, 90%)',

  success: `hsl(${hue.success}, 70%, 45%)`,
  successLight: `hsl(${hue.success}, 70%, 95%)`,

  warning: `hsl(${hue.warning}, 92%, 50%)`,
  warningLight: `hsl(${hue.warning}, 92%, 95%)`,

  error: `hsl(${hue.error}, 84%, 60%)`,
  errorLight: `hsl(${hue.error}, 84%, 95%)`,
};

export const typography = {
  h1: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 24,
  },
  h2: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.text,
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textMuted,
  },
};

const HSL_COLORS = {
  blue: 220,
  green: 142,
  red: 0,
};

export const COLOR_VARIANTS = {
  blue: {
    lightest: `hsl(${HSL_COLORS.blue}, 70%, 95%)`,
    light: `hsl(${HSL_COLORS.blue}, 70%, 90%)`,
    mid: `hsl(${HSL_COLORS.blue}, 70%, 60%)`,
    dark: `hsl(${HSL_COLORS.blue}, 70%, 40%)`,
  },
  green: {
    mid: `hsl(${HSL_COLORS.green}, 70%, 55%)`,
  },
  red: {
    light: `hsl(${HSL_COLORS.red}, 70%, 85%)`,
    mid: `hsl(${HSL_COLORS.red}, 75%, 45%)`,
    dark: `hsl(${HSL_COLORS.red}, 75%, 35%)`,
  },
  black: {
    mid: 'hsla(0, 0%, 30%, 1.00)',
    dark: 'hsl(0, 0%, 10%)',
  }
};

const clampHue = (value: number) => Math.max(0, Math.min(360, value));

export const palette = {
  neutral: {
    white: 'hsl(0, 0%, 100%)',
    black: 'hsl(0, 0%, 0%)',
    boundary: 'hsl(0, 0%, 80%)',
    transparentTransparent: 'hsla(0, 0%, 0%, 0)',
  },
  blue: {
    google: '#EA4335',
    ios: '#000000',
  },
  red: {
    deep: 'hsl(0.00, 75.00%, 6.27%)',
  },
  overlay: {
    whiteSoftTransparent: 'hsla(0.00, 0.00%, 100.00%, 0.22)',
    whiteMediumTransparent: 'hsla(0.00, 0.00%, 100.00%, 0.47)',
    whiteBorderTransparent: 'hsla(0.00, 0.00%, 100.00%, 0.23)',
    whiteSurfaceTransparent: 'hsla(0.00, 0.00%, 100.00%, 0.61)',
    blueGlowTransparent: 'hsla(210.89, 100.00%, 66.86%, 0.45)',
    navyGlowTransparent: 'hsla(210.93, 69.78%, 27.25%, 0.45)',
    blueMildTransparent: 'hsla(219.13, 66.67%, 72.94%, 0.25)',
    roseShadowTransparent: 'hsla(0.00, 22.29%, 65.69%, 0.35)',
    blackLightTransparent: 'hsla(0.00, 0.00%, 0.00%, 0.15)',
    taupeTransparent: 'hsla(0.00, 12.20%, 83.92%, 0.93)',
  },
  calendar: {
    calendarTodayBackground: 'hsl(0, 0%, 0%)',
    calendarTodayText: 'hsl(0, 0%, 100%)',
    calendarSessionBackground: 'hsl(0, 72%, 85%)',
    calendarSessionBorder: 'hsl(0, 72%, 75%)',
    calendarSessionText: 'hsl(0, 72%, 50%)',
    calendarDayText: 'hsl(0, 42%, 20%)',
    calendarDayDisabledText: 'hsl(0, 22%, 80%)',
    calendarMonthLabel: 'hsl(0, 12%, 10%)',
    calendarWeekdayLabel: 'hsl(0, 10%, 45%)',
    calendarDot: 'hsl(0, 72%, 50%)',
    calendarArrow: 'hsl(0, 0%, 30%)',
    calendarModalOverlayTransparent: 'hsla(0, 0%, 0%, 0.50)',
    calendarModalSurface: 'hsl(0, 0%, 100%)',
    calendarModalBorder: 'hsl(0, 0%, 80%)',
  },
};

export const surfaces = {
  gradientRow: {
    defaultBackground: 'hsla(0, 0%, 100%, 0.29)',
    defaultBorder: 'hsla(0, 0%, 100%, 0.21)',
    tintedBackground: (hueValue: number) => `hsla(${clampHue(hueValue)}, 70%, 90%, 0.35)`,
    tintedBorder: (hueValue: number) => `hsla(${clampHue(hueValue)}, 70%, 80%, 0.30)`,
  },
};

export const gradients = {
  appBackground: APP_GRADIENT,
  background: gradientStops,
} as const;
