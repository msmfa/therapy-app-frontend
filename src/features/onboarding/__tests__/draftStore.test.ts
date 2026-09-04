import * as SecureStore from 'expo-secure-store';
import {
    clearDraft,
    parseDraft,
    promoteAnonDraft,
    readDraft,
    writeDraft,
    type OnboardingDraft,
} from '../draftStore';

jest.mock('expo-secure-store', () => {
    const store = new Map<string, string>();
    return {
        __store: store,
        getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
        setItemAsync: jest.fn((key: string, value: string) => {
            store.set(key, value);
            return Promise.resolve();
        }),
        deleteItemAsync: jest.fn((key: string) => {
            store.delete(key);
            return Promise.resolve();
        }),
    };
});

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;

const draft = (overrides: Partial<OnboardingDraft> = {}): OnboardingDraft => ({
    goal: 'practise',
    sessionAtIso: '2026-09-08T16:00:00.000Z',
    sessionDateSkipped: false,
    cadence: 'weekly',
    morningMinutes: 450,
    eveningMinutes: 1200,
    plan: 'annual',
    reminderScheduled: false,
    resumeRoute: '/(onboarding)/reminder-times',
    ...overrides,
});

beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
});

describe('draft storage', () => {
    it('round-trips a draft, including the session date', async () => {
        await writeDraft('user-a', draft());

        const restored = await readDraft('user-a');
        expect(restored).toEqual(draft());
        expect(new Date(restored!.sessionAtIso!).getUTCHours()).toBe(16);
    });

    it('round-trips an explicit choice to continue without a booked session', async () => {
        const sampleDraft = draft({ sessionAtIso: null, sessionDateSkipped: true });

        await writeDraft('user-a', sampleDraft);

        await expect(readDraft('user-a')).resolves.toEqual(sampleDraft);
    });

    it('keeps the keychain, not plain storage, as the home for the draft', async () => {
        await writeDraft('user-a', draft());
        expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('returns null when nothing was stored', async () => {
        await expect(readDraft('user-a')).resolves.toBeNull();
    });
});

describe('isolation between accounts', () => {
    it('never returns one account\'s answers to another', async () => {
        await writeDraft('user-a', draft({ goal: 'prepare', cadence: 'weekly' }));
        await writeDraft('user-b', draft({ goal: 'habit', cadence: 'monthly' }));

        expect((await readDraft('user-a'))?.goal).toBe('prepare');
        expect((await readDraft('user-b'))?.goal).toBe('habit');
    });

    it('keeps the signed-out draft separate from any account', async () => {
        await writeDraft(null, draft({ goal: 'prepare' }));
        await expect(readDraft('user-a')).resolves.toBeNull();
    });

    it('clears only the account it was asked to clear', async () => {
        await writeDraft('user-a', draft());
        await writeDraft('user-b', draft());

        await clearDraft('user-a');

        expect(await readDraft('user-a')).toBeNull();
        expect(await readDraft('user-b')).not.toBeNull();
    });
});

describe('promoteAnonDraft', () => {
    it('carries a signed-out draft onto the account that signs in', async () => {
        await writeDraft(null, draft({ goal: 'practise' }));

        const promoted = await promoteAnonDraft('user-a');

        expect(promoted?.goal).toBe('practise');
        expect((await readDraft('user-a'))?.goal).toBe('practise');
    });

    it('always removes the anonymous record, so it cannot leak to the next visitor', async () => {
        await writeDraft(null, draft({ goal: 'practise' }));

        await promoteAnonDraft('user-a');

        expect(await readDraft(null)).toBeNull();
    });

    it('does not let a stranger\'s anonymous draft overwrite the account\'s own', async () => {
        await writeDraft('user-a', draft({ goal: 'prepare' }));
        await writeDraft(null, draft({ goal: 'habit' }));

        const promoted = await promoteAnonDraft('user-a');

        expect(promoted?.goal).toBe('prepare');
        expect(await readDraft(null)).toBeNull();
    });

    it('returns null when there is nothing to carry over', async () => {
        await expect(promoteAnonDraft('user-a')).resolves.toBeNull();
    });
});

describe('parseDraft', () => {
    it('rejects a record whose date no longer parses', () => {
        expect(parseDraft(JSON.stringify(draft({ sessionAtIso: 'not-a-date' })))).toBeNull();
    });

    it('rejects malformed JSON rather than throwing', () => {
        expect(parseDraft('{ broken')).toBeNull();
    });

    it('falls back to the annual plan when the stored value is unrecognised', () => {
        const parsed = parseDraft(JSON.stringify({ ...draft(), plan: 'weekly' }));
        expect(parsed?.plan).toBe('annual');
    });

    it('drops an unrecognised resume route instead of navigating to it', () => {
        const parsed = parseDraft(JSON.stringify({ ...draft(), resumeRoute: '/admin' }));
        expect(parsed?.resumeRoute).toBeNull();
    });

    it('does not let a stale skip flag override a real appointment', () => {
        const parsed = parseDraft(JSON.stringify({ ...draft(), sessionDateSkipped: true }));

        expect(parsed?.sessionDateSkipped).toBe(false);
    });
});

describe('validation of stored values', () => {
    it('drops a goal this build no longer offers instead of casting it', () => {
        const parsed = parseDraft(JSON.stringify({ ...draft(), goal: 'become-happier' }));

        expect(parsed?.goal).toBeNull();
    });

    it('drops an unrecognised cadence so session generation cannot run on it', () => {
        const parsed = parseDraft(JSON.stringify({ ...draft(), cadence: 'twice-weekly' }));

        expect(parsed?.cadence).toBeNull();
    });

    it('accepts every cadence and goal the build does offer', () => {
        (['weekly', 'fortnightly', 'monthly', 'varies'] as const).forEach((cadence) => {
            expect(parseDraft(JSON.stringify(draft({ cadence })))?.cadence).toBe(cadence);
        });
		(['practise', 'prepare', 'habit'] as const).forEach((goal) => {
			expect(parseDraft(JSON.stringify(draft({ goal })))?.goal).toBe(goal);
		});
	});

	it('drops the retired remember choice from an unfinished draft', () => {
		const parsed = parseDraft(JSON.stringify(draft({ goal: 'remember' })));

		expect(parsed?.goal).toBeNull();
	});

    it('falls back to a sane time when the stored minutes are out of range', () => {
        const negative = parseDraft(JSON.stringify({ ...draft(), morningMinutes: -30 }));
        const tooLarge = parseDraft(JSON.stringify({ ...draft(), eveningMinutes: 5000 }));
        const fractional = parseDraft(JSON.stringify({ ...draft(), morningMinutes: 12.5 }));

        expect(negative?.morningMinutes).toBe(450);
        expect(tooLarge?.eveningMinutes).toBe(1200);
        expect(fractional?.morningMinutes).toBe(450);
    });

    it('falls back when the minutes are not numbers at all', () => {
        const parsed = parseDraft(JSON.stringify({ ...draft(), morningMinutes: '07:30' }));

        expect(parsed?.morningMinutes).toBe(450);
    });

    it('survives a record with nothing recognisable in it', () => {
        const parsed = parseDraft(JSON.stringify({ nonsense: true }));

        expect(parsed).toEqual({
            goal: null,
            sessionAtIso: null,
            sessionDateSkipped: false,
            cadence: null,
            morningMinutes: 450,
            eveningMinutes: 1200,
            plan: 'annual',
            reminderScheduled: false,
            resumeRoute: null,
        });
    });
});
