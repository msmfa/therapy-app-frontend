import { createAnalytics, ANALYTICS_READY_TIMEOUT_MS, type AnalyticsDependencies } from '../core';
import { CONSENT_KEY } from '../config';

const key = (owner: string | null) => `${CONSENT_KEY}.${owner === null ? 'anonymous' : `account.${owner}`}`;
const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const deferred = () => { let resolve!: () => void; const promise = new Promise<void>((r) => { resolve = r; }); return { promise, resolve }; };
function setup(seed: Record<string, string> = {}, allowed = true) {
    const values = new Map(Object.entries(seed));
    let clock = 1000;
    let sequence = 0;
    let owner: string | null = null;
    const events: Array<{ event: string; properties: unknown; owner: string | null; timestamp: Date }> = [];
    const transport = {
        activate: jest.fn(async (id: string | null, isCurrent: () => boolean) => { if (isCurrent()) owner = id; }),
        deactivate: jest.fn(async () => undefined),
        capture: jest.fn((event: string, properties: Record<string, string | boolean>, timestamp: Date) => { events.push({ event, properties, owner, timestamp }); }),
    };
    const dependencies: AnalyticsDependencies = {
        config: { allowed, apiKey: 'phc_test', host: 'https://eu.i.posthog.com', appVersion: '1.0', platform: 'ios' },
        storage: {
            getItem: jest.fn(async (name: string) => values.get(name) ?? null),
            setItem: jest.fn(async (name: string, value: string) => { values.set(name, value); }),
            removeItem: jest.fn(async (name: string) => { values.delete(name); }),
        },
        createTransport: jest.fn(() => transport),
        clearTransportStorage: jest.fn(async () => undefined),
        now: () => clock,
        newId: () => `visit-${++sequence}`,
    };
    const analytics = createAnalytics(dependencies);
    return { analytics, dependencies, transport, values, events, advance: (by: number) => { clock += by; } };
}
const note = { operation: 'new', is_first_note: true, entry_point: 'notes' } as const;

test('does not construct the SDK or send before auth and explicit consent are known', async () => {
    const { analytics, dependencies } = setup();
    await analytics.initialize();
    expect(analytics.getSnapshot().hydrated).toBe(false);
    expect(analytics.capture('note_saved', note)).toBe(false);
    analytics.setIdentity(null);
    await settle();
    expect(analytics.getSnapshot()).toMatchObject({ hydrated: true, consentKnown: false, enabled: false });
    expect(dependencies.createTransport).not.toHaveBeenCalled();
    await analytics.setConsent(true);
    expect(dependencies.createTransport).toHaveBeenCalledTimes(1);
    expect(analytics.capture('note_saved', note)).toBe(true);
});

test('disabled build/config never constructs SDK even with a stored opt-in', async () => {
    const { analytics, dependencies } = setup({ [key('A')]: 'true' }, false);
    analytics.setIdentity('A');
    await analytics.initialize();
    expect(analytics.getSnapshot()).toMatchObject({ consent: true, enabled: false, available: false });
    expect(dependencies.createTransport).not.toHaveBeenCalled();
});

test('returning account keeps its identity on token refresh and later login without copying consent to B', async () => {
    const { analytics, transport, events } = setup({ [key('A')]: 'true' });
    analytics.setIdentity('A');
    await analytics.initialize();
    const visit = analytics.getVisitId();
    analytics.setIdentity('A');
    expect(analytics.getVisitId()).toBe(visit);
    expect(transport.activate).toHaveBeenCalledTimes(1);
    analytics.capture('note_saved', note);
    analytics.setIdentity(null);
    await settle();
    analytics.setIdentity('B');
    await settle();
    expect(analytics.getSnapshot()).toMatchObject({ consentKnown: false, enabled: false });
    analytics.setIdentity('A');
    await settle();
    expect(analytics.capture('note_saved', note)).toBe(true);
    expect(events.map((event) => event.owner)).toEqual(['A', 'A']);
});

test('only a fresh anonymous explicit choice transfers to first account; existing refusal wins', async () => {
    const { analytics, values } = setup({ [key('B')]: 'false' });
    analytics.setIdentity(null);
    await analytics.initialize();
    await analytics.setConsent(true);
    analytics.setIdentity('A');
    await settle();
    expect(values.get(key('A'))).toBe('true');
    analytics.setIdentity(null);
    await settle();
    expect(analytics.getSnapshot().consentKnown).toBe(false);
    await analytics.setConsent(true);
    analytics.setIdentity('B');
    await settle();
    expect(analytics.getSnapshot()).toMatchObject({ consentKnown: true, consent: false, enabled: false });
});

