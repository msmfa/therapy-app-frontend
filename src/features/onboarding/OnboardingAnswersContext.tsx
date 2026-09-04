import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSegments } from 'expo-router';
import type { CadenceId, GoalId } from './onboardingCopy';
import type { PlanId } from '../subscription/types';
import { useAuth } from '../../context/auth/AuthContext';
import { cancelOnboardingReminder } from './onboardingNotifications';
import {
    clearDraft,
    promoteAnonDraft,
    readDraft,
    writeDraft,
    type OnboardingDraft,
} from './draftStore';
import {
    onboardingRouteForSegments,
    type OnboardingResumeRoute,
} from './onboardingResume';

export type OnboardingAnswers = {
    goal: GoalId | null;
    /** Local Date for the next session, carrying both the day and the time. */
    sessionAt: Date | null;
    /** The user explicitly chose to preview a plan before booking a session. */
    sessionDateSkipped: boolean;
    cadence: CadenceId | null;
    /** Minutes from local midnight, so the value is independent of any date. */
    morningMinutes: number;
    eveningMinutes: number;
    plan: PlanId;
    /**
     * A purchase or restore was verified by StoreKit in THIS run of the app.
     *
     * Deliberately not persisted: this is only a navigation latch preventing a
     * deep link from skipping the paywall. Paid features must use StoreKit's
     * current entitlement (and, once added, the backend entitlement), not this.
     */
    entitlementConfirmedThisSession: boolean;
    /**
     * True only when notification permission is granted and this device's push
     * token was registered with the backend that sends the reminder schedule.
     */
    reminderScheduled: boolean;
    /** Last focused onboarding screen; local navigation state is not durable. */
    resumeRoute: OnboardingResumeRoute | null;
};

export const DEFAULT_MORNING_MINUTES = 7 * 60 + 30;
export const DEFAULT_EVENING_MINUTES = 20 * 60;

const DEFAULT_ANSWERS: OnboardingAnswers = {
    goal: null,
    sessionAt: null,
    sessionDateSkipped: false,
    cadence: null,
    morningMinutes: DEFAULT_MORNING_MINUTES,
    eveningMinutes: DEFAULT_EVENING_MINUTES,
    plan: 'annual',
    entitlementConfirmedThisSession: false,
    reminderScheduled: false,
    resumeRoute: null,
};

const toDraft = (answers: OnboardingAnswers): OnboardingDraft => ({
    goal: answers.goal,
    sessionAtIso: answers.sessionAt === null ? null : answers.sessionAt.toISOString(),
    sessionDateSkipped: answers.sessionDateSkipped,
    cadence: answers.cadence,
    morningMinutes: answers.morningMinutes,
    eveningMinutes: answers.eveningMinutes,
    plan: answers.plan,
    reminderScheduled: answers.reminderScheduled,
    resumeRoute: answers.resumeRoute,
});

const fromDraft = (draft: OnboardingDraft): OnboardingAnswers => ({
    goal: draft.goal,
    sessionAt: draft.sessionAtIso === null ? null : new Date(draft.sessionAtIso),
    sessionDateSkipped: draft.sessionDateSkipped,
    cadence: draft.cadence,
    morningMinutes: draft.morningMinutes,
    eveningMinutes: draft.eveningMinutes,
    plan: draft.plan,
    // Never restored: a new run must ask StoreKit for the current entitlement.
    entitlementConfirmedThisSession: false,
    reminderScheduled: draft.reminderScheduled,
    resumeRoute: draft.resumeRoute,
});

type OnboardingAnswersContextValue = {
    answers: OnboardingAnswers;
    /** False until the stored draft has been read. */
    hydrated: boolean;
    setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
    /** Wipes the draft from the keychain and resets the flow. */
    discardDraft: () => Promise<void>;
};

const OnboardingAnswersContext = createContext<OnboardingAnswersContextValue | undefined>(undefined);

/**
 * Holds what the user has told us during onboarding, and keeps it.
 *
 * Mounted above the Gate in app/_layout.tsx rather than inside the (onboarding)
 * group. Signing in changes the user id, OnboardingProvider re-hydrates, and
 * while it does the Gate swaps the navigator for a loading screen: a provider
 * inside the group would be unmounted at that moment. Living above that keeps
 * the answers on screen; the keychain keeps them across a relaunch or a crash.
 */
