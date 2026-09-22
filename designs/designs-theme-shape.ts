/**
 * The shape both themes share.
 *
 * Semantic rather than primitive on purpose. In the light app the raw
 * COLOR_VARIANTS.black.* and white.* each do two jobs: black is ink except
 * where it is a shadow or a solid pill, white is a surface except where it is
 * the ink on orange. Those jobs part ways at night, so components read a name
 * for the job (ink, surface, shadow, solid) and each theme decides the colour.
 *
 * Every key exists in both themes with the same type; designs-themes has a
 * test that walks both and fails on any difference.
 */

export type ColorScheme = 'light' | 'dark';

export type GradientStops = readonly [string, string, ...string[]];
export type GradientLocations = readonly [number, number, ...number[]];

export type Theme = {
    scheme: ColorScheme;
    statusBar: 'light-content' | 'dark-content';

    ink: {
        primary: string;
        secondary: string;
        tertiary: string;
        quaternary: string;
    };

    ground: {
        /** The full-screen gradient behind everything. */
        gradient: GradientStops;
        /** The colour the gradient settles on: the tab ground, fades, the splash. */
        base: string;
        /** `base` at zero alpha, for edge fades that must not pass through black. */
        fade: string;
    };

    surface: {
        card: string;
        cardBorder: string;
        /** The card's top edge, where the light catches it. */
        cardEdge: string;
        cardShadow: string;
        frostedShadow: string;
        gradientCardShadow: string;
        soft: string;
        medium: string;
        row: string;
        rowBorder: string;
        /** Below the surface: meter tracks, inactive dots. */
        groove: string;
        /** An opaque page where the light app has a white one. */
        sheet: string;
        /** Alert and error modals, the schedule sheet. */
        modal: string;
        sheetCard: string;
        sheetCardBorder: string;
        field: string;
        fieldBorder: string;
        fieldBorderFocused: string;
        disabledLight: string;
        spinnerWell: string;
        tinted: (hue: number) => string;
        tintedBorder: (hue: number) => string;
    };

    glass: {
        tint: 'light' | 'dark';
        background: string;
        highlight: readonly [string, string];
        rim: string;
        shade: string;
    };

    /** Drop shadows are black in both themes; only surfaces change. */
    shadow: string;

    solid: {
        background: string;
        text: string;
        disabledSurface: string;
        disabledBorder: string;
        disabledText: string;
    };

    link: {
        color: string;
        pressed: string;
    };

    accent: {
        /** A small mark that carries meaning: a session disc, a tick. */
        mark: string;
        markSurface: string;
        markInk: string;
        /** The ring on a chosen option and the radio. */
        ring: string;
        /** The decorative sweep: the circle behind the glass. */
        sweep: GradientStops;
    };

    chosen: {
        fill: string;
        ink: string;
        inkSecondary: string;
        ring: string;
        /** The filled disc, drawn as a gradient so both themes take one path. */
        mark: GradientStops;
    };

    /** The emphasised block: supporting banner, science summary, quote card. */
    emphasis: {
        panel: string;
        /** A rule along the panel's top, or none. */
        rule: GradientStops | null;
        ink: string;
        inkSecondary: string;
    };

    accentScreen: {
        ground: string;
        textPrimary: string;
        textSecondary: string;
        card: string;
        cardBorder: string;
        cardEdge: string;
        /** A glow behind the screen's object, or none. */
        glow: GradientStops | null;
    };

    status: {
        success: string;
        successLight: string;
        warning: string;
        warningLight: string;
        error: string;
        errorLight: string;
        danger: string;
        dangerText: string;
    };

    badge: {
        fill: string;
        border: string;
        text: string;
    };

    trialBadge: {
        background: string;
        border: string;
        text: string;
    };

    calendar: {
        month: {
            monthText: string;
            weekdayHeader: string;
            dayDefault: string;
            dayDisabled: string;
            arrows: string;
            sessionDot: string;
            reminderDot: string;
            reminderDotOnToday: string;
            todayBackground: string;
            todayText: string;
            sessionFill: string;
            sessionFillText: string;
            pressedBackground: string;
            pressedText: string;
            dayFontWeight: '400';
        };
        backdrop: {
            base: GradientStops;
            baseLocations: GradientLocations;
            glow: GradientStops;
            glowLocations: GradientLocations;
            blurTint: 'light' | 'dark';
            blurIntensity: number;
        };
        sheet: {
            surface: string;
            border: string;
            overlay: string;
        };
    };

    chart: {
        rule: string;
        trace: string;
        marker: string;
        label: string;
    };

    hairline: string;

    navigation: {
        background: string;
        card: string;
        text: string;
        border: string;
    };
};
