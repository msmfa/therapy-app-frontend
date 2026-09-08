import type { PlanTimelineEntry } from '../../onboarding/planTimeline';
import {
    intervalCardsFromPlan,
    intervalCardsFromSchedule,
} from '../intervalCards';
import { Reason } from '../types';
import { ReminderType } from '../../../utils/types';

describe('interval science cards', () => {
    it('uses the exact times from the onboarding plan and omits the separate note prompt', () => {
        const entries: PlanTimelineEntry[] = [
            {
                id: 'log_note',
                label: 'After your session',
                body: 'Capture what mattered.',
                researchTarget: null,
                at: new Date('2026-03-03T18:00:00.000Z'),
                occurrences: [new Date('2026-03-03T18:00:00.000Z')],
            },
            {
                id: 'post_session',
                label: 'Later that evening',
                body: 'Return to your note.',
                researchTarget: ReminderType.EarlyConsolidation,
                at: new Date('2026-03-03T20:15:00.000Z'),
                occurrences: [new Date('2026-03-03T20:15:00.000Z')],
            },
        ];

        const cards = intervalCardsFromPlan(entries, 'en-GB');

        expect(cards).toHaveLength(1);
        expect(cards[0]).toMatchObject({
            reason: Reason.PostSession,
            time: '20:15',
        });
        expect(cards[0].caption).toContain('3 Mar');
    });

    it('uses the server time zone and groups repeated scheduled reviews', () => {
        const cards = intervalCardsFromSchedule(
            [
                {
                    atUtc: '2026-03-06T20:15:00.000Z',
                    localDate: '2026-03-06',
                    reason: Reason.MidSession,
                    gapIndex: 0,
                },
                {
                    atUtc: '2026-03-10T20:15:00.000Z',
                    localDate: '2026-03-10',
                    reason: Reason.MidSession,
                    gapIndex: 0,
                },
            ],
            'America/New_York',
            'en-GB',
        );

        expect(cards).toHaveLength(1);
        expect(cards[0]).toMatchObject({
            reason: Reason.MidSession,
            time: '15:15',
        });
        expect(cards[0].caption).toContain('next of 2');
        expect(cards[0].caption).toMatch(/EST|GMT-5/);
    });

    it('orders card types by their next real occurrence and drops invalid instants', () => {
        const cards = intervalCardsFromSchedule(
            [
                {
                    atUtc: '2026-03-05T08:00:00.000Z',
                    localDate: '2026-03-05',
                    reason: Reason.PostSleep,
                    gapIndex: 0,
                },
                {
                    atUtc: 'not-a-date',
                    localDate: '2026-03-04',
                    reason: Reason.MidSession,
                    gapIndex: 0,
                },
                {
                    atUtc: '2026-03-04T20:00:00.000Z',
                    localDate: '2026-03-04',
                    reason: Reason.PostSession,
                    gapIndex: 0,
                },
            ],
            'UTC',
            'en-GB',
        );

        expect(cards.map(({ reason }) => reason)).toEqual([
            Reason.PostSession,
            Reason.PostSleep,
        ]);
    });
});
