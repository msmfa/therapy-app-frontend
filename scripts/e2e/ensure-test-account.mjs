/**
 * Makes sure the dedicated staging E2E account exists and its password works.
 *
 * Idempotent: run it as often as you like. If the account is already there and
 * the credentials are right, it reports that and exits 0. It only ever creates
 * the one account named by E2E_EMAIL, and never deletes anything.
 *
 * Run this once when setting up the CI secrets, and again if the staging
 * database is ever rebuilt. CI does not run it: a PR should fail loudly on a
 * missing account rather than quietly recreating it.
 *
 * Usage:
 *   E2E_API_URL=... E2E_EMAIL=... E2E_PASSWORD=... node scripts/e2e/ensure-test-account.mjs
 */
import { apiRequest, resolveConfig } from './staging-api.mjs';

async function main() {
    const { baseUrl, email, password, name } = resolveConfig();

    process.stdout.write(`[e2e] ensuring account ${email} on ${baseUrl}\n`);

    const existing = await apiRequest(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: { email, password },
    });

    if (existing.ok && existing.body?.token) {
        process.stdout.write('[e2e] account already exists and the password is correct\n');
        return;
    }

    const registration = await apiRequest(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
    });

    if (registration.ok && registration.body?.token) {
        process.stdout.write('[e2e] account created\n');
        return;
    }

    // The backend returns 400 "User already exists" when the address is taken.
    // Reaching here with that error means the account exists but E2E_PASSWORD
    // does not match it, which is a secret problem rather than a setup step.
    const detail = registration.body?.error ?? registration.body?.message ?? `HTTP ${registration.status}`;
    if (/already exists/i.test(String(detail))) {
        throw new Error(
            `${email} already exists on this backend but E2E_PASSWORD does not sign in. `
            + 'Reset the password for that account, or point E2E_EMAIL at a different one.',
        );
    }

    throw new Error(`Could not create the test account: ${detail}`);
}

main().catch((error) => {
    process.stderr.write(`[e2e] ${error.message}\n`);
    process.exitCode = 1;
});
