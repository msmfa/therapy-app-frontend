import type { AnalyticsConfig } from './config';
import { CONSENT_KEY } from './config';
import { allowedEventProperties, type AnalyticsEvent, type AnalyticsEvents } from './events';

export type AnalyticsSnapshot = { hydrated: boolean; consentKnown: boolean; consent: boolean; available: boolean; enabled: boolean };
export type CaptureOptions = { dedupeKey?: string };
export type Capture = <E extends AnalyticsEvent>(event: E, properties: AnalyticsEvents[E], options?: CaptureOptions) => boolean;
export type AnalyticsOperation = { enabled: boolean; isCurrent(): boolean; capture: Capture };
export type CleanupReason = 'opt_out' | 'account_deleted';
export interface AnalyticsTransport {
    activate(identity: string | null, isCurrent: () => boolean): Promise<void>;
    deactivate(clear: boolean): Promise<void>;
    capture(event: string, properties: Record<string, string | boolean>, timestamp: Date): void;
}
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };
export type AnalyticsDependencies = {
    config: AnalyticsConfig;
    storage: Storage;
    createTransport(maySend: () => boolean, identity: string | null, isCurrent: () => boolean): AnalyticsTransport;
    clearTransportStorage(): Promise<void>;
    now(): number;
    newId(): string;
};
const consentKey = (id: string | null) => `${CONSENT_KEY}.${id === null ? 'anonymous' : `account.${encodeURIComponent(id)}`}`;
const MAX_DEDUPE_KEYS = 256;
export const ANALYTICS_READY_TIMEOUT_MS = 1000;
const disabledOperation = (): AnalyticsOperation => ({ enabled: false, isCurrent: () => false, capture: () => false });

