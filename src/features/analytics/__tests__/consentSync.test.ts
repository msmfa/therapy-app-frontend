import { createConsentSync } from '../consentSync';
import { ANALYTICS_STORAGE_SUFFIX } from '../config';

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => { resolve = done; });
    return { promise, resolve };
};

function setup() {
    const state = { identity: 'user-a' as string | null, consent: true, available: true, hydrated: true };
    const legacyKey = `plastic_brains.analytics_pending_consent.v1${ANALYTICS_STORAGE_SUFFIX}.user-a`;
    const data = new Map([[legacyKey, JSON.stringify({ consent: false, revision: 4 })]]);
    const storage = { removeItem: jest.fn(async (key: string) => { data.delete(key); }) };
    const runtime = {
        getIdentity: () => state.identity,
        getSnapshot: () => ({ ...state, consentKnown: state.hydrated, enabled: state.consent }),
        initialize: jest.fn(async () => {}),
    };
    const read = jest.fn<Promise<{ analyticsConsent?: boolean }>, []>(async () => ({}));
    const write = jest.fn<Promise<void>, [true]>(async () => {});
    return { state, data, storage, runtime, read, write,
        sync: createConsentSync({ runtime, storage, read, write }) };
}

it.each([false, undefined])('marks an existing account consented when the old server value is %s', async (analyticsConsent) => {
    const f = setup();
    f.read.mockResolvedValue({ analyticsConsent });
    await expect(f.sync.sync()).resolves.toBe(true);
    expect(f.write).toHaveBeenCalledWith(true);
    expect(f.state.consent).toBe(true);
    expect(f.data.size).toBe(0);
});

it('does not rewrite an already-consented account', async () => {
    const f = setup();
    f.read.mockResolvedValue({ analyticsConsent: true });
    await expect(f.sync.sync()).resolves.toBe(true);
    expect(f.write).not.toHaveBeenCalled();
});

it.each(['read', 'write'] as const)('retries a failed %s on the next foreground sync', async (stage) => {
    const f = setup();
    f[stage].mockRejectedValueOnce(new Error('offline'));
    await expect(f.sync.sync()).resolves.toBe(false);
    await expect(f.sync.sync()).resolves.toBe(true);
    expect(f.write).toHaveBeenLastCalledWith(true);
});

it('shares concurrent requests for the same account', async () => {
    const f = setup();
    const response = deferred<{ analyticsConsent: boolean }>();
    f.read.mockReturnValueOnce(response.promise);
    const first = f.sync.sync();
    expect(f.sync.sync()).toBe(first);
    response.resolve({ analyticsConsent: false });
    await first;
    expect(f.read).toHaveBeenCalledTimes(1);
    expect(f.write).toHaveBeenCalledTimes(1);
});

it('does not apply an old account response to a newly signed-in account', async () => {
    const f = setup();
    const response = deferred<{ analyticsConsent: boolean }>();
    f.read.mockReturnValueOnce(response.promise);
    const request = f.sync.sync();
    for (let i = 0; i < 20 && f.read.mock.calls.length === 0; i++) await Promise.resolve();
    f.state.identity = 'user-b';
    response.resolve({ analyticsConsent: false });
    await expect(request).resolves.toBe(false);
    expect(f.write).not.toHaveBeenCalled();
    await expect(f.sync.sync()).resolves.toBe(true);
    expect(f.write).toHaveBeenCalledTimes(1);
});

it('does not revive a deleted account from an older settings response', async () => {
    const f = setup();
    const response = deferred<{ analyticsConsent: boolean }>();
    f.read.mockReturnValueOnce(response.promise);
    const request = f.sync.sync();
    for (let i = 0; i < 20 && f.read.mock.calls.length === 0; i++) await Promise.resolve();
    await f.sync.forgetAccount('user-a');
    response.resolve({ analyticsConsent: false });
    await expect(request).resolves.toBe(false);
    await expect(f.sync.sync()).resolves.toBe(false);
    expect(f.write).not.toHaveBeenCalled();
    expect(f.data.size).toBe(0);
});

it.each(['anonymous', 'excluded', 'storage failure', 'suppressed'])('does not synchronize for %s', async (condition) => {
    const f = setup();
    if (condition === 'anonymous') f.state.identity = null;
    if (condition === 'excluded') f.state.available = false;
    if (condition === 'storage failure') f.state.hydrated = false;
    if (condition === 'suppressed') f.state.consent = false;
    await f.sync.sync();
    expect(f.read).not.toHaveBeenCalled();
    expect(f.write).not.toHaveBeenCalled();
});
