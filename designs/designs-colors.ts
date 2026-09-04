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
    light: `hsl(0, 70%, 85%)`,
    mid: `hsl(0, 75%, 45%)`,
    dark: `hsl(0, 75%, 35%)`,
    default: 'hsla(0, 64%, 51%, 1.00)',

    primary: 'hsla(0, 64%, 51%, 1.00)',
    secondary: 'hsla(0, 64%, 61%, 1.00)',
    tertiary: 'hsla(0, 64%, 68%, 1.00)',
    quaternary: 'hsla(0, 64%, 75%, 1.00)',
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

// The pale blue the app settles on: the last stop of APP_GRADIENT, the tab
// bar's ground, and the calendar's bottom sheet. Declared here so the gradient
// and the calendar discs cannot drift apart.
export const SURFACE_BLUE = 'hsl(206.67, 17.65%, 90.00%)';

// The same tone at zero alpha. A gradient fading to `transparent` interpolates
// through black on the way, which reads as a grey smear over pale ground, so
// edge fades run to this instead.
export const SURFACE_BLUE_FADE = 'hsla(206.67, 17.65%, 90.00%, 0)';

// The action orange, taken straight off the design: the mean of the 117 core
// pixels of its orange dots, ignoring the antialiased fringe. Carries the
// session discs and the calendar's buttons.
export const ACTION_ORANGE = '#E26D31';

/** Deep blue for the radio's ring and dot. */
export const ACTION_BLUE_DARK = 'hsl(222, 70%, 26%)';

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
  // A disabled primary sits on the pale app background, where a white-tinted
  // outline disappears entirely. These two keep it visible while still reading
  // as unavailable.
  disabledSurface: 'hsla(0, 0%, 0%, 0.05)',
  disabledText: COLOR_VARIANTS.black.quaternary,
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
  activeSessionBackground: 'hsla(0, 78%, 80%, 1)',
  activeSessionBorder: COLOR_VARIANTS.red.quaternary,
  activeSessionText: COLOR_VARIANTS.red.default,
  scheduledBackground: 'hsla(0, 74%, 84%, 0.98)',
  scheduledText: COLOR_VARIANTS.red.default,
  pressedText: COLOR_VARIANTS.red.default,
  unscheduledBackground: 'hsla(0, 82%, 93%, 0.69)',
  calendarDayDefault: COLOR_VARIANTS.black.secondary,
  calendarDayDisabled: 'hsla(0, 0%, 0%, 0.150)',
  calendarMonthText: COLOR_VARIANTS.black.secondary,
  calendarWeekdayHeader: 'hsla(0, 0%, 0%, 0.30)',
  arrows: COLOR_VARIANTS.black.secondary,
  reminderBackground: 'rgba(167, 202, 201, 0.96)',
  reminderBorder: 'rgba(37, 96, 88, 0.44)',
  reminderText: 'rgb(37, 96, 88)',
  dotIndicator: 'rgb(37, 96, 88)',
  modalOverlayTransparent: 'rgba(0, 0, 0, 0.54)',
  modalSurface: SURFACE_BLUE,
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
    taupeTransparent: 'hsla(0.00, 0.00%, 88.00%, 0.99)',
  },
} as const;

export const COMPONENT_COLORS = {
  settingsRowBackground: SETTINGS_ROW_BACKGROUND,
  glassBackground: GLASS_BACKGROUND,
  scienceBadgeBorder: SCIENCE_BADGE_BORDER,
} as const;


// The calendar surface. The month sits straight on the app background rather
// than on a card, so every colour here has to hold up against the pale
// blue-to-grey backdrop.
export const CALENDAR_DARK_COLORS = {
  monthText: 'hsl(240, 8%, 16%)',
  weekdayHeader: 'hsla(240, 8%, 16%, 0.55)',
  dayDefault: 'hsla(240, 8%, 16%, 0.88)',
  dayDisabled: 'hsla(240, 8%, 16%, 0.24)',
  arrows: 'hsla(240, 8%, 16%, 0.70)',
  // Days are marked by three dots under the numeral rather than a disc behind
  // it: orange for a therapy session, blue for a reminder.
  sessionDot: ACTION_ORANGE,
  reminderDot: 'hsl(226, 62%, 48%)',
  // Today is the one solid disc in the month, so it reads before the dots do.
  todayBackground: 'hsl(240, 8%, 10%)',
  todayText: 'hsl(0, 0%, 78%)',
  // Press feedback on a day that is neither a session nor a reminder.
  pressedBackground: 'hsla(240, 8%, 16%, 0.10)',
  pressedText: 'hsl(240, 8%, 16%)',
  // The design's numerals are regular weight inside the discs as well as out.
  dayFontWeight: '400',
} as const;
