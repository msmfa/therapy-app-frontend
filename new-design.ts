const hue = {
  primary: 220,   // Blue
  success: 142,   // Green
  warning: 38,    // Orange
  error: 0,       // Red
};

// const BLUE_GRADIENT_VARIATIONS = {
//   lagoon: [
//     'hsl(217.00, 84.00%, 52.00%)',
//     'hsl(213.00, 78.00%, 60.00%)',
//     'hsl(209.00, 68.00%, 70.00%)',
//     'hsl(206.00, 60.00%, 80.00%)',
//     'hsl(203.00, 52.00%, 88.00%)',
//     'hsl(200.00, 44.00%, 92.00%)',
//   ] as const,
//   midnight: [
//     'hsl(228.00, 74.00%, 40.00%)',
//     'hsl(224.00, 68.00%, 48.00%)',
//     'hsl(220.00, 60.00%, 58.00%)',
//     'hsl(216.00, 54.00%, 70.00%)',
//     'hsl(210.00, 48.00%, 82.00%)',
//     'hsl(205.00, 42.00%, 90.00%)',
//   ] as const,
//   glacier: [
//     'hsl(202.00, 68.00%, 60.00%)',
//     'hsl(198.00, 62.00%, 68.00%)',
//     'hsl(194.00, 56.00%, 76.00%)',
//     'hsl(190.00, 48.00%, 84.00%)',
//     'hsl(186.00, 40.00%, 90.00%)',
//     'hsl(182.00, 34.00%, 94.00%)',
//   ] as const,
//   mist: [
//     'hsl(210.00, 42.00%, 58.00%)',
//     'hsl(208.00, 38.00%, 66.00%)',
//     'hsl(206.00, 32.00%, 74.00%)',
//     'hsl(204.00, 26.00%, 82.00%)',
//     'hsl(202.00, 22.00%, 88.00%)',
//     'hsl(200.00, 18.00%, 92.00%)',
//   ] as const,
//   fjord: [
//     'hsl(214.00, 36.00%, 52.00%)',
//     'hsl(212.00, 32.00%, 60.00%)',
//     'hsl(210.00, 28.00%, 70.00%)',
//     'hsl(208.00, 24.00%, 78.00%)',
//     'hsl(206.00, 20.00%, 86.00%)',
//     'hsl(204.00, 16.00%, 92.00%)',
//   ] as const,
//   moonlit: [
//     'hsl(222.00, 34.00%, 46.00%)',
//     'hsl(220.00, 30.00%, 56.00%)',
//     'hsl(218.00, 26.00%, 66.00%)',
//     'hsl(216.00, 22.00%, 76.00%)',
//     'hsl(214.00, 18.00%, 86.00%)',
//     'hsl(212.00, 14.00%, 92.00%)',
//   ] as const,
//   powder: [
//     'hsl(198.00, 38.00%, 64.00%)',
//     'hsl(196.00, 32.00%, 72.00%)',
//     'hsl(194.00, 28.00%, 78.00%)',
//     'hsl(192.00, 24.00%, 84.00%)',
//     'hsl(190.00, 20.00%, 90.00%)',
//     'hsl(188.00, 16.00%, 94.00%)',
//   ] as const,
//   overcast: [
//     'hsl(214.00, 28.00%, 54.00%)',
//     'hsl(212.00, 24.00%, 62.00%)',
//     'hsl(210.00, 22.00%, 70.00%)',
//     'hsl(208.00, 20.00%, 78.00%)',
//     'hsl(206.00, 18.00%, 86.00%)',
//     'hsl(204.00, 16.00%, 94.00%)',
//   ] as const,
//   drift: [
//     'hsl(202.00, 26.00%, 58.00%)',
//     'hsl(201.00, 24.00%, 64.00%)',
//     'hsl(200.00, 22.00%, 72.00%)',
//     'hsl(199.00, 20.00%, 80.00%)',
//     'hsl(198.00, 18.00%, 88.00%)',
//     'hsl(197.00, 16.00%, 96.00%)',
//   ] as const,
//   stillwater: [
//     'hsl(220.00, 24.00%, 52.00%)',
//     'hsl(218.00, 22.00%, 60.00%)',
//     'hsl(216.00, 20.00%, 68.00%)',
//     'hsl(214.00, 18.00%, 76.00%)',
//     'hsl(212.00, 16.00%, 84.00%)',
//     'hsl(210.00, 14.00%, 92.00%)',
//   ] as const,
// } as const;