test('account switch and opt-out synchronously invalidate late callbacks and clear the queue', async () => {
    const { analytics, transport } = setup({ [key('A')]: 'true', [key('B')]: 'true' });
    analytics.setIdentity('A');
    await analytics.initialize();
    const oldA = analytics.beginOperation();
    analytics.setIdentity('B');
    expect(oldA.capture('note_saved', note)).toBe(false);
    await settle();
    const oldB = analytics.beginOperation();
    const revoke = analytics.setConsent(false);
    expect(oldB.isCurrent()).toBe(false);
    expect(analytics.capture('note_saved', note)).toBe(false);
    expect(transport.deactivate).toHaveBeenLastCalledWith(true);
    await revoke;
});

test('deferred old consent hydration cannot overwrite a new owner or instantiate SDK', async () => {
    const { analytics, dependencies } = setup({ [key('A')]: 'true' });
    const gate = deferred();
    const originalRead = dependencies.storage.getItem;
    dependencies.storage.getItem = jest.fn(async (name) => { if (name === key('A')) await gate.promise; return originalRead(name); });
    analytics.setIdentity('A');
    void analytics.initialize();
    await settle();
    analytics.setIdentity('B');
    await settle();
    gate.resolve();
    await settle();
    expect(analytics.getIdentity()).toBe('B');
    expect(analytics.getSnapshot()).toMatchObject({ consent: false, enabled: false });
    expect(dependencies.createTransport).not.toHaveBeenCalled();
});

test('rapid opt-out and opt-in persist in request order and cannot revive old operations', async () => {
    const { analytics, values } = setup({ [key('A')]: 'true' });
    analytics.setIdentity('A');
    await analytics.initialize();
    const stale = analytics.beginOperation();
    const off = analytics.setConsent(false);
    const on = analytics.setConsent(true);
    await Promise.all([off, on]);
    expect(values.get(key('A'))).toBe('true');
    expect(analytics.getSnapshot().enabled).toBe(true);
    expect(stale.capture('note_saved', note)).toBe(false);
});

test('storage failure leaves capture disabled and reports a safe retryable error', async () => {
    const { analytics, dependencies } = setup();
    analytics.setIdentity(null);
    await analytics.initialize();
    dependencies.storage.setItem = jest.fn(async () => { throw new Error('sensitive storage response'); });
    await expect(analytics.setConsent(true)).rejects.toThrow('could not be saved');
    expect(analytics.getSnapshot().enabled).toBe(false);
    expect(dependencies.createTransport).not.toHaveBeenCalled();
});

test('opt-out cleans local linkage, and deleting stale A does not disable signed-in B', async () => {
    const { analytics, values, transport } = setup({ [key('A')]: 'true', [key('B')]: 'true' });
    analytics.setIdentity('B');
    await analytics.initialize();
    const cleanup = jest.fn(async () => undefined);
    analytics.registerCleanup(cleanup);
    await analytics.forgetAccount('A');
    expect(values.has(key('A'))).toBe(false);
    expect(analytics.getSnapshot().enabled).toBe(true);
    expect(transport.deactivate).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledWith('account_deleted', 'A');
    await analytics.setConsent(false);
    expect(cleanup).toHaveBeenCalledWith('opt_out', 'B');
});

test('runtime allowlist drops raw data and rejects unknown or malformed events; dedupe stays local and bounded', async () => {
    const { analytics, events } = setup({ [key('A')]: 'true' });
    analytics.setIdentity('A');
    await analytics.initialize();
    const unsafeCapture = analytics.capture as (event: string, properties: unknown, options?: { dedupeKey?: string }) => boolean;
    expect(unsafeCapture('note_saved', { ...note, note_id: 'private', text: 'therapy detail', error: new Error('secret') }, { dedupeKey: 'local-note-id' })).toBe(true);
    expect(events[0].properties).toEqual(note);
    expect(JSON.stringify(events[0])).not.toContain('local-note-id');
    expect(analytics.capture('note_saved', note, { dedupeKey: 'local-note-id' })).toBe(false);
    expect(unsafeCapture('screen', { route: '/notes/private' })).toBe(false);
    expect(unsafeCapture('note_saved', { ...note, entry_point: 'private route' })).toBe(false);
    for (let index = 0; index < 257; index++) analytics.capture('note_saved', note, { dedupeKey: String(index) });
    expect(analytics.capture('note_saved', note, { dedupeKey: 'local-note-id' })).toBe(true);
});

test('capture timestamps reflect action time and visits rotate only after 30 minutes away', async () => {
    const { analytics, events, advance } = setup({ [key('A')]: 'true' });
    analytics.setIdentity('A');
    await analytics.initialize();
    const firstVisit = analytics.getVisitId();
    analytics.capture('note_saved', note);
    analytics.onAppStateChange('inactive');
    advance(29 * 60_000);
    analytics.onAppStateChange('active');
    expect(analytics.getVisitId()).toBe(firstVisit);
    analytics.onAppStateChange('background');
    advance(30 * 60_000);
    analytics.onAppStateChange('active');
    expect(analytics.getVisitId()).not.toBe(firstVisit);
    expect(events[0].timestamp.toISOString()).toBe(new Date(1000).toISOString());
});


