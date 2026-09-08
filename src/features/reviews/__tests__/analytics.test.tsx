import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useNoteReviews } from '../useNoteReviews';

const mockSessions: unknown[] = [];
const mockRecord = jest.fn();
const mockCompleted = jest.fn();
const mockFailed = jest.fn();
let mockEpoch = 0;
const mockBegin = jest.fn(() => {
    const epoch = mockEpoch;
    return { reviewCompleted: (...args: unknown[]) => { if (epoch === mockEpoch) mockCompleted(...args); },
        failed: (...args: unknown[]) => { if (epoch === mockEpoch) mockFailed(...args); } };
});
jest.mock('../../analytics/engagement', () => ({ beginEngagement: () => mockBegin() }));
jest.mock('../../../context/therapy-sessions/TherapySessionsContext', () => ({
    useTherapySessions: () => ({ scheduleSessions: mockSessions, reminderScheduleSettings: null }),
}));
jest.mock('../../../hooks/useDeviceTimeZone', () => ({ useDeviceTimeZone: () => 'UTC' }));
jest.mock('../reviewStore', () => ({
    listReviewsForUser: async () => [], recordReview: (...args: unknown[]) => mockRecord(...args), removeReview: jest.fn(),
}));

beforeEach(() => { jest.clearAllMocks(); mockEpoch += 1; jest.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { jest.restoreAllMocks(); });
const NOTE = { id: 'private-note-id', createdAt: 1 };

it('reports only a newly persisted review, never hydration or duplicate attempts', async () => {
    mockRecord.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useNoteReviews('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockCompleted).not.toHaveBeenCalled();
    await act(async () => { await result.current.markReviewed(NOTE, new Date('2026-01-01T12:00:00Z')); });
    await act(async () => { await result.current.markReviewed(NOTE, new Date('2026-01-01T12:00:00Z')); });
    await act(async () => { await result.current.markReviewed(NOTE, new Date('2026-01-02T12:00:00Z')); });
    expect(mockCompleted).toHaveBeenCalledTimes(1);
    expect(mockCompleted).toHaveBeenCalledWith(NOTE.id, Date.parse('2026-01-01T12:00:00Z'), 'unprompted', expect.any(Function));
});

it('does not claim success after a storage failure', async () => {
    mockRecord.mockRejectedValueOnce(new Error('private failure text'));
    const { result } = renderHook(() => useNoteReviews('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await expect(result.current.markReviewed(NOTE)).rejects.toThrow('Failed to save review'); });
    expect(mockCompleted).not.toHaveBeenCalled();
    expect(mockFailed).toHaveBeenCalledWith('review_save');
});

it('begins the analytics scope before persistence and drops a late old-account result', async () => {
    let finish!: (result: boolean) => void;
    mockRecord.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const { result, rerender } = renderHook(({ user }) => useNoteReviews(user), { initialProps: { user: 'user-a' } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let save!: Promise<unknown>;
    act(() => { save = result.current.markReviewed(NOTE); });
    expect(mockBegin).toHaveBeenCalledTimes(1);
    mockEpoch += 1;
    rerender({ user: 'user-b' });
    await act(async () => { finish(true); await save; });
    expect(mockCompleted).not.toHaveBeenCalled();
});
