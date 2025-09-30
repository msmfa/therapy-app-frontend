import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { useOnboarding } from '../src/context/OnboardingContext';

export default function Index() {
    const { hydrated: authHydrated, user } = useAuth();
    const { hydrated: onboardingHydrated, hasOnboarded } = useOnboarding();

    if (!authHydrated || !onboardingHydrated) {
        return null; // allow providers to hydrate before routing
    }

    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    if (!hasOnboarded) {
        return <Redirect href="/(onboarding)" />;
    }

    return <Redirect href="/(tabs)" />;
}
