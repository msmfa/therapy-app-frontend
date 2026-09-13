import { useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import Loading from '../components/ui/Loading';
import { hydrateLanguage } from './index';

/**
 * Holds the first render until the stored language preference is applied.
 *
 * i18next itself is already initialised synchronously, on the device's
 * language, so this is not waiting for translations to load. It is waiting for
 * the one asynchronous fact: whether the user previously overrode that. Without
 * the gate, someone who chose Français on an English phone would get a frame of
 * English before the AsyncStorage read lands.
 *
 * One `AsyncStorage.getItem` in front of a screen that was already showing a
 * loading state while auth hydrates, so it costs nothing visible. A failed read
 * resolves to "follow the device" rather than rejecting, so this cannot wedge
 * the app on the splash.
 */
export function LanguageGate({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void hydrateLanguage().finally(() => {
            if (!cancelled) setReady(true);
        });

        // "System" has to keep meaning "whatever the device says", including
        // after the device changes. iOS usually restarts an app when the system
        // language changes, which would re-run the hydration above on its own,
        // but that is a behaviour of the OS rather than a guarantee, and it does
        // not hold when only the *order* of preferred languages is edited.
        // Re-resolving on resume costs one AsyncStorage read per foreground and
        // removes the assumption. An explicit choice re-resolves to itself, so
        // this cannot override one.
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void hydrateLanguage();
        });

        return () => {
            cancelled = true;
            subscription.remove();
        };
    }, []);

    if (!ready) return <Loading fullScreen />;

    return <>{ children }</>;
}
