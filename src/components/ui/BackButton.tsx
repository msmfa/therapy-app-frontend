import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { TEXT_COLORS } from 'designs/designs-colors';

type Props = {
    /** Logical previous screen to use when this route has no navigation history. */
    fallbackHref?: Href;
};

/**
 * The visible way back on screens that hide their header.
 *
 * Onboarding and the auth screens both run headerless, so without this the only
 * way back is the iOS edge-swipe, which is undiscoverable and awkward under
 * VoiceOver. A resumed or deep-linked flow can make a later screen the root of
 * its stack, so callers can supply the logical previous route as a fallback.
 */
export function BackButton({ fallbackHref }: Props) {
    const router = useRouter();
    const canGoBack = router.canGoBack();

    if (!canGoBack && fallbackHref === undefined) {
        return null;
    }

    const handlePress = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        if (fallbackHref !== undefined) {
            router.replace(fallbackHref);
        }
    };

    return (
        <TouchableOpacity
            onPress={ handlePress }
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={ styles.button }
            activeOpacity={ 0.7 }
        >
            <Feather name="arrow-left" size={ 22 } color={ TEXT_COLORS.primary } />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
});
