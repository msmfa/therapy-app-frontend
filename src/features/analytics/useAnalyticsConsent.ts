import { useEffect, useSyncExternalStore } from 'react';
import { analytics } from './client';

const subscribe = (listener: () => void) => analytics.subscribe(listener);
const getSnapshot = () => analytics.getSnapshot();

/** A preference subscription; rendering this hook never captures an event. */
export function useAnalyticsConsent() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    useEffect(() => { void analytics.initialize(); }, []);
    return snapshot;
}
