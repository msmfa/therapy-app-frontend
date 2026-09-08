import { useCallback, useEffect, useState } from 'react';
import { loadOffer } from './storeKit';
import type { SubscriptionOfferState } from './types';

/**
 * Reads the two plans from the store.
 *
 * There is deliberately no fallback offer. If the store cannot answer, the
 * paywall shows "We can't load subscriptions right now" rather than a price the
 * app made up.
 */
export function useSubscriptionOffer(): {
    state: SubscriptionOfferState;
    reload: () => void;
} {
    const [state, setState] = useState<SubscriptionOfferState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setState({ status: 'loading' });

        loadOffer()
            .then((result) => {
                if (cancelled) return;
                setState(
                    result.status === 'ready'
                        ? { status: 'ready', offer: result.offer }
                        : { status: 'unavailable', reason: result.reason },
                );
            })
            .catch(() => {
                if (cancelled) return;
                setState({ status: 'unavailable', reason: 'store_error' });
            });

        return () => {
            cancelled = true;
        };
    }, [attempt]);

    const reload = useCallback(() => {
        setAttempt((current) => current + 1);
    }, []);

    return { state, reload };
}
