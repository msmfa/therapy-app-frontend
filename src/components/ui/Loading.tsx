import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PALETTE, SURFACE_BLUE } from 'designs/designs-colors';
import DancingSquare from './PulsingSquare';
import { useTranslation } from 'react-i18next';

type LoadingProps = {
    fullScreen?: boolean;
    transparent?: boolean;
};

export default function Loading({
    fullScreen = true,
    transparent = false,
}: LoadingProps) {
    const { t } = useTranslation('common');
    // These loaders belong to their screen. Presenting a native modal during
    // auth/entitlement transitions can compete with iOS authentication sheets
    // and can cover the current tab when an unfocused tab hydrates.
    return (
        <View style={ [
            fullScreen ? styles.screen : styles.container,
            fullScreen && !transparent && styles.opaqueScreen,
        ] }>
            <View
                style={ [styles.spinnerContainer, fullScreen && styles.fullScreenContainer] }
                pointerEvents="auto"
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={ t('a11y.loading') }
                accessibilityState={ { busy: true } }
            >
                <DancingSquare />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    // The app's own ground, not white. This is the screen the launch splash
    // hands over to, and a white one made the boot read as two steps: the
    // splash, then a white flash, then the pale blue the app is actually on.
    opaqueScreen: {
        backgroundColor: SURFACE_BLUE,
    },
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: PALETTE.overlay.taupeTransparent,
        paddingHorizontal: 24,
    },
    fullScreenContainer: {
        flex: 1,
    },
});
