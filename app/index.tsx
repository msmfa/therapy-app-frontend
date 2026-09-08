import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/auth/AuthContext';
import { useOnboarding } from '../src/context/onboarding/OnboardingContext';
import Loading from '../src/components/ui/Loading';

export default function Index() {
    // `isAuthenticated` rather than `user`, to match the Gate in _layout.tsx and
    // the API client's definition of signed in.
    const { hydrated: authHydrated, isAuthenticated } = useAuth();
    const { hydrated: onboardingHydrated, hasOnboarded } = useOnboarding();

    if (!authHydrated || !onboardingHydrated) {
        return <Loading />; // wait for providers to hydrate
    }

    // Onboarding is the entry point, signed in or not: a new user walks the flow
    // and only reaches authentication at the account step. `hasOnboarded` is
    // stored per user id, so a signed-out visitor is always "not onboarded" and
    // lands on Welcome, which carries its own "I already have an account" route
    // into sign-in for returning users.
    if (!hasOnboarded) {
        return <Redirect href="/(onboarding)" />;
    }

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return <Redirect href="/(tabs)" />;
}
