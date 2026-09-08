import React from 'react';
import { StyleSheet, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

type Props = {
    onPress: () => void;
    disabled?: boolean;
};

/**
 * Apple's own Sign in with Apple button.
 *
 * Apple requires their control, mark and typography rather than a look-alike, so
 * this uses AppleAuthentication.AppleAuthenticationButton instead of the app's
 * generic Button. The label is Apple's CONTINUE type, which renders as
 * "Continue with Apple" in the device language.
 */
export function AppleSignInButton({ onPress, disabled = false }: Props) {
    return (
        <View
            style={ disabled ? styles.disabled : undefined }
            pointerEvents={ disabled ? 'none' : 'auto' }
            accessibilityState={ { disabled } }
        >
            <AppleAuthentication.AppleAuthenticationButton
                buttonType={ AppleAuthentication.AppleAuthenticationButtonType.CONTINUE }
                buttonStyle={ AppleAuthentication.AppleAuthenticationButtonStyle.BLACK }
                cornerRadius={ 30 }
                style={ styles.button }
                onPress={ onPress }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 60,
    },
    disabled: {
        opacity: 0.5,
    },
});
