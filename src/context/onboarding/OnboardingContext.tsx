import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext';
import { getCurrentUserSettings, updateCurrentUser } from '../../api/users';

type OnboardingContextValue = {
    hydrated: boolean;
    hasOnboarded: boolean;
    finishOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
};

const ONBOARDING_PREFIX = 'onboarding:v1:';

/** Why onboarding could not be marked complete. */
export type OnboardingCompletionFailure = 'no_user' | 'server';

export class OnboardingCompletionError extends Error {
    readonly reason: OnboardingCompletionFailure;

    constructor(reason: OnboardingCompletionFailure, cause?: unknown) {
        super(
            reason === 'no_user'
                ? 'Cannot finish onboarding without a signed-in user.'
                : 'Could not save onboarding completion to the account.',
        );
        this.name = 'OnboardingCompletionError';
        this.reason = reason;
        if (cause !== undefined) this.cause = cause;
    }
}
const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    // The account whose completion flag has actually been read. Keeping this
    // identity, rather than only a boolean, makes an account switch become
    // unhydrated in the very render where userId changes; effects run too late
    // to prevent one frame of the previous account's state leaking through.
    const [hydratedUserId, setHydratedUserId] = useState<string | null>();
    const [hasOnboarded, setHasOnboarded] = useState(false);
    const { user, hydrated: authHydrated } = useAuth();

    const userId = user?.id ?? null;
    const hydrated = authHydrated && hydratedUserId === userId;
    const currentUserIdRef = useRef(userId);
    currentUserIdRef.current = userId;

    // Hydrate onboarding state when user changes
    useEffect(() => {
        // Wait for auth to finish hydrating before we start
        if (!authHydrated) {
            return;
        }

        let cancelled = false;

        // No user is always an incomplete, but fully-hydrated onboarding state.
        if (!userId) {
            setHasOnboarded(false);
            setHydratedUserId(null);
            return;
        }

        (async () => {
            try {
                const key = `${ONBOARDING_PREFIX}${userId}`;
                const value = await AsyncStorage.getItem(key);
                if (cancelled) return;

                if (value === '1') {
                    // Existing installs used a device-only marker. Let them in
                    // immediately, then backfill the account marker so a new
                    // phone or reinstall will make the same decision.
                    setHasOnboarded(true);
                    setHydratedUserId(userId);
                    void (async () => {
                        try {
                            const settings = await getCurrentUserSettings();
                            // The request was authenticated as this account,
                            // but a later PATCH would use whichever token is
                            // current. Never let an old response complete a
                            // newly selected account's onboarding.
                            if (cancelled || currentUserIdRef.current !== userId) return;
                            if (!settings.onboardingCompleted) {
                                await updateCurrentUser({ onboardingCompleted: true });
                            }
                        } catch (error) {
                            console.warn('[OnboardingProvider] server backfill failed:', error);
                        }
                    })();
                    return;
                }

                // No local marker may mean a new device, not a new user. The
                // account is authoritative so returning users do not repeat
                // onboarding and append another session series.
                let completedOnAccount = false;
                try {
                    const settings = await getCurrentUserSettings();
                    completedOnAccount = settings.onboardingCompleted === true;
                } catch (error) {
                    console.warn('[OnboardingProvider] server hydration failed:', error);
                }
                if (cancelled) return;

                setHasOnboarded(completedOnAccount);
                if (completedOnAccount) {
                    // Cache only. Failure cannot undo the server-owned result.
                    await AsyncStorage.setItem(key, '1').catch((error) => {
                        console.warn('[OnboardingProvider] local completion cache failed:', error);
                    });
                }
            } catch (error) {
                if (cancelled) return;
                console.error('[OnboardingProvider] hydration error:', error);
                // On error, default to not onboarded
                setHasOnboarded(false);
            } finally {
                if (!cancelled) setHydratedUserId(userId);
            }
        })();

        // A sign-in, sign-out or account switch can happen before storage
        // answers. The previous request must never overwrite the new user's
        // onboarding state when it eventually resolves.
        return () => {
            cancelled = true;
        };
    }, [userId, authHydrated]);

    const finishOnboarding = async () => {
        // Marking onboarding complete for "nobody" silently stranded the user:
        // the flag was never written, hasOnboarded stayed false, and the app
        // bounced them back to the start with no explanation. Callers need to
        // know, so they can keep the draft and route to sign-in instead.
        if (!userId) {
            throw new OnboardingCompletionError('no_user');
        }

        const key = `${ONBOARDING_PREFIX}${userId}`;

        try {
            await updateCurrentUser({ onboardingCompleted: true });
        } catch (error) {
            console.error('[OnboardingProvider] finishOnboarding error:', error);
            throw new OnboardingCompletionError('server', error);
        }

        // The account marker is authoritative. This local write only avoids a
        // network wait on the next launch and must not turn a completed account
        // back into an incomplete one if device storage is unavailable.
        await AsyncStorage.setItem(key, '1').catch((error) => {
            console.warn('[OnboardingProvider] local completion cache failed:', error);
        });
        if (currentUserIdRef.current === userId) setHasOnboarded(true);
    };

    const resetOnboarding = async () => {
        if (!userId) {
            console.warn('[OnboardingProvider] resetOnboarding called with no user');
            return;
        }

        const key = `${ONBOARDING_PREFIX}${userId}`;

        try {
            await updateCurrentUser({ onboardingCompleted: false });
            await AsyncStorage.removeItem(key);
            if (currentUserIdRef.current === userId) setHasOnboarded(false);
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
