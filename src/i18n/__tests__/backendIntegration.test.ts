/**
 * The frontend's own API functions against a real running backend.
 *
 * The contract test inside the backend asserts hand-written payloads. This
 * asserts the payloads the app actually builds, by calling the same exported
 * functions the screens call, so a rename or a dropped field on this side
 * fails here rather than in production.
 *
 * Skipped unless I18N_BACKEND_URL points at a server, so the normal suite is
 * unaffected.
 */

const BASE = process.env.I18N_BACKEND_URL;
const describeIfBackend = BASE ? describe : describe.skip;

describeIfBackend('frontend language calls against a live backend', () => {
    let token = '';
    let registerDeviceToken: typeof import('../../api/devices').registerDeviceToken;
    let updateCurrentUser: typeof import('../../api/users').updateCurrentUser;
    let getCurrentUserSettings: typeof import('../../api/users').getCurrentUserSettings;

    beforeAll(async () => {
        const email = `i18n${Date.now()}@example.com`;
        const res = await fetch(`${BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'Password123!', name: 'I18n' }),
        });
        const body = (await res.json()) as { token: string };
        token = body.token;

        // The app's own configuration hook, the same one AuthProvider uses, so
        // the requests below go through the real client rather than a stand-in.
        const client = require('../../api/client') as typeof import('../../api/client');
        client.configureApiClient({ baseUrl: BASE, getToken: () => token });

        registerDeviceToken = (require('../../api/devices') as typeof import('../../api/devices')).registerDeviceToken;
        const users = require('../../api/users') as typeof import('../../api/users');
        updateCurrentUser = users.updateCurrentUser;
        getCurrentUserSettings = users.getCurrentUserSettings;
    });

    it('registerDeviceToken lands its tag in deviceLocale, not locale', async () => {
        await registerDeviceToken('ExponentPushToken[cccccccccccccccccccccc]', 'ios');

        const settings = await getCurrentUserSettings();
        expect(settings.deviceLocale).toBeTruthy();
        expect(settings.locale).toBeUndefined();
    });

    it('an explicit choice is stored and read back', async () => {
        await updateCurrentUser({ locale: 'fr' });
        expect((await getCurrentUserSettings()).locale).toBe('fr');
    });

    it('System sends null and clears the stored choice', async () => {
        await updateCurrentUser({ locale: 'fr' });
        await updateCurrentUser({ locale: null });
        expect((await getCurrentUserSettings()).locale).toBeUndefined();
    });

    it('registering again does not overwrite the explicit choice', async () => {
        await updateCurrentUser({ locale: 'fr' });
        await registerDeviceToken('ExponentPushToken[dddddddddddddddddddddd]', 'ios');

        const settings = await getCurrentUserSettings();
        expect(settings.locale).toBe('fr');
    });
});
