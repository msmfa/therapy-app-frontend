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
        /**
         * How hard the card's shadow is thrown. The light shadow is a tinted
         * glow and stays soft; the dark one is what separates a card from a
         * ground it is barely lighter than, and has to be deep.
         */
        cardShadowOpacity: number;
        /** Where a lifted card's shadow falls, and how far it spreads. */
        shadowOffset: { width: number; height: number };
        shadowRadius: number;
        frostedShadow: string;
        gradientCardShadow: string;
        soft: string;
        medium: string;
        row: string;
        rowBorder: string;
        /** A group of rows inside a card: the language picker, the reminder times. */
        rowGroup: string;
        rowGroupBorder: string;
        /** Below the surface: meter tracks, inactive dots. */
        groove: string;
        /** An opaque page where the light app has a white one. */
        sheet: string;
        /** The sheet's tone at its deepest, for a band that settles into it. */
        sheetTint: string;
        /** A near-opaque card for a page of reading. */
        readingCard: string;
        /** A small grey pill: the plain plan badge. */
        chip: string;
        /** A card edge brighter than the shared one, for cards over artwork. */
        cardHighlight: string;
        /** A lit gradient rim round a solid object (a dark pill, the mock notification), or none. */
        lightRim: GradientStops | null;
        /** Alert and error modals, the schedule sheet. */
        modal: string;
        /** The dimming behind a modal. */
        scrim: string;
        sheetCard: string;
        sheetCardBorder: string;
        field: string;
        fieldBorder: string;
        fieldBorderFocused: string;
        disabledLight: string;
        spinnerWell: string;
        tinted: (hue: number) => string;
        tintedBorder: (hue: number) => string;
        /** GradientCard with no hue: a lighter wash than the card. */
        tintCard: string;
        tintCardBorder: string;
    };

    glass: {
        tint: 'light' | 'dark';
        background: string;
        highlight: readonly [string, string];
        /** The specular edge's colour, and how much of it there is. */
        rim: string;
        rimOpacity: number;
        shade: string;
        /** A disabled label on a glass pill. */
        disabledLabel: string;
    };

    radio: {
        ring: string;
        ringUnselected: string;
        selectedFill: string;
        selectedBorder: string;
        unselectedFill: string;
        unselectedBorder: string;
    };

    /** Drop shadows are black in both themes; only surfaces change. */
    shadow: string;

    solid: {
        background: string;
        border: string;
        text: string;
        disabledSurface: string;
        disabledBorder: string;
        disabledText: string;
    };

    link: {
        /** Onboarding's links: deep, set beside body copy. */
        color: string;
        pressed: string;
        /** The brighter inline link: citations, external and internal links. */
        bright: string;
        brightPressed: string;
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
        /** The chosen option's label: the warm ink on orange by day. */
        ink: string;
        /** A chosen plan card's reading inks, which sit lighter on the fill. */
        inkBright: string;
        inkBrightest: string;
        /** The card's own outline. */
        border: string;
        /** The radio's ring. */
        ring: string;
        /** The filled disc, drawn as a gradient so both themes take one path. */
        mark: GradientStops;
        /** The tick inside that disc. */
        check: string;
        /** The disc behind a timeline icon on a chosen card. */
        iconDisc: string;
        /** The trial badge on a chosen card. */
        trialFill: string;
        trialText: string;
    };

    /**
     * The chosen plan card. Orange in both themes: the one place the night
     * keeps the brand's fill, because a chosen plan is the flow's biggest
     * decision and the orange is what says so.
     */
    plan: {
        fill: string;
        border: string;
        inkBright: string;
        inkBrightest: string;
        check: string;
        mark: GradientStops;
        iconDisc: string;
        trialFill: string;
        trialText: string;
    };

    /** The emphasised block: supporting banner, science summary, quote card. */
    emphasis: {
        panel: string;
        /** A rule along the panel's top, or none. */
        rule: GradientStops | null;
        ink: string;
        inkSecondary: string;
        /** The attribution line on a quote, held back from the quotation. */
        inkMuted: string;
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

    /** The red family: a fill, a line, an ink. Badges, the step circles, error rows. */
    red: {
        light: string;
        mid: string;
        dark: string;
    };

    /** The reminder card's aura: the ground it is painted on, its core, and how much of the glow shows. */
    aura: {
        top: string;
        mid: string;
        bottom: string;
        core: string;
        glowOpacity: number;
    };

    /** The paper objects: the cheatsheet, the note sheet, the note editor. Their ink, on their paper. */
    paper: {
        ink: string;
        inkSoft: string;
        inkBody: string;
        inkMuted: string;
        rule: string;
        circle: string;
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
    /** Fainter still: the timeline's rail. */
    hairlineFaint: string;

    navigation: {
        background: string;
        card: string;
        text: string;
        border: string;
    };
};
