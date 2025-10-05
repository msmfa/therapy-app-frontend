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
