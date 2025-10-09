const COLOR_HUES = {
  primary: 220, // Blue
  success: 142, // Green
  warning: 38,  // Orange
  error: 0,     // Red
} as const;

export const COLOR_VARIANTS = {
  blue: {
    lightest: `hsl(${COLOR_HUES.primary}, 70%, 95%)`,
    light: `hsl(${COLOR_HUES.primary}, 70%, 90%)`,
    mid: `hsl(${COLOR_HUES.primary}, 90%, 50%)`,
    dark: `hsl(${COLOR_HUES.primary}, 70%, 40%)`,
  },
  green: {
    mid: `hsl(${COLOR_HUES.success}, 70%, 55%)`,
  },
  red: {
    light: `hsl(${COLOR_HUES.error}, 70%, 85%)`,
    mid: `hsl(${COLOR_HUES.error}, 75%, 45%)`,
    dark: `hsl(${COLOR_HUES.error}, 75%, 35%)`,
    default: 'hsla(0, 64%, 51%, 1.00)',
  },
  black: {
    primary: 'hsl(0, 0%, 5%)',
    secondary: 'hsla(0, 0%, 0%, 0.70)',
    tertiary: 'hsla(0, 0%, 0%, 0.55)',
    quaternary: 'hsla(0, 0%, 0%, 0.40)',
  },
  white: {
    primary: 'hsl(0, 0%, 100%)',
    secondary: 'hsla(0, 0%, 100%, 0.70)',
    tertiary: 'hsla(0, 0%, 90%, 0.35)',
    quaternary: 'hsl(0, 0%, 80%)',
  },
  transparent: 'hsla(0, 0%, 0%, 0)',
} as const;

export const TEXT_COLORS = {
  primary: COLOR_VARIANTS.black.primary,
  secondary: COLOR_VARIANTS.black.secondary,
  tertiary: COLOR_VARIANTS.black.tertiary,
  quaternary: COLOR_VARIANTS.black.quaternary,
} as const;

export const BUTTON_COLORS = {
  primaryBackground: COLOR_VARIANTS.black.primary,
  primaryText: COLOR_VARIANTS.white.primary,
  secondaryBackground: COLOR_VARIANTS.transparent,
  secondaryText: COLOR_VARIANTS.black.primary,
  disabledBackground: COLOR_VARIANTS.transparent,
  disabledLight: COLOR_VARIANTS.white.tertiary,
  disabledDark: 'hsla(0, 0%, 0%, 0.15)',
} as const;

export const THEME_COLORS = {
  text: COLOR_VARIANTS.black.primary,
  success: `hsl(${COLOR_HUES.success}, 70%, 45%)`,
  successLight: `hsl(${COLOR_HUES.success}, 70%, 95%)`,
  warning: `hsl(${COLOR_HUES.warning}, 92%, 50%)`,
  warningLight: `hsl(${COLOR_HUES.warning}, 92%, 95%)`,
  error: `hsl(${COLOR_HUES.error}, 84%, 60%)`,
  errorLight: `hsl(${COLOR_HUES.error}, 84%, 95%)`,
} as const;

export const CALENDAR_COLORS = {
  todayBackground: COLOR_VARIANTS.black.primary,
  todayText: COLOR_VARIANTS.white.secondary,
  calendarSelectedBackground: COLOR_VARIANTS.black.primary,
  activeSessionBackground: 'hsla(0, 82%, 93%, 0.69)',
  activeSessionBorder: COLOR_VARIANTS.red.default,
  activeSessionText: COLOR_VARIANTS.red.default,
  scheduledBackground: 'hsla(0, 82%, 93%, 0.69)',
  scheduledText: COLOR_VARIANTS.red.default,
  pressedText: COLOR_VARIANTS.red.default,
  unscheduledBackground: 'hsla(0, 82%, 93%, 0.69)',
  calendarDayDefault: COLOR_VARIANTS.black.secondary,
  calendarDayDisabled: 'hsla(0, 0%, 0%, 0.150)',
  calendarMonthText: COLOR_VARIANTS.black.secondary,
  calendarWeekdayHeader: 'hsla(0, 0%, 0%, 0.30)',
  arrows: COLOR_VARIANTS.black.secondary,
  dotIndicator: COLOR_VARIANTS.red.default,
  modalOverlayTransparent: 'rgba(0, 0, 0, 0.54)',
  modalSurface: 'rgba(247, 250, 255, 1)',
  modalBorder: COLOR_VARIANTS.white.quaternary,
} as const;

const SETTINGS_ROW_BACKGROUND = 'hsla(0, 0%, 100%, 0.65)';
const GLASS_BACKGROUND = 'rgba(255, 255, 255, 0.15)';
const SCIENCE_BADGE_BORDER = 'rgba(74, 69, 69, 0.31)';

export const PALETTE = {
  neutral: {
    black: 'hsl(0, 0%, 0%)',
    boundary: COLOR_VARIANTS.white.quaternary,
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
    whiteSoftSurface: SETTINGS_ROW_BACKGROUND,
    blueGlowTransparent: 'hsla(210.89, 100.00%, 66.86%, 0.45)',
    blueMildTransparent: 'hsla(219.13, 66.67%, 72.94%, 0.25)',
    navyGlowTransparent: 'hsla(210.93, 69.78%, 27.25%, 0.45)',
    roseShadowTransparent: 'hsla(0.00, 22.29%, 65.69%, 0.35)',
    blackLightTransparent: 'hsla(0.00, 0.00%, 0.00%, 0.15)',
    taupeTransparent: 'hsla(0.00, 12.20%, 83.92%, 0.93)',
  },
} as const;

export const COMPONENT_COLORS = {
  settingsRowBackground: SETTINGS_ROW_BACKGROUND,
  glassBackground: GLASS_BACKGROUND,
  scienceBadgeBorder: SCIENCE_BADGE_BORDER,
} as const;