test('immediate anonymous-to-account checkout waits for account consent and SDK readiness before starting', async () => {
    const { analytics, dependencies, transport, events, advance } = setup({ [key('A')]: 'true' });
    analytics.setIdentity(null);
    await analytics.initialize();
    await analytics.setConsent(true);
    const consentRead = deferred();
    const sdkReady = deferred();
    const read = dependencies.storage.getItem;
    dependencies.storage.getItem = jest.fn(async (name) => { if (name === key('A')) await consentRead.promise; return read(name); });
    const activate = transport.activate.getMockImplementation()!;
    transport.activate.mockImplementation(async (id, current) => { await sdkReady.promise; await activate(id, current); });
    analytics.setIdentity('A');
    const preparation = analytics.beginOperationWhenReady();
    let resolved = false;
    void preparation.then(() => { resolved = true; });
    await settle();
    expect(analytics.getSnapshot().consentKnown).toBe(false);
    expect(resolved).toBe(false);
    expect(events).toEqual([]);
    consentRead.resolve();
    await settle();
    expect(analytics.getSnapshot()).toMatchObject({ consent: true, enabled: false });
    expect(resolved).toBe(false);
    sdkReady.resolve();
    const scope = await preparation;
    expect(scope.enabled).toBe(true);
    advance(500);
    scope.capture('checkout_started', { operation: 'purchase', plan: 'annual', entry_point: 'onboarding' });
    advance(1000);
    scope.capture('checkout_result', { operation: 'purchase', plan: 'annual', entry_point: 'onboarding', outcome: 'purchased' });
    expect(events.map((event) => ({ owner: event.owner, at: event.timestamp.getTime() }))).toEqual([{ owner: 'A', at: 1500 }, { owner: 'A', at: 2500 }]);
});

test.each([null, 'false'])('does not prepare or buffer an account operation with consent %s', async (consent) => {
    const { analytics, dependencies } = setup(consent === null ? {} : { [key('A')]: consent });
    analytics.setIdentity('A');
    const scope = await analytics.beginOperationWhenReady();
    expect(scope.enabled).toBe(false);
    expect(dependencies.createTransport).not.toHaveBeenCalled();
    await analytics.setConsent(true);
    expect(scope.capture('note_saved', note)).toBe(false);
});

test.each(['consent', 'sdk'])('times out stalled %s readiness without reviving that checkout later', async (stage) => {
    jest.useFakeTimers();
    try {
        const { analytics, dependencies, transport, events } = setup({ [key('A')]: 'true' });
        const gate = deferred();
        if (stage === 'consent') {
            const read = dependencies.storage.getItem;
            dependencies.storage.getItem = async (name) => { await gate.promise; return read(name); };
        } else {
            const activate = transport.activate.getMockImplementation()!;
            transport.activate.mockImplementation(async (id, current) => { await gate.promise; await activate(id, current); });
        }
        analytics.setIdentity('A');
        const preparation = analytics.beginOperationWhenReady();
        await settle();
        jest.advanceTimersByTime(ANALYTICS_READY_TIMEOUT_MS);
        const scope = await preparation;
        expect(scope.enabled).toBe(false);
        gate.resolve();
        await settle();
        expect(analytics.getSnapshot().enabled).toBe(true);
        expect(scope.capture('note_saved', note)).toBe(false);
        expect(events).toEqual([]);
        expect(jest.getTimerCount()).toBe(0);
    } finally { jest.useRealTimers(); }
});

test.each(['logout', 'switch', 'opt_out'])('%s cancels readiness before its deadline and never attributes the old action', async (action) => {
    const { analytics, transport, events } = setup({ [key('A')]: 'true', [key('B')]: 'true' });
    const gate = deferred();
    const activate = transport.activate.getMockImplementation()!;
    transport.activate.mockImplementation(async (id, current) => { await gate.promise; await activate(id, current); });
    analytics.setIdentity('A');
    const preparation = analytics.beginOperationWhenReady();
    await settle();
    if (action === 'opt_out') await analytics.setConsent(false);
    else analytics.setIdentity(action === 'logout' ? null : 'B');
    const scope = await preparation;
    expect(scope.enabled).toBe(false);
    gate.resolve();
    await settle();
    expect(scope.capture('note_saved', note)).toBe(false);
    expect(events).toEqual([]);
});

test('SDK activation failure returns a disabled scope without waiting for the deadline', async () => {
    jest.useFakeTimers();
    try {
        const { analytics, transport } = setup({ [key('A')]: 'true' });
        transport.activate.mockRejectedValue(new Error('SDK storage failure'));
        analytics.setIdentity('A');
        expect((await analytics.beginOperationWhenReady()).enabled).toBe(false);
        expect(jest.getTimerCount()).toBe(0);
    } finally { jest.useRealTimers(); }
});
