import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useOAuthLogin } from '../../auth/useOAuthLogin';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';
import AppText from '../ui/AppText';
import Spacer, { SpacerVariant } from '../ui/Spacer';

interface Props {
    onSuccess?: () => void;
    disabled?: boolean;
}

// The original FontAwesome 4.7 Apple glyph, drawn directly so this compact
// control does not depend on an asynchronously loaded icon font.
// Source: https://github.com/FortAwesome/Font-Awesome/blob/v4.7.0/fonts/fontawesome-webfont.svg
const APPLE_MARK_PATH = 'M1393 321q-39 -125 -123 -250q-129 -196 -257 -196q-49 0 -140 32q-86 32 -151 32q-61 0 -142 -33q-81 -34 -132 -34q-152 0 -301 259q-147 261 -147 503q0 228 113 374q113 144 284 144q72 0 177 -30q104 -30 138 -30q45 0 143 34q102 34 173 34q119 0 213 -65q52 -36 104 -100q-79 -67 -114 -118q-65 -94 -65 -207q0 -124 69 -223t158 -126zM1017 1494q0 -61 -29 -136q-30 -75 -93 -138q-54 -54 -108 -72q-37 -11 -104 -17q3 149 78 257q74 107 250 148q1 -3 2.5 -11t2.5 -11q0 -4 0.5 -10t0.5 -10z';

export const SocialAuthButtons: React.FC<Props> = ({ onSuccess, disabled = false }) => {
    const { appleAvailable, loadingProvider, signInWithApple } =
        useOAuthLogin(onSuccess);

    const appleLoading = loadingProvider === 'apple';
    const appleDisabled = appleLoading || disabled;

    if (!appleAvailable) return null;

    return (
        <View style={ styles.section }>
            <Spacer variant={ SpacerVariant.large } />
            <AppText variant="caption" align="center">
                Or continue with
            </AppText>
            <Spacer variant={ SpacerVariant.large } />
            <View style={ styles.buttonRow }>
                <TouchableOpacity
                    onPress={ signInWithApple }
                    style={ [styles.button, appleDisabled && styles.disabledButton] }
                    disabled={ appleDisabled }
                    accessibilityLabel="Continue with Apple"
                    accessibilityRole="button"
                    accessibilityState={ { disabled: appleDisabled, busy: appleLoading } }
                >
                    { appleLoading ? (
                        <ActivityIndicator
                            color={ COLOR_VARIANTS.black.primary }
                            accessibilityLabel="Signing in with Apple"
                        />
                    ) : (
                        <Svg
                            width={ 26 }
                            height={ 26 }
                            viewBox="0 0 1408 1792"
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                        >
                            <Path
                                d={ APPLE_MARK_PATH }
                                transform="translate(0 1536) scale(1 -1)"
                                fill={ COLOR_VARIANTS.black.primary }
                            />
                        </Svg>
                    ) }
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        width: '100%',
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: PALETTE.overlay.whiteSoftTransparent,
        backgroundColor: PALETTE.overlay.whiteSoftTransparent,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default SocialAuthButtons;
