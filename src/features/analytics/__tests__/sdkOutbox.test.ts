import PostHog, { PostHogPersistedProperty } from 'posthog-react-native';

// Exercise the installed SDK's real queue and retry logic; no PostHog request
// leaves this test. App lifecycle/native dependencies use the Expo Jest preset.
test('SDK retries the same queued event with its original timestamp, UUID and identity after a network failure', async () => {
    const originalFetch = global.fetch;
    let offline = true;
    const bodies: string[] = [];
    global.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
        const address = String(url);
        if (address.includes('/batch') || address.includes('/e/')) {
            bodies.push(String(init?.body));
            if (offline) throw new TypeError('Network request failed');
        }
        return { status: 200, ok: true, json: async () => ({}), text: async () => '{}', headers: { get: () => null } } as unknown as Response;
    });
    const sdk = new PostHog('phc_test', {
        host: 'https://eu.i.posthog.com', persistence: 'memory',
        defaultOptIn: false, captureAppLifecycleEvents: false,
        enableSessionReplay: false, capturePushNotificationOpened: false,
        capturePushNotificationSubscriptions: false, disableSurveys: true,
        disableRemoteFeatureFlags: true, preloadFeatureFlags: false,
        setDefaultPersonProperties: false, customAppProperties: {},
        errorTracking: { autocapture: false, exceptionSteps: { enabled: false } },
        flushAt: 100, flushInterval: 0, fetchRetryCount: 0,
        disableCompression: true,
    });
    try {
        await sdk.ready();
        await sdk.optIn();
        sdk.identify('backend-a');
        sdk.setPersistedProperty(PostHogPersistedProperty.Queue, []);
        const occurredAt = new Date('2025-01-01T12:00:00Z');
        sdk.capture('note_saved', { operation: 'new', is_first_note: true, entry_point: 'notes' }, { timestamp: occurredAt });
        await expect(sdk.flush()).rejects.toThrow();
        const queued = sdk.getPersistedProperty<Array<{ message: { uuid: string; timestamp: Date | string; distinct_id: string } }>>(PostHogPersistedProperty.Queue)!;
        expect(queued).toHaveLength(1);
        expect(new Date(queued[0].message.timestamp).toISOString()).toBe(occurredAt.toISOString());
        expect(queued[0].message.distinct_id).toBe('backend-a');
        offline = false;
        await sdk.flush();
        expect(sdk.getPersistedProperty(PostHogPersistedProperty.Queue)).toEqual([]);
        expect(bodies).toHaveLength(2);
        const first = JSON.parse(bodies[0]);
        const retry = JSON.parse(bodies[1]);
        expect(retry.batch[0]).toMatchObject({ timestamp: first.batch[0].timestamp, uuid: first.batch[0].uuid, distinct_id: 'backend-a' });
    } finally {
        sdk.setPersistedProperty(PostHogPersistedProperty.Queue, []);
        await sdk.shutdown();
        global.fetch = originalFetch;
    }
});
