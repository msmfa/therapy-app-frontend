import { firstIncompletePlanRoute } from '../flowGuard';

const FUTURE = new Date('2026-09-10T17:00:00.000Z');
const NOW = Date.parse('2026-09-04T12:00:00.000Z');

describe('firstIncompletePlanRoute', () => {
    it('returns the earliest missing answer', () => {
        expect(firstIncompletePlanRoute({ goal: null, sessionAt: null, sessionDateSkipped: false, cadence: null }, NOW))
            .toBe('/(onboarding)/goal');
        expect(firstIncompletePlanRoute({ goal: 'remember', sessionAt: null, sessionDateSkipped: false, cadence: null }, NOW))
            .toBe('/(onboarding)/session-date');
        expect(firstIncompletePlanRoute({ goal: 'remember', sessionAt: FUTURE, sessionDateSkipped: false, cadence: null }, NOW))
            .toBe('/(onboarding)/session-cadence');
    });

    it('rejects a session that passed before onboarding finished', () => {
        expect(firstIncompletePlanRoute({
            goal: 'remember',
            sessionAt: new Date(NOW - 1),
            sessionDateSkipped: false,
            cadence: 'weekly',
        }, NOW)).toBe('/(onboarding)/session-date');
    });

    it('returns null for a complete usable plan', () => {
        expect(firstIncompletePlanRoute({
            goal: 'remember',
            sessionAt: FUTURE,
            sessionDateSkipped: false,
            cadence: 'weekly',
        }, NOW)).toBeNull();
    });

    it('accepts the explicit sample-plan path without inventing a session', () => {
        expect(firstIncompletePlanRoute({
            goal: 'remember',
            sessionAt: null,
            sessionDateSkipped: true,
            cadence: 'weekly',
        }, NOW)).toBeNull();
    });
});