export function OnboardingAnswersProvider({ children }: { children: React.ReactNode }) {
    const { user, hydrated: authHydrated, registerSignOutTask } = useAuth();
    const userId = user?.id ?? null;
    const segments = useSegments();

    const [answers, setAnswers] = useState<OnboardingAnswers>(DEFAULT_ANSWERS);
    const [hydrated, setHydrated] = useState(false);

    // SecureStore writes are asynchronous and are not guaranteed to finish in
    // call order. Serialising them prevents an older picker value overwriting a
    // newer one, and lets clearing wait until every earlier write has landed.
    const draftOperationsRef = useRef<Promise<void>>(Promise.resolve());

    // Whose draft the state currently reflects, so a write never lands under
    // the wrong key while the user id is changing.
    const ownerRef = useRef<string | null>(null);

    useEffect(() => {
        if (!authHydrated) return;

        let cancelled = false;
        setHydrated(false);

        (async () => {
            // A user can authenticate immediately after answering the last
            // anonymous question. Let that write finish before promoting the
            // draft, or the account read can overtake it and reset the answers.
            await draftOperationsRef.current;
            const draft = userId === null ? await readDraft(null) : await promoteAnonDraft(userId);
            if (cancelled) return;

            ownerRef.current = userId;
            setAnswers(draft === null ? DEFAULT_ANSWERS : fromDraft(draft));
            setHydrated(true);
        })().catch(() => {
            if (cancelled) return;
            ownerRef.current = userId;
            setAnswers(DEFAULT_ANSWERS);
            setHydrated(true);
        });

        return () => {
            cancelled = true;
        };
    }, [authHydrated, userId]);

    const setAnswer = useCallback(
        <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
            setAnswers((current) => {
                if (Object.is(current[key], value)) return current;
                const next = { ...current, [key]: value };
                // Only persist once the owner is settled, so an answer cannot be
                // written to the previous account's record mid-switch.
                if (ownerRef.current === userId) {
                    draftOperationsRef.current = draftOperationsRef.current
                        .then(() => writeDraft(userId, toDraft(next)))
                        .catch(() => undefined);
                }
                return next;
            });
        },
        [userId],
    );

    const discardDraft = useCallback(async () => {
        setAnswers(DEFAULT_ANSWERS);
        // Whatever local reminder the flow booked belongs to the draft. Leaving
        // it behind means a notification for a plan that no longer exists. The
        // clear is part of the same queue as writes, so a slow save cannot
        // recreate the draft after onboarding completes.
        const clear = draftOperationsRef.current.then(async () => {
            await Promise.all([
                clearDraft(userId),
                clearDraft(null),
                cancelOnboardingReminder().catch((error) => {
                    // The actual plan and completion state are already saved.
                    // Keep the old identifier so a later cleanup can retry, but
                    // never trap the user in onboarding over legacy local data.
                    console.warn('[onboarding] could not remove legacy reminder:', error);
                }),
            ]);
        });
        draftOperationsRef.current = clear.catch(() => undefined);
        await clear;
    }, [userId]);

    // Signing out, and deleting an account (which signs out), must leave nothing
    // behind for the next person to use this device.
    useEffect(() => {
        return registerSignOutTask(async () => {
            setAnswers(DEFAULT_ANSWERS);
            const clear = draftOperationsRef.current.then(async () => {
                await Promise.all([
                    clearDraft(userId),
                    clearDraft(null),
                    cancelOnboardingReminder().catch((error) => {
                        console.warn('[onboarding] could not remove legacy reminder:', error);
                    }),
                ]);
            });
            draftOperationsRef.current = clear.catch(() => undefined);
            await clear;
        });
    }, [registerSignOutTask, userId]);

    // As with the completion provider, a plain `hydrated` boolean is stale for
    // one render when the account changes. ownerRef identifies whose answers
    // are actually in memory and closes that privacy/correctness gap.
    const answersHydrated = hydrated && authHydrated && ownerRef.current === userId;

    // Navigation state is not guaranteed to survive a terminated app. Record
    // the currently focused onboarding screen in the same encrypted draft as
    // the answers. Auth and main-app routes deliberately leave it untouched.
    const activeResumeRoute = onboardingRouteForSegments(segments);
    useEffect(() => {
        if (
            answersHydrated
            && activeResumeRoute !== null
            && answers.resumeRoute !== activeResumeRoute
        ) {
            setAnswer('resumeRoute', activeResumeRoute);
        }
    }, [activeResumeRoute, answers.resumeRoute, answersHydrated, setAnswer]);

    const value = useMemo(
        () => ({ answers, hydrated: answersHydrated, setAnswer, discardDraft }),
        [answers, answersHydrated, setAnswer, discardDraft],
    );

    return (
        <OnboardingAnswersContext.Provider value={ value }>
            { children }
        </OnboardingAnswersContext.Provider>
    );
}

export function useOnboardingAnswers(): OnboardingAnswersContextValue {
    const context = useContext(OnboardingAnswersContext);

    if (!context) {
        throw new Error('useOnboardingAnswers must be used inside OnboardingAnswersProvider');
    }

    return context;
}
