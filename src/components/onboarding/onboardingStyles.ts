import { StyleSheet } from 'react-native';
import { PALETTE, TEXT_COLORS } from 'designs/designs-colors';
import { BRAND_FONTS } from 'designs/designs-typography';

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
});
