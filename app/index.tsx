import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { useOnboarding } from '../src/context/OnboardingContext';
import Loading from '../src/components/ui/Loading';

export default function Index() {
    const { hydrated: authHydrated, user } = useAuth();
    const { hydrated: onboardingHydrated, hasOnboarded } = useOnboarding();

    if (!authHydrated || !onboardingHydrated) {
        return <Loading text="Loading your account..." />; // wait for providers to hydrate
    }

    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    if (!hasOnboarded) {
        return <Redirect href="/(onboarding)" />;
    }

    return <Redirect href="/(tabs)" />;
}
