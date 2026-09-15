import type { PlanTimelineEntry } from '../../onboarding/planTimeline';
import {
    intervalCardsFromPlan,
    intervalCardsFromSchedule,
} from '../intervalCards';
import { Reason } from '../types';
import { ReminderType } from '../../../utils/types';
import { i18next } from '../../../i18n';

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
    describe('caption language', () => {
        // Every test above passes an explicit locale, which left the default
        // untested. The default was `undefined`, both callers relied on it,
        // and `undefined` means Hermes's own locale: "en-GB" whatever the app
        // language is. A French user read "Wed, 16 Sep · next of 3".
        const entries = (count: number): PlanTimelineEntry[] => [{
            id: 'pre_session',
            label: 'The night before',
            body: 'One last look.',
            researchTarget: ReminderType.EarlyConsolidation,
            at: new Date('2026-09-16T19:00:00.000Z'),
            occurrences: Array.from({ length: count }, () => new Date('2026-09-16T19:00:00.000Z')),
        }];

        afterEach(async () => {
            await i18next.changeLanguage('en');
        });

        it('formats the date in the app language when no locale is given', async () => {
            await i18next.changeLanguage('fr');
            const [card] = intervalCardsFromPlan(entries(1));

            expect(card.caption).toContain('sept');
            expect(card.caption).not.toContain('Sep ');
        });

        it('translates the occurrence count', async () => {
            await i18next.changeLanguage('fr');
            expect(intervalCardsFromPlan(entries(3))[0].caption).toContain('prochain sur 3');

            await i18next.changeLanguage('en');
            expect(intervalCardsFromPlan(entries(3))[0].caption).toContain('next of 3');
        });

        it('omits the count when there is only one occurrence', () => {
            expect(intervalCardsFromPlan(entries(1))[0].caption).not.toContain('next of');
        });
    });
});
