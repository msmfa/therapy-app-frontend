// Runs the demo seed once the app has everything the seed needs.
//
// Mounted next to the other root-level initialisers. Inert unless
// EXPO_PUBLIC_SEED_DEMO=1 and the bundle is a dev one, so it costs a single
// boolean in any build that is not being used for screenshots.
//
// It waits for the session list rather than firing on login, because a note's
// reminder schedule is derived from the sessions either side of it: seeding
// before they arrive would write notes that belong to no gap and draw empty
// progress bars.
import * as React from 'react';

import { useAuth } from '../../context/auth/AuthContext';
import { useOnboarding } from '../../context/onboarding/OnboardingContext';
import { useTherapySessions } from '../../context/therapy-sessions/TherapySessionsContext';
import { useDeviceTimeZone } from '../../hooks/useDeviceTimeZone';
import { useScheduleTimeZone } from '../reminders/useScheduleTimeZone';
import { hasSeeded, isDemoSeedEnabled, seedDemoData } from './demoSeed';

export function DemoSeedRunner(): null {
    const { user, isAuthenticated } = useAuth();
    const { scheduleSessions } = useTherapySessions();
    const { hasOnboarded, hydrated: onboardingHydrated, finishOnboarding } = useOnboarding();
    const deviceTimeZone = useDeviceTimeZone();
    const timeZone = useScheduleTimeZone(deviceTimeZone);

    const userId = user?.id;
    // A gap needs two sessions. Below that there is no schedule to hang a note
    // on, so there is nothing worth seeding yet.
    const ready = Boolean(
        isAuthenticated && userId && onboardingHydrated && scheduleSessions.length >= 2,
    );

    // Guards a second pass while the first is still running: seeding sets
    // onboarding state, which re-renders this component mid-run.
    const runningRef = React.useRef(false);

    React.useEffect(() => {
        if (!isDemoSeedEnabled() || !ready || !userId || runningRef.current) return;

        runningRef.current = true;

        void (async () => {
            try {
                if (!(await hasSeeded(userId))) {
                    const result = await seedDemoData(userId, scheduleSessions, timeZone);
                    console.log(
                        `[DemoSeed] Wrote ${result.notesWritten} notes and ` +
                            `${result.reviewsWritten} reviews for ${userId}.`,
                    );
                }

                // The demo account is created straight in the database, so it has
                // never walked onboarding and the Gate would park it there. The
                // screenshots are of the main app, so mark it done.
                if (!hasOnboarded) {
                    await finishOnboarding();
                }
            } catch (error) {
                console.warn('[DemoSeed] Failed:', error);
            } finally {
                runningRef.current = false;
            }
        })();
    }, [ready, userId, scheduleSessions, timeZone, hasOnboarded, finishOnboarding]);

    return null;
}
