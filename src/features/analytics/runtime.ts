import PostHog, { PostHogPersistedProperty } from 'posthog-react-native';
import type { CaptureEvent } from '@posthog/core';
import { allowedEventProperties } from './events';
import { type AnalyticsConfig } from './config';
import type { AnalyticsTransport } from './core';
import { createAnalyticsSdkStorage } from './storage';

/** Final event boundary, also applied to the SDK's automatic enrichment. */
export function sanitizeAnalyticsEvent(event: CaptureEvent | null, config: AnalyticsConfig): CaptureEvent | null {
    if (!event) return null;
    const properties = event.event === '$identify' ? {} : allowedEventProperties(event.event, event.properties);
    if (!properties) return null;
    const safe: Record<string, string | boolean> = {
        ...properties,
        app_version: config.appVersion,
        platform: config.platform,
        environment: 'production',
        $geoip_disable: true,
    };
    // PostHog uses these fields to join only its own anonymous ID on identify.
    // Device properties, arbitrary $set/$set_once and free text are excluded.
    for (const key of ['$anon_distinct_id', '$session_id'] as const) {
        const value = event.properties?.[key];
        if (typeof value === 'string' && /^[0-9a-f-]{32,36}$/i.test(value)) safe[key] = value;
    }
    if (typeof event.properties?.$process_person_profile === 'boolean') safe.$process_person_profile = event.properties.$process_person_profile;
    if (event.properties?.token === config.apiKey) safe.token = config.apiKey;
    return { event: event.event, uuid: event.uuid, timestamp: event.timestamp, properties: safe };
}

export function createPostHogTransport(
    config: AnalyticsConfig,
    maySend: () => boolean,
    initialOwner: string | null,
    isInitialOwnerCurrent: () => boolean,
): AnalyticsTransport {
    let owner = initialOwner;
    const sdk = new PostHog(config.apiKey, {
        host: config.host,
        defaultOptIn: false,
        captureAppLifecycleEvents: false,
        enableSessionReplay: false,
        capturePushNotificationOpened: false,
        capturePushNotificationSubscriptions: false,
        errorTracking: { autocapture: false, exceptionSteps: { enabled: false } },
        disableSurveys: true,
        disableRemoteFeatureFlags: true,
        preloadFeatureFlags: false,
        sendFeatureFlagEvent: false,
        setDefaultPersonProperties: false,
        disableGeoip: true,
        customAppProperties: {},
        flushAt: 20,
        flushInterval: 30_000,
        maxQueueSize: 100,
        maxBatchSize: 50,
        fetchRetryCount: 0,
        persistence: 'file',
        customStorage: createAnalyticsSdkStorage(initialOwner, isInitialOwnerCurrent, () => owner),
        before_send: (event) => maySend() ? sanitizeAnalyticsEvent(event, config) : null,
        logs: { beforeSend: () => null },
    });
    const clearQueue = () => {
        // reset() explicitly preserves queued events in SDK 4.67.3. Revocation
        // must remove those too; only use the SDK's public persistence API.
        sdk.setPersistedProperty(PostHogPersistedProperty.Queue, []);
        sdk.setPersistedProperty(PostHogPersistedProperty.LogsQueue, []);
    };
    // SDK readiness and persistence are asynchronous. Serialize the finishing
    // steps so an old logout cannot reset an account activated afterwards.
    let lifecycle = Promise.resolve();
    const enqueueLifecycle = (operation: () => Promise<void>) => {
        const next = lifecycle.then(operation);
        lifecycle = next.catch(() => undefined);
        return next;
    };
    return {
        activate: (identity, isCurrent) => enqueueLifecycle(async () => {
            await sdk.ready();
            if (!isCurrent()) return;
            const identified = sdk.getPersistedProperty(PostHogPersistedProperty.PersonMode) === 'identified';
            if (identified && sdk.getDistinctId() !== identity) { clearQueue(); sdk.reset([]); }
            owner = identity;
            await sdk.optIn();
            if (!isCurrent()) return;
            if (identity !== null) sdk.identify(identity);
        }),
        deactivate: (clear) => {
            // Immediate revocation also prevents AppState/interval flushing
            // while an earlier lifecycle operation is waiting for storage.
            void sdk.optOut();
            if (clear) { clearQueue(); sdk.reset([]); void sdk.optOut(); owner = null; }
            return enqueueLifecycle(async () => {
                await sdk.ready();
                if (clear) { clearQueue(); sdk.reset([]); owner = null; }
                await sdk.optOut();
            });
        },
        capture: (event, properties, timestamp) => sdk.capture(event, properties, { timestamp, disableGeoip: true }),
    };
}
