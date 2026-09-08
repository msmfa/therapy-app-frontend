import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../../src/context/auth/AuthContext';
import { apiGet } from '../../src/api/client';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { noteReviewProgress } from '../../src/features/reviews/reviewProgress';
import { Reason } from '../../src/features/reminders/types';

jest.mock('@sentry/react-native', () => ({
    withScope: (fn: any) => fn({ setTag: jest.fn(), setContext: jest.fn(), setFingerprint: jest.fn() }),
    captureException: jest.fn(),
}));

const response = (status: number, body: unknown) => ({
    status, ok: status >= 200 && status < 300,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
} as Response);

afterEach(() => jest.restoreAllMocks());

it('preserves both appointments that fall on the same local day', () => {
    // Construct local dates so this test is independent of the host time zone.
    // These can originate on different calendar days before a traveller changes
    // device time zone, or from the backend which permits multiple daily visits.
    const morning = new Date(2027, 0, 12, 9);
    const afternoon = new Date(2027, 0, 12, 16);
    const result = convertSessionsToCalendarFormat([
        { _id: 'session-1', startsAtUtc: morning.toISOString(), durationMin: 50 },
        { _id: 'session-2', startsAtUtc: afternoon.toISOString(), durationMin: 50 },
    ]);
    expect(Object.values(result)).toHaveLength(2);
    expect(result['session-1']).toEqual(morning);
    expect(result['session-2']).toEqual(afternoon);
});

it('keeps a valid persisted session during a temporary refresh outage', async () => {
    const stored: Record<string, string> = {
        token: 'expired-access-token', refreshToken: 'still-valid-refresh-token',
        user: JSON.stringify({ id: 'account-a', email: 'a@example.com', name: 'A' }),
    };
    jest.spyOn(SecureStore, 'getItemAsync').mockImplementation(async key => stored[key] ?? null);
    const clear = jest.spyOn(SecureStore, 'deleteItemAsync').mockResolvedValue();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce(response(401, { error: 'jwt expired' }))
        .mockRejectedValueOnce(new TypeError('Network request failed'));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    await act(async () => {
        await expect(apiGet('/api/users/me')).rejects.toMatchObject({ status: 0 });
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.isAuthenticated).toBe(true);
    expect(clear).not.toHaveBeenCalledWith('refreshToken');
});

it('preserves completed reviews when earlier session history leaves the fetched window', () => {
    const sessionsUtc = ['2027-01-01T14:00:00.000Z', '2027-01-08T14:00:00.000Z', '2027-01-15T14:00:00.000Z'];
    const input = {
        sessionsUtc, timeZone: 'UTC', createdAt: Date.parse('2027-01-08T15:00:00Z'), noteId: 'note-1',
        reviews: [{ noteId: 'note-1', localDate: '2027-01-08', reviewedAt: Date.parse('2027-01-08T21:00:00Z'),
            gapIndex: 1, reason: Reason.PostSession, occurrenceAtUtc: '2027-01-08T20:00:00.000Z' }],
        now: new Date('2027-01-16T00:00:00Z'),
    };
    expect(noteReviewProgress(input).completed).toBe(1);
    // The note and both ends of its gap still exist; only an unrelated earlier
    // session falls out of the provider's rolling 90-day query.
    const after = noteReviewProgress({ ...input, sessionsUtc: sessionsUtc.slice(1) });
    expect(after.completed).toBe(1);
    expect(after.segments[0].status).toBe('done');
});

it('refreshes an expired access token before unregistering the push device on logout', async () => {
    const stored: Record<string, string> = {
        token: 'expired-access-token', refreshToken: 'valid-refresh-token',
        user: JSON.stringify({ id: 'account-a', email: 'a@example.com', name: 'A' }),
    };
    jest.spyOn(SecureStore, 'getItemAsync').mockImplementation(async key => stored[key] ?? null);
    jest.spyOn(SecureStore, 'deleteItemAsync').mockResolvedValue();
    const fetchMock = jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce(response(200, { token: 'fresh-access', refreshToken: 'fresh-refresh', user: { id: 'account-a', email: 'a@example.com', name: 'A' } }))
        .mockResolvedValueOnce(response(204, null));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    let cleanupError: any;
    result.current.registerSignOutTask(async () => {
        const { apiDelete } = require('../../src/api/client');
        await apiDelete('/api/devices', { body: { pushToken: 'mock-token' } }).catch((e: unknown) => { cleanupError = e; });
    });
    await act(async () => { await result.current.signOut(); });
    expect(result.current.isAuthenticated).toBe(false);
    expect(cleanupError).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1][1]?.headers as Headers).get('Authorization')).toBe('Bearer fresh-access');
});
