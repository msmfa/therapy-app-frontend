import * as Sentry from '@sentry/react-native';
import type { PlanId } from './types';

// Keep the native module lazy: importing expo-iap at runtime here would also
// load it in Expo Go. Only these documented codes may leave the device.
const STORE_CODES = new Set([
    'activity-unavailable', 'already-owned', 'already-prepared',
    'billing-response-json-parse-error', 'billing-unavailable', 'connection-closed',
    'deferred-payment', 'developer-error', 'duplicate-purchase', 'empty-sku-list',
    'feature-not-supported', 'iap-not-available', 'init-connection', 'interrupted',
    'item-not-owned', 'item-unavailable', 'network-error', 'not-ended', 'not-prepared',
    'pending', 'purchase-error', 'purchase-verification-failed',
    'purchase-verification-finish-failed', 'purchase-verification-finished',
    'query-product', 'remote-error', 'service-disconnected', 'service-error',
    'service-timeout', 'sku-not-found', 'sku-offer-mismatch', 'sync-error',
    'transaction-validation-failed', 'unknown', 'user-cancelled', 'user-error',
]);
const APPLE_DOMAINS = new Set([
    'SKErrorDomain', 'ASDErrorDomain', 'AMSErrorDomain', 'NSURLErrorDomain',
    'StoreKit.StoreKitError', 'StoreKit.Product.PurchaseError',
]);

export type PurchaseAttemptDiagnostics = {
    plan: PlanId;
    attempt: number;
    startedAt: number;
};
export type PurchaseErrorSource = 'prepare' | 'request' | 'listener';

type NativeCode = { domain: string; code: number };

function nativeErrorCodes(error: unknown): NativeCode[] {
    const result: NativeCode[] = [];
    const add = (domain: unknown, code: unknown) => {
        if (typeof domain !== 'string' || !APPLE_DOMAINS.has(domain)
            || typeof code !== 'number' || !Number.isSafeInteger(code)
            || Math.abs(code) > 1_000_000 || result.length >= 8) return;
        if (!result.some((item) => item.domain === domain && item.code === code)) {
            result.push({ domain, code });
        }
    };
    let current = error;
    for (let depth = 0; depth < 4; depth++) {
        if (!current || typeof current !== 'object') break;
        const value = current as Record<string, unknown>;
        add(value.domain, value.code);
        // Some bridges preserve NSError descriptions; others expose only a
        // localized message. Never transmit that text, even for cancellations.
        for (const field of ['message', 'debugMessage']) {
            const text = value[field];
            if (typeof text !== 'string') continue;
            const pattern = /\b(?:Error )?Domain=([A-Za-z.]+)\s+Code=(-?\d+)\b/g;
            for (const match of text.slice(0, 8192).matchAll(pattern)) {
                add(match[1], Number(match[2]));
            }
        }
        current = value.cause;
    }
    return result;
}

/** Capture one bounded diagnostic per attempt, without native messages or receipts. */
export function reportPurchaseError(
    error: unknown,
    attempt: PurchaseAttemptDiagnostics,
    source: PurchaseErrorSource,
    outcome: 'cancelled' | 'pending' | 'failed',
): void {
    try {
        const rawCode = error && typeof error === 'object' && 'code' in error ? error.code : null;
        const code = typeof rawCode === 'string' && STORE_CODES.has(rawCode) ? rawCode : 'unknown';
        const nativeCodes = nativeErrorCodes(error);
        Sentry.captureEvent({
            message: 'StoreKit purchase outcome',
            // A cancellation is evidence for support, not proof of a failure.
            level: outcome === 'failed' ? 'error' : 'info',
            fingerprint: ['store', 'purchase', code],
            tags: {
                'store.stage': 'purchase',
                'store.code': code,
                'store.outcome': outcome,
                'store.source': source,
            },
            contexts: {
                store: {
                    plan: attempt.plan,
                    attempt: attempt.attempt,
                    elapsed_ms: Math.min(3_600_000, Math.max(0, Date.now() - attempt.startedAt)),
                    native_error_codes: nativeCodes,
                    native_codes_available: nativeCodes.length > 0,
                },
            },
        });
    } catch {
        // Neither native error inspection nor telemetry may block checkout.
    }
}
