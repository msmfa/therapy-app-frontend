import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { apiRequest, configureApiClient } from '../client';

describe('apiRequest auth header handling', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({}),
        } as Response);

        global.fetch = fetchMock as unknown as typeof fetch;

        configureApiClient({
            baseUrl: 'https://api.example.com',
            defaultTimeoutMs: 1000,
            getToken: async () => 'test-token',
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.resetAllMocks();
    });

    it('omits the Authorization header when auth is disabled', async () => {
        const fetchSpy = global.fetch as jest.MockedFunction<typeof fetch>;

        await apiRequest('/public', { auth: false });

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const init = (fetchSpy.mock.calls[0]?.[1] ?? {}) as RequestInit;
        const requestHeaders = init.headers as Headers;

        expect(requestHeaders.get('Authorization')).toBeNull();
    });

    it('includes the Authorization header when auth is enabled', async () => {
        const fetchSpy = global.fetch as jest.MockedFunction<typeof fetch>;

        await apiRequest('/private');

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const init = (fetchSpy.mock.calls[0]?.[1] ?? {}) as RequestInit;
        const requestHeaders = init.headers as Headers;

        expect(requestHeaders.get('Authorization')).toBe('Bearer test-token');
    });
});

describe('apiRequest transport failure mapping', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        configureApiClient({
            baseUrl: 'https://api.example.com',
            defaultTimeoutMs: 1000,
            getToken: async () => 'test-token',
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.resetAllMocks();
    });

    it('maps aborts to 408 by error name, without relying on a global DOMException', async () => {
        // Hermes has no global DOMException; RN's fetch polyfill rejects with
        // an Error-derived object whose name is 'AbortError'. Simulate that
        // shape exactly.
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        global.fetch = jest.fn<typeof fetch>().mockRejectedValue(abortError) as unknown as typeof fetch;

        await expect(apiRequest('/anything')).rejects.toMatchObject({
            name: 'ApiError',
            status: 408,
            message: 'Request timed out',
        });
    });

    it('maps network failures to status 0 with a network code', async () => {
        global.fetch = jest
            .fn<typeof fetch>()
            .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

        await expect(apiRequest('/anything')).rejects.toMatchObject({
            name: 'ApiError',
            status: 0,
            code: 'network',
            message: 'Network request failed',
        });
    });
});
