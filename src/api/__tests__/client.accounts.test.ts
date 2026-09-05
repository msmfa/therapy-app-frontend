import { waitFor } from '@testing-library/react-native';
import { apiRequest, configureApiClient } from '../client';

const originalFetch = global.fetch;
const deferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
};
const unauthorized = { ok: false, status: 401 } as Response;

afterEach(() => {
    global.fetch = originalFetch;
    configureApiClient({ getSessionVersion: undefined, refreshAuth: undefined, onAuthFailure: undefined });
});

it('does not retry an old account request or sign out the new account after a late 401', async () => {
    let version = 1;
    const response = deferred<Response>();
    const refreshAuth = jest.fn().mockResolvedValue(false);
    const onAuthFailure = jest.fn();
    configureApiClient({
        getToken: () => `token-${version}`, getSessionVersion: () => version,
        refreshAuth, onAuthFailure,
    });
    global.fetch = jest.fn().mockReturnValue(response.promise);
    const request = apiRequest('/private', { method: 'POST', body: { accountData: 'A' } });
    const rejected = expect(request).rejects.toMatchObject({ code: 'session_changed' });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    version = 2;
    response.resolve(unauthorized);
    await rejected;

    expect(refreshAuth).not.toHaveBeenCalled();
    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
});

it.each([true, false])('ignores an old refresh result (%s) after the session changes', async (refreshed) => {
    let version = 1;
    const refresh = deferred<boolean>();
    const refreshAuth = jest.fn().mockReturnValue(refresh.promise);
    const onAuthFailure = jest.fn();
    configureApiClient({ getToken: () => 'token-a', getSessionVersion: () => version, refreshAuth, onAuthFailure });
    global.fetch = jest.fn().mockResolvedValue(unauthorized);
    const request = apiRequest('/private');
    const rejected = expect(request).rejects.toMatchObject({ code: 'session_changed' });
    await waitFor(() => expect(refreshAuth).toHaveBeenCalledTimes(1));
    version = 2;
    refresh.resolve(refreshed);
    await rejected;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(onAuthFailure).not.toHaveBeenCalled();
});

it('starts a separate refresh for the new account while the old one is pending', async () => {
    let version = 1;
    const refreshA = deferred<boolean>();
    const refreshAuth = jest.fn().mockReturnValueOnce(refreshA.promise).mockResolvedValueOnce(true);
    const onAuthFailure = jest.fn();
    configureApiClient({ getToken: () => `token-${version}`, getSessionVersion: () => version, refreshAuth, onAuthFailure });
    global.fetch = jest.fn()
        .mockResolvedValueOnce(unauthorized)
        .mockResolvedValueOnce(unauthorized)
        .mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    const requestA = apiRequest('/private-a');
    const rejectedA = expect(requestA).rejects.toMatchObject({ code: 'session_changed' });
    await waitFor(() => expect(refreshAuth).toHaveBeenCalledTimes(1));
    version = 2;
    await expect(apiRequest('/private-b')).resolves.toBeUndefined();
    expect(refreshAuth).toHaveBeenCalledTimes(2);
    refreshA.resolve(false);
    await rejectedA;
    expect(onAuthFailure).not.toHaveBeenCalled();
});
