import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useTimeZoneSync } from '../useTimeZoneSync';
import { updateCurrentUser } from '../../api/users';

let mockUserId = 'user-a';
jest.mock('../../context/auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { id: mockUserId } }),
}));
jest.mock('../../api/users', () => ({ updateCurrentUser: jest.fn() }));

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(done => { resolve = done; });
    return { promise, resolve };
};
let zone = 'Europe/London';
let foreground: (state: AppStateStatus) => void;

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(updateCurrentUser).mockReset().mockResolvedValue({} as never);
    mockUserId = 'user-a';
    zone = 'Europe/London';
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: zone }),
    }) as Intl.DateTimeFormat);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
        foreground = callback;
        return { remove: jest.fn() };
    });
});
afterEach(() => { jest.restoreAllMocks(); });

it('refreshes reminders after the zone PATCH succeeds, and deduplicates unchanged zones', async () => {
    const patch = deferred();
    jest.mocked(updateCurrentUser).mockReturnValueOnce(patch.promise as never);
    const onSynced = jest.fn(async () => {});
    renderHook(() => useTimeZoneSync(onSynced));
    expect(updateCurrentUser).toHaveBeenCalledWith({ timeZone: 'Europe/London' });
    expect(onSynced).not.toHaveBeenCalled();
    await act(async () => { patch.resolve(); });
    expect(onSynced).toHaveBeenCalledTimes(1);

    await act(async () => { foreground('active'); });
    expect(updateCurrentUser).toHaveBeenCalledTimes(1);
    zone = 'America/New_York';
    await act(async () => { foreground('active'); });
    expect(updateCurrentUser).toHaveBeenLastCalledWith({ timeZone: 'America/New_York' });
    expect(onSynced).toHaveBeenCalledTimes(2);
});

it('serializes rapid travel updates so an old PATCH cannot finish last', async () => {
    const first = deferred();
    jest.mocked(updateCurrentUser).mockReturnValueOnce(first.promise as never);
    const onSynced = jest.fn(async () => {});
    renderHook(() => useTimeZoneSync(onSynced));
    zone = 'America/New_York';
    act(() => { foreground('active'); foreground('active'); });
    expect(updateCurrentUser).toHaveBeenCalledTimes(1);
    await act(async () => { first.resolve(); });
    expect(updateCurrentUser).toHaveBeenCalledTimes(2);
    expect(updateCurrentUser).toHaveBeenNthCalledWith(2, { timeZone: 'America/New_York' });
    expect(onSynced).toHaveBeenCalledTimes(2);
});

it('retries a failed PATCH on foreground without invalidating reminders prematurely', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(updateCurrentUser).mockRejectedValueOnce(new Error('offline'));
    const onSynced = jest.fn(async () => {});
    renderHook(() => useTimeZoneSync(onSynced));
    await waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(onSynced).not.toHaveBeenCalled();
    await act(async () => { foreground('active'); });
    expect(updateCurrentUser).toHaveBeenCalledTimes(2);
    expect(onSynced).toHaveBeenCalledTimes(1);
});

it('syncs each account independently and ignores old account completions', async () => {
    const first = deferred();
    jest.mocked(updateCurrentUser).mockReturnValueOnce(first.promise as never);
    const onSynced = jest.fn(async () => {});
    const { rerender } = renderHook(() => useTimeZoneSync(onSynced));
    mockUserId = 'user-b';
    rerender({});
    await waitFor(() => expect(onSynced).toHaveBeenCalledTimes(1));
    await act(async () => { first.resolve(); });
    expect(onSynced).toHaveBeenCalledTimes(1);
    expect(updateCurrentUser).toHaveBeenCalledTimes(2);
});
