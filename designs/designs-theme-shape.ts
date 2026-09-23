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

/**
 * A card lit from its top-left corner, the way the reference's dark panels
 * are: the face is a diagonal sweep from a lighter corner into the fill, and
 * the rim is a hairline of light round the edge that is brightest at that
 * corner and all but gone by the opposite one. `locations` place the stops
 * along the diagonal, so the light can pool in the corner rather than spread
 * evenly across the card.
 */
export type CardLight = {
    face: { colors: GradientStops; locations: readonly [number, number, ...number[]] };
    rim: { colors: GradientStops; locations: readonly [number, number, ...number[]] };
};
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
        /**
         * How an unchosen card is lit, or null for a flat card. The night's
         * cards take the reference's corner light; the day's card is one tint
         * with a plain border and needs none.
         */
        cardLight: CardLight | null;
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
        /** The round well at the option's leading end that the dot sits in. */
        well: string;
        /** The light down from the pill's top edge. */
        sheen: GradientStops;
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
        /**
         * How onboarding's solid actions are drawn. The ground's opposite by
         * day; at night the same glass as every other action, since a black
         * pill on the charcoal ground read as a hole cut in the page.
         */
        flowAction: 'solid' | 'glass';
        /** The one action that starts the flow: black by day, the plan's orange at night. */
        start: {
            background: string;
            text: string;
            /** A bright rim round the start action, or none: the orange lit along its edge at night. */
            rim: GradientStops | null;
        };
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
        /**
         * How a chosen card is lit, or null for a flat fill. At night the
         * chosen card is the same lit panel a step brighter, with a stronger
         * rim; by day it is the flat orange block.
         */
        light: CardLight | null;
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
        /** How the chosen plan card is lit, or null for the flat orange block. */
        light: CardLight | null;
        inkBright: string;
        inkBrightest: string;
        check: string;
        mark: GradientStops;
        iconDisc: string;
        trialFill: string;
        trialText: string;
    };

    /**
     * The tester's quote. By day the same orange block as the emphasis panel;
     * at night the chosen plan's orange, since the emphasis panel goes
     * charcoal there and a stranger's words have to stay the odd card out.
     */
    testimonial: {
        panel: string;
        ink: string;
        /** The attribution line, held back from the quotation. */
        inkMuted: string;
        light: CardLight | null;
    };

    /** The emphasised block: supporting banner, science summary. */
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
        /** How the accent screen's card is lit, or null for a flat card. */
        cardLight: CardLight | null;
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
            /** The blue light along the sheet's top, fading down into the surface; stops at the backdrop glow's locations. */
            glow: GradientStops;
        };
        /** The next-session and next-reminder cards under the month. */
        eventCard: {
            /** The ground the cards sit on, top to bottom. */
            ground: GradientStops;
            /** The ground's last stop at zero alpha, for the fade over the tab bar. */
            groundFade: string;
            /** The card's wash, top-left to bottom-right. */
            fill: GradientStops;
            /** The same wash thinned out, for cards on a sheet whose colour should come through. */
            fillTranslucent: GradientStops;
            border: string;
            /** The band along the card's foot, lighter than the card above it. */
            footer: string;
            /** The hard break between the reading and the band. */
            footerRule: string;
            /** The one action on a card: a lit blue pill that throws its own blue shadow. */
            action: {
                fill: GradientStops;
                label: string;
                /** The inner ring where the pill catches the light. */
                rim: string;
                shadow: string;
            };
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
