import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { useOAuthLogin } from '../../auth/useOAuthLogin';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { AppleSignInButton } from '../onboarding/AppleSignInButton';
import AppText from '../ui/AppText';
import Spacer, { SpacerVariant } from '../ui/Spacer';

interface Props {
    onSuccess?: () => void;
    disabled?: boolean;
}

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
            <AppleSignInButton
                onPress={ signInWithApple }
                disabled={ appleDisabled }
            />
            { appleLoading && (
                <ActivityIndicator
                    color={ COLOR_VARIANTS.black.primary }
                    accessibilityLabel="Signing in with Apple"
                    style={ styles.progress }
                />
            ) }
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        width: '100%',
        marginBottom: 16,
    },
    progress: {
        marginTop: 12,
    },
});

export default SocialAuthButtons;
