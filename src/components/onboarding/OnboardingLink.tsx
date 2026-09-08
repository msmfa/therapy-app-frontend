import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { onboardingStyles, ONBOARDING_LINK_COLOR } from './onboardingStyles';

type Props = {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    /** `caption` for the dense legal and store rows; `body` everywhere else. */
    size?: 'body' | 'caption';
    accessibilityLabel?: string;
    accessibilityHint?: string;
    style?: StyleProp<ViewStyle>;
};

/**
 * Every tappable piece of text in onboarding.
 *
 * One appearance for all of them: bold deep blue with a trailing arrow and no
 * underline. Keeping the arrow inside the component rather than leaving it to
 * each caller is what stops the flow drifting back into a mix of underlined
 * and unmarked links.
 */
export function OnboardingLink({
    label,
    onPress,
    disabled = false,
    size = 'body',
    accessibilityLabel,
    accessibilityHint,
    style,
}: Props) {
    return (
        <TouchableOpacity
            onPress={ onPress }
            disabled={ disabled }
            activeOpacity={ 0.7 }
            accessibilityRole="link"
            accessibilityLabel={ accessibilityLabel ?? label }
            accessibilityHint={ accessibilityHint }
            accessibilityState={ { disabled } }
            style={ [styles.link, disabled && styles.disabled, style] }
        >
            <AppText
                variant={ size }
                style={ [onboardingStyles.linkLabel, styles.label] }
            >
                { label }
            </AppText>

            <Feather
                name="arrow-right"
                size={ size === 'caption' ? 16 : 18 }
                color={ ONBOARDING_LINK_COLOR }
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    link: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    label: {
        flexShrink: 1,
    },
    disabled: {
        opacity: 0.5,
    },
});
