import type { Href } from 'expo-router';
import type { OnboardingAnswers } from './OnboardingAnswersContext';

/**
 * Earliest unanswered piece required to build and save a real plan.
 *
 * The check is shared by the paywall, purchase handoff and completion screen so
 * a deep link cannot make someone pay before the plan they are buying has the
 * inputs needed to exist.
 */
export function firstIncompletePlanRoute(
    answers: Pick<OnboardingAnswers, 'goal' | 'sessionAt' | 'sessionDateSkipped' | 'cadence'>,
    nowMs: number = Date.now(),
): Href | null {
    if (answers.goal === null) return '/(onboarding)/goal';
    if (
        !answers.sessionDateSkipped
        && (answers.sessionAt === null || answers.sessionAt.getTime() <= nowMs)
    ) {
        return '/(onboarding)/session-date';
    }
    if (answers.cadence === null) return '/(onboarding)/session-cadence';
    return null;
}
