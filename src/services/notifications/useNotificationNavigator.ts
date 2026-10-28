import { useCallback, useEffect, useState } from 'react';
import { useNavigationContainerRef, useRouter, type Href } from 'expo-router';
import { notificationNavigationFor } from './routing';

/**
 * Opens a notification's destination, or `null` while the root layout's Stack
 * cannot take a navigation yet. See `notificationNavigationFor`.
 */
export function useNotificationNavigator(): ((href: Href) => void) | null {
    const router = useRouter();
    const navigationRef = useNavigationContainerRef();
    const [stackReady, setStackReady] = useState(false);

    useEffect(() => {
        const check = (): void => {
            setStackReady(navigationRef.isReady() && notificationNavigationFor(navigationRef.getRootState()) !== null);
        };
        check();
        return navigationRef.addListener('state', check);
    }, [navigationRef]);

    const open = useCallback((href: Href) => {
        if (notificationNavigationFor(navigationRef.getRootState()) === 'dismissTo') {
            router.dismissTo(href);
        } else {
            router.replace(href);
        }
    }, [navigationRef, router]);

    return stackReady ? open : null;
}
