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
 * The ground. The reference's panel runs from about 16% down to 10%, and its
 * shadows take that to 6%: a ground any darker than 9% leaves a black shadow
 * nothing to fall on, which is what happened at 6%. Same cool hue as the
 * light app's SURFACE_BLUE, taken down 81 points.
 */
export const NIGHT_GROUND = 'hsl(212, 14%, 9%)';
export const NIGHT_GROUND_FADE = 'hsla(212, 14%, 9%, 0)';
/** The ground in hex, for app.json's splash. */
export const NIGHT_GROUND_HEX = '#141719';

/**
 * The light app runs pink into pale blue, top to bottom. The night ground runs
 * lit into shadow instead: the reference's panel top down to its deepest
 * panel. The top sits at 12%: dark enough that the screen reads as the
 * reference's shadowed panel, with every ink still well clear of 4.5:1.
 */
export const NIGHT_GRADIENT = [
    'hsl(213, 12%, 12%)',
    'hsl(212, 13%, 11%)',
    'hsl(211, 14%, 10%)',
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
 * separates it is a lit top edge and a wide, soft, black shadow thrown down
 * and to the right. The surfaces are opaque charcoal rather than white at a
 * low alpha: iOS draws a layer's shadow from its alpha, so a translucent card
 * threw a translucent shadow, and the reference's are solid.
 */
export const NIGHT_SURFACE = {
    card: 'hsl(213, 10%, 14%)',
    cardBorder: 'hsla(0, 0%, 100%, 0.06)',
    // The same as the border: a brighter top edge blended into the darker
    // sides round every corner and read as a smear. The light comes from the
    // sheen instead.
    cardEdge: 'hsla(0, 0%, 100%, 0.06)',
    /**
     * Lit from the top-left corner. The face pools a little light there and
     * settles into the fill past the middle; the rim is brightest at that
     * corner and fades round to almost nothing at the bottom right, so the
     * edge reads as caught light rather than a drawn outline.
     */
    cardLight: {
        face: {
            colors: ['hsl(213, 10%, 17%)', 'hsl(213, 10%, 14%)', 'hsl(213, 10%, 13%)'] as const,
            locations: [0, 0.4, 1] as const,
        },
        rim: {
            colors: ['hsla(0, 0%, 100%, 0.22)', 'hsla(0, 0%, 100%, 0.08)', 'hsla(0, 0%, 100%, 0.03)'] as const,
            locations: [0, 0.4, 1] as const,
        },
    },
    cardShadow: 'hsl(0, 0%, 0%)',
    frostedShadow: 'hsl(0, 0%, 0%)',
    gradientCardShadow: 'hsl(0, 0%, 0%)',
    /** New-note field, social buttons, a chosen reference row. */
    soft: 'hsl(213, 10%, 12%)',
    /** Note card arrow disc, reminder rows. */
    medium: 'hsl(213, 9%, 18%)',
    /** A row inside a card: a hair above the card it sits in. */
    row: 'hsl(213, 9%, 16%)',
    rowBorder: 'hsla(0, 0%, 100%, 0.06)',
    /** A group of rows inside a card: the same lift as a row, bordered like a card. */
    rowGroup: 'hsl(213, 9%, 16%)',
    rowGroupBorder: 'hsla(0, 0%, 100%, 0.06)',
    /**
     * Things that sit below the surface: the meter's resting ticks, inactive
     * pagination dots. The reference's credit-limit track is a groove cut into
     * its panel, darker than what it sits on.
     */
    groove: 'hsla(0, 0%, 0%, 0.35)',
    /** Page-white screens become the reference's panel, one step up. */
    sheet: 'hsl(212, 9%, 13%)',
    /** Where a band on the sheet settles: a step back toward the ground. */
    sheetTint: 'hsl(212, 12%, 11%)',
    /** A page of reading: the card, since there is no white to be nearly. */
    readingCard: 'hsl(213, 10%, 14%)',
    /** A small grey pill. */
    chip: 'hsl(213, 9%, 21%)',
    /** A card over artwork or the timeline's rail: a brighter edge than the shared one. */
    cardHighlight: 'hsla(0, 0%, 100%, 0.18)',
    /**
     * The lit rim round a solid object: a dark pill, the mock notification.
     * The reference's buttons are black with a hairline of light along the
     * top that fades down the sides; this is that hairline, as a gradient
     * drawn just outside the object.
     */
    lightRim: ['hsla(0, 0%, 100%, 0.45)', 'hsla(0, 0%, 100%, 0.05)'] as const,
    /** Alert and error modals, the schedule sheet: one step up again. */
    modal: 'hsl(214, 9%, 15%)',
    /** A little heavier than the day's, so a sheet still separates from the ground under it. */
    scrim: 'rgba(0, 0, 0, 0.66)',
    sheetCard: 'hsl(213, 10%, 14%)',
    sheetCardBorder: 'hsla(0, 0%, 100%, 0.08)',
    field: 'hsl(213, 10%, 11%)',
    fieldBorder: 'hsla(0, 0%, 100%, 0.14)',
    fieldBorderFocused: 'hsl(210, 19%, 94%)',
    disabledLight: 'hsla(0, 0%, 100%, 0.10)',
    spinnerWell: 'hsla(212, 9%, 14%, 0.99)',
    glass: 'rgba(255, 255, 255, 0.03)',
    /** A tinted card at night is a faint wash of the hue over the charcoal. */
    tinted: (hue: number) => `hsla(${hue}, 40%, 60%, 0.14)`,
    tintedBorder: (hue: number) => `hsla(${hue}, 40%, 65%, 0.28)`,
    /** GradientCard with no hue: a step lighter than the ground, a step under the card. */
    tintCard: 'hsl(213, 10%, 12%)',
    tintCardBorder: 'hsla(0, 0%, 100%, 0.06)',
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

/** The night's one mark colour: a light grey, for rings and the chosen disc, drawn flat. */
export const NIGHT_MARK = 'hsl(214, 8%, 72%)';

/**
 * The radio. By day it is a frosted pill with a deep blue ring; at night the
 * chosen pill takes the chosen plan's orange, see-through like the rest, and
 * its dot the orange the night sets sentences in, so the choice reads the
 * way a chosen plan does.
 */
export const NIGHT_RADIO = {
    ring: 'hsl(22, 90%, 68%)',
    ringUnselected: 'hsla(0, 0%, 100%, 0.16)',
    selectedFill: 'hsla(19, 64%, 42%, 0.32)',
    selectedBorder: 'hsla(26, 100%, 78%, 0.4)',
    unselectedFill: 'hsla(220, 70%, 62%, 0.04)',
    unselectedBorder: 'hsla(220, 70%, 72%, 0.14)',
    well: 'hsla(0, 0%, 100%, 0.07)',
    sheen: ['hsla(0, 0%, 100%, 0.06)', 'hsla(0, 0%, 100%, 0)'] as const,
} as const;

/**
 * The solid pill stays dark: the reference's buttons are black objects held
 * off the panel by a lit rim (NIGHT_SURFACE.lightRim) rather than by being a
 * different colour. Near-black, with the primary ink on it (13:1).
 */
export const NIGHT_SOLID = {
    background: 'hsl(212, 14%, 4%)',
    border: 'hsla(0, 0%, 100%, 0.22)',
    text: NIGHT_INK.primary,
    disabledSurface: 'hsla(0, 0%, 100%, 0.04)',
    disabledBorder: 'hsla(0, 0%, 100%, 0.12)',
    disabledText: NIGHT_INK.quaternary,
} as const;

/**
 * The shape behind the glass. By day it is a red circle that the glass blurs
 * into a glow; at night it is a shadow, a soft near-black blob that the glass
 * blurs into the deeper dark the reference's panels sit in. The hologram from
 * the reference's corner was tried here and read as a purple lamp.
 */
export const NIGHT_SWEEP = ['hsl(212, 14%, 2%)', 'hsl(212, 12%, 7%)'] as const;



/**
 * The day's blue, taken as dark as the charcoal allows: any deeper and it
 * drops under 4.5:1 on a card at the top. 4.9:1 there as it stands.
 */
export const NIGHT_LINK = 'hsl(216, 80%, 62%)';
export const NIGHT_LINK_PRESSED = 'hsl(216, 70%, 50%)';

/**
 * The brand orange's jobs at night. The reference has no orange, so a fill
 * becomes the panel charcoal and the emphasis it carried moves to a lit rule
 * along its top; a chosen card is that panel with a light grey ring. Only
 * ACTION_ORANGE survives, as the small marks that carry meaning.
 */
export const NIGHT_ACCENT = {
    mark: ACTION_ORANGE,
    markSurface: 'hsla(0, 0%, 100%, 0.06)',
    /** Orange as a sentence: 7.9:1 on the ground. */
    markInk: 'hsl(22, 90%, 68%)',
    panel: 'hsl(214, 8%, 19%)',
    panelEdge: 'hsl(214, 8%, 23%)',
    chosenFill: 'hsl(214, 8%, 21%)',
    /** The chosen card: the same corner light as the others, turned up a step, with a brighter rim. */
    chosenLight: {
        face: {
            colors: ['hsl(213, 9%, 25%)', 'hsl(213, 9%, 21%)', 'hsl(213, 9%, 19%)'] as const,
            locations: [0, 0.4, 1] as const,
        },
        rim: {
            colors: ['hsla(0, 0%, 100%, 0.45)', 'hsla(0, 0%, 100%, 0.16)', 'hsla(0, 0%, 100%, 0.06)'] as const,
            locations: [0, 0.4, 1] as const,
        },
    },
} as const;

/**
 * The accent screen: the reference's panel, with a shadow pooled behind the
 * notes screenshot so the screenshot is the lit object and the ground no
 * longer competes with it. White reads at 15:1, so the screen affords its card
 * and its 0.92 secondary ink with room to spare.
 */
/**
 * The one orange that survives at night as a surface: the chosen plan, and
 * with it the things that share its job of standing out from the charcoal,
 * the privacy promise, the tester's quote, the example-dates band and the
 * action that starts the flow. Banked from the brand orange so it marks
 * without lighting the screen, but not so far that it goes brown; the pale
 * ink clears 5:1 on it, and 4.5:1 on the lit corner.
 */
export const NIGHT_PLAN = {
    fill: 'hsl(19, 64%, 42%)',
    border: 'hsla(26, 100%, 78%, 0.55)',
    /**
     * The bright edge round the start action: a hot orange, pale along the
     * top and deepening down the sides, drawn just outside the fill.
     */
    rim: ['hsl(32, 100%, 76%)', 'hsl(16, 100%, 54%)'] as const,
    /** The same corner light as the charcoal cards, in the orange, with a peach rim. */
    light: {
        face: {
            colors: ['hsl(19, 64%, 44%)', 'hsl(19, 64%, 42%)', 'hsl(19, 64%, 40%)'] as const,
            locations: [0, 0.4, 1] as const,
        },
        rim: {
            colors: ['hsla(28, 100%, 85%, 0.65)', 'hsla(28, 100%, 85%, 0.25)', 'hsla(28, 100%, 85%, 0.08)'] as const,
            locations: [0, 0.4, 1] as const,
        },
    },
} as const;

export const NIGHT_ACCENT_SCREEN = {
    ground: 'hsl(213, 10%, 11%)',
    textPrimary: 'hsl(0, 0%, 100%)',
    // Full white, not the day's 0.92: on the orange's lit corner the softer
    // white fell just under 4.5:1, and there is no darker orange to give back.
    textSecondary: 'hsl(0, 0%, 100%)',
    /** The privacy promise: the plan's orange, lit the same way. */
    card: NIGHT_PLAN.fill,
    cardBorder: NIGHT_PLAN.border,
    cardEdge: NIGHT_PLAN.border,
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
 * The month grid. The near-black ink family mirrors to the near-white one;
 * today is still the one solid disc in the month, a mid grey that lifts off
 * the grid without glaring, and the reminder dot is a blue lifted for a dark
 * ground (5.4:1). The session disc is unchanged: white on it was already
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
    todayBackground: 'hsl(214, 8%, 30%)',
    todayText: NIGHT_INK.primary,
    reminderDotOnToday: 'hsl(232, 70%, 78%)',
    sessionFill: '#CC4500',
    // The day's warm white: the warmest that holds 4.5:1 on this disc.
    sessionFillText: '#FFF9F5',
    pressedBackground: 'hsla(210, 19%, 94%, 0.10)',
    pressedText: NIGHT_INK.primary,
    dayFontWeight: '400',
} as const;

/**
 * The calendar's backdrop: a sheet lifted just off the ground, fading out
 * down the month the way the light one does, with a shadow pooled at its top
 * where the day's version has a blue glow.
 */
export const NIGHT_CALENDAR_BACKDROP_BASE = [
    'hsla(210, 10%, 70%, 0.08)',
    'hsla(210, 10%, 70%, 0.06)',
    'hsla(210, 10%, 70%, 0.04)',
    'hsla(210, 10%, 70%, 0.03)',
] as const;

export const NIGHT_CALENDAR_BACKDROP_GLOW = [
    'hsla(0, 0%, 0%, 0.45)',
    'hsla(0, 0%, 0%, 0.15)',
    'hsla(0, 0%, 0%, 0)',
] as const;

/** The schedule sheet: the panel, under a slightly heavier scrim. */
export const NIGHT_CALENDAR_SHEET = {
    surface: NIGHT_SURFACE.modal,
    border: 'hsla(0, 0%, 100%, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.66)',
    // The day's blue, kept faint so it tints the sheet rather than lighting it.
    glow: ['hsla(222, 70%, 58%, 0.18)', 'hsla(222, 70%, 58%, 0.06)', 'hsla(222, 70%, 58%, 0)'] as const,
} as const;

/**
 * The next-event cards at night: the sheet card's grey lit from the top-left
 * and settling a touch bluer, with the foot band a step lighter again.
 */
export const NIGHT_CALENDAR_EVENT_CARD = {
    ground: [NIGHT_GROUND, 'hsl(216, 16%, 11%)'] as const,
    groundFade: 'hsla(216, 16%, 11%, 0)',
    fill: ['hsl(213, 10%, 17%)', 'hsl(215, 14%, 12%)'] as const,
    fillTranslucent: ['hsla(213, 10%, 17%, 0.35)', 'hsla(215, 14%, 12%, 0.28)'] as const,
    border: 'hsla(0, 0%, 100%, 0.08)',
    footer: 'hsla(0, 0%, 100%, 0.02)',
    footerRule: 'hsla(0, 0%, 100%, 0.06)',
    // The same lit blue as the day's, a step deeper so it does not glare.
    action: {
        fill: ['hsl(214, 80%, 58%)', 'hsl(222, 74%, 46%)'] as const,
        label: 'hsl(0, 0%, 100%)',
        rim: 'hsla(0, 0%, 100%, 0.22)',
        shadow: 'hsl(220, 90%, 50%)',
    },
} as const;

/**
 * The ground the reminder card's aura is painted on.
 *
 * At night it is flat: one charcoal, and no sunrise behind the dots. The
 * banked glow read as a smudge on a dark panel rather than as light, and the
 * dots are white on their own. The three stops stay the same value rather
 * than collapsing to one so the panel keeps its shape in the theme.
 */
export const NIGHT_AURA = {
    top: 'hsl(212, 12%, 13%)',
    mid: 'hsl(212, 12%, 13%)',
    bottom: 'hsl(212, 12%, 13%)',
    /** Unused while the glow is off, kept so the token stays whole. */
    core: 'hsl(20, 70%, 34%)',
    glowOpacity: 0,
} as const;

/**
 * The paper objects at night: the same sheets, printed on dark grained paper
 * (paper-*-dark.webp, made from the light textures), with a light ink where
 * the day's is navy.
 */
export const NIGHT_PAPER = {
    ink: 'hsl(210, 19%, 92%)',
    inkSoft: 'hsla(210, 19%, 92%, 0.68)',
    inkBody: 'hsla(210, 19%, 92%, 0.66)',
    inkMuted: 'hsla(210, 19%, 92%, 0.55)',
    rule: 'hsla(210, 19%, 92%, 0.18)',
    circle: 'hsla(0, 0%, 100%, 0.08)',
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
