/**
 * The night palette: a counterpart for every export in designs-colors and
 * designs-gradients, sampled off the charcoal reference the palette was agreed
 * against (a neumorphic card interface, one cool charcoal at three depths, a
 * holographic corner as its only saturated colour).
 *
 * This is the primitive layer for the dark theme, the way designs-colors is
 * for the light one. Components never read it directly; designs-themes
 * assembles both into one shape and components read the theme.
 *
 * Every value here was checked against the worst case it will be read on: a
 * card at the top of the ground gradient, where the ground is lightest. The
 * ratios quoted are from that check.
 */

import { ACTION_ORANGE } from './designs-colors';

/**
 * The violet from the middle of the hologram (below), where one solid colour
 * is needed: the ring on a chosen card, the radio's dot.
 */
export const HOLOGRAM_VIOLET = 'hsl(259, 76%, 59%)';

/**
 * The ground. The reference's deepest panel is 6%; the app's sits at 10% so a
 * card lifted by 0.05 white still separates from it. Same cool hue as the
 * light app's SURFACE_BLUE, taken down 80 points.
 */
export const NIGHT_GROUND = 'hsl(212, 14%, 10%)';
export const NIGHT_GROUND_FADE = 'hsla(212, 14%, 10%, 0)';
/** The ground in hex, for app.json's splash. */
export const NIGHT_GROUND_HEX = '#16191D';

/**
 * The light app runs pink into pale blue, top to bottom. The night ground runs
 * lit into shadow instead: the reference's panel top down to its deepest
 * panel. Capped at 16% at the top, which is where a 66% grey stops clearing
 * 4.5:1 on a card; any lighter and body copy fails on the first card of a
 * screen.
 */
export const NIGHT_GRADIENT = [
    'hsl(213, 11%, 16%)',
    'hsl(212, 12%, 14%)',
    'hsl(211, 13%, 12%)',
    NIGHT_GROUND,
    NIGHT_GROUND,
    NIGHT_GROUND,
] as const;

/**
 * Ink. Primary is the reference's wordmark, #ECF0F2, kept off pure white so
 * headlines do not glare on OLED (13.0:1 on a card at the top). The greys are
 * the reference's #8D9195 lifted: 66% reads at 5.1:1 on a card at the top of
 * the gradient, 64% at 4.8:1, and 62% is the least that clears 4.5:1 there,
 * chosen the same way the light quaternary's 0.54 was.
 */
export const NIGHT_INK = {
    primary: 'hsl(210, 19%, 94%)',
    secondary: 'hsl(214, 5%, 66%)',
    tertiary: 'hsl(214, 5%, 64%)',
    quaternary: 'hsl(214, 5%, 62%)',
} as const;

/**
 * Surfaces. In the reference a card is barely lighter than its panel; what
 * separates it is a lit top edge and a deep shadow. So these are small: the
 * card is 0.05 white over the ground, its border 0.08 brightening to 0.14
 * along the top, and its shadow is black at 0.55 rather than the blue glow the
 * light cards wear, which has nothing pale to fall on at night.
 */
export const NIGHT_SURFACE = {
    card: 'hsla(0, 0%, 100%, 0.05)',
    cardBorder: 'hsla(0, 0%, 100%, 0.08)',
    cardEdge: 'hsla(0, 0%, 100%, 0.14)',
    cardShadow: 'hsla(0, 0%, 0%, 0.55)',
    frostedShadow: 'hsla(0, 0%, 0%, 0.45)',
    gradientCardShadow: 'hsla(0, 0%, 0%, 0.50)',
    /** New-note field, social buttons, a chosen reference row. */
    soft: 'hsla(0, 0%, 100%, 0.04)',
    /** Note card arrow disc, reminder rows. */
    medium: 'hsla(0, 0%, 100%, 0.10)',
    /** A row inside a card: a hair above the card it sits in. */
    row: 'hsla(0, 0%, 100%, 0.04)',
    rowBorder: 'hsla(0, 0%, 100%, 0.08)',
    /**
     * Things that sit below the surface: the meter's resting ticks, inactive
     * pagination dots. The reference's credit-limit track is a groove cut into
     * its panel, darker than what it sits on.
     */
    groove: 'hsla(0, 0%, 0%, 0.35)',
    /** Page-white screens become the reference's panel, one step up. */
    sheet: 'hsl(212, 9%, 14%)',
    /** Alert and error modals, the schedule sheet: one step up again. */
    modal: 'hsl(214, 9%, 16%)',
    sheetCard: 'hsla(0, 0%, 100%, 0.06)',
    sheetCardBorder: 'hsla(0, 0%, 100%, 0.10)',
    field: 'hsla(0, 0%, 100%, 0.04)',
    fieldBorder: 'hsla(0, 0%, 100%, 0.14)',
    fieldBorderFocused: 'hsl(210, 19%, 94%)',
    disabledLight: 'hsla(0, 0%, 100%, 0.10)',
    spinnerWell: 'hsla(212, 9%, 14%, 0.99)',
    glass: 'rgba(255, 255, 255, 0.03)',
    /** A tinted card at night is a faint wash of the hue over the charcoal. */
    tinted: (hue: number) => `hsla(${hue}, 40%, 60%, 0.14)`,
    tintedBorder: (hue: number) => `hsla(${hue}, 40%, 65%, 0.28)`,
} as const;

