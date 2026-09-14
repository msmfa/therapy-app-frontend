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
import { useTranslation } from 'react-i18next';

/**
 * Catch-all route for unmatched paths
 *
 * This prevents the "unmatched route" error when notifications
 * trigger deep links that don't match existing routes.
 * Shows an error message and allows user to navigate back.
 */
export default function NotFound() {
    const { t } = useTranslation('common');
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
                <AppText variant="h1">{ t('notFound.title') }</AppText>
                <Spacer variant={ SpacerVariant.medium } />
                <AppText variant="body" align="center">
                    { t('notFound.body') }
                </AppText>
                <Spacer variant={ SpacerVariant.large } />
                <Button onPress={ handleGoHome } label={ t('notFound.cta') } />
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
