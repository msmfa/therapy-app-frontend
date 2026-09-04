import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getEntitlement } from './storeKit';
import type { EntitlementState } from './types';
import { useAuth } from '../../context/auth/AuthContext';

/**
 * StoreKit-backed subscription state for routing and paid-feature guards.
 *
 * It refreshes whenever the app becomes active so a purchase, refund or renewal
 * changed outside the app is reflected without a relaunch.
 */
export function useEntitlement(): {
    state: EntitlementState;
    refresh: () => void;
} {
    const { isAuthenticated, user } = useAuth();
    const accountId = isAuthenticated ? user?.id ?? null : null;
    // Include auth mode as well as id: a briefly incomplete authenticated user
    // must not reuse the signed-out Apple-ID result just because both ids are
    // null for that render.
    const ownerKey = isAuthenticated ? `user:${accountId ?? 'unknown'}` : 'signed-out';
    const [snapshot, setSnapshot] = useState<{
        ownerKey: string;
        state: EntitlementState;
    }>(() => ({ ownerKey, state: { status: 'loading' } }));
    const [attempt, setAttempt] = useState(0);

    // Effects run after render. Deriving loading here closes the render-sized
    // gap where a new account could otherwise see the previous account's active
    // answer before the effect below reset it.
    const state: EntitlementState = snapshot.ownerKey === ownerKey
        ? snapshot.state
        : { status: 'loading' };

    useEffect(() => {
        let cancelled = false;

        // Entitlement belongs to an app account, not merely to the boolean
        // state "someone is signed in". A direct account switch must never
        // render with the previous user's answer while the new one is checked.
        setSnapshot({ ownerKey, state: { status: 'loading' } });

        getEntitlement({ syncWithServer: isAuthenticated })
            .then((result) => {
                if (!cancelled) setSnapshot({ ownerKey, state: result });
            })
            .catch(() => {
                if (!cancelled) {
                    setSnapshot({
                        ownerKey,
                        state: { status: 'unknown', reason: 'store_error' },
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [attempt, isAuthenticated, ownerKey]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') setAttempt((current) => current + 1);
        });

        return () => subscription.remove();
    }, []);

    const refresh = useCallback(() => {
        setSnapshot({ ownerKey, state: { status: 'loading' } });
        setAttempt((current) => current + 1);
    }, [ownerKey]);

    return { state, refresh };
}
