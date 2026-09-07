import { waitFor } from '@testing-library/react-native';
import { apiRequest, configureApiClient, type ApiRequestOptions } from '../client';

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

it.each<[string, Response, ApiRequestOptions]>([
    ['JSON', { ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ owner: 'A' }) } as Response, {}],
    ['text', { ok: true, status: 200, headers: new Headers(), text: async () => 'A' } as Response, {}],
    ['204', { ok: true, status: 204 } as Response, {}],
    ['unparsed', { ok: true, status: 200 } as Response, { parseJson: false }],
])('rejects a late successful %s response from the previous account', async (_format, result, options) => {
    let version = 1;
    const response = deferred<Response>();
    const onAuthFailure = jest.fn();
    configureApiClient({ getToken: () => `token-${version}`, getSessionVersion: () => version, onAuthFailure });
    global.fetch = jest.fn().mockReturnValue(response.promise);

    const rejected = expect(apiRequest('/private', options)).rejects.toMatchObject({ code: 'session_changed' });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    version = 2;
    response.resolve(result);
    await rejected;
    expect(onAuthFailure).not.toHaveBeenCalled();
});

it.each(['json', 'text', 'error'] as const)('rejects an account switch during %s body parsing', async (format) => {
    let version = 1;
    const body = deferred<unknown>();
    const parse = jest.fn().mockReturnValue(body.promise);
    configureApiClient({ getToken: () => `token-${version}`, getSessionVersion: () => version });
    global.fetch = jest.fn().mockResolvedValue({
        ok: format !== 'error',
        status: format === 'error' ? 500 : 200,
        headers: new Headers({ 'content-type': format === 'text' ? 'text/plain' : 'application/json' }),
        json: parse,
        text: parse,
    } as unknown as Response);

    const rejected = expect(apiRequest('/private')).rejects.toMatchObject({ code: 'session_changed' });
    await waitFor(() => expect(parse).toHaveBeenCalledTimes(1));
    version = 2;
    body.resolve(format === 'text' ? 'account A' : { message: 'account A' });
    await rejected;
});

it('lets a public request finish across account changes, including body parsing', async () => {
    let version = 1;
    const response = deferred<Response>();
    const body = deferred<unknown>();
    const parse = jest.fn().mockReturnValue(body.promise);
    configureApiClient({ getToken: () => `token-${version}`, getSessionVersion: () => version });
    global.fetch = jest.fn().mockReturnValue(response.promise);

    const request = apiRequest('/public', { auth: false });
    version = 2;
    response.resolve({
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: parse,
    } as unknown as Response);
    await waitFor(() => expect(parse).toHaveBeenCalledTimes(1));
    version = 3;
    body.resolve({ public: true });
    await expect(request).resolves.toEqual({ public: true });
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.has('Authorization')).toBe(false);
});
