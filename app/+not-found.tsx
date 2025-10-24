import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/auth/AuthContext';
import { useOnboarding } from '../src/context/onboarding/OnboardingContext';
import AppText from '../src/components/ui/AppText';
import { Button } from '../src/components/ui/Button';
import Spacer, { SpacerVariant } from '../src/components/ui/Spacer';
import { COLOR_VARIANTS } from '../designs/designs-colors';
import * as Sentry from '@sentry/react-native';

/**
 * Catch-all route for unmatched paths
 *
 * This prevents the "unmatched route" error when notifications
 * trigger deep links that don't match existing routes.
 * Shows an error message and allows user to navigate back.
 */
export default function NotFound() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { hasOnboarded } = useOnboarding();

    useEffect(() => {
        Sentry.withScope((scope) => {
            scope.setTag('feature', 'routing.not-found');
            scope.setLevel('warning');
            Sentry.captureMessage('User hit unmatched route');
        });
    }, []);

    const handleGoHome = () => {
        if (!isAuthenticated) {
            router.replace('/(auth)/login');
        } else if (!hasOnboarded) {
            router.replace('/(onboarding)');
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <SafeAreaView style={ styles.container } edges={ ['top', 'bottom'] }>
            <View style={ styles.content }>
                <AppText variant="h1">Oops!</AppText>
                <Spacer variant={ SpacerVariant.medium } />
                <AppText variant="body" align="center">
                    We couldn't find what you were looking for! Apologies.
                </AppText>
                <Spacer variant={ SpacerVariant.large } />
                <Button onPress={ handleGoHome } label="Go to Home" />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR_VARIANTS.white.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
});
