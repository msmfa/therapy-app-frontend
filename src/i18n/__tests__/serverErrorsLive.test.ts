/**
 * Real server failures, rendered in French by the real mapper.
 * Skipped unless I18N_BACKEND_URL is set.
 */
import { serverErrorMessage } from '../../features/errors/serverErrorMessage';
import { i18next } from '../index';
import fr from '../locales/fr.json';

const BASE = process.env.I18N_BACKEND_URL;
const d = BASE ? describe : describe.skip;

d('server failures in French, end to end', () => {
    // The app's own auth calls, not apiPost. They pass `auth: false`, which is
    // what keeps the client's 401-refresh branch out of the way; reaching for
    // apiPost directly makes a wrong password come back as the client's own
    // "Authentication required" and proves nothing about the server's code.
    let loginWithPassword: typeof import('../../api/auth').loginWithPassword;
    let registerAccount: typeof import('../../api/auth').registerAccount;

    beforeAll(async () => {
        const client = require('../../api/client') as typeof import('../../api/client');
        client.configureApiClient({ baseUrl: BASE, getToken: () => null });
        const auth = require('../../api/auth') as typeof import('../../api/auth');
        loginWithPassword = auth.loginWithPassword;
        registerAccount = auth.registerAccount;
        await i18next.changeLanguage('fr');
    });
    afterAll(async () => { await i18next.changeLanguage('en'); });

    const failureFrom = async (call: () => Promise<unknown>): Promise<string> => {
        try {
            await call();
            throw new Error('expected the request to fail');
        } catch (error) {
            return serverErrorMessage(error);
        }
    };

    it('renders a wrong password in French', async () => {
        const email = `codes${Date.now()}@example.com`;
        await registerAccount({ email, password: 'Password123!', name: 'C' });

        const message = await failureFrom(() => loginWithPassword(email, 'Wrong123!'));
        expect(message).toBe(fr.serverError.invalid_credentials);
    });

    it('renders a duplicate registration in French', async () => {
        const email = `dup${Date.now()}@example.com`;
        await registerAccount({ email, password: 'Password123!', name: 'C' });

        const message = await failureFrom(() => registerAccount({ email, password: 'Password123!', name: 'C' }));
        expect(message).toBe(fr.serverError.user_already_exists);
    });

    it('renders a rejected body in French', async () => {
        const message = await failureFrom(() => registerAccount({ email: 'not-an-email', password: 'x', name: '' }));
        expect(message).toBe(fr.serverError.validation_failed);
    });
});
