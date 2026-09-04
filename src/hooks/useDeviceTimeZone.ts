import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getDeviceTimeZone } from './useTimeZoneSync';

const UTC_ZONE = 'UTC';

const readZone = (): string => getDeviceTimeZone() ?? UTC_ZONE;

/**
 * The device's current IANA zone, re-read whenever the app returns to the
 * foreground.
 *
 * Reminder instants are derived from the zone, so the zone has to be a
 * reactive input rather than something resolved once inside the scheduler.
 * A user who flies LA→NY keeps the same sessions, so a schedule effect keyed
 * only on `[sessions]` never re-runs: the app goes on displaying instants
 * computed for Los Angeles while `useTimeZoneSync` has already told the
 * backend about New York, and the two disagree until something else happens
 * to invalidate the sessions.
 */
export function useDeviceTimeZone(): string {
    const [zone, setZone] = useState<string>(readZone);

    useEffect(() => {
        const sync = () => {
            const next = readZone();
            // Only update on a real change; a new string identity every foreground
            // would retrigger every dependent effect.
            setZone((current) => (current === next ? current : next));
        };

        sync();

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                sync();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return zone;
}
