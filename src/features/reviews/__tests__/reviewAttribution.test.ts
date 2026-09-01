import { describe, expect, it } from '@jest/globals';
import { Reason, type Reminder } from '../../reminders/types';
import { attributeReview } from '../reviewAttribution';

const occurrence = (
    atUtc: string,
    reason: Reason,
    localDate: string,
    gapIndex = 0,
): Reminder => ({ atUtc, reason, gapIndex, localDate });

describe('attributeReview', () => {
    // The evening reminder on the session day, and the morning one after it.
    const postSession = occurrence('2024-01-01T20:00:00.000Z', Reason.PostSession, '2024-01-01');
    const postSleep = occurrence('2024-01-02T07:00:00.000Z', Reason.PostSleep, '2024-01-02');

    const attribute = (at: string, occurrences: Reminder[]) =>
        attributeReview({ occurrences, at: new Date(at), timeZone: 'UTC' });

    it('credits a tick made minutes after the reminder to that reminder', () => {
        expect(attribute('2024-01-01T20:15:00.000Z', [postSession, postSleep])).toEqual({
            localDate: '2024-01-01',
            reason: Reason.PostSession,
            occurrenceAtUtc: postSession.atUtc,
            gapIndex: 0,
        });
    });

    it('still credits the evening reminder after midnight has rolled the date', () => {
        // The whole reason attribution is not keyed on the calendar day: this
        // tick happens on the 2nd but answers the 1st's reminder.
        expect(attribute('2024-01-02T00:20:00.000Z', [postSession, postSleep])).toMatchObject({
            localDate: '2024-01-01',
            reason: Reason.PostSession,
        });
    });

    it('never lets an evening tick reach past the next morning reminder', () => {
        // 08:00 is beyond post_sleep at 07:00, so the evening reminder is
        // closed even though its own eight-hour cap has not expired.
        expect(attribute('2024-01-02T08:00:00.000Z', [postSession, postSleep])).toMatchObject({
            localDate: '2024-01-02',
            reason: Reason.PostSleep,
        });
    });

    it('closes the evening reminder at its cap when no morning reminder follows', () => {
        // A two-day gap gives the next day to pre_session, which outranks
        // post_sleep, so nothing bounds the evening tick but its own cap.
        expect(attribute('2024-01-02T03:59:00.000Z', [postSession])).toMatchObject({
            reason: Reason.PostSession,
            localDate: '2024-01-01',
        });

        expect(attribute('2024-01-02T04:01:00.000Z', [postSession])).toMatchObject({
            reason: null,
            localDate: '2024-01-02',
        });
    });

    it('treats a review before any reminder has fired as unprompted', () => {
        expect(attribute('2024-01-01T09:00:00.000Z', [postSession, postSleep])).toEqual({
            localDate: '2024-01-01',
            reason: null,
            occurrenceAtUtc: null,
            gapIndex: null,
        });
    });

    it('treats a review days after a mid-session reminder as unprompted', () => {
        const mid = occurrence('2024-01-04T20:00:00.000Z', Reason.MidSession, '2024-01-04');

        expect(attribute('2024-01-05T19:00:00.000Z', [mid])).toMatchObject({
            reason: Reason.MidSession,
        });
        // Cadence is four days; a tick two days late is a new act of review.
        expect(attribute('2024-01-06T19:00:00.000Z', [mid])).toMatchObject({
            reason: null,
            localDate: '2024-01-06',
        });
    });

    it('uses the occurrence day, not the tick day, west of UTC', () => {
        // 20:00 in Los Angeles on the 1st is 04:00 UTC on the 2nd.
        const evening = occurrence('2024-01-02T04:00:00.000Z', Reason.PostSession, '2024-01-01');

        const result = attributeReview({
            occurrences: [evening],
            at: new Date('2024-01-02T05:00:00.000Z'),
            timeZone: 'America/Los_Angeles',
        });

        expect(result.localDate).toBe('2024-01-01');
    });

    it('falls back to the tick day when handed nothing to answer', () => {
        expect(attribute('2024-01-03T12:00:00.000Z', [])).toEqual({
            localDate: '2024-01-03',
            reason: null,
            occurrenceAtUtc: null,
            gapIndex: null,
        });
    });

    it('honours a caller-supplied grace override', () => {
        const result = attributeReview({
            occurrences: [postSession],
            at: new Date('2024-01-01T21:30:00.000Z'),
            timeZone: 'UTC',
            graceHours: { [Reason.PostSession]: 1 },
        });

        expect(result.reason).toBeNull();
    });
});
