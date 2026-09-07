import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useNoteReviews } from '../useNoteReviews';
import { occurrencesForGap } from '../reviewSchedule';
import type { NoteReview } from '../reviewStore';
import type { ReviewAttribution } from '../reviewAttribution';
import type { ReviewOccurrence } from '../reviewSchedule';

let mockSessions = [
    { _id: 'session-a', startsAtUtc: '2024-01-01T01:00:00.000Z' },
    { _id: 'session-b', startsAtUtc: '2024-01-15T01:00:00.000Z' },
];
let mockSettings = { timeZone: 'UTC', morningReminderMinutes: 420, eveningReminderMinutes: 1200 };
let mockRows: NoteReview[] = [];
const mockRecordReview = jest.fn().mockResolvedValue(true);
const mockBackfill = jest.fn();
let mockScheduleStatus = 'ready';

jest.mock('../../../context/therapy-sessions/TherapySessionsContext', () => ({
    useTherapySessions: () => ({ scheduleSessions: mockSessions, reminderScheduleSettings: mockSettings, reminderScheduleStatus: mockScheduleStatus }),
}));
jest.mock('../../../hooks/useDeviceTimeZone', () => ({ useDeviceTimeZone: () => mockSettings.timeZone }));
jest.mock('../reviewStore', () => ({
    listReviewsForUser: async () => mockRows,
    recordReview: (...args: unknown[]) => mockRecordReview(...args),
    backfillReviewIdentities: (...args: unknown[]) => mockBackfill(...args),
    removeReview: jest.fn(),
}));

const NOTE = { id: 'note-1', createdAt: Date.parse('2024-01-01T02:00:00.000Z') };

beforeEach(() => {
    mockSessions = [
        { _id: 'session-a', startsAtUtc: '2024-01-01T01:00:00.000Z' },
        { _id: 'session-b', startsAtUtc: '2024-01-15T01:00:00.000Z' },
    ];
    mockSettings = { timeZone: 'UTC', morningReminderMinutes: 420, eveningReminderMinutes: 1200 };
    mockRows = [];
    mockScheduleStatus = 'ready';
    mockRecordReview.mockReset().mockImplementation(async (_userId: string, noteId: string, attribution: ReviewAttribution, reviewedAt: number) => {
        mockRows = [...mockRows, { ...attribution, noteId, reviewedAt }];
        return true;
    });
    mockBackfill.mockReset().mockImplementation(async (_userId: string, rows: NoteReview[], occurrences: ReviewOccurrence[]) => {
        mockRows = rows.map((row) => {
            const matching = occurrences.filter((occurrence) => occurrence.atUtc === row.occurrenceAtUtc && occurrence.reason === row.reason);
            return matching.length === 1 ? { ...row, occurrenceId: matching[0].occurrenceId } : row;
        });
        return mockRows;
    });
});

it('saves stable identity and keeps buttons disabled when the same slot shifts to another date', async () => {
    const { result, rerender } = renderHook(() => useNoteReviews('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
        await result.current.markReviewed(NOTE, new Date('2024-01-01T20:30:00.000Z'));
    });
    expect(mockRecordReview).toHaveBeenCalledWith('user-a', NOTE.id,
        expect.objectContaining({ occurrenceId: expect.any(String) }), expect.any(Number));

    mockSettings = { ...mockSettings, timeZone: 'America/Los_Angeles' };
    rerender({});
    // The same post-session slot now falls on the preceding local date.
    const shiftedTick = new Date('2024-01-01T04:30:00.000Z');
    const state = result.current.reviewState(NOTE, shiftedTick);
    expect(state.attribution.localDate).toBe('2023-12-31');
    expect(state.withinWindow).toBe(true);
    expect(state.alreadyReviewed).toBe(true);
    expect(state.canReview).toBe(false);
    expect(result.current.isReviewed(NOTE, shiftedTick)).toBe(true);
    expect(result.current.progressFor(NOTE, new Date('2024-01-16T00:00:00.000Z')).completed).toBe(1);

    await act(async () => {
        await expect(result.current.markReviewed(NOTE, shiftedTick)).resolves.toMatchObject({ recorded: false });
    });
    expect(mockRecordReview).toHaveBeenCalledTimes(1);
});

