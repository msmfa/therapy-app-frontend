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
    /**
     * Hold the label to one line, shrinking the type if it will not fit.
     *
     * For the pair of legal links, which sit side by side. The English labels
     * fit at the caption size and the French ones do not: "Politique de
     * confidentialité" is twice the width of "Privacy Policy", and the row
     * wrapped into two lines with one link stranded underneath. Shrinking only
     * when needed keeps English at the size it was designed at, and means a
     * third language cannot break the row either.
     */
    fitOnOneLine?: boolean;
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
    fitOnOneLine = false,
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
                style={ [
                    onboardingStyles.linkLabel,
                    styles.label,
                    fitOnOneLine && styles.oneLineLabel,
                ] }
                numberOfLines={ fitOnOneLine ? 1 : undefined }
                adjustsFontSizeToFit={ fitOnOneLine }
                minimumFontScale={ fitOnOneLine ? 0.7 : undefined }
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
    oneLineLabel: {
        // Smaller than the caption default before any auto-shrinking, because
        // both of these labels are long in every language and the pair has one
        // row to share.
        fontSize: 12,
    },
    disabled: {
        opacity: 0.5,
    },
});
