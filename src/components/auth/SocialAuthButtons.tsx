import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useOAuthLogin } from '../../auth/useOAuthLogin';
import AppText from '../ui/typography';

interface Props {
    onSuccess?: () => void;
}

export const SocialAuthButtons: React.FC<Props> = ({ onSuccess }) => {
    const { appleAvailable, googleConfigured, loadingProvider, signInWithApple, signInWithGoogle } =
        useOAuthLogin(onSuccess);

    const appleLoading = loadingProvider === 'apple';
    const googleLoading = loadingProvider === 'google';

    return (
        <View style={ styles.container }>
            { appleAvailable && (
                <TouchableOpacity
                    onPress={ signInWithApple }
                    style={ [styles.button, appleLoading && styles.disabledButton] }
                    disabled={ appleLoading }
                >
                    { appleLoading ? (
                        <ActivityIndicator color={ '#FF0000' } />
                    ) : (
                        <View style={ styles.content }>
                            <FontAwesome name="apple" size={ 20 } color={ '#808080' } style={ styles.icon } />
                            <AppText style={ styles.buttonText } color="#000000" weight="semibold">
                                Continue with Apple
                            </AppText>
                        </View>
                    ) }
                </TouchableOpacity>
            ) }

            <TouchableOpacity
                onPress={ signInWithGoogle }
                style={ [
                    styles.button,
                    styles.lastButton,
                    (!googleConfigured || googleLoading) && styles.disabledButton,
                ] }
                disabled={ googleLoading || !googleConfigured }
            >
                { googleLoading ? (
                    <ActivityIndicator color={ '#0000FF' } />
                ) : (
                    <View style={ styles.content }>
                        <FontAwesome name="google" size={ 20 } color={ '#0000FF' } style={ styles.icon } />
                        <AppText style={ styles.buttonText } color="#000000" weight="semibold">
                            Continue with Google
                        </AppText>
                    </View>
                ) }
            </TouchableOpacity>

            { !googleConfigured && (
                <AppText style={ styles.helperText } color="#0000FF">
                    Add your Google client IDs to enable this option.
                </AppText>
            ) }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    button: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#808080',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    lastButton: {
        marginBottom: 0,
    },
    disabledButton: {
        opacity: 0.6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    helperText: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 8,
    },
});

export default SocialAuthButtons;