it('restores stable completion after reopening and moving the opening session past note creation', async () => {
    const oldOccurrence = occurrencesForGap(0, {
        sessionsUtc: mockSessions.map((session) => session.startsAtUtc),
        sessionIdsByStart: Object.fromEntries(mockSessions.map((session) => [session.startsAtUtc, session._id])),
        timeZone: 'UTC',
    })[0];
    mockRows = [{
        noteId: NOTE.id, reviewedAt: Date.parse('2024-01-01T20:30:00.000Z'),
        localDate: oldOccurrence.localDate, gapIndex: 0, reason: oldOccurrence.reason,
        occurrenceAtUtc: oldOccurrence.atUtc, occurrenceId: oldOccurrence.occurrenceId,
    }];
    mockSessions = [
        { _id: 'session-a', startsAtUtc: '2024-01-02T01:00:00.000Z' },
        { _id: 'session-b', startsAtUtc: '2024-01-16T01:00:00.000Z' },
    ];
    const { result } = renderHook(() => useNoteReviews('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const state = result.current.reviewState(NOTE, new Date('2024-01-02T20:30:00.000Z'));
    expect(state.attribution.occurrenceId).toBe(oldOccurrence.occurrenceId);
    expect(state.alreadyReviewed).toBe(true);
    expect(state.canReview).toBe(false);
    expect(result.current.progressFor(NOTE, new Date('2024-01-17T00:00:00.000Z')).completed).toBe(1);
});

it('backfills an exact legacy slot once the server schedule is ready, preserving later session and zone edits', async () => {
    const oldOccurrence = occurrencesForGap(0, {
        sessionsUtc: mockSessions.map((session) => session.startsAtUtc), timeZone: 'UTC',
    })[0];
    mockRows = [{ noteId: NOTE.id, reviewedAt: Date.parse('2024-01-01T20:30:00.000Z'),
        localDate: oldOccurrence.localDate, reason: oldOccurrence.reason, gapIndex: 0,
        occurrenceAtUtc: oldOccurrence.atUtc, occurrenceId: null }];
    mockScheduleStatus = 'loading';
    const { result, rerender } = renderHook(() => useNoteReviews('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockBackfill).not.toHaveBeenCalled();

    mockScheduleStatus = 'ready';
    rerender({});
    await waitFor(() => expect(result.current.reviews[0].occurrenceId).toBeTruthy());
    expect(mockBackfill).toHaveBeenCalledTimes(1);
    expect(mockBackfill.mock.calls[0][0]).toBe('user-a');

    mockSessions = [
        { _id: 'session-a', startsAtUtc: '2024-01-01T03:00:00.000Z' },
        { _id: 'session-b', startsAtUtc: '2024-01-15T03:00:00.000Z' },
    ];
    mockSettings = { ...mockSettings, timeZone: 'America/Los_Angeles', eveningReminderMinutes: 1260 };
    rerender({});
    await waitFor(() => expect(result.current.progressFor(NOTE, new Date('2024-01-17T00:00:00.000Z')).completed).toBe(1));
    expect(result.current.progressFor(NOTE).hasSchedule).toBe(true);
    expect(mockBackfill).toHaveBeenCalledTimes(1);
});

it('does not apply a late account A migration result after account B hydration', async () => {
    const oldOccurrence = occurrencesForGap(0, { sessionsUtc: mockSessions.map((session) => session.startsAtUtc), timeZone: 'UTC' })[0];
    const oldRow = { noteId: NOTE.id, reviewedAt: 1, localDate: oldOccurrence.localDate,
        reason: oldOccurrence.reason, gapIndex: 0, occurrenceAtUtc: oldOccurrence.atUtc, occurrenceId: null };
    mockRows = [oldRow];
    let finishMigration!: (rows: NoteReview[]) => void;
    mockBackfill.mockImplementationOnce(() => new Promise((resolve) => { finishMigration = resolve; }));
    const { result, rerender } = renderHook(({ userId }) => useNoteReviews(userId), { initialProps: { userId: 'user-a' } });
    await waitFor(() => expect(mockBackfill).toHaveBeenCalledTimes(1));

    mockRows = [];
    rerender({ userId: 'user-b' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { finishMigration([{ ...oldRow, occurrenceId: 'account-a-identity' }]); });
    expect(result.current.reviews).toEqual([]);
});

it('keeps legacy reviews readable when persisting their identity fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const oldOccurrence = occurrencesForGap(0, { sessionsUtc: mockSessions.map((session) => session.startsAtUtc), timeZone: 'UTC' })[0];
    const oldRow = { noteId: NOTE.id, reviewedAt: 1, localDate: oldOccurrence.localDate,
        reason: oldOccurrence.reason, gapIndex: 0, occurrenceAtUtc: oldOccurrence.atUtc, occurrenceId: null };
    mockRows = [oldRow];
    mockBackfill.mockRejectedValueOnce(new Error('storage unavailable'));
    const { result } = renderHook(() => useNoteReviews('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.reviews).toEqual([oldRow]);
    expect(result.current.progressFor(NOTE, new Date('2024-01-16T00:00:00.000Z')).completed).toBe(1);
    expect(result.current.error).toBeNull();
    warn.mockRestore();
});

it('retains a new tick saved while an older legacy-backfill snapshot is pending', async () => {
    const oldOccurrence = occurrencesForGap(0, { sessionsUtc: mockSessions.map((session) => session.startsAtUtc), timeZone: 'UTC' })[0];
    const oldRow = { noteId: NOTE.id, reviewedAt: 1, localDate: oldOccurrence.localDate,
        reason: oldOccurrence.reason, gapIndex: 0, occurrenceAtUtc: oldOccurrence.atUtc, occurrenceId: null };
    mockRows = [oldRow];
    let finishMigration!: (rows: NoteReview[]) => void;
    mockBackfill.mockImplementationOnce(() => new Promise((resolve) => { finishMigration = resolve; }));
    const { result } = renderHook(() => useNoteReviews('user-a'));
    await waitFor(() => expect(mockBackfill).toHaveBeenCalledTimes(1));

    await act(async () => {
        await result.current.markReviewed(NOTE, new Date('2024-01-02T07:30:00.000Z'));
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reviews).toHaveLength(2);
    await act(async () => { finishMigration([{ ...oldRow, occurrenceId: 'older-backfill-result' }]); });

    expect(result.current.reviews).toHaveLength(2);
    expect(result.current.progressFor(NOTE, new Date('2024-01-17T00:00:00.000Z')).completed).toBe(2);
    expect(result.current.loading).toBe(false);
});
