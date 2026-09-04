import { useEffect, useRef } from 'react';
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

export function useTimeZoneSync(): void {
    const { isAuthenticated } = useAuth();
    const lastSyncedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            lastSyncedRef.current = null;
            return;
        }

        let cancelled = false;

        const sync = async () => {
            const timeZone = getDeviceTimeZone();
            if (!timeZone || timeZone === lastSyncedRef.current) return;

            try {
                await updateCurrentUser({ timeZone });
                if (!cancelled) {
                    lastSyncedRef.current = timeZone;
                }
            } catch (err) {
                // Non-fatal: reminders fall back to the last known zone.
                console.warn('[TimeZoneSync] Failed to update time zone:', err);
            }
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
    }, [isAuthenticated]);
}
