import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from 'src/context/auth/AuthContext';
import { updateCurrentUser } from 'src/api/users';

/**
 * Keeps the backend's copy of the device time zone current.
 *
 * Reminder times ("07:00", "20:00") are wall-clock times, and the cron that
 * sends them runs on the server. Without this the server has to assume UTC,
 * which puts the morning reminder at 23:00 the night before for anyone in the
 * Americas.
 *
 * Re-checked when the app returns to the foreground so travel and DST changes
 * are picked up.
 */
export function getDeviceTimeZone(): string | null {
    try {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return zone && zone.length > 0 ? zone : null;
    } catch {
        return null;
    }
}

export function useTimeZoneSync(onSynced?: () => Promise<void>): void {
    const { isAuthenticated, user } = useAuth();
    const userId = isAuthenticated ? user?.id : undefined;

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;
        let lastSynced: string | null = null;
        let inFlight: Promise<void> | null = null;

        const sync = (): Promise<void> => {
            if (inFlight) return inFlight;
            const request = (async () => {
                try {
                    // Serialize updates. If the zone changes again during a
                    // PATCH, send the latest one only after that PATCH settles.
                    while (!cancelled) {
                        const timeZone = getDeviceTimeZone();
                        if (!timeZone || timeZone === lastSynced) return;
                        await updateCurrentUser({ timeZone });
                        if (cancelled) return;
                        await onSynced?.();
                        if (cancelled) return;
                        lastSynced = timeZone;
                    }
                } catch (err) {
                    // Keep retrying on foreground after either sync or cache
                    // invalidation fails; do not mark the zone as up to date.
                    console.warn('[TimeZoneSync] Failed to update time zone:', err);
                }
            })().finally(() => { inFlight = null; });
            inFlight = request;
            return request;
        };

        void sync();

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                void sync();
            }
        });

        return () => {
            cancelled = true;
            subscription.remove();
        };
    }, [userId, onSynced]);
}
