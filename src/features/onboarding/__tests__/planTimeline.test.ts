import { planTimeline, postSessionNoteAt } from '../planTimeline';
import { ReminderType } from '../../../utils/types';

const at = (iso: string) => new Date(iso);

const MORNING = 7 * 60 + 30;
const EVENING = 20 * 60;

describe('planTimeline', () => {
    it('keeps the note prompt separate from the four review moments', () => {
        const entries = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });

        expect(entries.map((entry) => entry.id)).toEqual([
            'log_note',
            'post_session',
            'post_sleep',
            'mid_session',
            'pre_session',
        ]);

        const times = entries.map((entry) => entry.at.getTime());
        expect(times).toEqual([...times].sort((a, b) => a - b));
    });

    it('gives every reminder its own research destination', () => {
        const entries = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });

        expect(entries.map((entry) => entry.researchTarget)).toEqual([
            null,
            ReminderType.EarlyConsolidation,
            ReminderType.SleepDependentConsolidation,
            ReminderType.SpacedReactivation,
            ReminderType.StateReinstatement,
        ]);
    });

    it('prompts for the note ten minutes after a 50-minute session', () => {
        const [logNote] = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });

        expect(logNote.id).toBe('log_note');
        expect(logNote.at.getDate()).toBe(3);
        expect(logNote.at.getHours()).toBe(18);
        expect(logNote.at.getMinutes()).toBe(0);
    });

    it('does not let the evening reflection time change the note prompt', () => {
        const sessionAt = at('2026-03-03T17:00:00');

        expect(postSessionNoteAt(sessionAt)).toEqual(at('2026-03-03T18:00:00'));

        const earlyEvening = planTimeline({
            sessionAt,
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: 18 * 60 + 30,
        })[0];
        const lateEvening = planTimeline({
            sessionAt,
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: 23 * 60,
        })[0];

        expect(earlyEvening.at).toEqual(lateEvening.at);
        expect(earlyEvening.at).toEqual(at('2026-03-03T18:00:00'));
    });

    it('drops an evening review that would happen during the session', () => {
        const entries = planTimeline({
            sessionAt: at('2026-03-03T19:45:00'),
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });

        expect(entries[0].id).toBe('log_note');
        expect(entries[0].at.getHours()).toBe(20);
        expect(entries[0].at.getMinutes()).toBe(45);
        expect(entries.some((entry) => entry.id === 'post_session')).toBe(false);
    });

    it('uses the chosen morning time the day after the session', () => {
        const entries = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'weekly',
            morningMinutes: 6 * 60 + 15,
            eveningMinutes: EVENING,
        });
        const postSleep = entries.find((entry) => entry.id === 'post_sleep');

        expect(postSleep?.at.getDate()).toBe(4);
        expect(postSleep?.at.getHours()).toBe(6);
        expect(postSleep?.at.getMinutes()).toBe(15);
    });

    it('places the pre-session review the evening before the next session', () => {
        const weekly = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        }).find((entry) => entry.id === 'pre_session');
        const fortnightly = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'fortnightly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        }).find((entry) => entry.id === 'pre_session');

        expect(weekly?.at.getDate()).toBe(9);
        expect(fortnightly?.at.getDate()).toBe(16);
    });

    it('omits the pre-session review when the schedule varies', () => {
        const entries = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'varies',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });

        // The log-note prompt is anchored to the confirmed session. Review
        // reminders need a known following session to define their gap.
        expect(entries.map((entry) => entry.id)).toEqual(['log_note']);
        expect(entries.every((entry) => entry.at.getTime() >= at('2026-03-03T17:00:00').getTime())).toBe(true);
    });

    it('omits the pre-session review when cadence was never answered', () => {
        const entries = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: null,
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });

        expect(entries.some((entry) => entry.id === 'pre_session')).toBe(false);
    });

    it('still shows the note prompt derived from the confirmed session', () => {
        const entries = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'varies',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });

        expect(entries.find((entry) => entry.id === 'log_note')?.at.getDate()).toBe(3);
        expect(entries.some((entry) => entry.id !== 'log_note')).toBe(false);
    });

    it('does not promise a morning review while an overnight session is still running', () => {
        const entries = planTimeline({
            sessionAt: at('2026-03-03T23:30:00'),
            cadence: 'weekly',
            morningMinutes: 10,
            eveningMinutes: EVENING,
        });

        expect(entries.some((entry) => entry.id === 'post_sleep')).toBe(false);
    });

    it('keeps the between-sessions review inside the gap', () => {
        const weekly = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        }).find((entry) => entry.id === 'mid_session');

        // The scheduler's first spaced reactivation: three days on, in the evening.
        expect(weekly?.at.getDate()).toBe(6);
        expect(weekly?.at.getHours()).toBe(20);
    });
});

