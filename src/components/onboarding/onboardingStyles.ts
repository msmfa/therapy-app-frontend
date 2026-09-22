import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { BRAND_FONTS } from 'designs/designs-typography';
import type { Theme } from 'designs/designs-themes';
import { useTheme } from '../../context/theme';

/** Surfaces and type shared with the notes editor and reminder cards. */
/** The corner radius every onboarding card shares. */
export const CARD_RADIUS = 26;

export const makeOnboardingStyles = (theme: Theme) => StyleSheet.create({
    card: {
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: theme.surface.cardBorder,
        // The lit top edge that lifts a card off a ground it is barely lighter
        // than. Equal to the border by day, so nothing changes there.
        borderTopColor: theme.surface.cardEdge,
        backgroundColor: theme.surface.card,
        shadowColor: theme.surface.cardShadow,
        shadowOffset: theme.scheme === 'dark' ? theme.surface.shadowOffset : { width: 0, height: 8 },
        shadowOpacity: theme.surface.cardShadowOpacity,
        shadowRadius: theme.scheme === 'dark' ? theme.surface.shadowRadius : 20,
        elevation: 3,
    },
    headline: {
        fontFamily: 'DMSans-Bold',
        fontWeight: undefined,
        fontSize: 32,
        lineHeight: 39,
        letterSpacing: -0.7,
        color: theme.ink.primary,
    },
    title: {
        fontFamily: BRAND_FONTS.medium,
        fontWeight: undefined,
        color: theme.ink.primary,
    },
    body: {
        fontFamily: BRAND_FONTS.regular,
        fontWeight: undefined,
        color: theme.ink.secondary,
        fontSize: 16,
        lineHeight: 25,
    },
    /**
     * A link's label: the link colour, body weight, never underlined. The
     * colour and the trailing arrow every link draws carry it together, so the
     * affordance still survives for anyone who cannot separate the colour from
     * the sentence around it.
     */
    linkLabel: {
        fontFamily: BRAND_FONTS.regular,
        fontWeight: undefined,
        color: theme.link.color,
    },
});

/**
 * The same surfaces and type on the accent ground.
 *
 * Applied on top of the base styles, never instead of them, so the metrics
 * (radius, size, leading, letterspacing) stay defined in exactly one place and
 * only the colours change with the surface.
 */
export const makeOnboardingAccentStyles = (theme: Theme) => StyleSheet.create({
    card: {
        borderColor: theme.accentScreen.cardBorder,
        borderTopColor: theme.accentScreen.cardEdge,
        backgroundColor: theme.accentScreen.card,
        // The light surface's card lifts off the page with a blue glow. On the
        // accent ground there is nothing paler behind it for a glow to fall on,
        // so the card is held by its border alone.
        shadowOpacity: 0,
        elevation: 0,
    },
    headline: {
        color: theme.accentScreen.textPrimary,
    },
    title: {
        color: theme.accentScreen.textPrimary,
    },
    body: {
        color: theme.accentScreen.textSecondary,
    },
});

export type OnboardingStyles = {
    onboardingStyles: ReturnType<typeof makeOnboardingStyles>;
    onboardingAccentStyles: ReturnType<typeof makeOnboardingAccentStyles>;
    /** One colour for every tappable piece of text in onboarding, and the arrow after it. */
    linkColor: string;
};

/** The shared onboarding sheets, built for the active theme. */
export function useOnboardingStyles(): OnboardingStyles {
    const { theme } = useTheme();
    return useMemo(() => ({
        onboardingStyles: makeOnboardingStyles(theme),
        onboardingAccentStyles: makeOnboardingAccentStyles(theme),
        linkColor: theme.link.color,
    }), [theme]);
}
