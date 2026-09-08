import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';
import DancingSquare from './PulsingSquare';

type LoadingProps = {
    fullScreen?: boolean;
    transparent?: boolean;
};

export default function Loading({
    fullScreen = true,
    transparent = false,
}: LoadingProps) {
    // These loaders belong to their screen. Presenting a native modal during
    // auth/entitlement transitions can compete with iOS authentication sheets
    // and can cover the current tab when an unfocused tab hydrates.
    return (
        <View style={ [
            fullScreen ? styles.screen : styles.container,
            fullScreen && !transparent && styles.opaqueScreen,
        ] }>
            <View
                style={ styles.fullScreenContainer }
                pointerEvents="auto"
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel="Loading"
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
    opaqueScreen: {
        backgroundColor: COLOR_VARIANTS.white.primary,
    },
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: PALETTE.overlay.taupeTransparent,
        paddingHorizontal: 24,
    },
});
