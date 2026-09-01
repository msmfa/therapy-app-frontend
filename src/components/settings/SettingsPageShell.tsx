import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppText from '../ui/AppText';
import { GlassCircleButton } from '../ui/GlassCircleButton';
import { GlassMorphismWithCircle } from '../ui/GlassMorphismWithCircle';
import { CirclePosition } from '../ui/LinearGradientCircle';
import { COLOR_VARIANTS } from 'designs/designs-colors';

type Props = {
    children: React.ReactNode;
    /** Shown beside the back arrow. Omitted on the index, which has no arrow. */
    title?: string;
    onBack?: () => void;
};

// The frame every settings page shares, so a category page is visibly the same
// surface as the one that opened it rather than a screen of its own.
export function SettingsPageShell({ children, title, onBack }: Props) {
    return (
        <View style={ styles.container }>
            <View pointerEvents="none" style={ styles.background }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_LEFT } />
            </View>
            <SafeAreaView style={ styles.root }>
                { onBack ? (
                    <View style={ styles.header }>
                        <GlassCircleButton
                            accessibilityLabel="Back"
                            icon="back"
                            iconColor={ COLOR_VARIANTS.black.primary }
                            size={ 48 }
                            onPress={ onBack }
                        />
                        { title ? (
                            <AppText variant="h3" style={ styles.headerTitle }>
                                { title }
                            </AppText>
                        ) : null }
                    </View>
                ) : null }
                { children }
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: StyleSheet.absoluteFillObject,
    root: {
        flex: 1,
        paddingHorizontal: 12,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 14,
        paddingBottom: 24,
        paddingTop: 4,
    },
    headerTitle: {
        textTransform: 'uppercase',
    },
});
