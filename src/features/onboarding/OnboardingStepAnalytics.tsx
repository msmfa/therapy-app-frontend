import { useCallback, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { analytics } from '../analytics/client';
import type { OnboardingStep } from '../analytics/events';

/** Mount only alongside a step's visible UI, never its loading or redirect branch. */
export function OnboardingStepAnalytics({ step }: { step: OnboardingStep }) {
    const snapshot = useSyncExternalStore(analytics.subscribe, analytics.getSnapshot, analytics.getSnapshot);
    return snapshot.enabled ? <FocusedStepAnalytics step={ step } snapshot={ snapshot } /> : null;
}

function FocusedStepAnalytics({ step, snapshot }: {
    step: OnboardingStep;
    snapshot: ReturnType<typeof analytics.getSnapshot>;
}) {
    useFocusEffect(useCallback(() => {
        const scope = analytics.beginOperation();
        const visit = analytics.getVisitId();
        // A focus effect may synchronously resume a saved draft and replace
        // Welcome. Give that redirect a chance to unmount before recording a
        // view; blur, account changes and consent changes cancel this capture.
        const timer = setTimeout(() => {
            scope.capture('onboarding_step_viewed', { onboarding_step: step, flow_version: '1' }, {
                dedupeKey: `onboarding-step:${visit}:1:${step}`,
            });
        }, 0);
        return () => clearTimeout(timer);
    }, [snapshot, step]));

    return null;
}