/**
 * The glass pill and disc. Same material as by day, lit from the same side,
 * less of it: the highlight gradient drops to a tenth, the rim keeps a lit top
 * edge, and the shade under the rim goes to black rather than navy.
 */
export const NIGHT_GLASS = {
    highlight: ['hsla(0, 0%, 100%, 0.10)', 'hsla(0, 0%, 100%, 0.02)'] as const,
    rim: '#ffffff',
    /** The specular stops keep their shape and lose two thirds of their light. */
    rimOpacity: 0.3,
    shade: '#000000',
} as const;

/**
 * The radio. By day it is a white box lifted off the sheet with a deep blue
 * ring; at night the box is the panel charcoal and the ring is the hologram's
 * violet, so the chosen option is marked the same way a chosen card is.
 */
export const NIGHT_RADIO = {
    ring: HOLOGRAM_VIOLET,
    ringUnselected: 'hsla(0, 0%, 100%, 0.16)',
    selectedFill: 'hsl(214, 8%, 24%)',
    selectedBorder: 'hsla(0, 0%, 100%, 0.16)',
    unselectedFill: 'hsla(0, 0%, 100%, 0.04)',
    unselectedBorder: 'hsla(0, 0%, 100%, 0.08)',
} as const;

/**
 * The solid pill inverts. A black pill on charcoal would vanish, so the two
 * moments that start something get a light pill with the ground's own ink on
 * it (11.9:1).
 */
export const NIGHT_SOLID = {
    background: NIGHT_INK.primary,
    text: 'hsl(212, 10%, 18%)',
    disabledSurface: 'hsla(0, 0%, 100%, 0.04)',
    disabledBorder: 'hsla(0, 0%, 100%, 0.12)',
    disabledText: NIGHT_INK.quaternary,
} as const;

/**
 * The hologram, sampled along the reference's corner from its pink edge into
 * the deep blue it dissolves into. The night app's one piece of colour that
 * is not a mark: the gradient circle behind the glass, the ring and disc on a
 * chosen option, the rule on an emphasised panel, the glow on the accent
 * screen.
 */
export const HOLOGRAM = ['#ECA8C0', '#7A49E6', '#4342C6', '#35429B', '#2F445E'] as const;


/** Its blue, lifted until it reads as type: 5.4:1 on a card at the top. */
export const NIGHT_LINK = 'hsl(248, 85%, 80%)';
export const NIGHT_LINK_PRESSED = 'hsl(248, 70%, 66%)';

/**
 * The brand orange's jobs at night. The reference has no orange, so a fill
 * becomes the panel charcoal and the emphasis it carried moves to a hologram
 * rule along its top; a chosen card is that panel with a violet ring. Only
 * ACTION_ORANGE survives, as the small marks that carry meaning.
 */
export const NIGHT_ACCENT = {
    mark: ACTION_ORANGE,
    markSurface: 'hsla(0, 0%, 100%, 0.06)',
    /** Orange as a sentence: 7.9:1 on the ground. */
    markInk: 'hsl(22, 90%, 68%)',
    panel: 'hsl(214, 8%, 22%)',
    panelEdge: 'hsl(214, 8%, 26%)',
    chosenFill: 'hsl(214, 8%, 24%)',
} as const;

/**
 * The accent screen: the reference's panel, with the hologram glowing behind
 * the notes screenshot so the screenshot is the lit object and the ground no
 * longer competes with it. White reads at 15:1, so the screen affords its card
 * and its 0.92 secondary ink with room to spare.
 */
