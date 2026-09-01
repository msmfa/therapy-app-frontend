// The zone review windows should open in.
//
// GET /reminders resolves the schedule in the zone the server holds for the
// profile, and that is the zone the pushes actually fire in. The device zone
// normally agrees (the app syncs it on every foreground), but right after
// travel, or while that sync is failing, the two diverge, and a review window
// opened in the device zone would disagree with the reminders the user really
// received. Prefer the zone the server answered with, read from the same cache
// entry the calendar draws from, and fall back to the device zone until a
// schedule has been fetched at all.
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { readRemindersCache } from './remindersCache';

export function useScheduleTimeZone(deviceTimeZone: string): string {
    const [serverTimeZone, setServerTimeZone] = useState<string | null>(null);

    useEffect(() => {
        let disposed = false;

        const readZone = async () => {
            const cached = await readRemindersCache();
            if (!disposed) setServerTimeZone(cached?.timeZone ?? null);
        };

        void readZone();

        // The cache is rewritten when the schedule is refetched, and foreground
        // is one of the refetch triggers, so re-read on the same signal.
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void readZone();
        });

        return () => {
            disposed = true;
            subscription.remove();
        };
    }, []);

    return serverTimeZone ?? deviceTimeZone;
}
