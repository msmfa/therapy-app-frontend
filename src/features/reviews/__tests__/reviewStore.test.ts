import { Reason } from '../../reminders/types';
import { backfillReviewIdentities, listReviewsForUser, recordReview } from '../reviewStore';

const mockDb = { runAsync: jest.fn(), getAllAsync: jest.fn() };
jest.mock('../../notes/useNotes', () => ({ getNotesDb: async () => mockDb }));

beforeEach(() => { jest.resetAllMocks(); });

it('writes the stable logical slot together with the original attribution evidence', async () => {
    mockDb.runAsync.mockResolvedValue({ changes: 1 });
    const occurrenceId = JSON.stringify(['review-v1', 'session-a', 'session-b', Reason.PostSleep, 0]);
    await expect(recordReview('user-a', 'note-1', {
        localDate: '2024-01-02', reason: Reason.PostSleep, gapIndex: 4,
        occurrenceAtUtc: '2024-01-02T07:00:00.000Z', occurrenceId,
    }, 123)).resolves.toBe(true);

    expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('occurrenceAtUtc, occurrenceId'),
        'note-1', 'user-a', '2024-01-02', 123, 4, Reason.PostSleep, '2024-01-02T07:00:00.000Z', occurrenceId);
});

it('restores new identities and leaves legacy rows without an invented identity', async () => {
    const legacy = { noteId: 'note-1', localDate: '2024-01-01', reviewedAt: 1, gapIndex: 0,
        reason: Reason.PostSession, occurrenceAtUtc: '2024-01-01T20:00:00.000Z' };
    const identified = { ...legacy, localDate: '2024-01-02', occurrenceId: '["review-v1","a","b","post_sleep",0]' };
    mockDb.getAllAsync.mockResolvedValue([legacy, identified]);

    expect(await listReviewsForUser('user-a')).toEqual([{ ...legacy, occurrenceId: null }, identified]);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('occurrenceAtUtc, occurrenceId'), 'user-a');
});

const legacy = { noteId: 'note-1', localDate: '2024-01-01', reviewedAt: 1, gapIndex: 7,
    reason: Reason.PostSession, occurrenceAtUtc: '2024-01-01T20:00:00.000Z', occurrenceId: null };
const currentOccurrence = { atUtc: '2024-01-01T20:00:00.000Z', localDate: '2024-01-01',
    reason: Reason.PostSession, gapIndex: 0, occurrenceId: '["review-v1","a","b","post_session",0]' };

it('backfills only a unique exact instant and kind, scoped to the original owner and row evidence', async () => {
    mockDb.runAsync.mockResolvedValue({ changes: 1 });
    const otherTime = { ...legacy, localDate: '2024-01-02', occurrenceAtUtc: '2024-01-02T20:00:00.000Z' };
    const otherKind = { ...legacy, reason: Reason.MidSession };
    const restored = await backfillReviewIdentities('user-a', [legacy, otherTime, otherKind], [currentOccurrence]);

    expect(restored).toEqual([{ ...legacy, occurrenceId: currentOccurrence.occurrenceId }, otherTime, otherKind]);
    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringMatching(/UPDATE OR IGNORE[\s\S]*userId = \?[\s\S]*occurrenceId IS NULL/),
        currentOccurrence.occurrenceId, 'user-a', 'note-1', '2024-01-01', 1, legacy.occurrenceAtUtc, Reason.PostSession);
});

it('leaves ambiguous matches and unique-index conflicts unchanged without deleting reviews', async () => {
    expect(await backfillReviewIdentities('user-a', [legacy], [currentOccurrence, { ...currentOccurrence, occurrenceId: 'another-gap' }])).toEqual([legacy]);
    expect(mockDb.runAsync).not.toHaveBeenCalled();

    mockDb.runAsync.mockResolvedValue({ changes: 0 });
    expect(await backfillReviewIdentities('user-a', [legacy], [currentOccurrence])).toEqual([legacy]);
    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
});
