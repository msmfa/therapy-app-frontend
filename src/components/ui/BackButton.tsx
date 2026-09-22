import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { GlassCircleButton } from './GlassCircleButton';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';

type Props = {
    /** Logical previous screen to use when this route has no navigation history. */
    fallbackHref?: Href;
    appearance?: 'plain' | 'glass';
};

/**
 * The visible way back on screens that hide their header.
 *
 * Onboarding and the auth screens both run headerless, so without this the only
 * way back is the iOS edge-swipe, which is undiscoverable and awkward under
 * VoiceOver. A resumed or deep-linked flow can make a later screen the root of
 * its stack, so callers can supply the logical previous route as a fallback.
 */
export function BackButton({ fallbackHref, appearance = 'plain' }: Props) {
    const router = useRouter();
    // Before the early return below: hooks cannot be called conditionally.
    const { t } = useTranslation('common');
    const { theme } = useTheme();
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

    if (appearance === 'glass') {
        return (
            <GlassCircleButton
                accessibilityLabel={ t('action.back') }
                icon="back"
                iconColor={ theme.ink.primary }
                size={ 48 }
                onPress={ handlePress }
            />
        );
    }

    return (
        <TouchableOpacity
            onPress={ handlePress }
            accessibilityRole="button"
            accessibilityLabel={ t('action.back') }
            style={ styles.button }
            activeOpacity={ 0.7 }
        >
            <Feather name="arrow-left" size={ 22 } color={ theme.ink.primary } />
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
