import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

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
        <View style={ styles.container }>
            { appleAvailable && (
                <TouchableOpacity
                    onPress={ signInWithApple }
                    style={ [styles.button, appleLoading && styles.disabledButton] }
                    disabled={ appleLoading }
                >
                    { appleLoading ? (
                        <ActivityIndicator color={ 'red' } />
                    ) : (
                        <View style={ styles.content }>
                            <FontAwesome name="apple" size={ 20 } color={ 'grey' } style={ styles.icon } />
                            <Text style={ styles.buttonText }>Continue with Apple</Text>
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
                    <ActivityIndicator color={ 'blue' } />
                ) : (
                    <View style={ styles.content }>
                        <FontAwesome name="google" size={ 20 } color={ 'blue' } style={ styles.icon } />
                        <Text style={ styles.buttonText }>Continue with Google</Text>
                    </View>
                ) }
            </TouchableOpacity>

            { !googleConfigured && (
                <Text style={ styles.helperText }>Add your Google client IDs to enable this option.</Text>
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
        borderColor: 'grey',
        backgroundColor: 'white',
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
        color: 'black',
        textAlign: 'center',
    },
    helperText: {
        textAlign: 'center',
        color: 'blue',
        fontSize: 12,
        marginTop: 8,
    },
});

export default SocialAuthButtons;
