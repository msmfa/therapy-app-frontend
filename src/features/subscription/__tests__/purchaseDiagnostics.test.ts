import * as Sentry from '@sentry/react-native';
import { reportPurchaseError } from '../purchaseDiagnostics';
import { sanitizeTelemetry } from '../../../utils/telemetry';

const attempt = { plan: 'annual' as const, attempt: 2, startedAt: 1000 };
const captured = () => jest.mocked(Sentry.captureEvent).mock.calls[0][0];

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(3500);
});
afterEach(() => jest.restoreAllMocks());

it('keeps Apple domain/code pairs while dropping messages, accounts, receipts and arbitrary fields', () => {
    reportPurchaseError({
        code: 'user-cancelled',
        message: 'Error Domain=ASDErrorDomain Code=530 "private-account@example.com"',
        debugMessage: 'Error Domain=AMSErrorDomain Code=100 "private-receipt" Domain=PrivateAccount Code=123',
        cause: { domain: 'SKErrorDomain', code: 2, message: 'private-note' },
        purchaseToken: 'private-token',
        productId: 'private-product',
    }, attempt, 'request', 'cancelled');
    const event = captured();
    expect(event).toMatchObject({
        level: 'info',
        tags: { 'store.code': 'user-cancelled', 'store.source': 'request' },
        contexts: { store: {
            plan: 'annual', attempt: 2, elapsed_ms: 2500,
            native_codes_available: true,
            native_error_codes: [
                { domain: 'ASDErrorDomain', code: 530 },
                { domain: 'AMSErrorDomain', code: 100 },
                { domain: 'SKErrorDomain', code: 2 },
            ],
        } },
    });
    expect(JSON.stringify(event)).not.toMatch(/private/i);
    // The app's existing beforeSend sanitizer must retain these safe details.
    expect(sanitizeTelemetry(event as Parameters<typeof sanitizeTelemetry>[0]).contexts?.store)
        .toEqual(event.contexts?.store);
});

it('records when Apple supplied no underlying codes without claiming a diagnosis', () => {
    reportPurchaseError({ code: 'user-cancelled', message: 'User cancelled the purchase flow' }, attempt, 'listener', 'cancelled');
    expect(captured()).toMatchObject({ contexts: { store: {
        native_codes_available: false, native_error_codes: [],
    } } });
});

it('normalizes unexpected native codes and never uploads arbitrary error content', () => {
    reportPurchaseError({ code: 'private-apple-account', debugMessage: 'private-message' }, attempt, 'prepare', 'failed');
    expect(captured()).toMatchObject({ level: 'error', tags: { 'store.code': 'unknown' } });
    expect(JSON.stringify(captured())).not.toContain('private');
});

it('bounds cyclic native causes and deduplicates repeated codes', () => {
    const error = { code: 2, domain: 'SKErrorDomain', cause: null as unknown };
    error.cause = error;
    reportPurchaseError(error, attempt, 'request', 'failed');
    expect(captured().contexts?.store?.native_error_codes).toEqual([{ domain: 'SKErrorDomain', code: 2 }]);
});

it('ignores malformed numeric codes and safely handles null errors', () => {
    reportPurchaseError({ domain: 'SKErrorDomain', code: Infinity }, attempt, 'request', 'failed');
    expect(captured().contexts?.store?.native_error_codes).toEqual([]);
    expect(() => reportPurchaseError(null, attempt, 'prepare', 'failed')).not.toThrow();
});

it('does not propagate a Sentry failure into checkout', () => {
    jest.mocked(Sentry.captureEvent).mockImplementationOnce(() => { throw new Error('offline'); });
    expect(() => reportPurchaseError({ code: 'user-cancelled' }, attempt, 'listener', 'cancelled')).not.toThrow();
});
