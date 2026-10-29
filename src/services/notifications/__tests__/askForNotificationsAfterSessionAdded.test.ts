// The prompt the app raises on its own, after a session is added or when it
// opens with reminders to come: only while the system has not decided, once
// per app run across both, a grant registers the device, and nothing it does
// can fail the save it follows.

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockEnsurePushRegistration = jest.fn();

jest.mock('expo-notifications', () => ({
    getPermissionsAsync: (...args: unknown[]) => mockGetPermissions(...args),
    requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissions(...args),
    setNotificationHandler: jest.fn(),
}));

jest.mock('../pushRegistration', () => ({
    ensurePushRegistration: (...args: unknown[]) => mockEnsurePushRegistration(...args),
}));

jest.mock('../../../features/analytics/client', () => ({
    analytics: { beginOperation: () => ({ capture: jest.fn() }) },
}));

type AskModule = typeof import('../permission');

/** A fresh copy of the module, so each test starts a new app run. */
function loadModule(): AskModule {
    let loaded: AskModule | undefined;
    jest.isolateModules(() => {
        loaded = require('../permission') as AskModule;
    });
    if (!loaded) throw new Error('module did not load');
    return loaded;
}

function loadAsk(): AskModule['askForNotificationsAfterSessionAdded'] {
    return loadModule().askForNotificationsAfterSessionAdded;
}

const undetermined = { status: 'undetermined', canAskAgain: true };
const granted = { status: 'granted', canAskAgain: true };
const denied = { status: 'denied', canAskAgain: false };

beforeEach(() => {
    jest.clearAllMocks();
    mockEnsurePushRegistration.mockResolvedValue({ status: 'registered', token: 't' });
});

it('asks while the system has not decided, then registers the device on a grant', async () => {
    mockGetPermissions.mockResolvedValue(undetermined);
    mockRequestPermissions.mockResolvedValue(granted);

    await loadAsk()();

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockEnsurePushRegistration).toHaveBeenCalledTimes(1);
});

it('registers nothing when the user declines', async () => {
    mockGetPermissions.mockResolvedValue(undetermined);
    mockRequestPermissions.mockResolvedValue(denied);

    await loadAsk()();

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockEnsurePushRegistration).not.toHaveBeenCalled();
});

it.each([
    ['already granted', granted],
    ['denied for good', denied],
])('does not ask when permission is %s', async (_label, permission) => {
    mockGetPermissions.mockResolvedValue(permission);

    await loadAsk()();

    expect(mockRequestPermissions).not.toHaveBeenCalled();
});

it('asks once for sessions added together', async () => {
    mockGetPermissions.mockResolvedValue(undetermined);
    mockRequestPermissions.mockResolvedValue(granted);
    const ask = loadAsk();

    await Promise.all([ask(), ask()]);

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
});

it('does not ask twice in a row, even where the system would allow it', async () => {
    // Android lets an app ask again after one refusal.
    mockGetPermissions.mockResolvedValue(undetermined);
    mockRequestPermissions.mockResolvedValue({ status: 'denied', canAskAgain: true });
    const ask = loadAsk();

    await ask();
    await ask();

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
});

it('resolves whatever goes wrong, so the save is never failed by it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockGetPermissions.mockRejectedValue(new Error('native module unavailable'));
    await expect(loadAsk()()).resolves.toBeUndefined();

    mockGetPermissions.mockResolvedValue(undetermined);
    mockRequestPermissions.mockRejectedValue(new Error('prompt failed'));
    await expect(loadAsk()()).resolves.toBeUndefined();

    mockRequestPermissions.mockResolvedValue(granted);
    mockEnsurePushRegistration.mockRejectedValue(new Error('offline'));
    await expect(loadAsk()()).resolves.toBeUndefined();
    warn.mockRestore();
});

it('asks when the app opens, and then not again after a session is added', async () => {
    mockGetPermissions.mockResolvedValue(undetermined);
    mockRequestPermissions.mockResolvedValue({ status: 'denied', canAskAgain: true });
    const { askForNotificationsOnOpen, askForNotificationsAfterSessionAdded } = loadModule();

    await askForNotificationsOnOpen();
    await askForNotificationsAfterSessionAdded();

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
});

it('asks nothing for the rest of the run once the user chose Not now', async () => {
    mockGetPermissions.mockResolvedValue(undetermined);
    const {
        askForNotificationsOnOpen,
        askForNotificationsAfterSessionAdded,
        skipNotificationAskThisRun,
    } = loadModule();

    skipNotificationAskThisRun();
    await askForNotificationsAfterSessionAdded();
    await askForNotificationsOnOpen();

    expect(mockRequestPermissions).not.toHaveBeenCalled();
});

it('asks on the next launch after Not now', async () => {
    mockGetPermissions.mockResolvedValue(undetermined);
    mockRequestPermissions.mockResolvedValue(granted);
    loadModule().skipNotificationAskThisRun();

    await loadModule().askForNotificationsOnOpen();

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockEnsurePushRegistration).toHaveBeenCalledTimes(1);
});
