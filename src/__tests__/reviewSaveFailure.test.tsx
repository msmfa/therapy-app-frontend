import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useNoteReviews } from '../../src/features/reviews/useNoteReviews';

const mockRecordReview = jest.fn();
const mockSessions: unknown[] = [];
jest.mock('../../src/context/therapy-sessions/TherapySessionsContext', () => ({
    useTherapySessions: () => ({ scheduleSessions: mockSessions, reminderScheduleSettings: null }),
}));
jest.mock('../../src/hooks/useDeviceTimeZone', () => ({ useDeviceTimeZone: () => 'UTC' }));
jest.mock('../../src/features/reviews/reviewStore', () => ({
    listReviewsForUser: async () => [],
    recordReview: (...args: unknown[]) => mockRecordReview(...args),
    removeReview: jest.fn(),
}));

it('reports failed review storage to the caller so the modal can stay open', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockRecordReview.mockRejectedValue(new Error('database or disk is full'));
    const { result } = renderHook(() => useNoteReviews('test-user'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
        await expect(result.current.markReviewed({ id: 'test-note', createdAt: Date.now() })).rejects.toThrow('Failed to save review');
    });
    expect(result.current.error).toBe('Failed to save review');
    expect(result.current.reviews).toHaveLength(0);
    jest.restoreAllMocks();
});