/** Testable lifecycle policy; network buffering and retry remain in PostHog. */
export function createAnalytics(deps: AnalyticsDependencies) {
    let identity: string | null | undefined;
    let generation = 0;
    let initialized = false;
    let transport: AnalyticsTransport | undefined;
    let snapshot: AnalyticsSnapshot = { hydrated: false, consentKnown: false, consent: false, available: deps.config.allowed, enabled: false };
    let pending = Promise.resolve();
    let storageQueue = Promise.resolve();
    let visitId = deps.newId();
    let backgroundAt: number | null = null;
    const listeners = new Set<() => void>();
    const readinessChecks = new Set<() => void>();
    const cleanups = new Set<(reason: CleanupReason, accountId: string | null) => void | Promise<void>>();
    const dedupe = new Set<string>();
    const publish = (patch: Partial<AnalyticsSnapshot>) => {
        const next = { ...snapshot, ...patch };
        if (!(Object.keys(next) as Array<keyof AnalyticsSnapshot>).every((key) => next[key] === snapshot[key])) {
            snapshot = next;
            listeners.forEach((listener) => listener());
        }
        // Identity can change while every visible loading flag stays false.
        // Pending operations still need to observe that generation change.
        readinessChecks.forEach((check) => check());
    };
    const enqueueStorage = (operation: () => Promise<void>): Promise<void> => {
        const result = storageQueue.then(operation);
        storageQueue = result.catch(() => undefined);
        return result;
    };
    const maySend = () => initialized && identity !== undefined && snapshot.hydrated && snapshot.consent && deps.config.allowed;
    const stop = (clear: boolean) => {
        publish({ enabled: false });
        dedupe.clear();
        return transport?.deactivate(clear).catch(() => undefined) ?? Promise.resolve();
    };
    const activate = async (version: number) => {
        if (version !== generation || !maySend()) return;
        try {
            transport ??= deps.createTransport(maySend, identity!, () => version === generation && maySend());
            await transport.activate(identity!, () => version === generation && maySend());
            if (version === generation && maySend()) publish({ enabled: true });
        } catch {
            if (version === generation) publish({ enabled: false });
        }
    };
    const loadConsent = async (owner: string | null, version: number) => {
        await storageQueue;
        let consent = false;
        try {
            const raw = await deps.storage.getItem(consentKey(owner));
            if (version !== generation || identity !== owner) return;
            // The app's automatic consent policy replaces all legacy prompt
            // choices. Persist it before allowing the SDK to send anything.
            if (raw !== 'true') await enqueueStorage(() => deps.storage.setItem(consentKey(owner), 'true'));
            consent = true;
        } catch { /* Storage failures must not enable collection. */ }
        if (version !== generation || identity !== owner) return;
        publish({ hydrated: true, consentKnown: consent, consent });
        if (consent) await activate(version);
        else {
            await stop(true);
            // No SDK is constructed just to revoke or clean persisted queues.
            if (version === generation) await deps.clearTransportStorage().catch(() => undefined);
        }
    };
    const capture: Capture = (event, properties, options) => {
        if (!snapshot.enabled || !transport) return false;
        const safe = allowedEventProperties(event, properties);
        if (!safe) return false;
        const key = options?.dedupeKey ? `${event}:${options.dedupeKey}` : null;
        if (key && dedupe.has(key)) return false;
        try {
            transport.capture(event, safe, new Date(deps.now()));
            if (key) {
                dedupe.add(key);
                if (dedupe.size > MAX_DEDUPE_KEYS) dedupe.delete(dedupe.values().next().value!);
            }
            return true;
        } catch { return false; }
    };

    const initialize = (): Promise<void> => {
        if (!initialized) {
            initialized = true;
            if (identity !== undefined) pending = loadConsent(identity, generation);
        }
        return pending;
    };
    const beginOperation = (): AnalyticsOperation => {
        const version = generation;
        const enabled = snapshot.enabled;
        const isCurrent = () => enabled && version === generation && snapshot.enabled;
        return { enabled, isCurrent, capture: (event, properties, options) => isCurrent() && capture(event, properties, options) };
    };
    /**
     * Let an immediate auth-to-checkout handoff finish identity/SDK startup.
     * The caller starts its action only afterwards: no startup event buffer.
     * Timeout, cancellation and failure return a scope that can never revive.
     */
    const beginOperationWhenReady = (): Promise<AnalyticsOperation> => {
        const version = generation;
        const owner = identity;
        if (!deps.config.allowed || owner === undefined) return Promise.resolve(disabledOperation());
        if (snapshot.enabled) return Promise.resolve(beginOperation());
        if (snapshot.hydrated && !snapshot.consent) return Promise.resolve(disabledOperation());
        return new Promise((resolve) => {
            let finished = false;
            let timer: ReturnType<typeof setTimeout> | undefined;
            const finish = (scope: AnalyticsOperation) => {
                if (finished) return;
                finished = true;
                if (timer !== undefined) clearTimeout(timer);
                readinessChecks.delete(check);
                resolve(scope);
            };
            const check = () => {
                if (version !== generation || owner !== identity) finish(disabledOperation());
                else if (snapshot.enabled) finish(beginOperation());
                else if (snapshot.hydrated && !snapshot.consent) finish(disabledOperation());
            };
            readinessChecks.add(check);
            timer = setTimeout(() => finish(disabledOperation()), ANALYTICS_READY_TIMEOUT_MS);
            try {
                void initialize().then(() => {
                    check();
                    // Failed SDK startup is best effort; don't hold billing for
                    // a timeout after initialization has already settled.
                    finish(disabledOperation());
                }, () => finish(disabledOperation()));
            } catch { finish(disabledOperation()); }
            check();
        });
    };

    return {
        capture,
        getSnapshot: () => snapshot,
        getIdentity: () => identity,
        subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
        getVisitId: () => visitId,
        onAppStateChange: (state: string) => {
            if (state === 'background' || state === 'inactive') backgroundAt ??= deps.now();
            if (state === 'active') {
                if (backgroundAt !== null && deps.now() - backgroundAt >= 30 * 60_000) { visitId = deps.newId(); dedupe.clear(); }
                backgroundAt = null;
            }
        },
        initialize,
        setIdentity: (nextIdentity: string | null) => {
            // Backend IDs are opaque identifiers, never emails or display names.
            const next = nextIdentity !== null && /^[A-Za-z0-9._:-]{1,128}$/.test(nextIdentity) ? nextIdentity : null;
            if (identity === next) return;
            const previous = identity;
            identity = next;
            const version = ++generation;
            visitId = deps.newId();
            publish({ hydrated: false, consentKnown: false, consent: false, enabled: false });
            // Keep the consented anonymous funnel only for its first sign-in.
            void stop(previous !== undefined && previous !== null || next === null);
            if (previous !== undefined) {
                void enqueueStorage(() => deps.storage.removeItem(consentKey(null))).catch(() => undefined);
            }
            if (initialized) pending = loadConsent(next, version);
        },
        beginOperation,
        beginOperationWhenReady,
        setConsent: async (consent: boolean): Promise<void> => {
            if (typeof consent !== 'boolean') throw new Error('Analytics consent must be a boolean.');
            const owner = identity;
            if (owner === undefined) throw new Error('Analytics identity is not initialized.');
            const version = ++generation;
            publish({ hydrated: true, consentKnown: true, consent: false, enabled: false });
            await stop(!consent);
            const persist = enqueueStorage(() => deps.storage.setItem(consentKey(owner), String(consent)));
            if (!consent) {
                await Promise.allSettled([...cleanups].map((handler) => handler('opt_out', owner)));
                if (version === generation) await deps.clearTransportStorage().catch(() => undefined);
            }
            try { await persist; } catch { throw new Error('Analytics state could not be saved.'); }
            if (version !== generation || identity !== owner) return;
            publish({ consent });
            if (consent) await activate(version);
        },
        registerCleanup: (handler: (reason: CleanupReason, accountId: string | null) => void | Promise<void>) => {
            cleanups.add(handler);
            return () => { cleanups.delete(handler); };
        },
        forgetAccount: async (accountId: string): Promise<void> => {
            if (identity === accountId) {
                const version = ++generation;
                publish({ hydrated: true, consentKnown: false, consent: false, enabled: false });
                await stop(true);
                if (version === generation) await deps.clearTransportStorage().catch(() => undefined);
            }
            await Promise.allSettled([...cleanups].map((handler) => handler('account_deleted', accountId)));
            await enqueueStorage(() => deps.storage.removeItem(consentKey(accountId)));
        },
    };
}
