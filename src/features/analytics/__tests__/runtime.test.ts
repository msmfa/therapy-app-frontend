import type { CaptureEvent } from '@posthog/core';
import type { AnalyticsConfig } from '../config';

const mockInstances: any[] = [];
let mockReady: Promise<void> = Promise.resolve();
jest.mock('posthog-react-native', () => ({
    __esModule: true,
    PostHogPersistedProperty: { Queue: 'queue', LogsQueue: 'logs_queue', PersonMode: 'person_mode' },
    default: class {
        state: Record<string, any> = { queue: [{ old: true }] };
        distinctId = 'anonymous';
        optedOut = true;
        calls: string[] = [];
        ready = () => mockReady;
        options: any;
        constructor(_key: string, options: any) { this.options = options; mockInstances.push(this); }
        getPersistedProperty = (key: string) => this.state[key];
        setPersistedProperty = (key: string, value: any) => { this.state[key] = value; };
        getDistinctId = () => this.distinctId;
        optIn = async () => { this.optedOut = false; this.calls.push('in'); };
        optOut = async () => { this.optedOut = true; this.calls.push('out'); };
        reset = () => { this.distinctId = 'anonymous'; this.state.person_mode = 'anonymous'; this.calls.push('reset'); };
        identify = (id: string) => { this.distinctId = id; this.state.person_mode = 'identified'; this.calls.push(`identify:${id}`); };
        capture = jest.fn();
    },
}));
import { createPostHogTransport, sanitizeAnalyticsEvent } from '../runtime';
const config: AnalyticsConfig = { apiKey: 'phc_test', host: 'https://eu.i.posthog.com', allowed: true, appVersion: '1.2.3', platform: 'ios' };
const event = (name: string, properties: Record<string, unknown>): CaptureEvent => ({ event: name, properties: properties as CaptureEvent['properties'], timestamp: new Date('2026-09-08T12:00:00Z'), uuid: '019f0101-cccc-7000-8888-123456789012' });
beforeEach(() => { mockInstances.length = 0; mockReady = Promise.resolve(); });

test('before-send strips SDK device/location/flags, person updates, paths, payloads and errors', () => {
    const output = sanitizeAnalyticsEvent({ ...event('note_saved', {
        operation: 'new', is_first_note: true, entry_point: 'notes',
        $device_model: 'private', $os_version: 'private', $screen_name: '/notes/secret',
        $set: { email: 'private@example.com' }, $set_once: { name: 'private' },
        $active_feature_flags: ['private'], content: 'private', error: new Error('private'),
    }), $set: { email: 'private@example.com' }, $set_once: { name: 'private' } }, config);
    expect(output).toEqual({
        ...event('note_saved', {}),
        properties: { operation: 'new', is_first_note: true, entry_point: 'notes', app_version: '1.2.3', platform: 'ios', environment: 'production', $geoip_disable: true },
    });
    expect(JSON.stringify(output)).not.toContain('private');
    expect(sanitizeAnalyticsEvent(event('$screen', { $screen_name: '/notes/private' }), config)).toBeNull();
});

test('identify retains only validated SDK identity linkage, never person fields', () => {
    const anonymous = '019f0101-cccc-7000-8888-123456789012';
    const output = sanitizeAnalyticsEvent(event('$identify', { $anon_distinct_id: anonymous, $session_id: anonymous, $process_person_profile: true, token: 'phc_test', email: 'secret', $set: { name: 'secret' } }), config);
    expect(output?.properties).toMatchObject({ $anon_distinct_id: anonymous, $session_id: anonymous, $process_person_profile: true, token: 'phc_test' });
    expect(JSON.stringify(output)).not.toContain('secret');
    expect(sanitizeAnalyticsEvent(event('$identify', { $anon_distinct_id: 'private-email@example.com' }), config)?.properties).not.toHaveProperty('$anon_distinct_id');
});

test('QA labeling is owned by the build, never by a capture caller', () => {
    const payload = event('note_saved', { operation: 'new', is_first_note: true, entry_point: 'notes', environment: 'production' });
    expect(sanitizeAnalyticsEvent(payload, { ...config, environment: 'qa' })?.properties?.environment).toBe('qa');
    expect(sanitizeAnalyticsEvent({ ...payload, properties: { ...payload.properties, environment: 'qa' } }, config)?.properties?.environment).toBe('production');
});

test('SDK config disables all automatic capture and before-send rejects once permission is revoked', () => {
    let maySend = true;
    createPostHogTransport(config, () => maySend, 'A', () => true);
    const options = mockInstances[0].options;
    expect(options).toMatchObject({ defaultOptIn: false, captureAppLifecycleEvents: false, enableSessionReplay: false, capturePushNotificationOpened: false, capturePushNotificationSubscriptions: false, disableSurveys: true, disableRemoteFeatureFlags: true, preloadFeatureFlags: false, sendFeatureFlagEvent: false, setDefaultPersonProperties: false, customAppProperties: {}, fetchRetryCount: 0, maxQueueSize: 100 });
    expect(options.before_send(event('onboarding_completed', { plan_mode: 'real' }))).not.toBeNull();
    maySend = false;
    expect(options.before_send(event('onboarding_completed', { plan_mode: 'real' }))).toBeNull();
    expect(options.logs.beforeSend({ message: 'secret' })).toBeNull();
});

test('deferred SDK readiness cannot let A logout reset B after B activation', async () => {
    let ready!: () => void;
    mockReady = new Promise((resolve) => { ready = resolve; });
    let generation = 1;
    const transport = createPostHogTransport(config, () => true, 'A', () => generation === 1);
    const openingA = transport.activate('A', () => generation === 1);
    generation = 2;
    const logout = transport.deactivate(true);
    const openingB = transport.activate('B', () => generation === 2);
    expect(mockInstances[0].state.queue).toEqual([]);
    ready();
    await Promise.all([openingA, logout, openingB]);
    expect(mockInstances[0].distinctId).toBe('B');
    expect(mockInstances[0].optedOut).toBe(false);
    expect(mockInstances[0].calls.at(-1)).toBe('identify:B');
});

test('rapid revoke then re-enable serializes queue erasure before renewed identification', async () => {
    const transport = createPostHogTransport(config, () => true, 'A', () => true);
    await transport.activate('A', () => true);
    mockInstances[0].state.queue = [{ queued: 'A' }];
    const revoke = transport.deactivate(true);
    const enable = transport.activate('A', () => true);
    await Promise.all([revoke, enable]);
    expect(mockInstances[0].state.queue).toEqual([]);
    expect(mockInstances[0].state.logs_queue).toEqual([]);
    expect(mockInstances[0].distinctId).toBe('A');
    expect(mockInstances[0].optedOut).toBe(false);
});

test('hands action timestamp unchanged to SDK buffering, without custom transport retry', () => {
    const transport = createPostHogTransport(config, () => true, 'A', () => true);
    const occurredAt = new Date('2026-01-01T00:00:00Z');
    transport.capture('onboarding_completed', { plan_mode: 'real' }, occurredAt);
    expect(mockInstances[0].capture).toHaveBeenCalledWith('onboarding_completed', { plan_mode: 'real' }, { timestamp: occurredAt, disableGeoip: true });
});
