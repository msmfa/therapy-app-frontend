import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Theme } from 'designs/designs-themes';
import DancingSquare from './PulsingSquare';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '../../context/theme';

type LoadingProps = {
    fullScreen?: boolean;
    transparent?: boolean;
};

export default function Loading({
    fullScreen = true,
    transparent = false,
}: LoadingProps) {
    const { t } = useTranslation('common');
    const styles = useThemedStyles(makeStyles);
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

const makeStyles = (theme: Theme) => StyleSheet.create({
    screen: {
        flex: 1,
    },
    // The app's own ground, not white. This is the screen the launch splash
    // hands over to, and a white one made the boot read as two steps: the
    // splash, then a white flash, then the ground the app is actually on.
    opaqueScreen: {
        backgroundColor: theme.ground.base,
    },
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.surface.spinnerWell,
        paddingHorizontal: 24,
    },
    fullScreenContainer: {
        flex: 1,
    },
});
