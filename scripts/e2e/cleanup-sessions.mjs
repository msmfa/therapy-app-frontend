/**
 * Removes the therapy sessions the smoke test creates on staging.
 *
 * The onboarding phase schedules eight weekly sessions starting today, which
 * is the only backend state the run produces (notes are device-local and go
 * away with the app's `clearState`). This deletes them again so the next run
 * starts from the same place.
 *
 * Scope, deliberately narrow:
 *   - one account: the dedicated E2E user named by E2E_EMAIL;
 *   - one date window: E2E_CLEANUP_FROM_DAYS..E2E_CLEANUP_TO_DAYS around today.
 *
 * It never drops a collection, never deletes the account, and cannot run
 * against production (see `assertNotProduction`). Anything outside the window
 * is left untouched.
 *
 * Usage:
 *   E2E_API_URL=... E2E_EMAIL=... E2E_PASSWORD=... node scripts/e2e/cleanup-sessions.mjs
 */
import { apiRequest, login, resolveConfig, utcDayBoundary } from './staging-api.mjs';

// The run creates sessions from today out to +49 days. The default window adds
// headroom on both sides so a run that straddles midnight, or a previous run
// from earlier in the month, is swept up too.
const DEFAULT_FROM_DAYS = -30;
const DEFAULT_TO_DAYS = 70;

const readDayOffset = (name, fallback) => {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === '') return fallback;

    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) {
        throw new Error(`${name} must be a whole number of days, got ${JSON.stringify(raw)}`);
    }
    return parsed;
};

async function main() {
    const { baseUrl, email, password } = resolveConfig();

    const fromDays = readDayOffset('E2E_CLEANUP_FROM_DAYS', DEFAULT_FROM_DAYS);
    const toDays = readDayOffset('E2E_CLEANUP_TO_DAYS', DEFAULT_TO_DAYS);

    if (fromDays > toDays) {
        throw new Error(`Empty cleanup window: from ${fromDays} is after to ${toDays}.`);
    }

    const from = utcDayBoundary(fromDays);
    const to = utcDayBoundary(toDays, true);

    process.stdout.write(`[e2e] cleanup target ${baseUrl} as ${email}\n`);
    process.stdout.write(`[e2e] window ${from.toISOString()} .. ${to.toISOString()}\n`);

    const { token } = await login(baseUrl, email, password);

    const before = await apiRequest(
        baseUrl,
        `/api/therapy-sessions?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        { token },
    );

    const existing = Array.isArray(before.body) ? before.body.length : 0;
    if (existing === 0) {
        process.stdout.write('[e2e] nothing to clean up\n');
        return;
    }

    // An empty `sessions` list means "the window should contain nothing", and
    // the backend scopes its deletion to exactly the from/to it is given.
    const { ok, status, body } = await apiRequest(baseUrl, '/api/therapy-sessions/sync', {
        method: 'POST',
        token,
        body: { sessions: [], from: from.toISOString(), to: to.toISOString() },
    });

    if (!ok) {
        const detail = body?.error ?? body?.message ?? `HTTP ${status}`;
        throw new Error(`Cleanup sync failed: ${detail}`);
    }

    process.stdout.write(`[e2e] removed ${body?.deleted ?? 0} of ${existing} session(s)\n`);
}

main().catch((error) => {
    process.stderr.write(`[e2e] cleanup failed: ${error.message}\n`);
    process.exitCode = 1;
});
