import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import Loading from '../../components/ui/Loading';
import { useEntitlementState } from './EntitlementContext';

/**
 * Guards the paid area of the app.
 *
 * Signing in and having finished onboarding are not evidence of a subscription:
 * a lapsed or refunded subscriber still satisfies both. This asks the store.
 *
 * - loading: wait, rather than flashing either the app or the paywall.
 * - active: allow.
 * - inactive: send to the subscription flow.
 * - unknown: allow, and log. The store being unreachable is our problem, not
 *   the subscriber's, and locking a paying customer out of their own notes over
 *   a network blip is worse than the revenue at risk. This only happens after
 *   neither StoreKit nor the backend can give a definite answer, so it is
 *   deliberately permissive and deliberately noisy.
 *
 * Never keyed off `entitlementConfirmedThisSession`. That flag is an onboarding
 * navigation latch, is not persisted, and says nothing about entitlement.
 */
export function EntitlementGate({ children }: { children: React.ReactNode }) {
    const { state } = useEntitlementState();

    useEffect(() => {
        if (state.status === 'unknown') {
            console.warn(
                `[Entitlement] Could not verify a subscription (${state.reason}). ` +
                'Allowing access so existing subscribers are not locked out.',
            );
        }
    }, [state]);

    if (state.status === 'loading') {
        return <Loading fullScreen />;
    }

    if (state.status === 'inactive') {
        return <Redirect href="/(onboarding)/subscription-preview" />;
    }

    return <>{ children }</>;
}
