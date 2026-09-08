import { StyleSheet } from 'react-native';
import { ACTION_BLUE_DARK, ACCENT_SURFACE, PALETTE, TEXT_COLORS } from 'designs/designs-colors';
import { BRAND_FONTS } from 'designs/designs-typography';

/**
 * One colour for every tappable piece of text in onboarding, and for the arrow
 * that follows it. Deep blue rather than the body's near-black, so a link is
 * distinguishable from the sentence around it without an underline.
 */
export const ONBOARDING_LINK_COLOR = ACTION_BLUE_DARK;

/** Surfaces and type shared with the notes editor and reminder cards. */
export const onboardingStyles = StyleSheet.create({
    card: {
        borderRadius: 26,
        borderWidth: 1,
        borderColor: PALETTE.overlay.whiteBorderTransparent,
        backgroundColor: PALETTE.overlay.whiteSurfaceTransparent,
        shadowColor: PALETTE.overlay.blueGlowTransparent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 3,
    },
    headline: {
        fontFamily: 'DMSans-Bold',
        fontWeight: undefined,
        fontSize: 32,
        lineHeight: 39,
        letterSpacing: -0.7,
        color: TEXT_COLORS.primary,
    },
    title: {
        fontFamily: BRAND_FONTS.medium,
        fontWeight: undefined,
        color: TEXT_COLORS.primary,
    },
    body: {
        fontFamily: BRAND_FONTS.regular,
        fontWeight: undefined,
        color: TEXT_COLORS.secondary,
        fontSize: 16,
        lineHeight: 25,
    },
    /**
     * A link's label: deep blue, body weight, never underlined. The colour and
     * the trailing arrow every link draws carry it together, so the affordance
     * still survives for anyone who cannot separate the colour from the
     * sentence around it.
     */
    linkLabel: {
        fontFamily: BRAND_FONTS.regular,
        fontWeight: undefined,
        color: ONBOARDING_LINK_COLOR,
    },
});

/**
 * The same surfaces and type on the accent ground.
 *
 * Applied on top of `onboardingStyles`, never instead of it, so the metrics
 * (radius, size, leading, letterspacing) stay defined in exactly one place and
 * only the colours change with the surface.
 */
export const onboardingAccentStyles = StyleSheet.create({
    card: {
        borderColor: ACCENT_SURFACE.cardBorder,
        backgroundColor: ACCENT_SURFACE.cardBackground,
        // The light surface's card lifts off the page with a blue glow. On the
        // accent ground there is nothing paler behind it for a glow to fall on,
        // so the card is held by its border alone.
        shadowOpacity: 0,
        elevation: 0,
    },
    headline: {
        color: ACCENT_SURFACE.textPrimary,
    },
    title: {
        color: ACCENT_SURFACE.textPrimary,
    },
    body: {
        color: ACCENT_SURFACE.textSecondary,
    },
});
