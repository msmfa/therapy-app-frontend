import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../src/context/auth/AuthContext';
import { useOnboarding } from '../src/context/onboarding/OnboardingContext';

/**
 * Catch-all route for unmatched paths
 *
 * This prevents the "unmatched route" error when notifications
 * trigger deep links that don't match existing routes.
 * Redirects to the appropriate screen based on auth state.
 */
export default function NotFound() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { hasOnboarded } = useOnboarding();

    useEffect(() => {
        // Redirect to the appropriate screen based on auth/onboarding state
        if (!isAuthenticated) {
            router.replace('/(auth)/login');
        } else if (!hasOnboarded) {
            router.replace('/(onboarding)');
        } else {
            // User is authenticated and onboarded, go to main app
            router.replace('/(tabs)');
        }
    }, [router, isAuthenticated, hasOnboarded]);

    // Show nothing while redirecting
    return <View style={ styles.container } />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
