import * as Sentry from '@sentry/react-native';
import { apiRequest, configureApiClient } from '../../api/client';
import { API_FAILURE_MESSAGE, reportHandledFailure, sanitizeTelemetry } from '../telemetry';

const originalFetch = global.fetch;

afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
});

it('removes HTTP credentials, bodies, query strings and account context', () => {
    const event = sanitizeTelemetry({ type: undefined, request: {
        url: 'https://api.example.com/api/therapy-sessions?access_token=secret', method: 'POST',
        headers: { Authorization: 'Bearer secret' }, data: { signedTransaction: 'secret' },
    }, user: { email: 'private@example.com' }, breadcrumbs: [{ category: 'http', data: { token: 'secret' } }] });
    expect(event.request).toEqual({ url: 'https://api.example.com/api/therapy-sessions', method: 'POST' });
    expect(event.user).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain('secret');
});

it.each([500, 429])('captures a generic diagnostic for HTTP %s while retaining the caller error and status', async (status) => {
    const privateMessage = 'private-response-body\nsecond private line';
    configureApiClient({ getToken: () => 'token', getSessionVersion: undefined });
    global.fetch = jest.fn().mockResolvedValue({
        ok: false, status,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: privateMessage, code: 'private-code', details: { signedTransaction: 'private-details' } }),
    } as Response);

    const callerError = await apiRequest('/private').catch((error: unknown) => error);
    expect(callerError).toMatchObject({ message: privateMessage, status });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const captured = jest.mocked(Sentry.captureException).mock.calls[0][0] as Error;
    expect(captured).toMatchObject({ message: API_FAILURE_MESSAGE, status });
    expect(captured).not.toBe(callerError);
    expect(captured.stack).toContain('src/api/client.ts');
    expect(captured.stack).not.toContain('private-response-body');
    expect(captured.stack).not.toContain('second private line');
    expect(JSON.stringify(captured)).not.toContain('private');
});

it('redacts API exceptions captured by callers, linked errors, and their messages while preserving diagnostics', () => {
    const frames = [{ filename: 'client.ts', function: 'apiRequest', lineno: 12 }];
    const event = sanitizeTelemetry({
        type: undefined,
        message: 'private-response-body',
        exception: { values: [
            { type: 'ApiError', value: 'private-response-body', stacktrace: { frames } },
            { type: 'Error', value: 'Wrapped private-response-body' },
        ] },
        contexts: { 'api.response': { status: 500 } },
        breadcrumbs: [{ category: 'console', message: 'Request failed: private-response-body' }],
    });

    expect(JSON.stringify(event)).not.toContain('private-response-body');
    expect(event.exception?.values?.[0]).toMatchObject({
        type: 'ApiError', value: API_FAILURE_MESSAGE, stacktrace: { frames },
    });
    expect(event.contexts?.['api.response']).toEqual({ status: 500 });
});

it('redacts tagged transport errors and leaves unrelated exception diagnostics intact', () => {
    const tagged = sanitizeTelemetry({
        type: undefined,
        tags: { 'api.method': 'GET' },
        exception: { values: [{ type: 'TypeError', value: 'private-network-message' }] },
    });
    expect(tagged.exception?.values?.[0].value).toBe(API_FAILURE_MESSAGE);

    const unrelated = sanitizeTelemetry({ type: undefined, exception: { values: [{ type: 'TypeError', value: 'Undefined is not a function' }] } });
    expect(unrelated.exception?.values?.[0].value).toBe('Undefined is not a function');
});

it('reports a handled call site without native error messages, causes, codes or context content', () => {
    const failure = Object.assign(new Error('private-receipt\nprivate-note-content'), {
        cause: new Error('private-account'), code: 'private-native-code',
    });
    reportHandledFailure('store', 'purchase', failure, { code: 'private-native-code', reason: 'network' });

    const captured = jest.mocked(Sentry.captureException).mock.calls[0][0] as Error;
    expect(captured).not.toBe(failure);
    expect(captured.message).toBe('store purchase failed');
    expect(captured.stack).toContain('src/utils/telemetry.ts');
    expect(captured.stack).not.toContain('private');
    expect(JSON.stringify(captured)).not.toContain('private');
    expect(captured.cause).toBeUndefined();
});

it('does not turn arbitrary diagnostic names into outbound exception text', () => {
    reportHandledFailure('private-account', 'private-note', { receipt: 'private-receipt' });
    expect(jest.mocked(Sentry.captureException).mock.calls[0][0])
        .toMatchObject({ message: 'handled unknown failed' });
});

it('allows only normalized failure reasons into diagnostic context', () => {
    const scope = { setTag: jest.fn(), setContext: jest.fn(), setFingerprint: jest.fn() };
    const withScope = jest.spyOn(Sentry, 'withScope').mockImplementation(
        <T>(callback: (value: Sentry.Scope) => T) => callback(scope as unknown as Sentry.Scope),
    );
    try {
        reportHandledFailure('store', 'purchase', null, { reason: 'network', code: 'private-receipt' });
        reportHandledFailure('store', 'purchase', null, { reason: 'private-account', token: 'private-token' });
        expect(scope.setContext.mock.calls).toEqual([['store', { reason: 'network' }]]);
    } finally {
        withScope.mockRestore();
    }
});

it('keeps the handled action usable when Sentry throws', () => {
    jest.mocked(Sentry.captureException).mockImplementationOnce(() => { throw new Error('SDK failure'); });
    expect(() => reportHandledFailure('store', 'restore', new Error('native failure'))).not.toThrow();
});
