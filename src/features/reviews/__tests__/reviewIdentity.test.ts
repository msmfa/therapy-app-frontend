import { Reason } from '../../reminders/types';
import { attributeReview } from '../reviewAttribution';
import { noteReviewProgress } from '../reviewProgress';
import { occurrencesForGap, type ReviewOccurrence, type ReviewScheduleInput } from '../reviewSchedule';
import type { NoteReview } from '../reviewStore';

const INPUT: ReviewScheduleInput = {
    sessionsUtc: ['2024-01-01T14:00:00.000Z', '2024-01-15T14:00:00.000Z'],
    sessionIdsByStart: { '2024-01-01T14:00:00.000Z': 'session-a', '2024-01-15T14:00:00.000Z': 'session-b' },
    timeZone: 'UTC',
};
const CREATED_AT = Date.parse('2024-01-01T15:00:00.000Z');

const recorded = (occurrence: ReviewOccurrence): NoteReview => ({
    noteId: 'note-1',
    reviewedAt: Date.parse(occurrence.atUtc) + 60_000,
    localDate: occurrence.localDate,
    reason: occurrence.reason,
    gapIndex: occurrence.gapIndex,
    occurrenceAtUtc: occurrence.atUtc,
    occurrenceId: occurrence.occurrenceId,
});

const progress = (input: ReviewScheduleInput, reviews: NoteReview[], createdAt = CREATED_AT) => noteReviewProgress({
    ...input, createdAt, reviews, noteId: 'note-1', now: new Date('2024-02-01T00:00:00.000Z'),
});

it('persists the generated logical identity when attributing a review', () => {
    const occurrences = occurrencesForGap(0, INPUT);
    const attribution = attributeReview({
        occurrences, timeZone: 'UTC', at: new Date(Date.parse(occurrences[0].atUtc) + 60_000),
    });
    expect(attribution.occurrenceId).toBe(occurrences[0].occurrenceId);
    expect(attribution.occurrenceId).toBeTruthy();
});

it('preserves every completed logical reminder when morning and evening preferences change', () => {
    const before = occurrencesForGap(0, INPUT);
    const after = progress({ ...INPUT, morningMinutes: 540, reflectionMinutes: 1320 }, before.map(recorded));

    expect(after.completed).toBe(before.length);
    expect(after.isComplete).toBe(true);
    expect(after.segments[0].occurrence.atUtc).not.toBe(before[0].atUtc);
});

it('preserves completion when a timezone change moves the reminder to another local date', () => {
    const beforeInput = {
        ...INPUT,
        sessionsUtc: ['2024-01-01T01:00:00.000Z', '2024-01-15T01:00:00.000Z'],
        sessionIdsByStart: { '2024-01-01T01:00:00.000Z': 'session-a', '2024-01-15T01:00:00.000Z': 'session-b' },
    };
    const before = occurrencesForGap(0, beforeInput)[0];
    const after = progress({ ...beforeInput, timeZone: 'America/Los_Angeles' }, [recorded(before)]);

    expect(after.segments[0].occurrence.localDate).not.toBe(before.localDate);
    expect(after.segments[0].status).toBe('done');
    expect(after.completed).toBe(1);
});

it('keeps the original gap after its sessions move past the note creation time', () => {
    const before = occurrencesForGap(0, INPUT);
    const after = progress({
        ...INPUT,
        sessionsUtc: ['2024-01-02T14:00:00.000Z', '2024-01-16T14:00:00.000Z'],
        sessionIdsByStart: { '2024-01-02T14:00:00.000Z': 'session-a', '2024-01-16T14:00:00.000Z': 'session-b' },
    }, before.map(recorded));

    expect(after.hasSchedule).toBe(true);
    expect(after.isComplete).toBe(true);
    expect(after.segments[0].occurrence.localDate).toBe('2024-01-02');
});

