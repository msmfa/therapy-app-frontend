// app/(onboarding)/success.tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import {
    OnboardingCompletionError,
    useOnboarding,
} from '../../src/context/onboarding/OnboardingContext';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import { Button } from '../../src/components/ui/Button';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { useAppAlert } from '../../src/context/alert';
import {
    ERROR_COPY,
    SUCCESS_COPY,
    successCopy,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { postSessionNoteAt } from '../../src/features/onboarding/planTimeline';
import { projectSessions } from '../../src/features/onboarding/sessionSeries';
import { updateCurrentUser } from '../../src/api/users';
import { DEFAULT_SESSION_MINUTES } from '../../src/features/reminders/reminderScheduleConfig';
import { timeLabel, weekdayName } from '../../src/features/onboarding/formatting';
import { firstIncompletePlanRoute } from '../../src/features/onboarding/flowGuard';

export default function SuccessScreen() {
    const router = useRouter();
    const { finishOnboarding } = useOnboarding();
    const { addSessions, refreshReminderSchedule } = useTherapySessions();
    const { answers, discardDraft } = useOnboardingAnswers();
    const { showAlert } = useAppAlert();
    const completionTriggeredRef = useRef(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const firstReminderAt = useMemo(() => {
        return answers.sessionAt === null ? null : postSessionNoteAt(answers.sessionAt);
    }, [answers.sessionAt]);

    const handleComplete = useCallback(async () => {
        if (completionTriggeredRef.current) {
            return;
        }

        completionTriggeredRef.current = true;
        setIsCompleting(true);

        try {
            // Sessions first. Onboarding is not finished until the schedule the
            // user built actually exists on the server: marking it complete and
            // clearing the draft before the write would leave an account that
            // has "onboarded" with an empty calendar and no way back.
            if (answers.sessionAt !== null) {
                const projected = projectSessions({
                    firstSessionAt: answers.sessionAt,
                    cadence: answers.cadence,
                });
                await addSessions(projected, DEFAULT_SESSION_MINUTES);
            }

            // The chosen reminder times, to the backend that actually sends the
            // pushes. Kept with the session write: a schedule saved without the
            // times would be reminded on the defaults, silently ignoring what
            // the user picked two screens earlier.
            await updateCurrentUser({
                morningReminderMinutes: answers.morningMinutes,
                eveningReminderMinutes: answers.eveningMinutes,
                ...(answers.goal === null ? {} : { reflectionGoal: answers.goal }),
            });
            // addSessions can cause a schedule fetch before the preference
            // write finishes. Invalidate that answer so calendar dots and
            // review windows are rebuilt from the newly saved times.
            await refreshReminderSchedule();

            await finishOnboarding();

            // Only now: the flow is done, so the draft has nothing left to
            // resume and no reason to sit in the keychain.
            await discardDraft();
            router.replace('/(tabs)/calendar');
        } catch (error) {
            // The draft is untouched, so the user resumes rather than starting
            // over. A missing account is its own problem and needs sign-in, not
            // a retry.
            completionTriggeredRef.current = false;
            setIsCompleting(false);

            if (error instanceof OnboardingCompletionError && error.reason === 'no_user') {
                showAlert(ERROR_COPY.signInTitle, ERROR_COPY.signInBody, {
                    primaryAction: {
                        label: ERROR_COPY.signInCta,
                        onPress: () => router.replace('/(onboarding)/account-preview'),
                    },
                });
                return;
            }

            showAlert(ERROR_COPY.saveTitle, ERROR_COPY.saveBody);
        }
    }, [
        answers.cadence,
        answers.eveningMinutes,
        answers.goal,
        answers.morningMinutes,
        answers.sessionAt,
        discardDraft,
        finishOnboarding,
        router,
        showAlert,
        addSessions,
        refreshReminderSchedule,
    ]);

    // Only show reminder copy when delivery is ready. The wording stays
    // prospective because this screen saves the actual session plan below.
    const { headline, body } = firstReminderAt === null
        ? { headline: SUCCESS_COPY.sampleHeadline, body: SUCCESS_COPY.sampleBody }
        : successCopy(
            answers.reminderScheduled,
            weekdayName(firstReminderAt),
            timeLabel(firstReminderAt),
        );

    // Protected route groups stop an unauthenticated user entering the paid
    // app, but they do not enforce the order of screens inside onboarding. A
    // stale/deep link to Success must not complete with fallback answers or
    // bypass the StoreKit step.
    const incompletePlanRoute = firstIncompletePlanRoute(answers);
    if (incompletePlanRoute !== null) return <Redirect href={ incompletePlanRoute } />;
    if (!answers.entitlementConfirmedThisSession) {
        return <Redirect href="/(onboarding)/subscription-preview" />;
    }

    return (
        <OnboardingScreen
            showBack={ false }
            headline={ headline }
            supporting={ body }
            footer={
                <Button
                    label={ firstReminderAt === null
                        ? SUCCESS_COPY.samplePrimaryCta
                        : SUCCESS_COPY.primaryCta }
                    onPress={ () => void handleComplete() }
                    loading={ isCompleting }
                />
            }
        />
    );
}