// const PINK_GRADIENT_VARIATIONS = {
//   blush: [
//     'hsl(354.00, 92.00%, 70.00%)',
//     'hsl(355.00, 80.00%, 78.00%)',
//     'hsl(356.00, 68.00%, 82.00%)',
//     'hsl(2.00, 48.00%, 88.00%)',
//     'hsl(8.00, 36.00%, 92.00%)',
//     'hsl(12.00, 28.00%, 95.00%)',
//   ] as const,
//   rosewater: [
//     'hsl(352.00, 88.00%, 74.00%)',
//     'hsl(350.00, 76.00%, 80.00%)',
//     'hsl(348.00, 62.00%, 84.00%)',
//     'hsl(344.00, 46.00%, 88.00%)',
//     'hsl(340.00, 34.00%, 92.00%)',
//     'hsl(336.00, 28.00%, 95.00%)',
//   ] as const,
//   peony: [
//     'hsl(6.00, 90.00%, 72.00%)',
//     'hsl(8.00, 78.00%, 80.00%)',
//     'hsl(10.00, 64.00%, 84.00%)',
//     'hsl(14.00, 48.00%, 88.00%)',
//     'hsl(18.00, 36.00%, 92.00%)',
//     'hsl(22.00, 28.00%, 95.00%)',
//   ] as const,
//   petal: [
//     'hsl(8.00, 46.00%, 70.00%)',
//     'hsl(10.00, 40.00%, 78.00%)',
//     'hsl(12.00, 34.00%, 82.00%)',
//     'hsl(14.00, 28.00%, 86.00%)',
//     'hsl(16.00, 24.00%, 90.00%)',
//     'hsl(18.00, 20.00%, 94.00%)',
//   ] as const,
//   dawn: [
//     'hsl(4.00, 36.00%, 68.00%)',
//     'hsl(6.00, 32.00%, 76.00%)',
//     'hsl(8.00, 28.00%, 80.00%)',
//     'hsl(10.00, 24.00%, 86.00%)',
//     'hsl(12.00, 20.00%, 90.00%)',
//     'hsl(14.00, 18.00%, 94.00%)',
//   ] as const,
//   chiffon: [
//     'hsl(0.00, 32.00%, 72.00%)',
//     'hsl(2.00, 28.00%, 78.00%)',
//     'hsl(4.00, 24.00%, 82.00%)',
//     'hsl(6.00, 20.00%, 86.00%)',
//     'hsl(8.00, 18.00%, 90.00%)',
//     'hsl(10.00, 16.00%, 94.00%)',
//   ] as const,
//   porcelain: [
//     'hsl(356.00, 28.00%, 74.00%)',
//     'hsl(358.00, 24.00%, 80.00%)',
//     'hsl(0.00, 22.00%, 84.00%)',
//     'hsl(2.00, 20.00%, 88.00%)',
//     'hsl(4.00, 18.00%, 92.00%)',
//     'hsl(6.00, 16.00%, 95.00%)',
//   ] as const,
//   ballet: [
//     'hsl(6.00, 30.00%, 68.00%)',
//     'hsl(7.00, 26.00%, 74.00%)',
//     'hsl(8.00, 24.00%, 80.00%)',
//     'hsl(9.00, 22.00%, 86.00%)',
//     'hsl(10.00, 20.00%, 92.00%)',
//     'hsl(11.00, 18.00%, 96.00%)',
//   ] as const,
//   shell: [
//     'hsl(4.00, 24.00%, 70.00%)',
//     'hsl(5.00, 22.00%, 76.00%)',
//     'hsl(6.00, 20.00%, 82.00%)',
//     'hsl(7.00, 18.00%, 88.00%)',
//     'hsl(8.00, 16.00%, 94.00%)',
//     'hsl(9.00, 14.00%, 97.00%)',
//   ] as const,
//   linen: [
//     'hsl(2.00, 18.00%, 72.00%)',
//     'hsl(3.00, 16.00%, 78.00%)',
//     'hsl(4.00, 14.00%, 84.00%)',
//     'hsl(5.00, 12.00%, 90.00%)',
//     'hsl(6.00, 10.00%, 95.00%)',
//     'hsl(7.00, 8.00%, 97.00%)',
//   ] as const,
// } as const;

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
  textDisabled: 'hsl(0, 0%, 60%)',

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
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
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
