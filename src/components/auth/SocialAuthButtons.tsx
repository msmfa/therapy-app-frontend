import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { useOAuthLogin } from '../../auth/useOAuthLogin';

interface Props {
    onSuccess?: () => void;
}

export const SocialAuthButtons: React.FC<Props> = ({ onSuccess }) => {
    const { appleAvailable, googleConfigured, loadingProvider, signInWithApple, signInWithGoogle } =
        useOAuthLogin(onSuccess);

    const appleLoading = loadingProvider === 'apple';
    const googleLoading = loadingProvider === 'google';

    return (
        <View style={styles.container}>
            {appleAvailable && (
                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={styles.appleButton}
                    onPress={signInWithApple}
                    disabled={appleLoading}
                />
            )}

            <TouchableOpacity
                onPress={signInWithGoogle}
                style={[styles.googleButton, (!googleConfigured || googleLoading) && styles.disabledButton]}
                disabled={googleLoading || !googleConfigured}
            >
                {googleLoading ? (
                    <ActivityIndicator color="#111" />
                ) : (
                    <Text style={styles.googleText}>Continue with Google</Text>
                )}
            </TouchableOpacity>

            {!googleConfigured && (
                <Text style={styles.helperText}>Add your Google client IDs to enable this option.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    appleButton: {
        height: 48,
        marginBottom: 12,
    },
    googleButton: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    googleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
    },
    helperText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 12,
        marginTop: 8,
    },
});

export default SocialAuthButtons;

