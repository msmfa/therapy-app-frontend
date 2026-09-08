import { useEffect } from 'react';
import { AppState } from 'react-native';
import { analytics } from '../../features/analytics/client';
import { analyticsConsentSync } from '../../features/analytics/consentSync';
import { useAuth } from '../../context/auth/AuthContext';

/** Analytics starts independently of the app's auth, billing and storage work. */
export function AnalyticsInitializer(): null {
    const { user, hydrated } = useAuth();
    useEffect(() => {
        void analytics.initialize();
        analytics.onAppStateChange(AppState.currentState);
        const subscription = AppState.addEventListener('change', (state) => {
            analytics.onAppStateChange(state);
            if (state === 'active') void analyticsConsentSync.sync();
        });
        return () => subscription.remove();
    }, []);
    useEffect(() => {
        if (hydrated && user?.id) void analyticsConsentSync.sync();
    }, [hydrated, user?.id]);
    return null;
}