it('keeps stable completion when earlier unrelated history leaves the session list', () => {
    const extended = {
        ...INPUT,
        sessionsUtc: ['2023-12-25T14:00:00.000Z', ...INPUT.sessionsUtc],
        sessionIdsByStart: { '2023-12-25T14:00:00.000Z': 'earlier', ...INPUT.sessionIdsByStart },
    };
    const before = occurrencesForGap(1, extended)[0];
    const after = progress(INPUT, [recorded(before)]);

    expect(before.gapIndex).toBe(1);
    expect(after.gapIndex).toBe(0);
    expect(after.completed).toBe(1);
});

it('does not give one completed repeated mid-session review credit for every mid-session slot', () => {
    const mids = occurrencesForGap(0, INPUT).filter((occurrence) => occurrence.reason === Reason.MidSession);
    expect(mids.length).toBeGreaterThan(1);
    const after = progress({ ...INPUT, reflectionMinutes: 1320 }, [recorded(mids[1])]);
    expect(after.completed).toBe(1);
    expect(after.segments.filter((segment) => segment.status === 'done')[0].occurrence.localDate).toBe(mids[1].localDate);
});

it('uses the cadence day rather than renumbering slots after daily deduplication', () => {
    const earlyCandidate = occurrencesForGap(0, { ...INPUT, startAfterDays: 1, cadenceDays: 4 });
    const laterStart = occurrencesForGap(0, { ...INPUT, startAfterDays: 5, cadenceDays: 4 });
    const before = earlyCandidate.filter((occurrence) => occurrence.reason === Reason.MidSession);
    const after = laterStart.filter((occurrence) => occurrence.reason === Reason.MidSession);
    expect(before.map((occurrence) => occurrence.localDate)).toEqual(['2024-01-06', '2024-01-10']);
    expect(after.map((occurrence) => occurrence.occurrenceId)).toEqual(before.map((occurrence) => occurrence.occurrenceId));
});

it('does not transfer an identified review to replacement sessions at the same times', () => {
    const before = occurrencesForGap(0, INPUT)[0];
    const after = progress({
        ...INPUT,
        sessionIdsByStart: { '2024-01-01T14:00:00.000Z': 'replacement-a', '2024-01-15T14:00:00.000Z': 'replacement-b' },
    }, [recorded(before)]);
    expect(after.completed).toBe(0);
});

it('does not discard a known identity when the current schedule has incomplete session IDs', () => {
    const before = occurrencesForGap(0, INPUT)[0];
    expect(progress({ ...INPUT, sessionIdsByStart: undefined }, [recorded(before)]).completed).toBe(0);
    expect(progress({ ...INPUT, sessionIdsByStart: { '2024-01-01T14:00:00.000Z': 'session-a' } }, [recorded(before)]).completed).toBe(0);
});

it('recovers legacy completed kinds within the same gap after reminder-time edits', () => {
    const before = occurrencesForGap(0, INPUT);
    const legacy = before.map((occurrence) => ({ ...recorded(occurrence), occurrenceId: null, gapIndex: 7 }));
    expect(progress({ ...INPUT, morningMinutes: 540, reflectionMinutes: 1320 }, legacy).isComplete).toBe(true);
});

it('recovers a legacy singleton across timezone date changes without guessing repeated mid slots', () => {
    const input = {
        ...INPUT,
        sessionsUtc: ['2024-01-01T01:00:00.000Z', '2024-01-15T01:00:00.000Z'],
        sessionIdsByStart: { '2024-01-01T01:00:00.000Z': 'session-a', '2024-01-15T01:00:00.000Z': 'session-b' },
    };
    const before = occurrencesForGap(0, input);
    const legacy = before.map((occurrence) => ({ ...recorded(occurrence), occurrenceId: null }));
    const after = progress({ ...input, timeZone: 'America/Los_Angeles' }, legacy);
    expect(after.segments.filter((segment) => segment.occurrence.reason !== Reason.MidSession)
        .every((segment) => segment.status === 'done')).toBe(true);
    expect(after.segments.filter((segment) => segment.occurrence.reason === Reason.MidSession)
        .every((segment) => segment.status !== 'done')).toBe(true);
});
