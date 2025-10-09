import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useOAuthLogin } from '../../auth/useOAuthLogin';
import AppText from '../ui/AppText';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';

interface Props {
    onSuccess?: () => void;
}

export const SocialAuthButtons: React.FC<Props> = ({ onSuccess }) => {
    const { appleAvailable, googleConfigured, loadingProvider, signInWithApple, signInWithGoogle } =
        useOAuthLogin(onSuccess);

    const appleLoading = loadingProvider === 'apple';
    const googleLoading = loadingProvider === 'google';

    return (
        <View>
            <View style={ styles.buttonRow }>
                { appleAvailable && (
                    <TouchableOpacity
                        onPress={ signInWithApple }
                        style={ [styles.button, appleLoading && styles.disabledButton] }
                        disabled={ appleLoading }
                        accessibilityLabel="Continue with Apple"
                        accessibilityRole="button"
                    >
                        { appleLoading ? (
                            <ActivityIndicator color={ COLOR_VARIANTS.black.primary } />
                        ) : (
                            <FontAwesome name='apple' size={ 26 } color={ COLOR_VARIANTS.black.primary } />
                        ) }
                    </TouchableOpacity>
                ) }

                <TouchableOpacity
                    onPress={ signInWithGoogle }
                    style={ [styles.button, (!googleConfigured || googleLoading) && styles.disabledButton] }
                    disabled={ googleLoading || !googleConfigured }
                    accessibilityLabel='Continue with Google'
                    accessibilityRole='button'
                >
                    { googleLoading ? (
                        <ActivityIndicator color={ PALETTE.blue.google } />
                    ) : (
                        <FontAwesome name='google' size={ 24 } color={ PALETTE.blue.google } />
                    ) }
                </TouchableOpacity>
            </View>

            { !googleConfigured && (
                <AppText style={ [styles.helperText, styles.helperTextNotice] } variant='caption'>
                    Add your Google client IDs to enable this option.
                </AppText>
            ) }
        </View>
    );
};

const styles = StyleSheet.create({
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    button: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: PALETTE.neutral.boundary,
        // backgroundColor: PALETTE.neutral.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },
    helperText: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 8,
    },
    helperTextNotice: {
        color: PALETTE.blue.google,
    },
});

export default SocialAuthButtons;