describe('the post-therapy note reminder', () => {
    it('fires ten minutes after a 50 minute session ends', () => {
        // 17:00 + 50 minutes of therapy + 10 = 18:00.
        expect(postSessionNoteAt(at('2026-03-03T17:00:00'))).toEqual(at('2026-03-03T18:00:00'));
    });

    it('is unmoved by the evening reflection time', () => {
        const early = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: 18 * 60,
        });
        const late = planTimeline({
            sessionAt: at('2026-03-03T17:00:00'),
            cadence: 'weekly',
            morningMinutes: MORNING,
            eveningMinutes: 22 * 60,
        });

        const noteOf = (entries: typeof early) =>
            entries.find((entry) => entry.id === 'log_note')?.at;

        expect(noteOf(early)).toEqual(at('2026-03-03T18:00:00'));
        expect(noteOf(late)).toEqual(noteOf(early));
    });

    it('tracks the session time, not the clock', () => {
        expect(postSessionNoteAt(at('2026-03-03T09:15:00'))).toEqual(at('2026-03-03T10:15:00'));
        expect(postSessionNoteAt(at('2026-03-03T20:30:00'))).toEqual(at('2026-03-03T21:30:00'));
    });
});

describe('spaced reviews between sessions', () => {
    const midDates = (cadence: 'weekly' | 'fortnightly' | 'monthly' | 'varies' | null) =>
        planTimeline({
            sessionAt: at('2026-09-09T17:00:00'),
            cadence,
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        })
            .filter((entry) => entry.id === 'mid_session')
            // One grouped entry now carries every spaced review.
            .flatMap((entry) => entry.occurrences)
            .map((date) => date.getDate());

    it('sends one for a weekly gap', () => {
        // startAfterDays 3, then 7 is not inside a 7 day gap.
        expect(midDates('weekly')).toEqual([12]);
    });

    it('sends three across a fortnightly gap, leaving no ten day hole', () => {
        // Days 3, 7 and 11 after a session on the 9th.
        expect(midDates('fortnightly')).toEqual([12, 16, 20]);
    });

    it('steps the whole way through a monthly gap', () => {
        const dates = midDates('monthly');

        expect(dates.length).toBeGreaterThan(3);
        // Every one falls before the pre-session review.
        const plan = planTimeline({
            sessionAt: at('2026-09-09T17:00:00'),
            cadence: 'monthly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });
        const pre = plan.find((entry) => entry.id === 'pre_session');
        plan
            .filter((entry) => entry.id === 'mid_session')
            .flatMap((entry) => entry.occurrences)
            .forEach((date) => expect(date.getTime()).toBeLessThan(pre!.at.getTime()));
    });

    it('never puts a spaced review on the pre-session evening', () => {
        // The server sends at most one review a day and the pre-session one wins.
        (['weekly', 'fortnightly', 'monthly'] as const).forEach((cadence) => {
            const plan = planTimeline({
                sessionAt: at('2026-09-09T17:00:00'),
                cadence,
                morningMinutes: MORNING,
                eveningMinutes: EVENING,
            });
            const pre = plan.find((entry) => entry.id === 'pre_session');
            const clash = plan
                .filter((entry) => entry.id === 'mid_session')
                .flatMap((entry) => entry.occurrences)
                .some((date) => date.toDateString() === pre?.at.toDateString());

            expect(clash).toBe(false);
        });
    });

    it('shows no invented reactivation when no next session is known', () => {
        expect(midDates('varies')).toEqual([]);
        expect(midDates(null)).toEqual([]);
    });

    it('keeps the whole plan in chronological order', () => {
        const times = planTimeline({
            sessionAt: at('2026-09-09T17:00:00'),
            cadence: 'fortnightly',
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        }).map((entry) => entry.at.getTime());

        expect(times).toEqual([...times].sort((a, b) => a - b));
    });
});

describe('grouping the spaced reviews', () => {
    const plan = (cadence: 'weekly' | 'fortnightly' | 'monthly') =>
        planTimeline({
            sessionAt: at('2026-09-09T17:00:00'),
            cadence,
            morningMinutes: MORNING,
            eveningMinutes: EVENING,
        });

    it('is one row however many reviews it holds', () => {
        (['weekly', 'fortnightly', 'monthly'] as const).forEach((cadence) => {
            expect(plan(cadence).filter((entry) => entry.id === 'mid_session')).toHaveLength(1);
        });
    });

    it('carries every date on that one row', () => {
        const [mid] = plan('fortnightly').filter((entry) => entry.id === 'mid_session');

        expect(mid.occurrences.map((date) => date.getDate())).toEqual([12, 16, 20]);
    });

    it('leads with the first occurrence, so `at` still means something', () => {
        const [mid] = plan('fortnightly').filter((entry) => entry.id === 'mid_session');

        expect(mid.at).toEqual(mid.occurrences[0]);
    });

    it('gives every other step a single occurrence', () => {
        plan('fortnightly')
            .filter((entry) => entry.id !== 'mid_session')
            .forEach((entry) => {
                expect(entry.occurrences).toEqual([entry.at]);
            });
    });
});
