import { createConsentSync } from '../consentSync';

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => { resolve = done; });
    return { promise, resolve };
};

function setup(syncWithAccount = true) {
    const state = { identity: 'user-a' as string | null, consent: false, consentKnown: true };
    const data = new Map<string, string>();
    const storage = {
        getItem: jest.fn(async (key: string) => data.get(key) ?? null),
        setItem: jest.fn(async (key: string, value: string) => { data.set(key, value); }),
        removeItem: jest.fn(async (key: string) => { data.delete(key); }),
    };
    const runtime = {
        getIdentity: () => state.identity,
        getSnapshot: () => ({ ...state, hydrated: true, enabled: state.consent, available: true }),
        initialize: async () => {},
        setConsent: jest.fn(async (value: boolean) => { state.consent = value; state.consentKnown = true; }),
    };
    const read = jest.fn<Promise<{ analyticsConsent?: boolean }>, []>(async () => ({}));
    const write = jest.fn<Promise<void>, [boolean]>(async () => {});
    return { state, data, storage, runtime, read, write,
        sync: createConsentSync({ runtime, storage, read, write, syncWithAccount }) };
}

it('keeps pre-consented beta choices local across startup, foreground and account switches', async () => {
    const f = setup(false);
    f.state.consent = true;
    f.read.mockResolvedValue({ analyticsConsent: false });
    await expect(f.sync.sync()).resolves.toBe(true);
    f.state.identity = 'user-b';
    await expect(f.sync.sync()).resolves.toBe(true);
    await expect(f.sync.setConsent(false)).resolves.toEqual({ synced: true });
    await expect(f.sync.setConsent(true)).resolves.toEqual({ synced: true });
    expect(f.read).not.toHaveBeenCalled();
    expect(f.write).not.toHaveBeenCalled();
    expect(f.storage.getItem).not.toHaveBeenCalled();
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.data.size).toBe(0);
    expect(f.runtime.setConsent.mock.calls).toEqual([[false], [true]]);
    await f.sync.forgetAccount('user-b');
    await expect(f.sync.setConsent(true)).rejects.toThrow('no longer available');
});

it('stops local capture immediately and retries the account opt-out after reconnecting', async () => {
    const f = setup();
    f.state.consent = true;
    f.write.mockRejectedValueOnce(new Error('offline'));
    const save = f.sync.setConsent(false);
    expect(f.state.consent).toBe(false);
    await expect(save).resolves.toEqual({ synced: false });
    expect(f.data.size).toBe(1);
    await expect(f.sync.sync()).resolves.toBe(true);
    expect(f.write.mock.calls).toEqual([[false], [false]]);
    expect(f.data.size).toBe(0);
});

it('serializes quick toggles so a slow opt-in cannot overwrite the latest opt-out', async () => {
    const f = setup();
    const firstWrite = deferred<void>();
    f.write.mockImplementationOnce(() => firstWrite.promise);
    const first = f.sync.setConsent(true);
    for (let i = 0; i < 20 && f.write.mock.calls.length === 0; i++) await Promise.resolve();
    expect(f.write).toHaveBeenCalledWith(true);
    const second = f.sync.setConsent(false);
    firstWrite.resolve();
    await Promise.all([first, second]);
    expect(f.write.mock.calls).toEqual([[true], [false]]);
    expect(f.state.consent).toBe(false);
    expect(f.data.size).toBe(0);
});

it('does not apply an old account response to a newly signed-in account', async () => {
    const f = setup();
    const response = deferred<{ analyticsConsent: boolean }>();
    f.read.mockReturnValueOnce(response.promise);
    const sync = f.sync.sync();
    for (let i = 0; i < 20 && f.read.mock.calls.length === 0; i++) await Promise.resolve();
    f.state.identity = 'user-b';
    response.resolve({ analyticsConsent: true });
    await expect(sync).resolves.toBe(false);
    expect(f.runtime.setConsent).not.toHaveBeenCalled();
    expect(f.write).not.toHaveBeenCalled();
});

it('applies the server choice when there is no newer pending local choice', async () => {
    const f = setup();
    f.state.consent = true;
    f.read.mockResolvedValue({ analyticsConsent: false });
    await expect(f.sync.sync()).resolves.toBe(true);
    expect(f.runtime.setConsent).toHaveBeenCalledWith(false);
    expect(f.write).not.toHaveBeenCalled();
});

it('never replaces a newer local toggle with a stale settings read', async () => {
    const f = setup();
    const response = deferred<{ analyticsConsent: boolean }>();
    f.read.mockReturnValueOnce(response.promise);
    const refresh = f.sync.sync();
    for (let i = 0; i < 20 && f.read.mock.calls.length === 0; i++) await Promise.resolve();
    const save = f.sync.setConsent(true);
    response.resolve({ analyticsConsent: false });
    await Promise.all([refresh, save]);
    expect(f.runtime.setConsent.mock.calls).toEqual([[true]]);
    expect(f.write).toHaveBeenCalledWith(true);
});

it('removes a pending preference when its account has been deleted', async () => {
    const f = setup();
    f.write.mockRejectedValueOnce(new Error('offline'));
    await f.sync.setConsent(true);
    expect(f.data.size).toBe(1);
    await f.sync.forgetAccount('user-a');
    expect(f.data.size).toBe(0);
});

it('cannot reactivate a deleted account from an older preference response before auth cleanup finishes', async () => {
    const f = setup();
    const response = deferred<{ analyticsConsent: boolean }>();
    f.read.mockReturnValueOnce(response.promise);
    const request = f.sync.sync();
    for (let i = 0; i < 20 && f.read.mock.calls.length === 0; i++) await Promise.resolve();
    await f.sync.forgetAccount('user-a');
    // Auth still identifies A while local notes and credentials are removed.
    response.resolve({ analyticsConsent: true });
    await expect(request).resolves.toBe(false);
    expect(f.runtime.setConsent).not.toHaveBeenCalled();
    expect(f.write).not.toHaveBeenCalled();
    await expect(f.sync.setConsent(true)).rejects.toThrow('no longer available');
});
