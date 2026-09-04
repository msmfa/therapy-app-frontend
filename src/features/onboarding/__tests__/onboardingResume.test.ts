import {
    isOnboardingResumeRoute,
    onboardingRouteForSegments,
    safeOnboardingResumeRoute,
} from '../onboardingResume';

const futureSession = new Date('2026-09-10T17:00:00.000Z');
const now = new Date('2026-09-04T12:00:00.000Z').getTime();

describe('onboarding route persistence', () => {
    it('records only known screens inside the onboarding group', () => {
        expect(onboardingRouteForSegments(['(onboarding)', 'reminder-times']))
            .toBe('/(onboarding)/reminder-times');
        expect(onboardingRouteForSegments(['(tabs)', 'calendar'])).toBeNull();
        expect(onboardingRouteForSegments(['(onboarding)', 'missing-screen'])).toBeNull();
    });

    it('accepts only a known onboarding route from storage', () => {
        expect(isOnboardingResumeRoute('/(onboarding)/success')).toBe(true);
        expect(isOnboardingResumeRoute('/(tabs)/calendar')).toBe(false);
        expect(isOnboardingResumeRoute(null)).toBe(false);
    });

    it('resumes the exact saved step when its prerequisites are still valid', () => {
        expect(safeOnboardingResumeRoute({
            goal: 'remember',
            sessionAt: futureSession,
            sessionDateSkipped: false,
            cadence: 'weekly',
            resumeRoute: '/(onboarding)/note-preview',
        }, now)).toBe('/(onboarding)/note-preview');
    });

    it('does not bounce a deliberate Back from the first question to that question again', () => {
        expect(safeOnboardingResumeRoute({
            goal: 'remember',
            sessionAt: null,
            sessionDateSkipped: false,
            cadence: null,
            resumeRoute: '/(onboarding)/goal',
        }, now)).toBeNull();
    });

    it('never skips the first missing or expired prerequisite', () => {
        expect(safeOnboardingResumeRoute({
            goal: null,
            sessionAt: futureSession,
            sessionDateSkipped: false,
            cadence: 'weekly',
            resumeRoute: '/(onboarding)/note-preview',
        }, now)).toBe('/(onboarding)/goal');

        expect(safeOnboardingResumeRoute({
            goal: 'remember',
            sessionAt: new Date(now - 1),
            sessionDateSkipped: false,
            cadence: 'weekly',
            resumeRoute: '/(onboarding)/note-preview',
        }, now)).toBe('/(onboarding)/session-date');

        expect(safeOnboardingResumeRoute({
            goal: 'remember',
            sessionAt: futureSession,
            sessionDateSkipped: false,
            cadence: null,
            resumeRoute: '/(onboarding)/note-preview',
        }, now)).toBe('/(onboarding)/session-cadence');
    });

    it('resumes a later step when the user explicitly chose the sample plan', () => {
        expect(safeOnboardingResumeRoute({
            goal: 'remember',
            sessionAt: null,
            sessionDateSkipped: true,
            cadence: 'weekly',
            resumeRoute: '/(onboarding)/plan-preview',
        }, now)).toBe('/(onboarding)/plan-preview');
    });
});
