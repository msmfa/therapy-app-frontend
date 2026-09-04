import type { Href } from 'expo-router';
import type { CadenceId, GoalId } from './onboardingCopy';

const ROUTE_BY_SCREEN = {
    goal: '/(onboarding)/goal',
    'session-date': '/(onboarding)/session-date',
    'session-cadence': '/(onboarding)/session-cadence',
    'reminder-times': '/(onboarding)/reminder-times',
    'plan-preview': '/(onboarding)/plan-preview',
    'reviews-preview': '/(onboarding)/reviews-preview',
    'note-preview': '/(onboarding)/note-preview',
    'subscription-preview': '/(onboarding)/subscription-preview',
    'account-preview': '/(onboarding)/account-preview',
    'notifications-preview': '/(onboarding)/notifications-preview',
    success: '/(onboarding)/success',
} as const;

export type OnboardingResumeRoute = (typeof ROUTE_BY_SCREEN)[keyof typeof ROUTE_BY_SCREEN];

const ROUTES = new Set<OnboardingResumeRoute>(Object.values(ROUTE_BY_SCREEN));

export const isOnboardingResumeRoute = (value: unknown): value is OnboardingResumeRoute =>
    typeof value === 'string' && ROUTES.has(value as OnboardingResumeRoute);

/** Converts Expo Router's focused segments into the route stored in the draft. */
export function onboardingRouteForSegments(
    segments: readonly string[],
): OnboardingResumeRoute | null {
    if (segments[0] !== '(onboarding)') return null;
    const screen = segments[1];
    return screen !== undefined && Object.prototype.hasOwnProperty.call(ROUTE_BY_SCREEN, screen)
        ? ROUTE_BY_SCREEN[screen as keyof typeof ROUTE_BY_SCREEN]
        : null;
}

type ResumeAnswers = {
    goal: GoalId | null;
    sessionAt: Date | null;
    sessionDateSkipped: boolean;
    cadence: CadenceId | null;
    resumeRoute: OnboardingResumeRoute | null;
};

/**
 * Restores the last focused step, but never skips an earlier answer that has
 * become invalid (for example, a next-session date that passed while away).
 */
export function safeOnboardingResumeRoute(
    answers: ResumeAnswers,
    nowMs: number = Date.now(),
): Href | null {
    const route = answers.resumeRoute;
    if (route === null) return null;

    // Goal is one tap from Welcome. Resuming it automatically makes a
    // deliberate Back from question 1 impossible: Welcome mounts, reads the
    // saved Goal route and immediately sends the user forward again. Keep the
    // first question selected in the draft, but let Welcome remain visible.
    if (route === '/(onboarding)/goal') return null;
    if (answers.goal === null) return '/(onboarding)/goal';

    if (route === '/(onboarding)/session-date') return route;
    if (
        !answers.sessionDateSkipped
        && (
            answers.sessionAt === null
            || Number.isNaN(answers.sessionAt.getTime())
            || answers.sessionAt.getTime() <= nowMs
        )
    ) {
        return '/(onboarding)/session-date';
    }

    if (route === '/(onboarding)/session-cadence') return route;
    if (answers.cadence === null) return '/(onboarding)/session-cadence';

    return route;
}