export const NIGHT_ACCENT_SCREEN = {
    ground: 'hsl(213, 9%, 15%)',
    textPrimary: 'hsl(0, 0%, 100%)',
    textSecondary: 'hsla(0, 0%, 100%, 0.92)',
    card: 'hsla(0, 0%, 100%, 0.06)',
    cardBorder: 'hsla(0, 0%, 100%, 0.10)',
    cardEdge: 'hsla(0, 0%, 100%, 0.16)',
} as const;

/** Status colours, each checked on a card at the top of the gradient. */
export const NIGHT_STATUS = {
    success: 'hsl(142, 60%, 58%)',
    successLight: 'hsla(142, 60%, 50%, 0.14)',
    warning: 'hsl(38, 92%, 62%)',
    warningLight: 'hsla(38, 92%, 55%, 0.14)',
    error: 'hsl(0, 90%, 76%)',
    errorLight: 'hsla(0, 84%, 60%, 0.14)',
    /** A destructive button keeps a real red fill with white on it. */
    danger: 'hsl(0, 64%, 45%)',
    /** Red as an icon or a line of text: 5.1:1 on a card at the top. */
    dangerText: 'hsl(0, 80%, 74%)',
} as const;

export const NIGHT_RED = {
    light: 'hsla(0, 70%, 60%, 0.22)',
    mid: 'hsl(0, 80%, 70%)',
    dark: 'hsl(0, 80%, 78%)',
} as const;

export const NIGHT_GREEN_PANEL = {
    background: 'hsla(142, 60%, 45%, 0.16)',
    border: 'hsl(142, 45%, 42%)',
    text: 'hsl(142, 70%, 72%)',
} as const;

/**
 * The gradient circle behind the glass. The red one lit the light app; at
 * night it is the hologram, blurred by the same glass.
 */
export const NIGHT_CIRCLE = HOLOGRAM;

/**
 * The month grid. The near-black ink family mirrors to the near-white one;
 * today is still the one solid disc in the month, now the one light thing on
 * a dark grid, and the reminder dot takes the hologram's blue, lifted for a
 * dark ground (5.4:1). The session disc is unchanged: white on it was already
 * 4.75:1 and it reads on any ground.
 */
export const NIGHT_CALENDAR_MONTH = {
    monthText: NIGHT_INK.primary,
    weekdayHeader: 'hsla(210, 19%, 94%, 0.66)',
    dayDefault: 'hsla(210, 19%, 94%, 0.88)',
    dayDisabled: 'hsla(210, 19%, 94%, 0.30)',
    arrows: 'hsla(210, 19%, 94%, 0.70)',
    sessionDot: ACTION_ORANGE,
    reminderDot: 'hsl(232, 70%, 72%)',
    todayBackground: NIGHT_INK.primary,
    todayText: 'hsl(212, 10%, 12%)',
    reminderDotOnToday: 'hsl(240, 54%, 45%)',
    sessionFill: '#CC4500',
    sessionFillText: 'hsl(0, 0%, 100%)',
    pressedBackground: 'hsla(210, 19%, 94%, 0.10)',
    pressedText: NIGHT_INK.primary,
    dayFontWeight: '400',
} as const;

/**
 * The calendar's backdrop: a sheet lifted just off the ground, fading out
 * down the month the way the light one does, with the haze at its top taking
 * the hologram's violet instead of the day's blue.
 */
export const NIGHT_CALENDAR_BACKDROP_BASE = [
    'hsla(210, 10%, 70%, 0.08)',
    'hsla(210, 10%, 70%, 0.06)',
    'hsla(210, 10%, 70%, 0.04)',
    'hsla(210, 10%, 70%, 0.03)',
] as const;

export const NIGHT_CALENDAR_BACKDROP_GLOW = [
    'hsla(259, 60%, 55%, 0.16)',
    'hsla(259, 55%, 50%, 0.06)',
    'hsla(259, 50%, 45%, 0)',
] as const;

/** The schedule sheet: the panel, under a slightly heavier scrim. */
export const NIGHT_CALENDAR_SHEET = {
    surface: NIGHT_SURFACE.modal,
    border: 'hsla(0, 0%, 100%, 0.10)',
    overlay: 'rgba(0, 0, 0, 0.66)',
} as const;

/** ChartBackground's four rules: the same four steps off the ground. */
export const NIGHT_CHART = {
    rule: 'hsl(212, 8%, 20%)',
    trace: 'hsl(212, 8%, 22%)',
    marker: 'hsl(212, 8%, 25%)',
    label: 'hsl(212, 8%, 26%)',
} as const;

/** Hairlines flip sides: the dotted grid, the summary rule, the timeline track. */
export const NIGHT_HAIRLINE = 'hsla(0, 0%, 100%, 0.16)';
