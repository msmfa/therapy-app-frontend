import type { OnboardingAnswers } from './OnboardingAnswersContext';
import { nextSessionAfterFirst } from './sessionSeries';
import { occurrencesForGap } from '../reviews/reviewSchedule';
import { occurrenceWindows } from '../reviews/reviewAttribution';

/** Use the same scheduling and credit boundaries as the live review feature. */
export function firstStreakReviewWindow(answers: Pick<OnboardingAnswers,
    'sessionAt' | 'cadence' | 'morningMinutes' | 'eveningMinutes'>) {
    if (!answers.sessionAt) return null;
    const nextSession = nextSessionAfterFirst({
        firstSessionAt: answers.sessionAt,
        cadence: answers.cadence,
    });
    if (!nextSession) return null;
    const occurrences = occurrencesForGap(0, {
        sessionsUtc: [answers.sessionAt.toISOString(), nextSession.toISOString()],
        morningMinutes: answers.morningMinutes,
        reflectionMinutes: answers.eveningMinutes,
    });
    return occurrenceWindows(occurrences)[0] ?? null;
}
