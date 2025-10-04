import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext';

type OnboardingContextValue = {
    hydrated: boolean;
    hasOnboarded: boolean;
    finishOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
};

const ONBOARDING_PREFIX = 'onboarding:v1:';
const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [hydrated, setHydrated] = useState(false);
    const [hasOnboarded, setHasOnboarded] = useState(false);
    const { user, hydrated: authHydrated } = useAuth();

    // Track the last user we hydrated for to prevent duplicate hydrations
    const lastHydratedUserId = useRef<string | null>(null);

    // Prevent concurrent hydration attempts
    const isHydrating = useRef(false);

    const userId = user?.id ?? null;

    useEffect(() => {
        console.log('[OnboardingProvider] mount');
        return () => {
            console.log('[OnboardingProvider] unmount');
        };
    }, []);

    // Hydrate onboarding state when user changes
    useEffect(() => {
        // CRITICAL: Only depend on userId, NOT on hydrated state
        // This prevents infinite re-hydration loops

        // Wait for auth to finish hydrating before we start
        if (!authHydrated) {
            console.log('[OnboardingProvider] waiting for auth to hydrate');
            return;
        }

        // Case 1: No user logged in
        if (!userId) {
            console.log('[OnboardingProvider] no user, marking as hydrated with default state');
            lastHydratedUserId.current = null;
            setHasOnboarded(false);
            setHydrated(true);
            return;
        }

        // Case 2: Same user, already hydrated - do nothing
        if (lastHydratedUserId.current === userId) {
            console.log('[OnboardingProvider] already hydrated for user', userId);
            return;
        }

        // Case 3: New user (or first hydration) - hydrate from storage
        // Guard: prevent concurrent hydrations
        if (isHydrating.current) {
            console.log('[OnboardingProvider] hydration already in progress for', userId);
            return;
        }

        isHydrating.current = true;
        setHydrated(false);
        console.log('[OnboardingProvider] starting hydration for user', userId);

        (async () => {
            try {
                const key = `${ONBOARDING_PREFIX}${userId}`;
                const value = await AsyncStorage.getItem(key);

                console.log('[OnboardingProvider] loaded value from storage', {
                    key,
                    value,
                });

                // Update state
                const onboardingComplete = value === '1';
                setHasOnboarded(onboardingComplete);

                // Mark this user as hydrated
                lastHydratedUserId.current = userId;

            } catch (error) {
                console.error('[OnboardingProvider] hydration error:', error);
                // On error, default to not onboarded
                setHasOnboarded(false);
            } finally {
                isHydrating.current = false;
                setHydrated(true);
                console.log('[OnboardingProvider] hydration complete for user', userId);
            }
        })();
    }, [userId, authHydrated]); // ONLY depend on userId and authHydrated, NOT on hydrated state!

    const finishOnboarding = async () => {
        if (!userId) {
            console.warn('[OnboardingProvider] finishOnboarding called with no user');
            return;
        }

        const key = `${ONBOARDING_PREFIX}${userId}`;
        console.log('[OnboardingProvider] finishOnboarding', { key });

        try {
            await AsyncStorage.setItem(key, '1');
            setHasOnboarded(true);
        } catch (error) {
            console.error('[OnboardingProvider] finishOnboarding error:', error);
            throw error;
        }
    };

    const resetOnboarding = async () => {
        if (!userId) {
            console.warn('[OnboardingProvider] resetOnboarding called with no user');
            return;
        }

        const key = `${ONBOARDING_PREFIX}${userId}`;
        console.log('[OnboardingProvider] resetOnboarding', { key });

        try {
            await AsyncStorage.removeItem(key);
            setHasOnboarded(false);
        } catch (error) {
            console.error('[OnboardingProvider] resetOnboarding error:', error);
            throw error;
        }
    };

    const value: OnboardingContextValue = {
        hydrated,
        hasOnboarded,
        finishOnboarding,
        resetOnboarding,
    };

    return (
        <OnboardingContext.Provider value={ value }>
            { children }
        </OnboardingContext.Provider>
    );
}

export const useOnboarding = () => {
    const ctx = useContext(OnboardingContext);
    if (!ctx) {
        throw new Error('useOnboarding must be used inside <OnboardingProvider>');
    }
    return ctx;
};
